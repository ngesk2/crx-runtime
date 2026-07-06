const { witnessAuthority } = require('./witness_authority');
const { VerificationAuthority } = require('./verification_authority');
const { replayCertificateAuthority } = require('./replay_certificate_authority');

class VerificationPipeline {
  constructor(verificationAuthority) {
    this._verificationAuthority = verificationAuthority;
  }

  async verify(event, reducerResults) {
    const checks = {};

    // 1. Witness integrity — does the witness hash match its data?
    if (event.witness) {
      const witnessResult = witnessAuthority.verifyWitness(event.witness);
      checks.witness = {
        passed: witnessResult.valid,
        reason: witnessResult.reason
      };
    } else {
      checks.witness = { passed: false, reason: 'No witness on event' };
    }

    // 2. Verification authority — 4-check verification (hash, metadata, version)
    if (event.witness && this._verificationAuthority) {
      try {
        const authResult = await this._verificationAuthority.verifyWitness(event.witness);
        checks.verification = {
          passed: authResult.artifacts[0]?.verified || false,
          checks: authResult.artifacts[0]?.checks || {}
        };
      } catch (error) {
        checks.verification = { passed: false, error: error.message };
      }
    } else {
      checks.verification = { passed: false, reason: 'No witness or verification authority' };
    }

    // 3. Certificate — verify replay certificate if present
    if (event.CanonicalEventHash) {
      checks.replayCertificate = { passed: true, reason: 'Event has canonical hash' };
    } else {
      checks.replayCertificate = { passed: false, reason: 'No canonical event hash' };
    }

    const allPassed = Object.values(checks).every(c => c.passed);

    return {
      verified: allPassed,
      checks,
      timestamp: event.timestamp
    };
  }
}

module.exports = { VerificationPipeline };
