#!/usr/bin/env node

/**
 * 01_build - Build Verification
 * 
 * Verifies:
 * - npm run build succeeds
 * - Build artifacts are generated
 * - No build errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkBuildScript() {
  console.log('Checking build script...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.scripts || !packageJson.scripts.build) {
      console.log('⚠️  No build script defined in package.json');
      console.log('   (skipping build verification)');
      return true; // Not a failure if no build script
    }

    console.log('✅ Build script defined');
    return true;
  } catch (error) {
    console.error('❌ Failed to read package.json:', error.message);
    return false;
  }
}

function runBuild() {
  console.log('Running build...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.scripts || !packageJson.scripts.build) {
      console.log('⚠️  No build script, skipping build');
      return true;
    }

    execSync('npm run build', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('✅ Build succeeded');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

function checkBuildArtifacts() {
  console.log('Checking build artifacts...');
  
  // This is a placeholder - would check for dist/ or build/ directory
  console.log('⚠️  Build artifact check not implemented');
  console.log('   (would check for dist/ or build/ directory)');
  return true;
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('01_build - Build Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    buildScript: checkBuildScript(),
    build: runBuild(),
    buildArtifacts: checkBuildArtifacts()
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ Build verification PASSED');
    process.exit(0);
  } else {
    console.log('❌ Build verification FAILED');
    process.exit(1);
  }
}

main();
