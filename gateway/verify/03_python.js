#!/usr/bin/env node

/**
 * 03_python - Python Verification
 * 
 * Verifies:
 * - Python files have valid syntax
 * - No Python syntax errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findPythonFiles() {
  console.log('Finding Python files...');
  
  const gatewayPath = path.join(__dirname, '..');
  const pythonFiles = [];

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
        scanDirectory(filePath);
      } else if (file.endsWith('.py')) {
        pythonFiles.push(filePath);
      }
    }
  }

  scanDirectory(gatewayPath);

  if (pythonFiles.length === 0) {
    console.log('✅ No Python files found');
    return [];
  }

  console.log(`Found ${pythonFiles.length} Python files`);
  return pythonFiles;
}

function checkPythonSyntax(pythonFiles) {
  console.log('Checking Python syntax...');
  
  if (pythonFiles.length === 0) {
    console.log('✅ No Python files to check');
    return true;
  }

  try {
    for (const file of pythonFiles) {
      execSync(`python -m py_compile "${file}"`, { stdio: 'inherit' });
    }
    
    console.log('✅ All Python files have valid syntax');
    return true;
  } catch (error) {
    console.error('❌ Python syntax check failed:', error.message);
    return false;
  }
}

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('03_python - Python Verification');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const pythonFiles = findPythonFiles();
  const syntaxCheck = checkPythonSyntax(pythonFiles);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Results:');
  console.log('═══════════════════════════════════════════════════════════════');

  if (syntaxCheck) {
    console.log('✅ Python verification PASSED');
    process.exit(0);
  } else {
    console.log('❌ Python verification FAILED');
    process.exit(1);
  }
}

main();
