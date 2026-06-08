/**
 * FCA-12: 1000x Determinism Test
 * 
 * Verifies that replay produces identical results across 1000 executions.
 * Expected: 1000/1000 witness matches
 */

import { ReplayEventStream } from '../../runtime/replay/replay_event_stream';
import { CanonicalEventEnvelope } from '../../runtime/replay/canonical_event_envelope';
import { DeterministicReplayEngine } from '../../runtime/replay/deterministic_replay_engine';
import * as fs from 'fs';
import * as path from 'path';

async function run1000xDeterminismTest() {
  console.log('FCA-12: 1000x Determinism Test\n');
  
  const corpusFiles = [
    'minimal_replay.json',
    'multi_event_replay.json',
    'lineage_replay.json',
    'unicode_replay.json'
  ];
  
  let totalMatches = 0;
  let totalTests = 0;
  
  for (const corpusFile of corpusFiles) {
    const corpusPath = path.join(__dirname, '../corpus', corpusFile);
    const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
    
    console.log(`Testing corpus: ${corpus.name}`);
    
    const events = corpus.event_stream.map((e: any) => new CanonicalEventEnvelope(e));
    const eventStream = new ReplayEventStream(events);
    const engine = new DeterministicReplayEngine();
    
    // Run 1000 times
    const results: any[] = [];
    for (let i = 0; i < 1000; i++) {
      const result = engine.replay(eventStream);
      results.push(result);
    }
    
    // Verify all results are identical
    const firstResult = results[0];
    let matches = 0;
    
    for (let i = 1; i < results.length; i++) {
      if (results[i].witness_root.witness_root === firstResult.witness_root.witness_root &&
          results[i].witness_root.leaf_count === firstResult.witness_root.leaf_count &&
          results[i].witness_root.tree_height === firstResult.witness_root.tree_height) {
        matches++;
      }
    }
    
    totalTests += 1000;
    totalMatches += matches + 1; // +1 for the first result
    
    console.log(`  Matches: ${matches + 1}/1000`);
    
    if (matches === 999) {
      console.log(`  ✓ PASSED\n`);
    } else {
      console.log(`  ✗ FAILED\n`);
    }
  }
  
  console.log('='.repeat(50));
  console.log(`Total matches: ${totalMatches}/${totalTests}`);
  console.log('='.repeat(50));
  
  if (totalMatches === totalTests) {
    console.log('\n✓ FCA-12 PASSED: 1000/1000 witness matches');
    process.exit(0);
  } else {
    console.log('\n✗ FCA-12 FAILED');
    process.exit(1);
  }
}

run1000xDeterminismTest().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
