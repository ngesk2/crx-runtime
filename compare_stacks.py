import filecmp
import os

def compare_dirs(dir1, dir2):
    cmp = filecmp.dircmp(dir1, dir2)
    with open(r'C:\Users\nolan\CRX\DUPLICATE_STACK_EVIDENCE.md', 'w', encoding='utf-8') as f:
        f.write('# DUPLICATE STACK EVIDENCE\n\n')
        f.write(f'Comparing `{dir1}` and `{dir2}`\n\n')
        
        def write_diff(c, path=""):
            for name in c.left_only:
                if name != 'node_modules':
                    f.write(f'* **Only in {dir1}**: `{os.path.join(path, name)}`\n')
            for name in c.right_only:
                if name != 'node_modules':
                    f.write(f'* **Only in {dir2}**: `{os.path.join(path, name)}`\n')
            for name in c.diff_files:
                f.write(f'* **Diverged**: `{os.path.join(path, name)}`\n')
            for name in c.same_files:
                f.write(f'* **Identical**: `{os.path.join(path, name)}`\n')
            for sub_dir, sub_cmp in c.subdirs.items():
                if sub_dir != 'node_modules':
                    write_diff(sub_cmp, os.path.join(path, sub_dir))
                    
        write_diff(cmp)

if __name__ == '__main__':
    compare_dirs(r'C:\Users\nolan\CRX\kernel\commit-service', r'C:\Users\nolan\CRX\runtime\kernel\commit-service')
