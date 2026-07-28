Ollama Tool Runtime (runtime/tools)

This folder contains lightweight CLI tools intended to be used by the Ollama supervisor as "tools".
Each tool reads a single JSON object from STDIN and writes JSON to STDOUT.

Usage examples:

Repository symbols:

```bash
echo '{"symbol":"ProjectionWorker"}' | python runtime/tools/repository_symbols.py
```

Repository relationships:

```bash
echo '{"symbol":"ProjectionWorker"}' | python runtime/tools/repository_relationships.py
```
