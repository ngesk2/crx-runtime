/**
 * Mission Decomposition Tests
 */

const assert = require('assert');
const { MissionDecomposition } = require('./mission_decomposition');

const mockMissionRuntime = {
  create: async (missionType, payload) => {
    return 'mission_' + Math.random().toString(36).substring(7);
  },
  complete: async (missionId, result) => {},
  fail: async (missionId, error) => {},
};

const mockPool = {
  query: async (sql, params) => {
    if (sql.includes('CREATE TABLE') || sql.includes('ALTER TABLE') || sql.includes('CREATE INDEX')) {
      return { rowCount: 1 };
    }
    if (sql.includes('INSERT INTO ping_mission_dependencies')) {
      return { rowCount: 1 };
    }
    if (sql.includes('UPDATE ping_missions SET child_mission_ids')) {
      return { rowCount: 1 };
    }
    if (sql.includes('UPDATE ping_missions SET parent_mission_id')) {
      return { rowCount: 1 };
    }
    if (sql.includes('SELECT * FROM ping_missions WHERE parent_mission_id')) {
      return { rows: [] };
    }
    if (sql.includes('SELECT * FROM ping_mission_dependencies')) {
      return { rows: [] };
    }
    return { rows: [] };
  },
};

async function main() {
  console.log('=== Mission Decomposition Tests ===');

  let passed = 0, failed = 0;

  const decomposition = new MissionDecomposition({
    pool: mockPool,
    missionRuntime: mockMissionRuntime,
  });

  try {
    await decomposition.initialize();
    passed++;
    console.log('  PASS initialize runs successfully');
  } catch (e) {
    failed++;
    console.log('  FAIL initialize runs successfully: ' + e.message);
  }

  try {
    const result = await decomposition.createWithChildren({
      parentMissionType: 'parent_task',
      parentPayload: { data: 'parent' },
      children: [
        { missionType: 'child_task_1', payload: { data: 'child1' }, dependencyType: 'required' },
        { missionType: 'child_task_2', payload: { data: 'child2' }, dependencyType: 'optional' },
      ],
    });
    assert.ok(result.parentMissionId);
    assert.strictEqual(result.childMissionIds.length, 2);
    passed++;
    console.log('  PASS createWithChildren creates parent and children');
  } catch (e) {
    failed++;
    console.log('  FAIL createWithChildren creates parent and children: ' + e.message);
  }

  try {
    const result = await decomposition.createWithChildren({
      parentMissionType: 'parent_task',
      parentPayload: { data: 'parent' },
      children: [],
    });
    assert.ok(result.parentMissionId);
    assert.strictEqual(result.childMissionIds.length, 0);
    passed++;
    console.log('  PASS createWithChildren with no children');
  } catch (e) {
    failed++;
    console.log('  FAIL createWithChildren with no children: ' + e.message);
  }

  try {
    const children = await decomposition.getChildren('parent_001');
    assert.ok(Array.isArray(children));
    passed++;
    console.log('  PASS getChildren returns child missions');
  } catch (e) {
    failed++;
    console.log('  FAIL getChildren returns child missions: ' + e.message);
  }

  try {
    const dependencies = await decomposition.getDependencies('parent_001');
    assert.ok(Array.isArray(dependencies));
    passed++;
    console.log('  PASS getDependencies returns dependencies');
  } catch (e) {
    failed++;
    console.log('  FAIL getDependencies returns dependencies: ' + e.message);
  }

  try {
    const completed = await decomposition.areRequiredChildrenCompleted('parent_001');
    assert.strictEqual(completed, true);
    passed++;
    console.log('  PASS areRequiredChildrenCompleted returns true when no children');
  } catch (e) {
    failed++;
    console.log('  FAIL areRequiredChildrenCompleted returns true when no children: ' + e.message);
  }

  try {
    const hasFailed = await decomposition.hasFailedChild('parent_001');
    assert.strictEqual(hasFailed, false);
    passed++;
    console.log('  PASS hasFailedChild returns false when no children');
  } catch (e) {
    failed++;
    console.log('  FAIL hasFailedChild returns false when no children: ' + e.message);
  }

  try {
    await decomposition.markWaitingForChildren('parent_001');
    passed++;
    console.log('  PASS markWaitingForChildren runs successfully');
  } catch (e) {
    failed++;
    console.log('  FAIL markWaitingForChildren runs successfully: ' + e.message);
  }

  try {
    const completed = await decomposition.completeParentWhenChildrenReady('parent_001');
    assert.strictEqual(completed, true);
    passed++;
    console.log('  PASS completeParentWhenChildrenReady completes when no failed children');
  } catch (e) {
    failed++;
    console.log('  FAIL completeParentWhenChildrenReady completes when no failed children: ' + e.message);
  }

  try {
    const health = await decomposition.health();
    assert.strictEqual(health.healthy, true);
    assert.strictEqual(health.pool, true);
    assert.strictEqual(health.missionRuntime, true);
    passed++;
    console.log('  PASS health returns dependency status');
  } catch (e) {
    failed++;
    console.log('  FAIL health returns dependency status: ' + e.message);
  }

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
