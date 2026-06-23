import os
import sys

def count_files(base_dir):
    ts_files = 0
    js_files = 0
    md_files = 0
    total_files = 0
    inaccessible = []
    
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
            
        for file in files:
            full_path = os.path.join(root, file)
            try:
                # check access
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    pass
                total_files += 1
                if file.endswith('.ts') and not file.endswith('.d.ts'):
                    ts_files += 1
                elif file.endswith('.js'):
                    js_files += 1
                elif file.endswith('.md'):
                    md_files += 1
            except Exception as e:
                inaccessible.append((full_path, str(e)))
                
    return total_files, ts_files, js_files, md_files, inaccessible

if __name__ == '__main__':
    base_dir = r'C:\Users\nolan\CRX'
    total_files, ts_files, js_files, md_files, inaccessible = count_files(base_dir)
    print("TOTAL:", total_files)
    print("TS:", ts_files)
    print("JS:", js_files)
    print("MD:", md_files)
    print("INACCESSIBLE:", len(inaccessible))
    for path, err in inaccessible:
        print(path, err)
