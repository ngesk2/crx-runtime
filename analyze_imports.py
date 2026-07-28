import os
import re

def analyze_imports(base_dir):
    ts_files = []
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in dirs: dirs.remove('node_modules')
        if '.git' in dirs: dirs.remove('.git')
        for file in files:
            if file.endswith('.ts'):
                ts_files.append(os.path.join(root, file))
                
    import_regex = re.compile(r'(?:import|export)\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]')
    dynamic_import_regex = re.compile(r'import\([\'"]([^\'"]+)[\'"]\)')
    
    failures = []
    
    for ts_file in ts_files:
        with open(ts_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                matches = import_regex.findall(line) + dynamic_import_regex.findall(line)
                for match in matches:
                    if match.startswith('.'):
                        # resolve path
                        dir_name = os.path.dirname(ts_file)
                        target = os.path.normpath(os.path.join(dir_name, match))
                        # check if target exists
                        if not os.path.exists(target) and not os.path.exists(target + '.ts') and not os.path.exists(target + '.js') and not os.path.exists(os.path.join(target, 'index.ts')):
                            failures.append({
                                'file': ts_file,
                                'line': i + 1,
                                'statement': line.strip(),
                                'reason': f'Path unresolved: {match} (resolved to {target})'
                            })
                    else:
                        # package import, just flag if it's dynamic or weird
                        if 'dynamic' in line.lower() and 'import(' in line:
                            failures.append({
                                'file': ts_file,
                                'line': i + 1,
                                'statement': line.strip(),
                                'reason': f'Dynamic import: {match}'
                            })
    return failures

if __name__ == '__main__':
    fails = analyze_imports(r'C:\Users\nolan\CRX')
    with open(r'C:\Users\nolan\CRX\IMPORT_GRAPH_FAILURES.md', 'w', encoding='utf-8') as f:
        f.write('# IMPORT GRAPH FAILURES\n\n')
        if not fails:
            f.write('No failures found.\n')
        for fail in fails:
            f.write(f"file: {fail['file']}\n")
            f.write(f"line: {fail['line']}\n")
            f.write(f"import statement: {fail['statement']}\n")
            f.write(f"failure reason: {fail['reason']}\n\n")
