/**
 * Persistent Queue Authority
 *
 * Phase 36E — Autonomous Engineering Fabric
 *
 * Constitutional authority for event-sourced multi-tier queue architecture.
 *
 * Queue Architecture:
 * Mission Queue → Capability Queue → Execution Queue → Result Queue
 *
 * Constitutional Constraint:
 * - Each queue is event-sourced
 * - Queue state is reconstructible from events
 * - Queue operations are constitutional
 * - Queue lifecycle is replayable
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Queue Types
 */
const QueueTypes = {
  MISSION_QUEUE: 'MissionQueue',
  CAPABILITY_QUEUE: 'CapabilityQueue',
  EXECUTION_QUEUE: 'ExecutionQueue',
  RESULT_QUEUE: 'ResultQueue'
};

/**
 * Queue Item Status
 */
const QueueItemStatus = {
  PENDING: 'pending',
  CLAIMED: 'claimed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Queue Item Schema
 *
 * Constitutional queue item artifact.
 */
class QueueItem {
  constructor(data) {
    this.item_id = data.item_id;
    this.queue_type = data.queue_type;
    this.payload = data.payload;
    this.priority = data.priority || 'medium';
    this.status = data.status || QueueItemStatus.PENDING;
    this.claimed_by = data.claimed_by || null;
    this.claimed_at = data.claimed_at || null;
    this.completed_at = data.completed_at || null;
    this.error = data.error || null;
    this.retry_count = data.retry_count || 0;
    this.max_retries = data.max_retries || 3;
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.enqueued_at = data.enqueued_at || constitutionalTimeAuthority.nowAsMillis();
    this.enqueued_by = data.enqueued_by || 'PersistentQueueAuthority';
    this.authority = 'PersistentQueueAuthority';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // Constitutional hashes
    this.item_hash = this._computeItemHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute item hash
   */
  _computeItemHash() {
    const itemData = {
      item_id: this.item_id,
      queue_type: this.queue_type,
      payload: this.payload,
      priority: this.priority,
      runtime_id: this.runtime_id,
      enqueued_at: this.enqueued_at
    };
    return CanonicalAuthority.hash(itemData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.item_id,
      input_hash: this.item_hash,
      output_hash: this.status === QueueItemStatus.COMPLETED ? CanonicalAuthority.hash(this.payload) : null,
      authority: this.authority,
      node_id: this.item_id,
      success: this.status === QueueItemStatus.COMPLETED,
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Claim item
   */
  claim(claimedBy) {
    this.status = QueueItemStatus.CLAIMED;
    this.claimed_by = claimedBy;
    this.claimed_at = constitutionalTimeAuthority.nowAsMillis();
    this.item_hash = this._computeItemHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Start processing
   */
  startProcessing() {
    this.status = QueueItemStatus.PROCESSING;
    this.item_hash = this._computeItemHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Complete item
   */
  complete(result) {
    this.status = QueueItemStatus.COMPLETED;
    this.completed_at = constitutionalTimeAuthority.nowAsMillis();
    this.payload = { ...this.payload, result };
    this.item_hash = this._computeItemHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Fail item
   */
  fail(error) {
    this.status = QueueItemStatus.FAILED;
    this.completed_at = constitutionalTimeAuthority.nowAsMillis();
    this.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
    this.retry_count++;
    this.item_hash = this._computeItemHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Serialize item to canonical bytes
   */
  toCanonical() {
    const ordered = {
      item_id: this.item_id,
      queue_type: this.queue_type,
      payload: this.payload,
      priority: this.priority,
      status: this.status,
      claimed_by: this.claimed_by,
      claimed_at: this.claimed_at,
      completed_at: this.completed_at,
      error: this.error,
      retry_count: this.retry_count,
      max_retries: this.max_retries,
      runtime_id: this.runtime_id,
      enqueued_at: this.enqueued_at,
      enqueued_by: this.enqueued_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      item_hash: this.item_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      item_id: this.item_id,
      queue_type: this.queue_type,
      payload: this.payload,
      priority: this.priority,
      status: this.status,
      claimed_by: this.claimed_by,
      claimed_at: this.claimed_at,
      completed_at: this.completed_at,
      error: this.error,
      retry_count: this.retry_count,
      max_retries: this.max_retries,
      runtime_id: this.runtime_id,
      enqueued_at: this.enqueued_at,
      enqueued_by: this.enqueued_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      item_hash: this.item_hash,
      witness: this.witness
    };
  }
}

/**
 * Persistent Queue Authority
 *
 * Constitutional authority for multi-tier queue architecture.
 */
class PersistentQueueAuthority {
  constructor(eventRepository, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._queues = new Map();
    
    // Initialize queues
    this._queues.set(QueueTypes.MISSION_QUEUE, new Map());
    this._queues.set(QueueTypes.CAPABILITY_QUEUE, new Map());
    this._queues.set(QueueTypes.EXECUTION_QUEUE, new Map());
    this._queues.set(QueueTypes.RESULT_QUEUE, new Map());
  }
  
  /**
   * Enqueue item
   * @param {string} queueType - Queue type
   * @param {Object} payload - Item payload
   * @param {Object} options - Enqueue options
   * @returns {QueueItem} Enqueued item
   */
  enqueue(queueType, payload, options = {}) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    const itemId = this._generateItemId(queueType, payload);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const itemData = {
      item_id: itemId,
      queue_type: queueType,
      payload: payload,
      priority: options.priority || 'medium',
      status: QueueItemStatus.PENDING,
      runtime_id: runtimeId,
      enqueued_at: constitutionalTimeAuthority.nowAsMillis(),
      enqueued_by: options.enqueued_by || 'PersistentQueueAuthority',
      max_retries: options.max_retries || 3
    };
    
    const item = new QueueItem(itemData);
    queue.set(itemId, item);
    
    // Emit ItemEnqueued event
    this._emitItemEnqueued(item);
    
    return item;
  }
  
  /**
   * Dequeue item (claim)
   * @param {string} queueType - Queue type
   * @param {string} claimedBy - Claimant ID
   * @returns {QueueItem|null} Claimed item or null if queue empty
   */
  dequeue(queueType, claimedBy) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    // Get first pending item
    for (const [itemId, item] of queue.entries()) {
      if (item.status === QueueItemStatus.PENDING) {
        item.claim(claimedBy);
        
        // Emit ItemClaimed event
        this._emitItemClaimed(item);
        
        return item;
      }
    }
    
    return null;
  }
  
  /**
   * Claim item by ID
   * @param {string} queueType - Queue type
   * @param {string} itemId - Item ID
   * @param {string} claimedBy - Claimant ID
   * @returns {QueueItem} Claimed item
   */
  claimItem(queueType, itemId, claimedBy) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    const item = queue.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    
    if (item.status !== QueueItemStatus.PENDING) {
      throw new Error(`Item not pending: ${itemId}`);
    }
    
    item.claim(claimedBy);
    
    // Emit ItemClaimed event
    this._emitItemClaimed(item);
    
    return item;
  }
  
  /**
   * Start processing item
   * @param {string} queueType - Queue type
   * @param {string} itemId - Item ID
   * @returns {QueueItem} Processing item
   */
  startProcessingItem(queueType, itemId) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    const item = queue.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    
    item.startProcessing();
    
    // Emit ItemProcessingStarted event
    this._emitItemProcessingStarted(item);
    
    return item;
  }
  
  /**
   * Complete item
   * @param {string} queueType - Queue type
   * @param {string} itemId - Item ID
   * @param {Object} result - Item result
   * @returns {QueueItem} Completed item
   */
  completeItem(queueType, itemId, result) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    const item = queue.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    
    item.complete(result);
    
    // Emit ItemCompleted event
    this._emitItemCompleted(item);
    
    return item;
  }
  
  /**
   * Fail item
   * @param {string} queueType - Queue type
   * @param {string} itemId - Item ID
   * @param {Error} error - Item error
   * @returns {QueueItem} Failed item
   */
  failItem(queueType, itemId, error) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    const item = queue.get(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }
    
    item.fail(error);
    
    // Emit ItemFailed event
    this._emitItemFailed(item);
    
    // Check if should retry
    if (item.retry_count < item.max_retries) {
      // Re-enqueue for retry
      item.status = QueueItemStatus.PENDING;
      item.claimed_by = null;
      item.claimed_at = null;
      
      // Emit ItemRetry event
      this._emitItemRetry(item);
    }
    
    return item;
  }
  
  /**
   * Get item
   * @param {string} queueType - Queue type
   * @param {string} itemId - Item ID
   * @returns {QueueItem} Item
   */
  getItem(queueType, itemId) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    return queue.get(itemId);
  }
  
  /**
   * Get all items in queue
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} All items
   */
  getQueueItems(queueType) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    return Array.from(queue.values());
  }
  
  /**
   * Get pending items in queue
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} Pending items
   */
  getPendingItems(queueType) {
    return this.getQueueItems(queueType).filter(item => item.status === QueueItemStatus.PENDING);
  }
  
  /**
   * Get claimed items in queue
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} Claimed items
   */
  getClaimedItems(queueType) {
    return this.getQueueItems(queueType).filter(item => item.status === QueueItemStatus.CLAIMED);
  }
  
  /**
   * Get processing items in queue
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} Processing items
   */
  getProcessingItems(queueType) {
    return this.getQueueItems(queueType).filter(item => item.status === QueueItemStatus.PROCESSING);
  }
  
  /**
   * Get completed items in queue
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} Completed items
   */
  getCompletedItems(queueType) {
    return this.getQueueItems(queueType).filter(item => item.status === QueueItemStatus.COMPLETED);
  }
  
  /**
   * Get failed items in queue
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} Failed items
   */
  getFailedItems(queueType) {
    return this.getQueueItems(queueType).filter(item => item.status === QueueItemStatus.FAILED);
  }
  
  /**
   * Get queue depth
   * @param {string} queueType - Queue type
   * @returns {number} Queue depth
   */
  getQueueDepth(queueType) {
    return this.getQueueItems(queueType).length;
  }
  
  /**
   * Get pending queue depth
   * @param {string} queueType - Queue type
   * @returns {number} Pending queue depth
   */
  getPendingQueueDepth(queueType) {
    return this.getPendingItems(queueType).length;
  }
  
  /**
   * Clear queue
   * @param {string} queueType - Queue type
   */
  clearQueue(queueType) {
    const queue = this._queues.get(queueType);
    if (!queue) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }
    
    queue.clear();
    
    // Emit QueueCleared event
    this._emitQueueCleared(queueType);
  }
  
  /**
   * Verify queue determinism
   * @param {string} queueType - Queue type
   * @param {Array<QueueItem>} items1 - First queue items
   * @param {Array<QueueItem>} items2 - Second queue items
   * @returns {boolean} Whether queues are equivalent
   */
  verifyQueueEquivalence(queueType, items1, items2) {
    if (items1.length !== items2.length) {
      return false;
    }
    
    for (let i = 0; i < items1.length; i++) {
      if (items1[i].item_hash !== items2[i].item_hash) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Replay queue from event log
   * @param {string} queueType - Queue type
   * @returns {Array<QueueItem>} Replayed queue items
   */
  async replayQueue(queueType) {
    // Get queue events from event repository
    const events = await this._eventRepository.getEventsByType(`ItemEnqueued_${queueType}`);
    
    // Reconstruct queue from events
    const queue = this._queues.get(queueType);
    queue.clear();
    
    for (const event of events) {
      if (event.event_type === `ItemEnqueued_${queueType}`) {
        const item = new QueueItem(event.payload);
        queue.set(item.item_id, item);
      } else if (event.event_type === `ItemClaimed_${queueType}`) {
        const item = queue.get(event.payload.item_id);
        if (item) {
          item.claim(event.payload.claimed_by);
        }
      } else if (event.event_type === `ItemProcessingStarted_${queueType}`) {
        const item = queue.get(event.payload.item_id);
        if (item) {
          item.startProcessing();
        }
      } else if (event.event_type === `ItemCompleted_${queueType}`) {
        const item = queue.get(event.payload.item_id);
        if (item) {
          item.complete(event.payload.result);
        }
      } else if (event.event_type === `ItemFailed_${queueType}`) {
        const item = queue.get(event.payload.item_id);
        if (item) {
          item.fail(new Error(event.payload.error.message));
        }
      }
    }
    
    return this.getQueueItems(queueType);
  }
  
  /**
   * Generate item ID
   */
  _generateItemId(queueType, payload) {
    return identityAuthority.generateId('queue_item', {
      queue_type: queueType,
      payload_hash: CanonicalAuthority.hash(payload),
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    });
  }
  
  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '36.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `persistent_queue_authority_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit ItemEnqueued event
   */
  _emitItemEnqueued(item) {
    const event = {
      event_id: identityAuthority.generateEventId(`ItemEnqueued_${item.queue_type}`, item.item_id),
      event_type: `ItemEnqueued_${item.queue_type}`,
      aggregate_id: item.item_id,
      aggregate_type: 'QueueItem',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: item.toJSON(),
      causation_id: null,
      correlation_id: item.item_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ItemClaimed event
   */
  _emitItemClaimed(item) {
    const event = {
      event_id: identityAuthority.generateEventId(`ItemClaimed_${item.queue_type}`, item.item_id),
      event_type: `ItemClaimed_${item.queue_type}`,
      aggregate_id: item.item_id,
      aggregate_type: 'QueueItem',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        item_id: item.item_id,
        claimed_by: item.claimed_by,
        claimed_at: item.claimed_at
      },
      causation_id: item.item_id,
      correlation_id: item.item_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ItemProcessingStarted event
   */
  _emitItemProcessingStarted(item) {
    const event = {
      event_id: identityAuthority.generateEventId(`ItemProcessingStarted_${item.queue_type}`, item.item_id),
      event_type: `ItemProcessingStarted_${item.queue_type}`,
      aggregate_id: item.item_id,
      aggregate_type: 'QueueItem',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        item_id: item.item_id,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: item.item_id,
      correlation_id: item.item_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ItemCompleted event
   */
  _emitItemCompleted(item) {
    const event = {
      event_id: identityAuthority.generateEventId(`ItemCompleted_${item.queue_type}`, item.item_id),
      event_type: `ItemCompleted_${item.queue_type}`,
      aggregate_id: item.item_id,
      aggregate_type: 'QueueItem',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        item_id: item.item_id,
        result: item.payload.result,
        completed_at: item.completed_at
      },
      causation_id: item.item_id,
      correlation_id: item.item_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ItemFailed event
   */
  _emitItemFailed(item) {
    const event = {
      event_id: identityAuthority.generateEventId(`ItemFailed_${item.queue_type}`, item.item_id),
      event_type: `ItemFailed_${item.queue_type}`,
      aggregate_id: item.item_id,
      aggregate_type: 'QueueItem',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        item_id: item.item_id,
        error: item.error,
        completed_at: item.completed_at,
        retry_count: item.retry_count
      },
      causation_id: item.item_id,
      correlation_id: item.item_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ItemRetry event
   */
  _emitItemRetry(item) {
    const event = {
      event_id: identityAuthority.generateEventId(`ItemRetry_${item.queue_type}`, item.item_id),
      event_type: `ItemRetry_${item.queue_type}`,
      aggregate_id: item.item_id,
      aggregate_type: 'QueueItem',
      aggregate_version: 1,
      sequence: 5,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        item_id: item.item_id,
        retry_count: item.retry_count
      },
      causation_id: item.item_id,
      correlation_id: item.item_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit QueueCleared event
   */
  _emitQueueCleared(queueType) {
    const event = {
      event_id: identityAuthority.generateEventId(`QueueCleared_${queueType}`, queueType),
      event_type: `QueueCleared_${queueType}`,
      aggregate_id: queueType,
      aggregate_type: 'Queue',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PersistentQueueAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        queue_type: queueType,
        cleared_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: null,
      correlation_id: queueType
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let persistentQueueAuthority = null;

function getPersistentQueueAuthority(eventRepository, runtimeIdentity = null) {
  if (!persistentQueueAuthority) {
    persistentQueueAuthority = new PersistentQueueAuthority(eventRepository, runtimeIdentity);
  }
  return persistentQueueAuthority;
}

module.exports = {
  PersistentQueueAuthority,
  QueueItem,
  QueueTypes,
  QueueItemStatus,
  persistentQueueAuthority,
  getPersistentQueueAuthority
};
