import sqlite3

conn = sqlite3.connect('webui.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", [row[0] for row in tables])

# Check model table specifically
cursor.execute("SELECT * FROM model")
models = cursor.fetchall()
print("\n=== Models ===")
for model in models:
    print(f"  {model}")

# Check config table
cursor.execute("SELECT * FROM config")
configs = cursor.fetchall()
print("\n=== Config ===")
for config in configs:
    print(f"  {config}")

conn.close()
