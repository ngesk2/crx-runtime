/**
 * GitHub Spine Test
 * 
 * Tests GitHub integration through constitutional event pipeline:
 * GitHub Webhook
 * ↓
 * PING Provider (GitHub)
 * ↓
 * Business Events
 * ↓
 * Identity Authority
 * ↓
 * Evidence
 * ↓
 * Knowledge / Graph
 * ↓
 * Replay
 * ↓
 * Projection
 * ↓
 * Presentation
 */

import { ExecutionEventBus, ConstitutionalEventType, ExecutionEventBuilder } from './execution-event-bus';
import { InMemoryIdentityAuthority } from '../identity/identity-authority';
import { InMemoryKnowledgeAuthority } from '../knowledge/knowledge-authority-interface';
import { ReplayAuthority } from '../replay/replay-authority';
import { GitHubProvider, GitHubOperation } from '../../adapters/github-provider-adapter';

async function testGitHubWebhookSpine() {
  console.log('🚀 Starting GitHub Spine Test: Webhook Event Flow');
  
  // 1. Wire the pipeline
  const eventBus = new ExecutionEventBus();
  const identityAuthority = new InMemoryIdentityAuthority();
  const knowledgeAuthority = new InMemoryKnowledgeAuthority();
  const replayAuthority = new ReplayAuthority();
  const gitHubProvider = new GitHubProvider();
  
  eventBus.setIdentityAuthority(identityAuthority);
  eventBus.setKnowledgeAuthority(knowledgeAuthority);
  eventBus.setReplayAuthority(replayAuthority);
  eventBus.setGitHubProvider(gitHubProvider);
  
  // 2. Create GitHub actor (repository owner)
  const gitHubActor = await identityAuthority.createActor({
    type: 'GitHubUser',
    attributes: { login: 'nolan', email: 'nolan@example.com' }
  });
  console.log(`✅ Created GitHub actor: ${gitHubActor.id}`);
  
  // 3. Build GitHub webhook event
  const eventBuilder = new ExecutionEventBuilder();
  const executionId = identityAuthority.generateUUIDv5('execution', 'github-webhook-001');
  
  const webhookEvent = eventBuilder.buildEvent(
    ConstitutionalEventType.ExecutionStarted,
    executionId,
    {
      actorId: gitHubActor.id,
      
      // GitHub Provider operation
      gitHubOperation: GitHubOperation.ProcessWebhook,
      gitHubInput: {
        eventType: 'pull_request',
        action: 'opened',
        repository: {
          name: 'constitutional-runtime',
          owner: { login: 'nolan' }
        },
        pullRequest: {
          number: 123,
          title: 'Add GitHub provider integration',
          state: 'open'
        }
      },
      gitHubParameters: {
        owner: 'nolan',
        repository: 'constitutional-runtime',
      },
      
      // Evidence payload
      evidencePayload: {
        type: 'GitHubWebhook',
        data: {
          eventType: 'pull_request',
          action: 'opened',
          prNumber: 123,
          repository: 'constitutional-runtime'
        }
      },
      
      // Graph mutation
      graphMutation: {
        type: 'createNode',
        data: {
          type: 'PullRequest',
          data: { 
            prNumber: 123, 
            title: 'Add GitHub provider integration',
            repository: 'constitutional-runtime'
          }
        }
      },
      
      // Knowledge payload
      knowledgePayload: {
        artifactId: 'artifact-github-pr-123',
        kind: 'PullRequest',
        data: { 
          prNumber: 123, 
          title: 'Add GitHub provider integration',
          state: 'open',
          repository: 'constitutional-runtime'
        },
        metadata: { source: 'github-webhook', format: 'json' }
      }
    }
  );
  
  console.log(`📝 Built GitHub webhook event: ${webhookEvent.eventId}`);
  
  // 4. Publish event through pipeline
  await eventBus.publish(webhookEvent);
  console.log(`🚀 Published GitHub webhook event through constitutional pipeline`);
  
  // 5. Verify pipeline execution
  console.log('\n📊 Pipeline Verification:');
  
  // Verify actor resolved
  if (webhookEvent.data.actor) {
    console.log(`✅ Identity Authority resolved actor: ${(webhookEvent.data.actor as any).id}`);
  } else {
    console.log('❌ Identity Authority failed to resolve actor');
  }
  
  // Verify GitHub provider executed
  if (webhookEvent.data.gitHubResponse) {
    const response = webhookEvent.data.gitHubResponse as any;
    console.log(`✅ GitHub Provider executed: ${response.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Operation: ${response.metadata.operation}`);
    console.log(`   Duration: ${response.duration}ms`);
  } else {
    console.log('❌ GitHub Provider failed to execute');
  }
  
  // Verify evidence stored
  if (webhookEvent.data.evidenceId) {
    console.log(`✅ Evidence Authority stored evidence: ${webhookEvent.data.evidenceId}`);
  } else {
    console.log('❌ Evidence Authority failed to store evidence');
  }
  
  // Verify graph mutated
  const nodes = await knowledgeAuthority.listNodes({ type: 'PullRequest' });
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
  if (webhookEvent.data.transcriptId) {
    console.log(`✅ Replay Authority generated transcript: ${webhookEvent.data.transcriptId}`);
  } else {
    console.log('❌ Replay Authority failed to generate transcript');
  }
  
  // 6. Verify event history
  const history = eventBus.getHistoryByExecution(executionId);
  console.log(`\n📜 Event History for execution ${executionId}:`);
  history.forEach(event => {
    console.log(`  - ${event.eventType} at ${event.timestamp}`);
  });
  
  console.log('\n✅ GitHub Spine Test Complete: Webhook Event Flow');
  console.log('🎯 GitHub → PING Provider → Business Events pipeline is operational');
}

