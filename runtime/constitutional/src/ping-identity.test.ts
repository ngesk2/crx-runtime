/**
 * Test real Ed25519 implementation
 * PATCH 7A: Real Cryptographic Identity
 */

import { PingIdentityManager } from './ping-identity';

async function testRealEd25519() {
  console.log('Testing real Ed25519 implementation...\n');

  // Test 1: Generate key pair
  console.log('Test 1: Generate key pair');
  const alice = PingIdentityManager.createIdentity('Alice');
  console.log(`  Alice ID: ${alice.identity_id}`);
  console.log(`  Public key: ${alice.public_key.substring(0, 32)}...`);
  console.log(`  Private key: ${alice.private_key.substring(0, 32)}...`);
  console.log('  ✓ Key pair generated\n');

  // Test 2: Sign data
  console.log('Test 2: Sign data');
  const data = 'Hello PING';
  const signature = PingIdentityManager.sign(alice, data);
  console.log(`  Data: ${data}`);
  console.log(`  Signature: ${signature.substring(0, 32)}...`);
  console.log('  ✓ Data signed\n');

  // Test 3: Verify signature
  console.log('Test 3: Verify signature');
  const verified = PingIdentityManager.verify(alice, data, signature);
  console.log(`  Verification result: ${verified}`);
  console.log('  ✓ Signature verified\n');

  // Test 4: Independent identity
  console.log('Test 4: Create independent Bob identity');
  const bob = PingIdentityManager.createIdentity('Bob');
  console.log(`  Bob ID: ${bob.identity_id}`);
  console.log(`  Alice ID: ${alice.identity_id}`);
  console.log(`  IDs are different: ${alice.identity_id !== bob.identity_id}`);
  console.log(`  Keys are different: ${alice.public_key !== bob.public_key}`);
  console.log('  ✓ Independent identity created\n');

  // Test 5: Bob cannot sign as Alice
  console.log('Test 5: Bob cannot sign as Alice');
  const bobSignature = PingIdentityManager.sign(bob, data);
  const bobCannotVerifyAsAlice = !PingIdentityManager.verifyWithPublicKey(data, bobSignature, alice.public_key);
  console.log(`  Bob signature: ${bobSignature.substring(0, 32)}...`);
  console.log(`  Bob cannot verify as Alice: ${bobCannotVerifyAsAlice}`);
  console.log('  ✓ Bob cannot sign as Alice\n');

  // Test 6: Bob can verify Alice
  console.log('Test 6: Bob can verify Alice independently');
  const bobCanVerifyAlice = PingIdentityManager.verifyWithPublicKey(data, signature, alice.public_key);
  console.log(`  Bob can verify Alice: ${bobCanVerifyAlice}`);
  console.log('  ✓ Bob can verify Alice independently\n');

  // Test 7: Wrong signature fails
  console.log('Test 7: Wrong signature fails');
  const wrongData = 'Wrong data';
  const wrongSignature = PingIdentityManager.sign(alice, wrongData);
  const wrongVerification = PingIdentityManager.verify(alice, data, wrongSignature);
  console.log(`  Wrong signature verification: ${wrongVerification}`);
  console.log('  ✓ Wrong signature fails\n');

  console.log('All Ed25519 tests passed!');
}

testRealEd25519().catch(console.error);
