#!/usr/bin/env node

/**
 * 04_containers - Container Verification
 * 
 * Verifies:
 * - Dockerfile exists
 * - Docker build succeeds
 * - Docker Compose configuration exists
 * - Docker Compose validate succeeds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDockerfile() {
  console.log('Checking Dockerfile...');
  
  const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
  
  if (!fs.existsSync(dockerfilePath)) {
    console.error('❌ Dockerfile not found');
    return false;
  }

  console.log('✅ Dockerfile exists');
  return true;
}

function checkDockerCompose() {
  console.log('Checking docker-compose.yml...');
  
  const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
  
  if (!fs.existsSync(dockerComposePath)) {
    console.log('⚠️  docker-compose.yml not found');
    console.log('   (multi-container setup not configured)');
    return true; // Not a failure if not configured
  }

  console.log('✅ docker-compose.yml exists');
  return true;
}

function validateDockerCompose() {
  console.log('Validating docker-compose.yml...');
  
  const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
  
  if (!fs.existsSync(dockerComposePath)) {
    console.log('⚠️  docker-compose.yml not found, skipping validation');
    return true;
  }

  try {
    execSync('docker-compose config', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('✅ docker-compose.yml is valid');
    return true;
  } catch (error) {
    console.error('❌ docker-compose.yml validation failed:', error.message);
    return false;
  }
}

function buildDockerImage() {
  console.log('Building Docker image...');
  
  const dockerfilePath = path.join(__dirname, '..', 'Dockerfile');
  
  if (!fs.existsSync(dockerfilePath)) {
    console.log('⚠️  Dockerfile not found, skipping build');
    return true;
  }

  try {
    execSync('docker build -t gateway-test .', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('✅ Docker image built successfully');
    return true;
  } catch (error) {
    console.error('❌ Docker build failed:', error.message);
    return false;
  }
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('04_containers - Container Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    dockerfile: checkDockerfile(),
    dockerCompose: checkDockerCompose(),
    dockerComposeValidate: validateDockerCompose(),
    dockerBuild: buildDockerImage()
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ Container verification PASSED');
    process.exit(0);
  } else {
    console.log('❌ Container verification FAILED');
    process.exit(1);
  }
}

main();
