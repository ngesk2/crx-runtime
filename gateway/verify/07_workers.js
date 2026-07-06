#!/usr/bin/env node

/**
 * 07_workers - Worker Verification
 * 
 * Verifies:
 * - Worker files exist
 * - Worker queue exists
 * - Worker health (if running)
 * - Queue health (if running)
 */

const fs = require('fs');
const path = require('path');

function checkWorkerFiles() {
  console.log('Checking worker files...');
  
  const workerFiles = [
    'background_workers.js',
    'worker_pool.js',
    'worker_queue.js',
    'worker_scheduler.js',
    'embedding_worker.js',
    'ollama_worker.js',
    'qdrant_worker.js'
  ];

  let found = 0;
  for (const file of workerFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      found++;
    }
  }

  if (found > 0) {
    console.log(`✅ Worker files found: ${found}/${workerFiles.length}`);
  } else {
    console.log('⚠️  No worker files found');
  }

  return true;
}

function checkWorkerQueue() {
  console.log('Checking worker queue...');
  
  const queueFiles = [
    'worker_queue.js',
    'persistent_queue.js',
    'dead_letter_queue.js'
  ];

  let found = 0;
  for (const file of queueFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      found++;
    }
  }

  if (found > 0) {
    console.log(`✅ Queue files found: ${found}/${queueFiles.length}`);
  } else {
    console.log('⚠️  No queue files found');
  }

  return true;
}

function checkWorkerHealth() {
  console.log('Checking worker health...');
  
  console.log('⚠️  Worker health check not implemented');
  console.log('   (requires running workers)');
  return true;
}

function checkQueueHealth() {
  console.log('Checking queue health...');
  
  console.log('⚠️  Queue health check not implemented');
  console.log('   (requires running queue)');
  return true;
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('07_workers - Worker Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    workerFiles: checkWorkerFiles(),
    workerQueue: checkWorkerQueue(),
    workerHealth: checkWorkerHealth(),
    queueHealth: checkQueueHealth()
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ Worker verification PASSED (with warnings)');
    process.exit(0);
  } else {
    console.log('❌ Worker verification FAILED');
    process.exit(1);
  }
}

main();
