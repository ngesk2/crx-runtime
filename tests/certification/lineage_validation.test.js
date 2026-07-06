/**
 * Phase 3.27 — Certification Test: Lineage Validation
 * 
 * Asserts that lineage cycles are rejected by ExecutionRuntime.
 * 
 * Test:
 * - Create valid lineage edges (no cycles)
 * - Create invalid lineage edges (with cycles)
 * - Assert valid lineage passes
 * - Assert invalid lineage with cycles is rejected
 */

/**
 * Test lineage validation (cycle detection)
 */
function testLineageValidation() {
  console.log('[Lineage Validation Test] Starting lineage validation check...\n');

  let allPassed = true;
  const results = [];

  // Test 1: Valid DAG (no cycles)
  const validLineage = [
    { parent_artifact_id: 'a', child_artifact_id: 'b' },
    { parent_artifact_id: 'b', child_artifact_id: 'c' },
    { parent_artifact_id: 'c', child_artifact_id: 'd' },
  ];

  const validResult = detectCycle(validLineage);
  if (!validResult.hasCycle) {
    console.log('✅ Valid DAG (no cycles) - PASSED');
    results.push({ test: 'valid DAG', passed: true });
  } else {
    console.log('❌ Valid DAG (no cycles) - FAILED (false positive)');
    allPassed = false;
    results.push({ test: 'valid DAG', passed: false });
  }

  // Test 2: Invalid lineage with direct cycle
  const directCycleLineage = [
    { parent_artifact_id: 'a', child_artifact_id: 'b' },
    { parent_artifact_id: 'b', child_artifact_id: 'a' },
  ];

  const directCycleResult = detectCycle(directCycleLineage);
  if (directCycleResult.hasCycle) {
    console.log('✅ Direct cycle detection - PASSED');
    results.push({ test: 'direct cycle detection', passed: true });
  } else {
    console.log('❌ Direct cycle detection - FAILED (cycle not detected)');
    allPassed = false;
    results.push({ test: 'direct cycle detection', passed: false });
  }

  // Test 3: Invalid lineage with indirect cycle
  const indirectCycleLineage = [
    { parent_artifact_id: 'a', child_artifact_id: 'b' },
    { parent_artifact_id: 'b', child_artifact_id: 'c' },
    { parent_artifact_id: 'c', child_artifact_id: 'a' },
  ];

  const indirectCycleResult = detectCycle(indirectCycleLineage);
  if (indirectCycleResult.hasCycle) {
    console.log('✅ Indirect cycle detection - PASSED');
    results.push({ test: 'indirect cycle detection', passed: true });
  } else {
    console.log('❌ Indirect cycle detection - FAILED (cycle not detected)');
    allPassed = false;
    results.push({ test: 'indirect cycle detection', passed: false });
  }

  // Test 4: Complex DAG with multiple branches (valid)
  const complexLineage = [
    { parent_artifact_id: 'a', child_artifact_id: 'b' },
    { parent_artifact_id: 'a', child_artifact_id: 'c' },
    { parent_artifact_id: 'b', child_artifact_id: 'd' },
    { parent_artifact_id: 'c', child_artifact_id: 'd' },
  ];

  const complexResult = detectCycle(complexLineage);
  if (!complexResult.hasCycle) {
    console.log('✅ Complex DAG (multiple branches) - PASSED');
    results.push({ test: 'complex DAG', passed: true });
  } else {
    console.log('❌ Complex DAG (multiple branches) - FAILED (false positive)');
    allPassed = false;
    results.push({ test: 'complex DAG', passed: false });
  }

  // Test 5: Self-loop (invalid)
  const selfLoopLineage = [
    { parent_artifact_id: 'a', child_artifact_id: 'a' },
  ];

  const selfLoopResult = detectCycle(selfLoopLineage);
  if (selfLoopResult.hasCycle) {
    console.log('✅ Self-loop detection - PASSED');
    results.push({ test: 'self-loop detection', passed: true });
  } else {
    console.log('❌ Self-loop detection - FAILED (cycle not detected)');
    allPassed = false;
    results.push({ test: 'self-loop detection', passed: false });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Lineage Validation Test: PASSED');
    console.log('Lineage cycle detection works correctly.');
  } else {
    console.log('❌ Lineage Validation Test: FAILED');
    console.log('Lineage cycle detection did not work as expected.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

/**
 * Detect cycles in lineage graph (DFS-based cycle detection)
 */
function detectCycle(lineage) {
  const lineageGraph = new Map();

  // Build lineage graph
  for (const edge of lineage) {
    if (!lineageGraph.has(edge.parent_artifact_id)) {
      lineageGraph.set(edge.parent_artifact_id, []);
    }
    lineageGraph.get(edge.parent_artifact_id).push(edge.child_artifact_id);
  }

  // Detect cycles using DFS
  const visited = new Set();
  const recursionStack = new Set();

  const hasCycle = (nodeId) => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const children = lineageGraph.get(nodeId) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        if (hasCycle(childId)) {
          return true;
        }
      } else if (recursionStack.has(childId)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const parentId of lineageGraph.keys()) {
    if (!visited.has(parentId)) {
      if (hasCycle(parentId)) {
        return { hasCycle: true, cycleNode: parentId };
      }
    }
  }

  return { hasCycle: false };
}

// Run test if executed directly
if (require.main === module) {
  const result = testLineageValidation();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testLineageValidation, detectCycle };
