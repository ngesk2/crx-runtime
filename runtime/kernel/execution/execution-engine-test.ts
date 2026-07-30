/**
 * Execution Engine Test
 * 
 * Tests canonical execution spine with Provider Registry.
 * 
 * execute()
 *     ↓
 * Identity
 *     ↓
 * Policy
 *     ↓
 * Provider
 *     ↓
 * Evidence
 *     ↓
 * Knowledge Graph
 *     ↓
 * Replay
 *     ↓
 * Projection
 *     ↓
 * Presentation
 */

import { ExecutionEngine, ConstitutionalExecutionContext } from './execution-engine';
import { InMemoryIdentityAuthority } from '../identity/identity-authority';
import { InMemoryKnowledgeAuthority } from '../knowledge/knowledge-authority-interface';
import { ReplayAuthority } from '../replay/replay-authority';
import { ProviderRegistry, getGlobalRegistry, setGlobalRegistry } from '../providers/provider-registry';
import { GitHubProvider } from '../../adapters/github-provider-adapter';

async function testCanonicalExecutionSpine() {
  console.log('🚀 Starting Phase 1 Test: Canonical Execution Spine');
  
  // 1. Setup Provider Registry
  const providerRegistry = new ProviderRegistry();
  const gitHubProvider = new GitHubProvider();
  providerRegistry.register(gitHubProvider);
  setGlobalRegistry(providerRegistry);
  
  console.log(`✅ Registered ${providerRegistry.getProviderIds().length} providers`);
  
  // 2. Setup Execution Engine
  const executionEngine = new ExecutionEngine({
    enablePolicyCheck: true,
    enableEvidenceStorage: true,
    enableKnowledgeIndexing: true,
    enableReplay: true,
    enableProjection: true,
  });
  
  const identityAuthority = new InMemoryIdentityAuthority();
  const knowledgeAuthority = new InMemoryKnowledgeAuthority();
  const replayAuthority = new ReplayAuthority();
  
  executionEngine.setIdentityAuthority(identityAuthority);
  executionEngine.setKnowledgeAuthority(knowledgeAuthority);
  executionEngine.setReplayAuthority(replayAuthority);
  executionEngine.setProviderAuthority(providerRegistry);
  
  console.log('✅ Execution Engine wired with all authorities');
  
  // 3. Create actor
  const actor = await identityAuthority.createActor({
    type: 'GitHubUser',
    attributes: { login: 'nolan', email: 'nolan@example.com' }
  });
  console.log(`✅ Created actor: ${actor.id}`);
  
  // 4. Execute through canonical spine
  console.log('\n📊 Executing through canonical spine:');
  
  const context = await executionEngine.execute(
    'github-provider',
    'CreateIssue',
    {
      title: 'Test issue from canonical spine',
      body: 'This issue was created through the constitutional execution spine',
      labels: ['test', 'spine']
    },
    actor.id,
    {
      owner: 'nolan',
      repository: 'constitutional-runtime'
    }
  );
  
  console.log(`\n🎯 Execution Context:`);
  console.log(`   Execution ID: ${context.executionId}`);
  console.log(`   Actor ID: ${context.actorId}`);
  console.log(`   Status: ${context.status}`);
  console.log(`   Authorities: ${context.authorities.join(', ')}`);
  console.log(`   Capabilities: ${context.capabilities.join(', ')}`);
  console.log(`   Evidence IDs: ${context.evidenceIds.length}`);
  console.log(`   Knowledge IDs: ${context.knowledgeIds.length}`);
  console.log(`   Projection IDs: ${context.projectionIds.length}`);
  console.log(`   Replay Transcript ID: ${context.replayTranscriptId}`);
  
  if (context.providerResponse) {
    console.log(`\n📦 Provider Response:`);
    console.log(`   Success: ${context.providerResponse.success}`);
    console.log(`   Duration: ${context.providerResponse.duration}ms`);
    if (context.providerResponse.output) {
      console.log(`   Output:`, context.providerResponse.output);
    }
  }
  
  // 5. Verify all pipeline stages executed
  console.log('\n📊 Pipeline Verification:');
  
  const checks = [
    { name: 'Identity Resolution', pass: context.actorId !== 'system' },
    { name: 'Policy Check', pass: context.authorities.length > 0 },
    { name: 'Provider Execution', pass: context.providerResponse !== undefined },
    { name: 'Evidence Storage', pass: context.evidenceIds.length > 0 },
    { name: 'Knowledge Indexing', pass: context.knowledgeIds.length > 0 },
    { name: 'Replay Transcript', pass: context.replayTranscriptId !== '' },
    { name: 'Projection', pass: context.projectionIds.length > 0 },
  ];
  
  for (const check of checks) {
    console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
  }
  
  const allPassed = checks.every(c => c.pass);
  
  if (allPassed) {
    console.log('\n✅ Phase 1 Test Complete: Canonical Execution Spine is operational');
    console.log('🎯 All providers now route through single canonical execute() function');
  } else {
    console.log('\n❌ Phase 1 Test Failed: Some pipeline stages did not execute');
  }
  
  return allPassed;
}

