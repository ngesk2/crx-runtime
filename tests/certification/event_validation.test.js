/**
 * Phase 3.26 — Certification Test: Event Validation
 * 
 * Asserts that unknown events are rejected by EventCatalog.
 * 
 * Test:
 * - Register known event schemas in EventCatalog
 * - Attempt to validate known event (should pass)
 * - Attempt to validate unknown event (should fail)
 * - Assert proper rejection of unknown events
 */

const { EventCatalog } = require('../../runtime/event_catalog');

/**
 * Test event validation
 */
function testEventValidation() {
  console.log('[Event Validation Test] Starting event validation check...\n');

  const eventCatalog = new EventCatalog();

  // Register known event schemas
  eventCatalog.register('ArtifactCreated', {
    type: 'object',
    properties: {
      artifact_id: { type: 'string' },
      artifact_type: { type: 'string' },
    },
    required: ['artifact_id', 'artifact_type'],
  });

  eventCatalog.register('VerificationPassed', {
    type: 'object',
    properties: {
      artifact_id: { type: 'string' },
      verification_id: { type: 'string' },
    },
    required: ['artifact_id', 'verification_id'],
  });

  let allPassed = true;
  const results = [];

  // Test 1: Validate known event with valid payload
  const knownEvent = {
    type: 'ArtifactCreated',
    payload: {
      artifact_id: 'test-123',
      artifact_type: 'TestArtifact',
    },
  };

  const knownValidation = eventCatalog.validate(knownEvent.type, knownEvent.payload);
  if (knownValidation.valid) {
    console.log('✅ Known event validation - PASSED');
    results.push({ test: 'known event validation', passed: true });
  } else {
    console.log('❌ Known event validation - FAILED');
    console.log(`   Errors: ${knownValidation.errors.join(', ')}`);
    allPassed = false;
    results.push({ test: 'known event validation', passed: false });
  }

  // Test 2: Validate known event with invalid payload (missing required field)
  const invalidKnownEvent = {
    type: 'ArtifactCreated',
    payload: {
      artifact_id: 'test-123',
      // Missing artifact_type
    },
  };

  const invalidKnownValidation = eventCatalog.validate(invalidKnownEvent.type, invalidKnownEvent.payload);
  if (!invalidKnownValidation.valid) {
    console.log('✅ Invalid known event rejection - PASSED');
    results.push({ test: 'invalid known event rejection', passed: true });
  } else {
    console.log('❌ Invalid known event rejection - FAILED (should reject)');
    allPassed = false;
    results.push({ test: 'invalid known event rejection', passed: false });
  }

  // Test 3: Validate unknown event (should fail)
  const unknownEvent = {
    type: 'UnknownEvent',
    payload: {
      some_field: 'value',
    },
  };

  const unknownValidation = eventCatalog.validate(unknownEvent.type, unknownEvent.payload);
  if (!unknownValidation.valid) {
    console.log('✅ Unknown event rejection - PASSED');
    results.push({ test: 'unknown event rejection', passed: true });
  } else {
    console.log('❌ Unknown event rejection - FAILED (should reject unknown events)');
    allPassed = false;
    results.push({ test: 'unknown event rejection', passed: false });
  }

  // Test 4: Validate event with null type (should fail)
  const nullTypeValidation = eventCatalog.validate(null, { test: 'data' });
  if (!nullTypeValidation.valid) {
    console.log('✅ Null type event rejection - PASSED');
    results.push({ test: 'null type rejection', passed: true });
  } else {
    console.log('❌ Null type event rejection - FAILED');
    allPassed = false;
    results.push({ test: 'null type rejection', passed: false });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Event Validation Test: PASSED');
    console.log('EventCatalog properly validates known events and rejects unknown events.');
  } else {
    console.log('❌ Event Validation Test: FAILED');
    console.log('Event validation did not work as expected.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testEventValidation();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testEventValidation };
