/**
 * Immutable Replay Log
 * 
 * Phase 9: Every compiler stage, every mission, every planner decision, every reflection
 * must produce replay events.
 * 
 * Append-only replay log with hash chain and signatures.
 * 
 * Blockchain-style replay log:
 * - Never edit, never delete
 * - Every event has: hash, signature, timestamp, authority, previous hash
 * - Cryptographic chain ensures integrity
 * - Replay is deterministic
 * - Replay references immutable object versions
 * 
 * Constitutional Constraint: Replay log is immutable.
 * Ω.18: Uses CanonicalAuthority for canonical hashing.
 */

const crypto = require('crypto');
const { CanonicalBytes, CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');

class ReplayLogEntry {
  constructor(data, previousHash = null, authority = 'ReplayAuthority') {
    const canonicalBytes = CanonicalBytes.serialize({ data, previousHash, authority });
    this.id = identityAuthority.generateFromCanonicalHash(canonicalBytes, 'replay_log_entry');
    this.data = data;
    this.previousHash = previousHash;
    this.authority = authority;
    this.timestamp = constitutionalTimeAuthority.now();
    this.hash = CanonicalAuthority.hashReplayEvent(this);
    this.signature = null;
  }

  sign(privateKey) {
    const data = Buffer.from(this.hash, 'utf8');
    this.signature = crypto.sign(null, data, privateKey).toString('hex');
    return this.signature;
  }

  verify(publicKey) {
    if (!this.signature) return false;
    const data = Buffer.from(this.hash, 'utf8');
    const signature = Buffer.from(this.signature, 'hex');
    return crypto.verify(null, data, publicKey, signature);
  }

  toJSON() {
    return {
      id: this.id,
      data: this.data,
      previousHash: this.previousHash,
      authority: this.authority,
      timestamp: this.timestamp,
      hash: this.hash,
      signature: this.signature,
    };
  }
}

class ImmutableReplayLog {
  constructor(postgresPool, constitutionalAuthority = null) {
    this._postgres = postgresPool;
    this._constitutionalAuthority = constitutionalAuthority;
    this._genesisHash = null;
  }

  async initialize() {
    // Use persistent constitutional authority if provided
    if (this._constitutionalAuthority) {
      await this._constitutionalAuthority.initialize();
    }

    // Load or create genesis hash
    await this._loadGenesis();
  }

  async _loadGenesis() {
    const result = await this._postgres.query(`
      SELECT event_data->>'hash' as hash
      FROM events
      WHERE event_type = 'REPLAY_GENESIS'
      ORDER BY event_id ASC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      this._genesisHash = result.rows[0].hash;
    } else {
      // Create genesis entry
      const genesisEntry = new ReplayLogEntry(
        { type: 'genesis', message: 'Immutable replay log genesis' },
        null,
        this._constitutionalAuthority ? this._constitutionalAuthority.getAuthorityRoot() : 'ReplayAuthority'
      );
      
      if (this._constitutionalAuthority) {
        genesisEntry.signature = this._constitutionalAuthority.sign(genesisEntry.hash);
      }
      
      this._genesisHash = genesisEntry.hash;
      
      await this._postgres.query(`
        INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
        VALUES ($1, $2, NOW(), $3, $4, $5)
      `, [
        genesisEntry.id,
        'REPLAY_GENESIS',
        genesisEntry.id,
        'REPLAY',
        JSON.stringify(genesisEntry.toJSON()),
      ]);
    }
  }

  async append(data, authority = null) {
    // Get latest hash
    const latestHash = await this._getLatestHash();

    // Use constitutional authority or provided authority
    const effectiveAuthority = authority || (this._constitutionalAuthority ? this._constitutionalAuthority.getAuthorityRoot() : 'ReplayAuthority');

    // Create new entry
    const entry = new ReplayLogEntry(data, latestHash, effectiveAuthority);
    
    if (this._constitutionalAuthority) {
      entry.signature = this._constitutionalAuthority.sign(entry.hash);
    }

    // Persist (append-only, never update)
    await this._postgres.query(`
      INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
      VALUES ($1, $2, NOW(), $3, $4, $5)
    `, [
      entry.id,
      'REPLAY_LOG_ENTRY',
      entry.id,
      'REPLAY',
      JSON.stringify(entry.toJSON()),
    ]);

    return entry;
  }

  async _getLatestHash() {
    const result = await this._postgres.query(`
      SELECT event_data->>'hash' as hash
      FROM events
      WHERE event_type = 'REPLAY_LOG_ENTRY'
      ORDER BY event_id DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      return result.rows[0].hash;
    }
    return this._genesisHash;
  }

  async replay(lifecycleId) {
    // Replay all entries for a lifecycle
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_data->>'lifecycle_id' = $1
      AND event_type IN ('REPLAY_LOG_ENTRY', 'REPLAY_GENESIS')
      ORDER BY event_id ASC
    `, [lifecycleId]);

    const entries = result.rows.map(row => row.event_data);
    
    // Verify chain integrity
    const isValid = await this._verifyChain(entries);
    if (!isValid) {
      throw new Error('Replay log chain verification failed');
    }

    return entries;
  }

  async _verifyChain(entries) {
    let previousHash = this._genesisHash;

    for (const entry of entries) {
      // Verify hash
      const entryHash = entry.hash;
      const computedHash = this._computeEntryHash(entry);
      if (entryHash !== computedHash) {
        console.error(`Hash mismatch for entry ${entry.id}`);
        return false;
      }

      // Verify chain link
      if (entry.previousHash !== previousHash) {
        console.error(`Chain link broken for entry ${entry.id}`);
        return false;
      }

      // Verify signature
      const isValid = crypto.verify(
        null,
        Buffer.from(entry.hash, 'utf8'),
        this._publicKey,
        Buffer.from(entry.signature, 'hex')
      );
      if (!isValid) {
        console.error(`Signature verification failed for entry ${entry.id}`);
        return false;
      }

      previousHash = entryHash;
    }

    return true;
  }

  _computeEntryHash(entry) {
    const hashInput = {
      id: entry.id,
      data: entry.data,
      previousHash: entry.previousHash,
      authority: entry.authority,
      timestamp: entry.timestamp,
    };
    const canonicalBytes = CanonicalBytes.serialize(hashInput);
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(canonicalBytes);
  }

  async getEntryCount() {
    const result = await this._postgres.query(`
      SELECT COUNT(*)
      FROM events
      WHERE event_type = 'REPLAY_LOG_ENTRY'
    `);
    return parseInt(result.rows[0].count, 10);
  }

  async getLatestEntries(limit = 10) {
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type = 'REPLAY_LOG_ENTRY'
      ORDER BY event_id DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => row.event_data);
  }
}

module.exports = {
  ReplayLogEntry,
  ImmutableReplayLog,
};
