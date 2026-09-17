'use strict';
// P0 item 9: fail-closed guard against the legacy database cluster.
//
// The binding database for the gateway is ping_runtime (brain-postgres).
// crx_runtime is the legacy cluster. The gateway must never silently fall
// back to it, and must refuse an explicit legacy setting loudly instead of
// writing events to the wrong database.
const BINDING_DATABASE = 'ping_runtime';
const LEGACY_DATABASES = new Set(['crx_runtime']);

/**
 * Resolve the database name, failing closed on the legacy cluster.
 * @param {string|undefined} explicit - config-level override (may be undefined)
 * @returns {string} the database to connect to
 * @throws {Error} if the resolved database is a known legacy database
 */
function resolveDatabase(explicit) {
  const db = explicit || process.env.POSTGRES_DB || BINDING_DATABASE;
  if (LEGACY_DATABASES.has(db)) {
    throw new Error(
      `[db-guard] Refusing to use legacy database '${db}'. ` +
        `The binding database is '${BINDING_DATABASE}'. ` +
        `Unset POSTGRES_DB or point it at '${BINDING_DATABASE}'.`
    );
  }
  return db;
}

module.exports = { resolveDatabase, BINDING_DATABASE };
