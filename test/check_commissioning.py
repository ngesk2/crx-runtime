#!/usr/bin/env python3
"""Local candidate proof, strictly separated from production admission."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import time

parser = argparse.ArgumentParser()
parser.add_argument('--tools-root', required=True, type=Path)
parser.add_argument('--node-path', required=True)
parser.add_argument('--run-disposable-database-tests', action='store_true', required=True)
args = parser.parse_args()
args.tools_root = args.tools_root.resolve()
root = Path(__file__).resolve().parents[1]
evidence = root / 'artifacts'
evidence.mkdir(exist_ok=True)
env = os.environ.copy()
env.update(NODE_PATH=args.node_path, GIT_OPTIONAL_LOCKS='0')
config = json.loads((root / '.test-database.json').read_text())
assert config['host'] == '127.0.0.1' and config['database'] == 'admission_proof'
# The test checks cluster_name before its first schema mutation. Credentials are
# never copied into the proof package or logs.

def output(command):
    return subprocess.check_output(command, cwd=root, env=env, text=True).strip()

report = {'source_sha': output(['git', 'rev-parse', 'HEAD']),
          'branch': output(['git', 'branch', '--show-current']),
          'platform': platform.platform(), 'node': output(['node', '--version']),
          'scope': 'Synthetic owner authority and disposable persisted-state tests only',
          'merge': 'HOLD', 'production_cutover': 'HOLD', 'commands': [], 'sources': {}}
report['tracked_changes_before'] = output(['git', '-c', 'core.filemode=false', 'status', '--porcelain', '--untracked-files=no'])
paths = [root / 'ping-runtime/events/unified_event_runtime.js', root / 'ping-runtime/runtime/tenant_registry.js',
         *sorted((root / 'ping-runtime/runtime').glob('commissioning_*')),
         root / 'ping-runtime/runtime/strict_wire_json.js',
         root / 'test/commissioning_admission.test.js', root / 'test/commissioning_crash_child.js',
         *[root / 'gateway' / name for name in ['test_verdict_authority.js', 'test_confidence_spine.js',
             'test_event_spine_time_authority.js', 'test_knowledge_ingest_adapter.js', 'test_ingest_boundary.js',
             'test_events_routes.js', 'test_tenant_spoof_ingress.js', 'test_events_recent.js', 'test_events_time_authority.js']],
         root / 'runtime/constitutional/src/ping-projector.ts',
         root / 'gateway/route_middleware.js', root / 'gateway/bootstrap/gateway_runtime.js',
         root / 'gateway/routes/events.js', root / 'gateway/routes/canonical_events.js', root / 'gateway/routes/ingest.js', Path(__file__)]
for p in paths:
    report['sources'][str(p.relative_to(root))] = hashlib.sha256(p.read_bytes()).hexdigest()

def run(command, label):
    start = time.monotonic()
    result = subprocess.run(command, cwd=root, env=env, capture_output=True, text=True)
    content = result.stdout + result.stderr
    log = evidence / (label + '.log')
    log.write_text(content)
    item = {'command': command, 'exit_code': result.returncode,
            'seconds': time.monotonic() - start, 'log': str(log.relative_to(root))}
    for field in ['tests', 'pass', 'fail']:
        match = re.search(r'^# ' + field + r' (\d+)$', content, re.M)
        if match: item[field] = int(match.group(1))
    for field in ['Passed', 'Failed', 'Total']:
        match = re.search(r'^' + field + r': (\d+)$', content, re.M)
        if match: item[field.lower()] = int(match.group(1))
    for pattern in [r'PASSED: (\d+), FAILED: (\d+)', r'(\d+) passed, (\d+) failed']:
        match = re.search(pattern, content)
        if match: item.update(passed=int(match.group(1)), failed=int(match.group(2)))
    match = re.search(r'All (\d+) confidence spine tests PASS', content)
    if match: item.update(passed=int(match.group(1)), failed=0)
    match = re.search(r'(\d+) knowledge adapter tests passed', content)
    if match: item.update(passed=int(match.group(1)), failed=0)
    if label == 'proof-test_events_recent.js' and result.returncode == 0 and content.startswith('PASS:'):
        item.update(passed=1, failed=0)
    item['failure_names'] = re.findall(r'^✗ (.+)$', content, re.M)
    report['commands'].append(item)
    return result.returncode, content

try:
    if report['tracked_changes_before']:
        raise RuntimeError('Refuse dirty tracked sources; record the candidate on its isolated branch before the full gate')
    code, text = run(['node', '-e',
        "const fs=require('fs'),{Pool}=require('pg'); const p=new Pool(JSON.parse(fs.readFileSync('.test-database.json','utf8')));"
        "(async()=>{try{console.log(JSON.stringify((await p.query(\"SELECT version() AS version,current_setting('cluster_name') AS cluster_name,current_database() AS database\")).rows[0]));}finally{await p.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});"], 'proof-database-environment')
    if code: raise RuntimeError('Disposable database metadata query failed')
    report['database'] = json.loads(text)
    if report['database']['cluster_name'] != 'ping-admission-proof-20261010':
        raise RuntimeError('Refuse unmarked database')
    code, text = run(['node', str(args.tools_root / 'node-typescript/node_modules/typescript/bin/tsc'),
         'runtime/constitutional/src/ping-projector.ts', '--module', 'commonjs', '--target', 'es2020',
         '--esModuleInterop', '--skipLibCheck', '--outDir', 'gateway/constitutional-dist',
         '--typeRoots', str(args.tools_root / 'node-typescript/node_modules/@types')], 'proof-reference-build')
    if code: raise RuntimeError('Existing reference compilation failed')
    code, text = run(['node', '--test', 'test/commissioning_admission.test.js'], 'proof-admission')
    if code: raise RuntimeError('Candidate admission/recovery tests failed')
    report['candidate_result'] = 'PASS'
    report['regression_result'] = 'PASS'
    for name in ['test_verdict_authority.js', 'test_confidence_spine.js', 'test_event_spine_time_authority.js',
                 'test_knowledge_ingest_adapter.js', 'test_ingest_boundary.js', 'test_events_routes.js',
                 'test_tenant_spoof_ingress.js', 'test_events_recent.js', 'test_events_time_authority.js']:
        code, text = run(['node', 'gateway/' + name], 'proof-' + name)
        if code: report['regression_result'] = 'FAIL'
    baseline = evidence / 'ingest-baseline.log'
    if baseline.exists():
        report['ingest_baseline_failure_names'] = re.findall(r'^✗ (.+)$', baseline.read_text(), re.M)
        ingest = next(item for item in report['commands'] if item['log'] == 'artifacts/proof-test_ingest_boundary.js.log')
        report['ingest_failures_match_prior_baseline'] = ingest['failure_names'] == report['ingest_baseline_failure_names']
    report['exit_code'] = 0 if report['regression_result'] == 'PASS' else 1
    report['result'] = 'Admission and gateway regression gate passed; merge remains HOLD' if report['exit_code'] == 0 else 'FAIL'
except Exception as error:
    report['result'] = 'FAIL'
    report['error'] = str(error)
    report['exit_code'] = 1
finally:
    report['tracked_changes'] = output(['git', '-c', 'core.filemode=false', 'status', '--porcelain', '--untracked-files=no'])
    if not report['tracked_changes_before'] and report['tracked_changes']:
        report.update(result='FAIL', error='Tracked sources changed during the gate', exit_code=1)
    (evidence / 'commissioning-proof.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'source_sha': report['source_sha'], 'result': report['result'],
                  'exit_code': report['exit_code'], 'proof': str(evidence / 'commissioning-proof.json')}))
sys.exit(report['exit_code'])
