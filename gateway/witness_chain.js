/**
 * Witness Chain
 * 
 * Phase 10: Generate witness chain for all stages
 * 
 * Stages to witness:
 * - Compiler
 * - Mission
 * - Replay
 * - Reflection
 * 
 * Verify:
 * - chain integrity
 * - hash integrity
 * - lineage
 * - object versions
 * 
 * Structure:
 * Genesis → W1 → W2 → W3 → ...
 * 
 * Each witness block:
 * - Signs the previous witness
 * - Contains hash of previous block
 * - Cryptographic linking ensures chain integrity
 * 
 * Verification becomes O(n) by following the chain.
 * Ω.18: Uses CanonicalAuthority for canonical hashing.
 */

const crypto = require('crypto');
const { CanonicalBytes, CanonicalAuthority } = require('./canonical_authority');
const { ConstitutionalAuthority: PersistentAuthority } = require('./constitutional_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');

class WitnessBlock {
  constructor(data, previousHash = null, blockNumber = 0, authority = 'WitnessAuthority') {
    this.id = deterministicIdAuthority.generateIdFromObject({ data, previousHash, blockNumber, authority });
    this.blockNumber = blockNumber;
    this.data = data;
    this.previousHash = previousHash;
    this.authority = authority;
    this.timestamp = constitutionalTimeAuthority.now();
    this.witnessRoot = this._computeWitnessRoot();
    this.hash = CanonicalAuthority.hashWitnessBlock(this);
    this.signature = null;
  }

  _computeWitnessRoot() {
    // Compute witness root from data
    return CanonicalAuthority.hash(this.data);
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
      blockNumber: this.blockNumber,
      data: this.data,
      previousHash: this.previousHash,
      authority: this.authority,
      timestamp: this.timestamp,
      hash: this.hash,
      signature: this.signature,
      witnessRoot: this.witnessRoot,
    };
  }
}

class WitnessChain {
  constructor(postgresPool, constitutionalAuthority = null) {
    this._postgres = postgresPool;
    this._constitutionalAuthority = constitutionalAuthority;
    this._genesisBlock = null;
  }

  async initialize() {
    // Use persistent constitutional authority if provided
    if (this._constitutionalAuthority) {
      await this._constitutionalAuthority.initialize();
    }

    // Load or create genesis block
    await this._loadGenesis();
  }

