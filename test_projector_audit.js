// Projector Constitution Audit
// Audit existing projectors for ordering dependencies

console.log('=== Projector Constitution Audit ===\n');

const { projectorValidator } = require('./runtime/kernel/authorities/projector_validator');
const { ProjectionRegistry } = require('./runtime/kernel/execution/projection_registry');

// Create a projection registry instance
const projectionRegistry = new ProjectionRegistry();

// Get all registered projectors
const projectors = projectionRegistry.getAll();

console.log(`Found ${projectors.length} registered projectors\n`);

let totalViolations = 0;
let validProjectors = 0;

for (const projector of projectors) {
  console.log(`Auditing projector: ${projector.name}`);
  
  // Validate projector code
  const validation = projectorValidator.validateProjector(
    projector.fn,
    projector.name
  );
  
  if (validation.valid) {
    console.log(`  ✓ Valid: No ordering dependencies detected`);
    validProjectors++;
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
console.log(`Total projectors: ${projectors.length}`);
console.log(`Valid projectors: ${validProjectors}`);
console.log(`Invalid projectors: ${projectors.length - validProjectors}`);
console.log(`Total violations: ${totalViolations}`);

if (totalViolations === 0) {
  console.log('\n✓ All projectors satisfy deterministic projection constraints');
} else {
  console.log('\n✗ Some projectors contain ordering dependencies');
  console.log('Ordering dependencies must be removed from projectors');
}
