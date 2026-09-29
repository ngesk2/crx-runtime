#!/usr/bin/env python3
with open('gateway/constitutional_runtime.js', 'r') as f:
    content = f.read()
old = " require ../constitutional-compiler/runtime/bootstrap new