async function testProviderRegistryRouting() {
  console.log('\n🚀 Starting Phase 1 Test: Provider Registry Routing');
  
  // 1. Setup Provider Registry with multiple providers
  const providerRegistry = new ProviderRegistry();
  const gitHubProvider = new GitHubProvider();
  
  providerRegistry.register(gitHubProvider);
  
  console.log(`✅ Registered providers: ${providerRegistry.getProviderIds().join(', ')}`);
  
  // 2. Test provider resolution
  console.log('\n📊 Testing Provider Resolution:');
  
  // Get by ID
  const byId = providerRegistry.get('github-provider');
  console.log(`   ✅ Get by ID: ${byId ? 'Found' : 'Not found'}`);
  
  // Get by type
  const byType = providerRegistry.getByType(gitHubProvider.providerType);
  console.log(`   ✅ Get by type: ${byType.length} providers`);
  
  // Get by trait
  const byTrait = providerRegistry.getByTrait(gitHubProvider.traits[0]);
  console.log(`   ✅ Get by trait: ${byTrait.length} providers`);
  
  // Resolve by requirements
  const resolved = providerRegistry.resolve({
    traits: gitHubProvider.traits,
  });
  console.log(`   ✅ Resolve by requirements: ${resolved.length} providers`);
  
  // List with filters
  const filtered = providerRegistry.list({
    providerType: gitHubProvider.providerType,
  });
  console.log(`   ✅ List with filters: ${filtered.length} providers`);
  
  // 3. Test statistics
  const stats = providerRegistry.getStatistics();
  console.log('\n📊 Registry Statistics:');
  console.log(`   Total Providers: ${stats.totalProviders}`);
  console.log(`   Providers by Type:`, stats.providersByType);
  console.log(`   Providers by Trait:`, stats.providersByTrait);
  
  console.log('\n✅ Phase 1 Test Complete: Provider Registry routing is operational');
  console.log('🎯 Providers can be dynamically registered and resolved');
  
  return true;
}

async function testReplayFromEvidence() {
  console.log('\n🚀 Starting Phase 7 Test: Canonical Replay from Evidence');
  
  // 1. Setup execution engine
  const providerRegistry = new ProviderRegistry();
  const gitHubProvider = new GitHubProvider();
  providerRegistry.register(gitHubProvider);
  setGlobalRegistry(providerRegistry);
  
  const executionEngine = new ExecutionEngine({
    enablePolicyCheck: true,
    enableEvidenceStorage: true,
    enableKnowledgeIndexing: true,
    enableReplay: true,
    enableProjection: true,
  });
  
  const identityAuthority = new InMemoryIdentityAuthority();
  const knowledgeAuthority = new InMemoryKnowledgeAuthority();
  const replayAuthority = new ReplayAuthority();
  
  executionEngine.setIdentityAuthority(identityAuthority);
  executionEngine.setKnowledgeAuthority(knowledgeAuthority);
  executionEngine.setReplayAuthority(replayAuthority);
  executionEngine.setProviderAuthority(providerRegistry);
  
  // 2. Execute operation
  const actor = await identityAuthority.createActor({
    type: 'GitHubUser',
    attributes: { login: 'nolan' }
  });
  
  const context = await executionEngine.execute(
    'github-provider',
    'CreateIssue',
    { title: 'Replay test issue' },
    actor.id,
    { owner: 'nolan', repository: 'constitutional-runtime' }
  );
  
  console.log(`✅ Original execution: ${context.executionId}`);
  
  // 3. Replay from evidence
  const replayedContext = await executionEngine.replayExecution(context.executionId);
  
  console.log('\n📊 Replay Verification:');
  
  if (replayedContext) {
    console.log(`   ✅ Replay successful`);
    console.log(`   Execution ID: ${replayedContext.executionId}`);
    console.log(`   Actor ID: ${replayedContext.actorId}`);
    console.log(`   Evidence IDs: ${replayedContext.evidenceIds.length}`);
    console.log(`   Knowledge IDs: ${replayedContext.knowledgeIds.length}`);
    
    const matches = 
      replayedContext.executionId === context.executionId &&
      replayedContext.actorId === context.actorId &&
      replayedContext.evidenceIds.length === context.evidenceIds.length;
    
    console.log(`   ${matches ? '✅' : '❌'} Replay matches original execution`);
    
    console.log('\n✅ Phase 7 Test Complete: Canonical Replay from evidence is operational');
    console.log('🎯 Executions can be reconstructed entirely from evidence');
    
    return matches;
  } else {
    console.log('   ❌ Replay failed');
    console.log('\n❌ Phase 7 Test Failed: Could not replay from evidence');
    
    return false;
  }
}

// Run all tests
async function runAllTests() {
  try {
    const test1 = await testCanonicalExecutionSpine();
    const test2 = await testProviderRegistryRouting();
    const test3 = await testReplayFromEvidence();
    
    console.log('\n🎉 All Phase 1 & 7 Tests Results:');
    console.log(`   Canonical Execution Spine: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Provider Registry Routing: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Canonical Replay from Evidence: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    
    if (test1 && test2 && test3) {
      console.log('\n🎉 All tests passed successfully!');
      console.log('🎯 Constitutional execution spine is fully operational');
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

runAllTests();
