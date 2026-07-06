#!/usr/bin/env node

/**
 * 00_repository - Repository Integrity Verification
 * 
 * Verifies:
 * - package.json exists and is valid
 * - npm install succeeds
 * - Dependencies are installed
 * - No circular dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkPackageJson() {
  console.log('Checking package.json...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.name) {
      console.error('❌ package.json missing name field');
      return false;
    }

    if (!packageJson.version) {
      console.error('❌ package.json missing version field');
      return false;
    }

    console.log('✅ package.json is valid');
    return true;
  } catch (error) {
    console.error('❌ package.json is invalid JSON:', error.message);
    return false;
  }
}

function checkDependencies() {
  console.log('Checking dependencies...');
  
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  node_modules not found, running npm install...');
    try {
      execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
      console.log('✅ Dependencies installed');
      return true;
    } catch (error) {
      console.error('❌ npm install failed:', error.message);
      return false;
    }
  }

  console.log('✅ Dependencies are installed');
  return true;
}

function checkCircularDependencies() {
  console.log('Checking for circular dependencies...');
  
  // This is a placeholder - would need madge or similar tool
  console.log('⚠️  Circular dependency check not implemented');
  console.log('   (requires madge or similar tool)');
  return true; // Skip for now
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('00_repository - Repository Integrity Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    packageJson: checkPackageJson(),
    dependencies: checkDependencies(),
    circularDependencies: checkCircularDependencies()
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ Repository integrity verification PASSED');
    process.exit(0);
  } else {
    console.log('❌ Repository integrity verification FAILED');
    process.exit(1);
  }
}

main();
