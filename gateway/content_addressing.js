/**
 * Content Addressing System
 * 
 * Full content addressing where canonical hash is the primary identity.
 * 
 * Constitutional Constraint:
 * - Everything should be retrievable by canonical hash
 * - UUID becomes optional alias
 * - Real identity: sha256 or blake3
 * 
 * This enables:
 * - Deduplication by content
 * - Content-based integrity verification
 * - Merkle tree construction
 * - Efficient diffing
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ContentAddress {
  constructor(content, algorithm = 'sha256') {
    this.content = content;
    this.algorithm = algorithm;
    this.hash = this._computeHash();
    this.uuid = this._generateUUIDAlias();
  }

  _computeHash() {
    const canonical = this._canonicalStringify(this.content);
    // Use CanonicalAuthority.hashBytes for all algorithms
    const canonicalBytes = Buffer.from(canonical, 'utf8');
    return CanonicalAuthority.hashBytes(canonicalBytes, this.algorithm);
  }

  _generateUUIDAlias() {
    // Generate UUID v5 from hash for deterministic alias
    const hashBuffer = Buffer.from(this.hash, 'hex');
    const namespace = CanonicalAuthority.hashBytes(Buffer.from('content-addressing'), 'md5');
    
    // UUID v5 algorithm
    const timeLow = hashBuffer.slice(0, 4).readUInt32BE(0);
    const timeMid = hashBuffer.slice(4, 6).readUInt16BE(0);
    const timeHiAndVersion = (hashBuffer.slice(6, 8).readUInt16BE(0) & 0x0FFF) | 0x5000;
    const clockSeqHiAndReserved = (hashBuffer[8] & 0x3F) | 0x80;
    const clockSeqLow = hashBuffer[9];
    const node = hashBuffer.slice(10, 16);

    const hex = (n) => n.toString(16).padStart(2, '0');
    
    return [
      hex(timeLow >>> 24),
      hex((timeLow >>> 16) & 0xFF),
      hex((timeLow >>> 8) & 0xFF),
      hex(timeLow & 0xFF),
      '-',
      hex(timeMid >>> 8),
      hex(timeMid & 0xFF),
      '-',
      hex(timeHiAndVersion >>> 8),
      hex(timeHiAndVersion & 0xFF),
      '-',
      hex(clockSeqHiAndReserved),
      hex(clockSeqLow),
      '-',
      hex(node[0]),
      hex(node[1]),
      hex(node[2]),
      hex(node[3]),
      hex(node[4]),
      hex(node[5]),
    ].join('');
  }

  _canonicalStringify(obj) {
    if (obj === null || obj === undefined) return String(obj);
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this._canonicalStringify(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    return '{' + sortedKeys.map(key => 
      JSON.stringify(key) + ':' + this._canonicalStringify(sortedObj[key])
    ).join(',') + '}';
  }

  getPrimaryIdentity() {
    return this.hash;
  }

  getAlias() {
    return this.uuid;
  }

  toJSON() {
    return {
      primary_identity: this.hash,
      alias: this.uuid,
      algorithm: this.algorithm,
    };
  }
}

class ContentAddressingStore {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._algorithm = 'sha256';
  }

  async store(content, metadata = {}) {
    // Create content address
    const address = new ContentAddress(content, this._algorithm);
    
    // Check if already exists
    const exists = await this._exists(address.hash);
    if (exists) {
      return {
        hash: address.hash,
        uuid: address.uuid,
        exists: true,
      };
    }

    // Store content
    await this._postgres.query(`
      INSERT INTO content_store (hash, uuid, content, algorithm, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (hash) DO UPDATE SET uuid = $2, content = $3, algorithm = $4, metadata = $5
    `, [
      address.hash,
      address.uuid,
      JSON.stringify(content),
      this._algorithm,
      JSON.stringify(metadata),
    ]);

    return {
      hash: address.hash,
      uuid: address.uuid,
      exists: false,
    };
  }

  async retrieve(hash) {
    const result = await this._postgres.query(`
      SELECT content, uuid, algorithm, metadata
      FROM content_store
      WHERE hash = $1
      LIMIT 1
    `, [hash]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      content: result.rows[0].content,
      uuid: result.rows[0].uuid,
      algorithm: result.rows[0].algorithm,
      metadata: result.rows[0].metadata,
    };
  }

  async retrieveByUUID(uuid) {
    const result = await this._postgres.query(`
      SELECT content, hash, algorithm, metadata
      FROM content_store
      WHERE uuid = $1
      LIMIT 1
    `, [uuid]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      content: result.rows[0].content,
      hash: result.rows[0].hash,
      algorithm: result.rows[0].algorithm,
      metadata: result.rows[0].metadata,
    };
  }

  async verify(hash, content) {
    const stored = await this.retrieve(hash);
    if (!stored) {
      return false;
    }

    const address = new ContentAddress(content, stored.algorithm);
    return address.hash === hash;
  }

  async _exists(hash) {
    const result = await this._postgres.query(`
      SELECT 1
      FROM content_store
      WHERE hash = $1
      LIMIT 1
    `, [hash]);

    return result.rows.length > 0;
  }

  async deduplicate(content) {
    // Check if content already exists
    const address = new ContentAddress(content, this._algorithm);
    const stored = await this.retrieve(address.hash);
    
    if (stored) {
      return {
        hash: address.hash,
        uuid: stored.uuid,
        deduplicated: true,
      };
    }

    // Store new content
    return await this.store(content);
  }

  async getStatistics() {
    const result = await this._postgres.query(`
      SELECT 
        COUNT(*) as total_objects,
        COUNT(DISTINCT algorithm) as algorithms,
        SUM(pg_column_size(content)) as total_size
      FROM content_store
    `);

    return {
      total_objects: parseInt(result.rows[0].total_objects, 10),
      algorithms: parseInt(result.rows[0].algorithms, 10),
      total_size: parseInt(result.rows[0].total_size, 10),
    };
  }

  async setAlgorithm(algorithm) {
    if (['sha256', 'sha384', 'sha512', 'blake2b256', 'blake3'].includes(algorithm)) {
      this._algorithm = algorithm;
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }

  getAlgorithm() {
    return this._algorithm;
  }
}

class ContentAddressedObject {
  constructor(content, metadata = {}) {
    this._contentAddress = new ContentAddress(content);
    this._content = content;
    this._metadata = metadata;
  }

  get hash() {
    return this._contentAddress.hash;
  }

  get uuid() {
    return this._contentAddress.uuid;
  }

  get content() {
    return this._content;
  }

  get metadata() {
    return this._metadata;
  }

  toJSON() {
    return {
      hash: this.hash,
      uuid: this.uuid,
      content: this._content,
      metadata: this._metadata,
    };
  }

  static fromHash(hash, content) {
    const obj = new ContentAddressedObject(content);
    obj._contentAddress.hash = hash;
    return obj;
  }
}

module.exports = {
  ContentAddress,
  ContentAddressingStore,
  ContentAddressedObject,
};
