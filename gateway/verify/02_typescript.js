#!/usr/bin/env node

/**
 * 02_typescript - TypeScript Verification
 * 
 * Verifies:
 * - tsconfig.json exists
 * - TypeScript compiles without errors
 * - No type errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkTsConfig() {
  console.log('Checking tsconfig.json...');
  
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    console.log('⚠️  tsconfig.json not found');
    console.log('   (TypeScript not configured)');
    return true; // Not a failure if TypeScript not configured
  }

  console.log('✅ tsconfig.json exists');
  return true;
}

function checkTypeScript() {
  console.log('Checking TypeScript compilation...');
  
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    console.log('⚠️  TypeScript not configured, skipping compilation');
    return true;
  }

  try {
    execSync('npx tsc --noEmit', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('✅ TypeScript compilation succeeded');
    return true;
  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error.message);
    return false;
  }
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('02_typescript - TypeScript Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const results = {
    tsConfig: checkTsConfig(),
    typescript: checkTypeScript()
  };

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ TypeScript verification PASSED');
    process.exit(0);
  } else {
    console.log('❌ TypeScript verification FAILED');
    process.exit(1);
  }
}

main();