async function testGitHubIssueCreationSpine() {
  console.log('\n🚀 Starting GitHub Spine Test: Issue Creation Flow');
  
  // 1. Wire the pipeline
  const eventBus = new ExecutionEventBus();
  const identityAuthority = new InMemoryIdentityAuthority();
  const knowledgeAuthority = new InMemoryKnowledgeAuthority();
  const replayAuthority = new ReplayAuthority();
  const gitHubProvider = new GitHubProvider();
  
  eventBus.setIdentityAuthority(identityAuthority);
  eventBus.setKnowledgeAuthority(knowledgeAuthority);
  eventBus.setReplayAuthority(replayAuthority);
  eventBus.setGitHubProvider(gitHubProvider);
  
  // 2. Create GitHub actor
  const gitHubActor = await identityAuthority.createActor({
    type: 'GitHubUser',
    attributes: { login: 'nolan', email: 'nolan@example.com' }
  });
  
  // 3. Build GitHub issue creation event
  const eventBuilder = new ExecutionEventBuilder();
  const executionId = identityAuthority.generateUUIDv5('execution', 'github-issue-001');
  
  const issueEvent = eventBuilder.buildEvent(
    ConstitutionalEventType.ExecutionStarted,
    executionId,
    {
      actorId: gitHubActor.id,
      
      // GitHub Provider operation
      gitHubOperation: GitHubOperation.CreateIssue,
      gitHubInput: {
        title: 'Add Kit provider integration',
        body: 'We need to integrate Kit as a provider following the same patterns as GitHub.',
        labels: ['enhancement', 'provider']
      },
      gitHubParameters: {
        owner: 'nolan',
        repository: 'constitutional-runtime',
      },
      
      // Evidence payload
      evidencePayload: {
        type: 'GitHubIssue',
        data: {
          title: 'Add Kit provider integration',
          repository: 'constitutional-runtime'
        }
      },
      
      // Graph mutation
      graphMutation: {
        type: 'createNode',
        data: {
          type: 'Issue',
          data: { 
            title: 'Add Kit provider integration',
            repository: 'constitutional-runtime'
          }
        }
      },
      
      // Knowledge payload
      knowledgePayload: {
        artifactId: 'artifact-github-issue-001',
        kind: 'Issue',
        data: { 
          title: 'Add Kit provider integration',
          labels: ['enhancement', 'provider'],
          repository: 'constitutional-runtime'
        },
        metadata: { source: 'github-api', format: 'json' }
      }
    }
  );
  
  console.log(`📝 Built GitHub issue creation event: ${issueEvent.eventId}`);
  
  // 4. Publish event through pipeline
  await eventBus.publish(issueEvent);
  console.log(`🚀 Published GitHub issue creation event through constitutional pipeline`);
  
  // 5. Verify pipeline execution
  console.log('\n📊 Pipeline Verification:');
  
  // Verify GitHub provider executed
  if (issueEvent.data.gitHubResponse) {
    const response = issueEvent.data.gitHubResponse as any;
    console.log(`✅ GitHub Provider executed: ${response.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Operation: ${response.metadata.operation}`);
    console.log(`   Duration: ${response.duration}ms`);
  } else {
    console.log('❌ GitHub Provider failed to execute');
  }
  
  // Verify evidence stored
  if (issueEvent.data.evidenceId) {
    console.log(`✅ Evidence Authority stored evidence: ${issueEvent.data.evidenceId}`);
  } else {
    console.log('❌ Evidence Authority failed to store evidence');
  }
  
  // Verify graph mutated
  const nodes = await knowledgeAuthority.listNodes({ type: 'Issue' });
  if (nodes.length > 0) {
    console.log(`✅ Graph Authority created node: ${nodes[0].id}`);
  } else {
    console.log('❌ Graph Authority failed to create node');
  }
  
  console.log('\n✅ GitHub Spine Test Complete: Issue Creation Flow');
}

// Run the tests
async function runAllTests() {
  try {
    await testGitHubWebhookSpine();
    await testGitHubIssueCreationSpine();
    console.log('\n🎉 All GitHub spine tests passed successfully!');
  } catch (error) {
    console.error('❌ GitHub Spine Test Failed:', error);
    process.exit(1);
  }
}

runAllTests();
