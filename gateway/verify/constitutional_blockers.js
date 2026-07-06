#!/usr/bin/env node

/**
 * Constitutional Blockers Verification Script
 * 
 * Phase 36A — Eliminate Hidden Authorities
 * 
 * This script verifies that no hidden authorities exist in replay-visible code.
 * 
 * RUN THIS SCRIPT AS PART OF BUILD PROCESS.
 * 
 * If any violations are found, the build MUST FAIL.
 */

const { constitutionalBlockers } = require('../constitutional_blockers');

console.log('🔒 CONSTITUTIONAL BLOCKERS VERIFICATION');
console.log('=====================================\n');

try {
  // Run all blockers on replay-visible files
  const results = constitutionalBlockers.checkAllReplayVisibleFiles();
  
  console.log(`Checked ${results.totalFiles} replay-visible files`);
  console.log(`Passed: ${results.passedFiles}`);
  console.log(`Failed: ${results.failedFiles}\n`);
  
  if (results.overallPassed) {
    console.log('✅ ALL CONSTITUTIONAL BLOCKERS PASSED\n');
    console.log('No hidden authorities detected in replay-visible code.');
    console.log('Build may proceed.');
    process.exit(0);
  } else {
    console.log('❌ CONSTITUTIONAL BLOCKER VIOLATIONS DETECTED\n');
    
    for (const fileResult of results.fileResults) {
      if (!fileResult.passed) {
        console.log(`\n📄 ${fileResult.filePath}`);
        console.log(`   Replay-Visible: ${fileResult.isReplayVisible ? 'YES' : 'NO'}`);
        
        for (const [blockerName, blockerResult] of Object.entries(fileResult.blockers)) {
          if (!blockerResult.passed) {
            console.log(`\n   ❌ ${blockerName.toUpperCase()}`);
            for (const violation of blockerResult.violations) {
              console.log(`      - ${violation.message} (${violation.count} occurrence(s))`);
            }
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('THESE ARE CONSTITUTIONAL BLOCKERS.');
    console.log('BUILD CANNOT PROCEED UNTIL ALL VIOLATIONS ARE RESOLVED.');
    console.log('='.repeat(50));
    
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ ERROR RUNNING CONSTITUTIONAL BLOCKERS:');
  console.error(error.message);
  process.exit(1);
}
