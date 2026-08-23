const { execSync, spawn } = require('child_process');
const env = Object.assign({}, process.env, {
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'crx_runtime',
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',
  QDRANT_URL: 'http://localhost:6333',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  PORT: '8080',
});
const child = spawn('node', ['server.js'], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
  detached: true,
});
child.unref();
console.log('Gateway started, PID:', child.pid);