  async _loadGenesis() {
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type = 'WITNESS_GENESIS'
      ORDER BY event_id ASC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      this._genesisBlock = result.rows[0].event_data;
    } else {
      // Create genesis block
      const genesisBlock = new WitnessBlock(
        { type: 'genesis', message: 'Witness chain genesis' },
        null,
        0,
        this._constitutionalAuthority ? this._constitutionalAuthority.getAuthorityRoot() : 'WitnessAuthority'
      );
      
      if (this._constitutionalAuthority) {
        genesisBlock.signature = this._constitutionalAuthority.sign(genesisBlock.hash);
      }
      
      this._genesisBlock = genesisBlock.toJSON();
      
      await this._postgres.query(`
        INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
        VALUES ($1, $2, NOW(), $3, $4, $5)
      `, [
        genesisBlock.id,
        'WITNESS_GENESIS',
        genesisBlock.id,
        'WITNESS',
        JSON.stringify(this._genesisBlock),
      ]);
    }
  }

  /**
   * Append witness block for constitutional artifacts
   * 
   * Constitutional Constraint: Witness signs object hashes only, not arbitrary payloads
   * 
   * Witnesses should attest to:
   * - Replay ID
   * - Object IDs
   * - Canonical hashes
   * - Compiler pass
   * - Mission ID
   * - Reflection ID
   * 
   * Not arbitrary runtime event envelopes
   */
  async append(artifacts, authority = null) {
    // Validate artifacts structure
    if (!artifacts || typeof artifacts !== 'object') {
      throw new Error('Witness requires structured artifacts object');
    }

    // Only allow constitutional artifact fields
    const allowedFields = [
      'replay_id',
      'object_ids',
      'canonical_hashes',
      'compiler_pass',
      'mission_id',
      'reflection_id',
    ];

    const artifactData = {};
    for (const field of allowedFields) {
      if (artifacts[field] !== undefined) {
        artifactData[field] = artifacts[field];
      }
    }

    // Ensure at least one artifact is present
    if (Object.keys(artifactData).length === 0) {
      throw new Error('Witness requires at least one constitutional artifact field');
    }

    // Get latest block
    const latestBlock = await this._getLatestBlock();
    const previousHash = latestBlock ? latestBlock.hash : this._genesisBlock.hash;
    const blockNumber = latestBlock ? latestBlock.blockNumber + 1 : 1;

    // Use constitutional authority or provided authority
    const effectiveAuthority = authority || (this._constitutionalAuthority ? this._constitutionalAuthority.getAuthorityRoot() : 'WitnessAuthority');

    // Create new block with artifact data only
    const block = new WitnessBlock(artifactData, previousHash, blockNumber, effectiveAuthority);
    
    if (this._constitutionalAuthority) {
      block.signature = this._constitutionalAuthority.sign(block.hash);
    }

    // Persist (append-only)
    await this._postgres.query(`
      INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
      VALUES ($1, $2, NOW(), $3, $4, $5)
    `, [
      block.id,
      'WITNESS_BLOCK',
      block.id,
      'WITNESS',
      JSON.stringify(block.toJSON()),
    ]);

    return block.toJSON();
  }

  async _getLatestBlock() {
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type = 'WITNESS_BLOCK'
      ORDER BY event_id DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      return result.rows[0].event_data;
    }
    return null;
  }

  async verifyChain() {
    // Verify entire chain from genesis to latest
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type IN ('WITNESS_GENESIS', 'WITNESS_BLOCK')
      ORDER BY event_id ASC
    `);

    const blocks = result.rows.map(row => row.event_data);
    return this._verifyBlocks(blocks);
  }

  /**
   * Verify provenance of witness block
   * 
   * Validates: Replay Event → Constitutional Object → Canonical Hash → Witness Block
   */
  async verifyProvenance(block) {
    if (!block.data || !block.data.replay_event_id) {
      console.warn(`Witness block ${block.id} has no replay event reference`);
      return true; // Not all blocks need provenance
    }

    // Verify replay event exists
    const replayResult = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_id = $1 AND event_type = 'REPLAY_LOG_ENTRY'
    `, [block.data.replay_event_id]);

    if (replayResult.rows.length === 0) {
      console.error(`Replay event ${block.data.replay_event_id} not found for witness block ${block.id}`);
      return false;
    }

    const replayEvent = replayResult.rows[0].event_data;

    // Verify constitutional object reference if present
    if (replayEvent.data && replayEvent.data.object_id) {
      const objectResult = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_id = $1
      `, [replayEvent.data.object_id]);

      if (objectResult.rows.length === 0) {
        console.error(`Constitutional object ${replayEvent.data.object_id} not found for replay event ${block.data.replay_event_id}`);
        return false;
      }

      const constitutionalObject = objectResult.rows[0].event_data;

      // Verify canonical hash
      if (constitutionalObject.canonical_hash !== replayEvent.data.object_hash) {
        console.error(`Canonical hash mismatch for object ${replayEvent.data.object_id}`);
        return false;
      }
    }

    return true;
  }

  async _verifyBlocks(blocks) {
    if (blocks.length === 0) return false;

    let previousHash = null;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Verify hash
      const blockHash = block.hash;
      const computedHash = CanonicalAuthority.hashWitnessBlock(block);
      if (blockHash !== computedHash) {
        console.error(`Hash mismatch for block ${block.id} at index ${i}`);
        return false;
      }

      // Verify chain link
      if (i === 0) {
        // Genesis block should have no previous hash
        if (block.previousHash !== null) {
          console.error(`Genesis block has previous hash`);
          return false;
        }
      } else {
        if (block.previousHash !== previousHash) {
          console.error(`Chain link broken for block ${block.id} at index ${i}`);
          return false;
        }
      }

      // Verify signature
      let isValid = false;
      if (this._constitutionalAuthority) {
        isValid = this._constitutionalAuthority.verify(block.hash, block.signature);
      } else {
        // Fallback to ephemeral key for backward compatibility
        isValid = crypto.verify(
          null,
          Buffer.from(block.hash, 'utf8'),
          this._publicKey,
          Buffer.from(block.signature, 'hex')
        );
      }

      if (!isValid) {
        console.error(`Signature verification failed for block ${block.id}`);
        return false;
      }

      // Verify provenance
      const provenanceValid = await this.verifyProvenance(block);
      if (!provenanceValid) {
        console.error(`Provenance verification failed for block ${block.id}`);
        return false;
      }

      previousHash = blockHash;
    }

    return true;
  }

  async getChainLength() {
    const result = await this._postgres.query(`
      SELECT COUNT(*)
      FROM events
      WHERE event_type = 'WITNESS_BLOCK'
    `);
    return parseInt(result.rows[0].count, 10) + 1; // +1 for genesis
  }

  async getBlocks(limit = 10, offset = 0) {
    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type IN ('WITNESS_GENESIS', 'WITNESS_BLOCK')
      ORDER BY event_data->>'blockNumber' ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows.map(row => row.event_data);
  }

  async getBlockByNumber(blockNumber) {
    if (blockNumber === 0) {
      return this._genesisBlock;
    }

    const result = await this._postgres.query(`
      SELECT event_data
      FROM events
      WHERE event_type = 'WITNESS_BLOCK'
      AND event_data->>'blockNumber' = $1
      LIMIT 1
    `, [String(blockNumber)]);

    if (result.rows.length > 0) {
      return result.rows[0].event_data;
    }
    return null;
  }

  async getWitnessRoot(lifecycleId) {
    // Get the witness root for a specific lifecycle
    const result = await this._postgres.query(`
      SELECT event_data->>'witnessRoot' as witness_root
      FROM events
      WHERE event_type = 'WITNESS_BLOCK'
      AND event_data->'data'->>'lifecycle_id' = $1
      ORDER BY event_id DESC
      LIMIT 1
    `, [lifecycleId]);

    if (result.rows.length > 0) {
      return result.rows[0].witness_root;
    }
    return null;
  }
}

module.exports = {
  WitnessBlock,
  WitnessChain,
};
