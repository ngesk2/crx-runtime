const { GatewayRuntime } = require('./bootstrap/gateway_runtime');

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason?.message || reason);
  if (reason?.stack) console.error(reason.stack);
});

const port = process.env.PORT || 8080;
const runtime = new GatewayRuntime();

runtime.start(port).catch((err) => {
  console.error('Gateway failed to start:', err.message);
  process.exit(1);
});
