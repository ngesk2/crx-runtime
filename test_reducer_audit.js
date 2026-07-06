// Reducer Constitution Audit
// Audit existing reducers for forbidden operations

console.log('=== Reducer Constitution Audit ===\n');

const { reducerValidator } = require('./runtime/kernel/authorities/reducer_validator');
const { reducerAuthority } = require('./runtime/kernel/authorities/reducer_authority');

// Get all registered reducers
const reducers = reducerAuthority.getAllReducers();

console.log(`Found ${reducers.length} registered reducers\n`);

let totalViolations = 0;
let validReducers = 0;

for (const reducer of reducers) {
  console.log(`Auditing reducer: ${reducer.reducer_id}`);
  
  // Validate reducer code
  const validation = reducerValidator.validateReducer(
    () => reducer.reducer_code,
    reducer.reducer_id
  );
  
  if (validation.valid) {
    console.log(`  ✓ Valid: No forbidden operations detected`);
    validReducers++;
  } else {
    console.log(`  ✗ Invalid: Found ${validation.violations.length} violation(s)`);
    totalViolations += validation.violations.length;
    
    for (const violation of validation.violations) {
      console.log(`    - ${violation.category}: ${violation.pattern} (${violation.count} occurrence(s))`);
    }
  }
  
  console.log();
}

console.log('=== Audit Summary ===');
console.log(`Total reducers: ${reducers.length}`);
console.log(`Valid reducers: ${validReducers}`);
console.log(`Invalid reducers: ${reducers.length - validReducers}`);
console.log(`Total violations: ${totalViolations}`);

if (totalViolations === 0) {
  console.log('\n✓ All reducers satisfy pure function constraints');
} else {
  console.log('\n✗ Some reducers contain forbidden operations');
  console.log('Forbidden operations must be removed from reducers');
}
