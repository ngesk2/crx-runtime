#!/usr/bin/env python3
import json

config_path = '/mnt/c/Users/nolan/.codex/config.toml'

with open(config_path, 'r') as f:
    content = f.read()

# Fix the projectlessWorkspaceRoot
old_root = "projectlessWorkspaceRoot = 'C:\\Users\\nolan'"
new_root = "projectlessWorkspaceRoot = '/home/nolan'"

content = content.replace(old_root, new_root)

with open(config_path, 'w') as f:
    f.write(content)

print('Codex config updated: projectlessWorkspaceRoot -> /home/nolan')
