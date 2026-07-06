/**
 * OmniRouter Bootstrap
 * 
 * Registers all constitutional authorities with the OmniRouter.
 * 
 * This ensures all authority invocations go through the single constitutional routing layer.
 */

const { omniRouter } = require('./omni_router');
const { canonicalAuthority } = require('./authorities/canonical_authority');
const { identityAuthority } = require('./authorities/identity_authority');
const { witnessAuthority } = require('./authorities/witness_authority');
const { verificationAuthority } = require('./authorities/verification_authority');
const { lineageAuthority } = require('./authorities/lineage_authority');
const { constitutionalTimeAuthority } = require('./authorities/constitutional_time_authority');
const { runtimeIdentityAuthority } = require('./authorities/runtime_identity_authority');
const { reducerAuthority } = require('./authorities/reducer_authority');
const { StandardEventSchema } = require('./authorities/standard_event_schema');
const { constitutionalClock } = require('./authorities/constitutional_clock');

/**
 * Bootstrap OmniRouter with all constitutional authorities
 */
function bootstrapOmniRouter() {
  // Register core authorities
  omniRouter.registerAuthority('canonical', canonicalAuthority, '1.0.0');
  omniRouter.registerAuthority('identity', identityAuthority, '1.0.0');
  omniRouter.registerAuthority('witness', witnessAuthority, '1.0.0');
  omniRouter.registerAuthority('verification', verificationAuthority, '1.0.0');
  omniRouter.registerAuthority('lineage', lineageAuthority, '1.0.0');
  
  // Register time authorities
  omniRouter.registerAuthority('constitutionalTime', constitutionalTimeAuthority, '1.0.0');
  omniRouter.registerAuthority('constitutionalClock', constitutionalClock, '1.0.0');
  
  // Register identity authorities
  omniRouter.registerAuthority('runtimeIdentity', runtimeIdentityAuthority, '1.0.0');
  
  // Register execution authorities
  omniRouter.registerAuthority('reducer', reducerAuthority, '1.0.0');
  omniRouter.registerAuthority('eventSchema', StandardEventSchema, '1.0.0');
  
  console.log('[OmniRouter] Bootstrapped with constitutional authorities:');
  console.log('[OmniRouter] Registered authorities:', omniRouter.getRegisteredAuthorities());
}

// Bootstrap on module load
bootstrapOmniRouter();

module.exports = {
  bootstrapOmniRouter
};
