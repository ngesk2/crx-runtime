// Diagnostic: trace PG init to find "column version does not exist"
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: 'localhost', port: 5432, database: 'crx_runtime',
    user: 'postgres', password: 'postgres',
  });

  // Try the same init sequence as gateway_runtime.js
  const files = [
    ['EventReadAuthority', '../ping-runtime/events/unified_event_runtime', 'initialize'],
    ['RepositoryStore', '../repository_store', 'initialize'],
    ['PostgresAdapter', '../postgres_adapter', 'initialize'],
    ['CanonicalEventEnvelope', '../canonical_event_envelope', 'initialize'],
    ['TenantRegistry', '../tenant_registry', 'initialize'],
    ['DeploymentRegistry', '../deployment_registry', 'initialize'],
    ['RuntimeRegistry', '../runtime_registry', 'initialize'],
    ['KnowledgeGraph', '../ping-runtime/knowledge/knowledge_graph', 'initialize'],
    ['MissionRuntime', '../ping-runtime/orchestration/mission_runtime', 'initialize'],
    ['WorkerRuntime', '../ping-runtime/workers/worker_runtime', 'initialize'],
  ];

  for (const [name, modPath, method] of files) {
    try {
      const mod = require(modPath);
      const ClassName = Object.keys(mod).find(k => k.includes(name.replace('Store','').replace('Authority','')));
      if (!ClassName) { console.log(`  SKIP ${name}: class not found in ${modPath}`); continue; }
      
      let instance;
      const Cls = mod[ClassName];
      if (name === 'PostgresAdapter') {
        instance = new Cls({ host: 'localhost', port: 5432, database: 'crx_runtime', user: 'postgres', password: 'postgres' });
      } else if (name === 'EventReadAuthority') {
        // skip - too complex
        console.log(`  SKIP ${name}: complex init`); continue;
      } else {
        instance = new Cls({ pool });
      }
      
      if (instance[method]) {
        await instance[method]();
        console.log(`  OK   ${name}`);
      } else {
        console.log(`  SKIP ${name}: no ${method} method`);
      }
    } catch (err) {
      console.log(`  FAIL ${name}: ${err.message}`);
    }
  }

  await pool.end();
}

main().catch(console.error);
