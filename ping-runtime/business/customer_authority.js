/**
 * Customer Authority
 *
 * HPP business authority for Customer management.
 * Consumes data from Google adapters (People, Gmail, Calendar),
 * merges into a single Customer aggregate, persists to Postgres,
 * and emits CUSTOMER_* events through CanonicalEventEnvelope.
 *
 * Constitutional Constraint:
 * - Authority operations, not CRUD
 * - All DB access via this._storage (PostgresAdapter)
 * - Events emitted via CanonicalEventEnvelope
 * - No direct pool.query()
 * - Tenant isolation enforced
 * - Canonical identity: customer://{tenantId}/{customerId}
 */

const crypto = require('crypto');
const { CanonicalEventEnvelope } = require('../../gateway/canonical_event_envelope');
const { isDeepStrictEqual } = require('node:util');

const CUSTOMER_UPSERT_FIELDS = new Set([
  'customer_id', 'display_name', 'given_name', 'family_name', 'email', 'emails',
  'phone', 'phones', 'company', 'title', 'address', 'addresses', 'photo_url',
  'biography', 'birthday', 'website', 'source', 'source_id', 'source_url', 'metadata',
]);
const CUSTOMER_TEXT_FIELDS = [
  'customer_id', 'display_name', 'given_name', 'family_name', 'email', 'phone',
  'company', 'title', 'photo_url', 'biography', 'birthday', 'website', 'source',
  'source_id', 'source_url',
];

function legacyWriteError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

class CustomerAuthority {
  /**
   * @param {Object} storage - PostgresAdapter
   * @param {Object} eventEnvelope - CanonicalEventEnvelope
   * @param {Object} [options]
   * @param {Object} [options.peopleAdapter] - GooglePeopleAdapter
   * @param {Object} [options.gmailAdapter] - GmailAdapter
   * @param {Object} [options.calendarAdapter] - GoogleCalendarAdapter
   */
  constructor(storage, eventEnvelope, options = {}) {
    this._storage = storage;
    this._eventEnvelope = eventEnvelope;
    this._peopleAdapter = options.peopleAdapter || null;
    this._gmailAdapter = options.gmailAdapter || null;
    this._calendarAdapter = options.calendarAdapter || null;
    this._tenantRegistry = options.tenantRegistry || null;
    this._eventRuntime = options.eventRuntime || null;
    this._admissionStorageIdentity = options.admissionStorageIdentity || null;
    this._dependencies = ['storage', 'canonicalEventEnvelope'];
    this._authorityVersion = '1.0.0';
  }

  get dependencies() {
    return this._dependencies;
  }

