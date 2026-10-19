#!/usr/bin/env python3
"""Reproduce the isolated proof kernel checks; never invoke a production caller."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import time

parser = argparse.ArgumentParser()
parser.add_argument('--tools-root', required=True, type=Path,
                    help='Isolated cargo/rustup/node-typescript directory')
parser.add_argument('--node-path', required=True, help='Existing gateway node_modules')
args = parser.parse_args()
args.tools_root = args.tools_root.resolve()
root = Path(__file__).resolve().parents[1]
kernel = root / 'proof-kernel'
evidence = kernel / 'evidence'
evidence.mkdir(exist_ok=True)
env = os.environ.copy()
env.update(CARGO_HOME=str(args.tools_root / 'cargo'),
           RUSTUP_HOME=str(args.tools_root / 'rustup'), NODE_PATH=args.node_path,
           GIT_OPTIONAL_LOCKS='0')
env['PATH'] = str(args.tools_root / 'cargo/bin') + os.pathsep + env['PATH']

def output(command):
    return subprocess.check_output(command, cwd=root, env=env, text=True).strip()

report = {
    'source_sha': output(['git', 'rev-parse', 'HEAD']),
    'tree_sha': output(['git', 'rev-parse', 'HEAD^{tree}']),
    'branch': output(['git', 'branch', '--show-current']),
    'platform': platform.platform(), 'machine': platform.machine(),
    'node': output(['node', '--version']), 'rust': output(['rustc', '--version']),
    'scope': 'Optional Linux/WSL proof verifier; no authority or production wiring',
    'merge': 'HOLD', 'production_cutover': 'HOLD', 'commands': [],
    'sources': {},
}
report['tracked_changes_before'] = output(['git', '-c', 'core.filemode=false', 'status', '--porcelain', '--untracked-files=no'])
report['rust_verbose'] = output(['rustc', '-vV'])
report['node_crypto'] = json.loads(output(['node', '-e', 'console.log(JSON.stringify({openssl:process.versions.openssl,napi:process.versions.napi}))']))
for item in kernel.rglob('*'):
    if item.is_file() and not any(part in {'target', 'evidence'} for part in item.parts) and item.suffix != '.node':
        report['sources'][str(item.relative_to(root))] = hashlib.sha256(item.read_bytes()).hexdigest()
report['sources']['ping-runtime/runtime/strict_wire_json.js'] = hashlib.sha256(
    (root / 'ping-runtime/runtime/strict_wire_json.js').read_bytes()).hexdigest()
for relative in ['ping-runtime/authorities/canonical_authority.js', 'ping-runtime/authorities/identity_authority.js',
                 'gateway/knowledge_ingest_adapter.js', 'runtime/constitutional/src/hash-authority.ts',
                 'runtime/constitutional/src/identity-authority.ts']:
    report['sources'][relative] = hashlib.sha256((root / relative).read_bytes()).hexdigest()

def run(command, json_result=False):
    index = len(report['commands'])
    log = evidence / f'{index:02d}.log'
    start = time.monotonic()
    result = subprocess.run(command, cwd=root, env=env, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True)
    log.write_text(result.stdout)
    item = {'command': command, 'exit_code': result.returncode,
            'seconds': time.monotonic() - start, 'log': str(log.relative_to(root)),
            'output_sha256': hashlib.sha256(log.read_bytes()).hexdigest()}
    for name in ['tests', 'pass', 'fail']:
        match = re.search(r'^# ' + name + r' (\d+)$', result.stdout, re.M)
        if match: item[name] = int(match.group(1))
    if command[:2] == ['cargo', 'test']:
        item['test_summaries'] = [{'passed': int(p), 'failed': int(f)}
            for p, f in re.findall(r'test result: \w+\. (\d+) passed; (\d+) failed', result.stdout)]
    if result.returncode == 0 and json_result:
        item['result'] = json.loads(result.stdout.strip().splitlines()[-1])
    report['commands'].append(item)
    if result.returncode:
        print(result.stdout[-4000:])
        raise RuntimeError(f'Check failed: {command}')
    return result.stdout

try:
    if report['tracked_changes_before']:
        raise RuntimeError('Refuse dirty tracked sources; commit the focused passing patch before the full gate')
    run(['node', str(args.tools_root / 'node-typescript/node_modules/typescript/bin/tsc'),
         'runtime/constitutional/src/ping-projector.ts', '--module', 'commonjs',
         '--target', 'es2020', '--esModuleInterop', '--skipLibCheck',
         '--outDir', 'gateway/constitutional-dist', '--typeRoots',
         str(args.tools_root / 'node-typescript/node_modules/@types')])
    run(['cargo', 'test', '--locked', '--offline', '--manifest-path', 'proof-kernel/Cargo.toml'])
    for manifest in ['proof-kernel/Cargo.toml', 'proof-kernel/native/Cargo.toml']:
        run(['cargo', 'clippy', '--locked', '--offline', '--all-targets', '--manifest-path', manifest, '--', '-D', 'warnings'])
    run(['cargo', 'build', '--locked', '--offline', '--manifest-path', 'proof-kernel/Cargo.toml'])
    run(['cargo', 'build', '--locked', '--offline', '--release', '--manifest-path',
         'proof-kernel/native/Cargo.toml'])
    shutil.copy2(kernel / 'native/target/release/libping_proof_native.so', kernel / 'native/ping-proof.node')
    run(['node', 'proof-kernel/golden.js'], json_result=True)
    run(['node', 'proof-kernel/differential-v2.js'], json_result=True)
    run(['node', '--test', 'proof-kernel/resource-boundary.test.js'])
    report['native_sha256'] = hashlib.sha256((kernel / 'native/ping-proof.node').read_bytes()).hexdigest()
    report['cli_sha256'] = hashlib.sha256((kernel / 'target/debug/ping-proof').read_bytes()).hexdigest()
    report['result'] = 'PASS for the recorded platform and vectors'
    report['exit_code'] = 0
except Exception as error:
    report['result'] = 'FAIL'
    report['error'] = str(error)
    report['exit_code'] = 1
finally:
    report['tracked_changes'] = output(['git', '-c', 'core.filemode=false', 'status', '--porcelain', '--untracked-files=no'])
    if report['tracked_changes'] or output(['git', 'rev-parse', 'HEAD']) != report['source_sha']:
        report.update(result='FAIL', error='Tracked sources or HEAD changed during the gate', exit_code=1)
    (evidence / 'proof.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'source_sha': report['source_sha'], 'result': report['result'],
                  'exit_code': report['exit_code'], 'proof': str(evidence / 'proof.json')}))
sys.exit(report['exit_code'])
