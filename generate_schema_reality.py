#!/usr/bin/env python3
"""
Generate SCHEMA_REALITY.md from live PostgreSQL database.
"""
import os
import sys
import psycopg2
from datetime import datetime
import subprocess

# Use docker exec to connect to PostgreSQL
POSTGRES_CONTAINER = os.getenv('POSTGRES_CONTAINER', 'brain-postgres')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'crx_runtime')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')

def get_postgres_connection():
    try:
        # Use docker exec to run psql commands
        # We'll use subprocess to execute queries via docker exec
        return "docker"
    except Exception as e:
        print(f"Failed to set up PostgreSQL connection: {e}")
        return None

def run_psql_query(query):
    """Run psql query via docker exec."""
    try:
        cmd = f'docker exec {POSTGRES_CONTAINER} psql -U {POSTGRES_USER} -d {POSTGRES_DB} -t -c "{query}"'
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"Query failed: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        print(f"Error running query: {e}")
        return None

def generate_schema_reality():
    conn = get_postgres_connection()
    if not conn:
        return

    try:
        # Get all tables
        tables_query = "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        tables_output = run_psql_query(tables_query)
        if not tables_output:
            print("Failed to get tables")
            return

        print(f"Tables output:\n{tables_output}")

        # Parse tables
        tables = []
        for line in tables_output.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2 and parts[0] and parts[0] != 'table_name':
                    tables.append((parts[0], parts[1]))

        print(f"Parsed {len(tables)} tables")

        # Get row counts and column info for each table
        table_info = []
        schema_details = {}

        for table_name, table_type in tables:
            # Get row count
            count_query = f'SELECT COUNT(*) FROM "{table_name}"'
            count_output = run_psql_query(count_query)
            count = int(count_output.strip()) if count_output else 0

            table_info.append((table_name, table_type, count))

            # Get column information
            columns_query = f"SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '{table_name}' AND table_schema = 'public' ORDER BY ordinal_position"
            columns_output = run_psql_query(columns_query)
            columns = []
            if columns_output:
                for line in columns_output.split('\n'):
                    line = line.strip()
                    if line and '|' in line:
                        parts = [p.strip() for p in line.split('|')]
                        if len(parts) >= 4 and parts[0] and parts[0] != 'column_name':
                            columns.append((parts[0], parts[1], parts[2], parts[3]))

            schema_details[table_name] = {
                'type': table_type,
                'row_count': count,
                'columns': columns
            }

        # Generate markdown
        output = f"""# Schema Reality

**Generated:** {datetime.utcnow().isoformat()}
**Database:** {POSTGRES_DB}
**Container:** {POSTGRES_CONTAINER}

---

# Tables in Public Schema

| Table | Type | Row Count | Columns |
|-------|------|-----------|---------|
"""

        for table_name, table_type, count in table_info:
            col_count = len(schema_details[table_name]['columns'])
            output += f"| {table_name} | {table_type} | {count} | {col_count} |\n"

        output += "\n---\n\n# Detailed Schema\n\n"

        for table_name in sorted(schema_details.keys()):
            info = schema_details[table_name]
            output += f"## {table_name}\n\n"
            output += f"**Type:** {info['type']}\n"
            output += f"**Row Count:** {info['row_count']}\n\n"
            output += "| Column | Data Type | Nullable | Default |\n"
            output += "|--------|-----------|----------|---------|\n"
            for col_name, data_type, is_nullable, col_default in info['columns']:
                output += f"| {col_name} | {data_type} | {is_nullable} | {col_default or ''} |\n"
            output += "\n"

        # Write to file
        with open('SCHEMA_REALITY.md', 'w') as f:
            f.write(output)

        print("SCHEMA_REALITY.md generated successfully")

    except Exception as e:
        print(f"Error generating schema reality: {e}")

if __name__ == '__main__':
    generate_schema_reality()