  /**
   * Initialize customers table.
   */
  async initialize() {
    await this._storage.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255) NOT NULL,
        display_name VARCHAR(512),
        given_name VARCHAR(255),
        family_name VARCHAR(255),
        email VARCHAR(512),
        emails JSONB DEFAULT '[]',
        phone VARCHAR(255),
        phones JSONB DEFAULT '[]',
        company VARCHAR(512),
        title VARCHAR(512),
        address JSONB,
        photo_url TEXT,
        biography TEXT,
        birthday DATE,
        website TEXT,
        source VARCHAR(64) NOT NULL,
        source_id VARCHAR(512),
        source_url TEXT,
        gmail_thread_count INTEGER DEFAULT 0,
        gmail_last_message_at TIMESTAMPTZ,
        calendar_event_count INTEGER DEFAULT 0,
        calendar_last_event_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, customer_id)
      )
    `);

    await this._storage.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id)
    `);

    await this._storage.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(tenant_id, email)
    `);

    await this._storage.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(tenant_id, source, source_id)
    `);

    console.log('[CustomerAuthority] Tables initialized');
  }

  /**
   * Canonicalize customer ID to URI format.
   *
   * @param {string} tenantId
   * @param {string} customerId
   * @returns {string} Canonical URI
   */
  canonicalizeId(tenantId, customerId) {
    return `customer://${tenantId}/${customerId}`;
  }

  /**
   * Compute deterministic customer ID from source + source_id.
   *
   * @param {string} source - "google_people", "gmail", "google_calendar"
   * @param {string} sourceId - Provider-specific ID
   * @returns {string} Stable customer_id
   */
  _computeCustomerId(source, sourceId) {
    const hash = crypto.createHash('sha256')
      .update(`${source}:${sourceId}`)
      .digest('hex');
    return `cust_${hash.slice(0, 16)}`;
  }

  /**
   * Execute ImportCustomersCommand
   *
   * Pulls contacts from Google People API, normalizes, persists, emits events.
   *
   * @param {Object} command
   * @param {string} command.tenantId
   * @param {Object} [command.options] - Adapter options (pageSize, pageToken, syncToken)
   * @returns {Object} { imported: number, updated: number, errors: string[] }
   */
  async executeImportCustomers() {
    throw legacyWriteError('legacy_provider_operation_blocked');
  }

  /**
   * Execute SyncCustomerEmailCommand
   *
   * Fetches Gmail threads for a customer, updates email metadata.
   *
   * @param {Object} command
   * @param {string} command.tenantId
   * @param {string} command.customerId
   * @param {string} command.email
   * @param {Object} [command.options]
   * @returns {Object} { thread_count: number, last_message_at: string|null }
   */
  async executeSyncCustomerEmail() {
    throw legacyWriteError('legacy_provider_operation_blocked');
  }

  /**
   * Execute SyncCustomerCalendarCommand
   *
   * Fetches Calendar events for a customer, updates calendar metadata.
   *
   * @param {Object} command
   * @param {string} command.tenantId
   * @param {string} command.customerId
   * @param {string} command.email
   * @param {Object} [command.options]
   * @returns {Object} { event_count: number, last_event_at: string|null }
   */
  async executeSyncCustomerCalendar() {
    throw legacyWriteError('legacy_provider_operation_blocked');
  }

  /**
   * Execute ResolveCustomerQuery
   *
   * @param {string} tenantId
   * @param {string} customerId
   * @returns {Object|null}
   */
  async executeResolveCustomer(tenantId, customerId) {
    return this._findCustomer(tenantId, customerId);
  }

  /**
   * Execute SearchCustomersQuery
   *
   * @param {Object} params
   * @param {string} params.tenantId
   * @param {string} [params.query] - Search display_name, email, company
   * @param {string} [params.email] - Exact email match
   * @param {string} [params.source] - Filter by source
   * @param {number} [params.limit]
   * @param {number} [params.offset]
   * @returns {Object[]} Matching customers
   */
  async executeSearchCustomers({ tenantId, query, email, source, limit = 50, offset = 0 } = {}) {
    if (!tenantId) throw new Error('tenantId is required');

    let sql = 'SELECT * FROM customers WHERE tenant_id = $1';
    const params = [tenantId];
    let paramIndex = 2;

    if (email) {
      sql += ` AND LOWER(email) = LOWER($${paramIndex++})`;
      params.push(email);
    }

    if (source) {
      sql += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (query) {
      sql += ` AND (
        LOWER(display_name) LIKE LOWER($${paramIndex})
        OR LOWER(email) LIKE LOWER($${paramIndex})
        OR LOWER(company) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    sql += ` ORDER BY updated_at DESC`;
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this._storage.query(sql, params);
    return result.rows;
  }

  /**
   * Execute ListCustomersQuery
   *
   * @param {Object} params
   * @param {string} params.tenantId
   * @param {number} [params.limit]
   * @param {number} [params.offset]
   * @returns {Object[]} All customers for tenant
   */
  async executeListCustomers({ tenantId, limit = 100, offset = 0 } = {}) {
    if (!tenantId) throw new Error('tenantId is required');

    const result = await this._storage.query(
      `SELECT * FROM customers
       WHERE tenant_id = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Execute GetCustomerStatsQuery
   *
   * @param {string} tenantId
   * @returns {Object} Aggregate stats
   */
  async executeGetCustomerStats(tenantId) {
    if (!tenantId) throw new Error('tenantId is required');

    const result = await this._storage.query(
      `SELECT
         COUNT(*) as total_customers,
         COUNT(DISTINCT source) as sources,
         COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
         COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
         COUNT(CASE WHEN company IS NOT NULL THEN 1 END) as with_company,
         SUM(gmail_thread_count) as total_threads,
         SUM(calendar_event_count) as total_events,
         MIN(created_at) as first_imported,
         MAX(updated_at) as last_updated
       FROM customers
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const sourceBreakdown = await this._storage.query(
      `SELECT source, COUNT(*) as count
       FROM customers
       WHERE tenant_id = $1
       GROUP BY source
       ORDER BY count DESC`,
      [tenantId]
    );

    return {
      ...result.rows[0],
      total_customers: parseInt(result.rows[0].total_customers) || 0,
      total_threads: parseInt(result.rows[0].total_threads) || 0,
      total_events: parseInt(result.rows[0].total_events) || 0,
      sources: sourceBreakdown.rows,
    };
  }

  /**
   * Execute UpsertCustomerCommand
   *
   * Manually create or update a customer (not from Google sync).
   *
   * @param {Object} command
   * @param {string} command.tenantId
   * @param {Object} command.customer - Customer data
   * @returns {Object} Persisted customer
   */
  async executeUpsertCustomer() {
    throw legacyWriteError('legacy_command_not_admitted');
  }

  /**
   * Execute the narrowly scoped, signed CUSTOMER_UPSERT command. TenantRegistry
   * owns actor, grant, scope, revocation, idempotency and receipt decisions;
   * this callback performs the existing customer SQL and compatibility event
   * mirror on the exact transaction client supplied by that admission.
   */
  async executeAdmittedUpsert(context, submission) {
    if (!this._tenantRegistry || !this._eventRuntime ||
        typeof this._eventRuntime.admitCommand !== 'function') {
      throw legacyWriteError('legacy_admission_unconfigured');
    }

    const commissioningPool = this._tenantRegistry._commissioningPool;
    const eventPool = this._eventRuntime._pool;
    const storagePool = this._storage && (this._storage._pool || this._storage);
    const envelopeStorage = this._eventEnvelope && this._eventEnvelope._storage;
    const envelopePool = envelopeStorage && (envelopeStorage._pool || envelopeStorage);
    const identity = this._admissionStorageIdentity;
    const verifiedSeparateStorage = identity?.storage === this._storage &&
      identity.admissionPool === commissioningPool && identity.customers_oid && identity.canonical_events_oid;
    if (!commissioningPool || commissioningPool !== eventPool ||
        (storagePool !== commissioningPool && !verifiedSeparateStorage) || envelopePool !== storagePool) {
      throw legacyWriteError('commissioning_pool_mismatch');
    }

    return this._eventRuntime.admitCommand(
      this._tenantRegistry,
      context,
      submission,
      async (client, data, append) => {
        const { intent, payload, operationDigest } = data || {};
        if (intent?.operation !== 'CUSTOMER_UPSERT') throw legacyWriteError('operation_not_implemented');
        if (!client || typeof client.query !== 'function' || typeof append !== 'function') {
          throw legacyWriteError('legacy_admission_unconfigured');
        }
        if (verifiedSeparateStorage) {
          const relations = (await client.query("SELECT to_regclass('customers')::oid AS customers_oid,to_regclass('canonical_events')::oid AS canonical_events_oid")).rows[0];
          if (!relations || relations.customers_oid !== identity.customers_oid ||
              relations.canonical_events_oid !== identity.canonical_events_oid) {
            throw legacyWriteError('commissioning_pool_mismatch');
          }
        }
        const customer = this._validateAdmittedCustomerPayload(intent, payload);
        if (!/^[a-f0-9]{64}$/.test(operationDigest || '')) throw legacyWriteError('invalid_operation_digest');

        const resourceId = this.canonicalizeId(intent.tenant_id, customer.customer_id);
        if (resourceId.length > 255 || intent.resource_id !== resourceId) {
          throw legacyWriteError('resource_scope_mismatch');
        }

        // This runs only after TenantRegistry has verified the actor and grant.
        // Serialize same-customer commands, including commands using different grants.
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
          'customer-upsert', resourceId,
        ]);

        const txAuthority = new CustomerAuthority(
          client,
          new CanonicalEventEnvelope(client, {
            repoRoot: this._eventEnvelope._repoRoot,
          }),
          { tenantRegistry: this._tenantRegistry, eventRuntime: this._eventRuntime },
        );
        const existing = await txAuthority._findCustomer(intent.tenant_id, customer.customer_id);
        if (existing) {
          await txAuthority._updateCustomer(intent.tenant_id, customer.customer_id, customer);
        } else {
          await txAuthority._insertCustomer(intent.tenant_id, customer.customer_id, customer);
        }

        const eventType = existing ? 'CUSTOMER_UPDATED' : 'CUSTOMER_CREATED';
        const eventPayload = {
          customer_id: customer.customer_id,
          display_name: customer.display_name || null,
          email: customer.email || null,
          // Retain the complete validated command for deterministic evidence replay.
          command: payload,
        };
        const appendResult = await append(eventType, eventPayload);
        if (!appendResult || appendResult.status !== 'ok' || !appendResult.inserted ||
            !appendResult.eventId) {
          throw legacyWriteError('event_persistence_failed');
        }

        const mirrorPayload = {
          ...eventPayload,
          ping_event_id: appendResult.eventId,
          operation_digest: operationDigest,
        };
        const envelope = txAuthority._eventEnvelope;
        const mirrorMetadata = {
          authority: 'customer',
          version: this._authorityVersion,
          compatibility: 'commissioning-admission@2',
          ping_event_id: appendResult.eventId,
          operation_digest: operationDigest,
        };
        const mirror = await envelope.executeEmitEvent({
          tenantId: intent.tenant_id,
          eventType,
          source: 'customer-authority',
          actor: intent.authenticated_actor,
          payload: mirrorPayload,
          metadata: mirrorMetadata,
        });

        const persisted = await client.query(
          `SELECT event_id, event_type, tenant_id, actor, source, payload, metadata, processed
           FROM canonical_events WHERE event_id = $1`,
          [mirror.event_id],
        );
        const row = persisted.rows[0];
        const json = value => typeof value === 'string' ? JSON.parse(value) : value;
        const storedPayload = row && json(row.payload);
        const storedMetadata = row && json(row.metadata);
        const expectedMetadata = mirror && {
          ...mirrorMetadata,
          created_at: mirror.metadata && mirror.metadata.created_at,
        };
        if (!row || row.event_type !== eventType || row.tenant_id !== intent.tenant_id ||
            row.actor !== intent.authenticated_actor || row.source !== 'customer-authority' ||
            row.processed !== false || storedPayload?.ping_event_id !== appendResult.eventId ||
            storedPayload?.operation_digest !== operationDigest ||
            storedPayload?.customer_id !== customer.customer_id ||
            storedMetadata?.ping_event_id !== appendResult.eventId ||
            storedMetadata?.operation_digest !== operationDigest ||
            !mirror || row.event_id !== mirror.event_id ||
            !isDeepStrictEqual(storedPayload, mirrorPayload) ||
            !isDeepStrictEqual(storedMetadata, expectedMetadata)) {
          throw legacyWriteError('compatibility_event_mismatch');
        }

        const marked = await client.query(
          `UPDATE canonical_events
           SET processed = TRUE, processed_at = NOW(), worker = 'admission-compatibility'
           WHERE event_id = $1 AND processed = FALSE`,
          [mirror.event_id],
        );
        if (marked.rowCount !== 1) throw legacyWriteError('compatibility_event_mark_failed');

        const verified = await client.query(
          `SELECT processed, worker, payload, metadata
           FROM canonical_events WHERE event_id = $1`,
          [mirror.event_id],
        );
        const finalRow = verified.rows[0];
        if (!finalRow || finalRow.processed !== true || finalRow.worker !== 'admission-compatibility' ||
            !isDeepStrictEqual(json(finalRow.payload), mirrorPayload) ||
            !isDeepStrictEqual(json(finalRow.metadata), expectedMetadata)) {
          throw legacyWriteError('compatibility_event_verification_failed');
        }

        return {
          ...appendResult,
          commandResult: { customer_id: customer.customer_id },
          compatibilityEventId: mirror.event_id,
        };
      },
    );
  }

  _validateAdmittedCustomerPayload(intent, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
        Object.keys(payload).sort().join(',') !== 'customer,tenant_id' ||
        typeof payload.tenant_id !== 'string' || payload.tenant_id !== intent.tenant_id ||
        !payload.customer || typeof payload.customer !== 'object' || Array.isArray(payload.customer)) {
      throw legacyWriteError('invalid_customer_command');
    }
    const customer = payload.customer;
    if (Object.keys(customer).some(key => !CUSTOMER_UPSERT_FIELDS.has(key))) {
      throw legacyWriteError('unsupported_customer_field');
    }
    if (typeof customer.customer_id !== 'string' || customer.customer_id.length < 1 ||
        customer.customer_id.length > 255) {
      throw legacyWriteError('invalid_customer_id');
    }
    for (const field of CUSTOMER_TEXT_FIELDS) {
      if (customer[field] !== undefined && customer[field] !== null && typeof customer[field] !== 'string') {
        throw legacyWriteError('invalid_customer_field');
      }
    }
    if (customer.source !== undefined && customer.source !== 'manual') {
      throw legacyWriteError('invalid_customer_source');
    }
    for (const field of ['emails', 'phones', 'addresses']) {
      if (customer[field] !== undefined && !Array.isArray(customer[field])) {
        throw legacyWriteError('invalid_customer_field');
      }
    }
    if (customer.metadata !== undefined && (!customer.metadata || typeof customer.metadata !== 'object' ||
        Array.isArray(customer.metadata))) {
      throw legacyWriteError('invalid_customer_field');
    }
    if (customer.address !== undefined && customer.address !== null &&
        (typeof customer.address !== 'object' || Array.isArray(customer.address))) {
      throw legacyWriteError('invalid_customer_field');
    }
    return { ...customer, source: 'manual' };
  }

  // ── Private Helpers ──────────────────────────────────────

  /**
   * Find a customer by tenant + customer_id.
   *
   * @param {string} tenantId
   * @param {string} customerId
   * @returns {Object|null}
   */
  async _findCustomer(tenantId, customerId) {
    const result = await this._storage.query(
      'SELECT * FROM customers WHERE tenant_id = $1 AND customer_id = $2',
      [tenantId, customerId]
    );
    return result.rows[0] || null;
  }

  /**
   * Insert a new customer.
   *
   * @param {string} tenantId
   * @param {string} customerId
   * @param {Object} data - Normalized contact data
   */
  async _insertCustomer(tenantId, customerId, data) {
    await this._storage.query(
      `INSERT INTO customers
       (tenant_id, customer_id, display_name, given_name, family_name,
        email, emails, phone, phones, company, title,
        address, photo_url, biography, birthday, website,
        source, source_id, source_url, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        tenantId, customerId,
        data.display_name || null,
        data.given_name || null,
        data.family_name || null,
        data.email || null,
        JSON.stringify(data.emails || []),
        data.phone || null,
        JSON.stringify(data.phones || []),
        data.company || null,
        data.title || null,
        JSON.stringify(data.addresses?.[0] || data.address || null),
        data.photo_url || null,
        data.biography || null,
        data.birthday || null,
        data.website || null,
        data.source || 'manual',
        data.source_id || null,
        data.source_url || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
  }

  /**
   * Update an existing customer.
   *
   * @param {string} tenantId
   * @param {string} customerId
   * @param {Object} data - Normalized contact data
   */
  async _updateCustomer(tenantId, customerId, data) {
    await this._storage.query(
      `UPDATE customers SET
        display_name = COALESCE($3, display_name),
        given_name = COALESCE($4, given_name),
        family_name = COALESCE($5, family_name),
        email = COALESCE($6, email),
        emails = COALESCE($7, emails),
        phone = COALESCE($8, phone),
        phones = COALESCE($9, phones),
        company = COALESCE($10, company),
        title = COALESCE($11, title),
        address = COALESCE($12, address),
        photo_url = COALESCE($13, photo_url),
        biography = COALESCE($14, biography),
        birthday = COALESCE($15, birthday),
        website = COALESCE($16, website),
        source = COALESCE($17, source),
        source_id = COALESCE($18, source_id),
        source_url = COALESCE($19, source_url),
        updated_at = NOW()
       WHERE tenant_id = $1 AND customer_id = $2`,
      [
        tenantId, customerId,
        data.display_name || null,
        data.given_name || null,
        data.family_name || null,
        data.email || null,
        data.emails ? JSON.stringify(data.emails) : null,
        data.phone || null,
        data.phones ? JSON.stringify(data.phones) : null,
        data.company || null,
        data.title || null,
        data.addresses?.[0] ? JSON.stringify(data.addresses[0]) : (data.address ? JSON.stringify(data.address) : null),
        data.photo_url || null,
        data.biography || null,
        data.birthday || null,
        data.website || null,
        data.source || null,
        data.source_id || null,
        data.source_url || null,
      ]
    );
  }

  /**
   * Emit a CUSTOMER_* event through CanonicalEventEnvelope.
   *
   * @param {string} tenantId
   * @param {string} eventType
   * @param {Object} payload
   * @param {Object} [options]
   * @param {string} [options.causationId]
   * @param {string} [options.correlationId]
   */
  async _emitEvent(tenantId, eventType, payload, options = {}) {
    await this._eventEnvelope.executeEmitEvent({
      tenantId,
      eventType,
      source: 'customer-authority',
      actor: 'system',
      payload,
      causationId: options.causationId || null,
      correlationId: options.correlationId || null,
      metadata: { authority: 'customer', version: this._authorityVersion },
    });
  }

  /**
   * Health check.
   */
  async health() {
    try {
      await this._storage.query('SELECT 1');
      return {
        healthy: true,
        storage: { healthy: true },
        adapters: {
          people: this._peopleAdapter ? 'configured' : 'missing',
          gmail: this._gmailAdapter ? 'configured' : 'missing',
          calendar: this._calendarAdapter ? 'configured' : 'missing',
        },
      };
    } catch (error) {
      return { healthy: false, storage: { healthy: false, error: error.message } };
    }
  }

  /**
   * Publish contract.
   */
  publishContract() {
    const contract = {
      authority_id: 'customer',
      authority_name: 'CustomerAuthority',
      version: this._authorityVersion,
      owner: 'hpp',
      consumes: ['tenantId', 'customerId', 'email', 'customer', 'options'],
      produces: ['customer', 'CUSTOMER_*_events'],
      guarantees: ['tenant_isolated', 'deterministic_id', 'event_sourced'],
      invariants: [
        'customer_id is deterministic SHA-256 from (source, source_id)',
        'every mutation emits a CUSTOMER_* event',
        'tenant A cannot read tenant B customers',
        'customer_id is canonical URI: customer://{tenantId}/{customerId}',
      ],
      consumers: ['googlePeopleAdapter', 'gmailAdapter', 'googleCalendarAdapter'],
      requires: ['storage', 'canonicalEventEnvelope'],
      failure_modes: ['adapter_unavailable', 'postgres_unavailable', 'duplicate_source_id'],
      rollback: 'event_driven',
      determinism: 'deterministic',
      dependencies: this._dependencies,
      schema_version: '1.0.0',
      authority_version: this._authorityVersion,
    };

    const { computeCanonicalHash } = require('../authorities/constitutional_validation');
    contract.contract_hash = computeCanonicalHash(contract);

    return contract;
  }
}

module.exports = { CustomerAuthority };
