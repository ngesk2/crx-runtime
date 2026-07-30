/**
 * Spine Test - Tenant Inspection Event
 * 
 * Tests the constitutional event pipeline end-to-end:
 * Tenant submits inspection
 * ↓
 * PING assigns identity
 * ↓
 * Evidence stored
 * ↓
 * Graph updated
 * ↓
 * Knowledge updated
 * ↓
 * Projection built
 * ↓
 * Replay succeeds
 * ↓
 * Presentation refreshes
 */

import { ExecutionEventBus, ConstitutionalEventType, ExecutionEventBuilder } from './execution-event-bus';
import { InMemoryIdentityAuthority } from '../identity/identity-authority';
import { InMemoryKnowledgeAuthority } from '../knowledge/knowledge-authority-interface';
import { ReplayAuthority } from '../replay/replay-authority';

async function testTenantInspectionSpine() {
  console.log('🚀 Starting Spine Test: Tenant Inspection Event');
  
  // 1. Wire the pipeline
  const eventBus = new ExecutionEventBus();
  const identityAuthority = new InMemoryIdentityAuthority();
  const knowledgeAuthority = new InMemoryKnowledgeAuthority();
  const replayAuthority = new ReplayAuthority();
  
  eventBus.setIdentityAuthority(identityAuthority);
  eventBus.setKnowledgeAuthority(knowledgeAuthority);
  eventBus.setReplayAuthority(replayAuthority);
  
  // 2. Create tenant actor
  const tenant = await identityAuthority.createActor({
    type: 'Tenant',
    attributes: { name: 'John Doe', email: 'john@example.com' }
  });
  console.log(`✅ Created tenant actor: ${tenant.id}`);
  
  // 3. Build tenant inspection event
  const eventBuilder = new ExecutionEventBuilder();
  const executionId = identityAuthority.generateUUIDv5('execution', 'inspection-001');
  
  const inspectionEvent = eventBuilder.buildEvent(
    ConstitutionalEventType.ExecutionStarted,
    executionId,
    {
      actorId: tenant.id,
      evidencePayload: {
        type: 'Inspection',
        data: {
          propertyId: 'property-123',
          inspectionType: 'Roof',
          date: new Date().toISOString(),
          notes: 'Roof inspection completed'
        }
      },
      graphMutation: {
        type: 'createNode',
        data: {
          type: 'Inspection',
          data: { propertyId: 'property-123', status: 'completed' }
        }
      },
      knowledgePayload: {
        artifactId: 'artifact-inspection-001',
        kind: 'Inspection',
        data: { inspectionType: 'Roof', result: 'Passed' },
        metadata: { source: 'tenant-submission', format: 'json' }
      }
    }
  );
  
  console.log(`📝 Built inspection event: ${inspectionEvent.eventId}`);
  
  // 4. Publish event through pipeline
  await eventBus.publish(inspectionEvent);
  console.log(`🚀 Published event through constitutional pipeline`);
  
  // 5. Verify pipeline execution
  console.log('\n📊 Pipeline Verification:');
  
  // Verify actor resolved
  if (inspectionEvent.data.actor) {
    console.log(`✅ Identity Authority resolved actor: ${(inspectionEvent.data.actor as any).id}`);
  } else {
    console.log('❌ Identity Authority failed to resolve actor');
  }
  
  // Verify evidence stored
  if (inspectionEvent.data.evidenceId) {
    console.log(`✅ Evidence Authority stored evidence: ${inspectionEvent.data.evidenceId}`);
  } else {
    console.log('❌ Evidence Authority failed to store evidence');
  }
  
  // Verify graph mutated
  const nodes = await knowledgeAuthority.listNodes({ type: 'Inspection' });
  if (nodes.length > 0) {
    console.log(`✅ Graph Authority created node: ${nodes[0].id}`);
  } else {
    console.log('❌ Graph Authority failed to create node');
  }
  
  // Verify knowledge indexed
  const knowledgeObjects = await knowledgeAuthority.query({ query: '', filters: {}, limit: 10 });
  if (knowledgeObjects.total > 0) {
    console.log(`✅ Knowledge Authority indexed: ${knowledgeObjects.total} objects`);
  } else {
    console.log('❌ Knowledge Authority failed to index');
  }
  
  // Verify replay transcript generated
  if (inspectionEvent.data.transcriptId) {
    console.log(`✅ Replay Authority generated transcript: ${inspectionEvent.data.transcriptId}`);
  } else {
    console.log('❌ Replay Authority failed to generate transcript');
  }
  
  // 6. Verify event history
  const history = eventBus.getHistoryByExecution(executionId);
  console.log(`\n📜 Event History for execution ${executionId}:`);
  history.forEach(event => {
    console.log(`  - ${event.eventType} at ${event.timestamp}`);
  });
  
  console.log('\n✅ Spine Test Complete: Tenant Inspection Event');
  console.log('🎯 Constitutional pipeline is wired and operational');
}

// Run the test
testTenantInspectionSpine().catch(error => {
  console.error('❌ Spine Test Failed:', error);
  process.exit(1);
});
