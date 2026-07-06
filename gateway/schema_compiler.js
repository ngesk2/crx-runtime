/**
 * Versioned Schema Compiler
 *
 * Multi-stage compiler for transforming source data into Canonical IR.
 *
 * Pipeline:
 * Source (GitHub/GitLab/Azure/etc.)
 *   → DTO (Data Transfer Object)
 *   → Canonical IR (Intermediate Representation)
 *   → CompilerAuthority
 *   → ConstitutionalObject
 *
 * This allows multiple source systems to produce identical constitutional objects.
 *
 * Phase 2.7.3 — Constitutional Boundary Collapse
 * - Removed DTO registration (moved to DTORegistryAuthority)
 * - Compiler knows nothing about source systems
 * - Adapters register their DTOs with DTORegistryAuthority
 */

const { dtoRegistryAuthority } = require('./dto_registry_authority');

// Singleton instance
const versionedSchemaCompiler = new VersionedSchemaCompiler();

/**
 * Base DTO class for all source systems
 */
class SourceDTO {
  constructor(sourceType, rawData) {
    this.sourceType = sourceType;
    this.rawData = rawData;
    this.extractedAt = new Date().toISOString();
  }

  validate() {
    throw new Error('validate() must be implemented');
  }

  toCanonicalIR() {
    throw new Error('toCanonicalIR() must be implemented');
  }
}

/**
 * Canonical Intermediate Representation
 *
 * Pure data structure - no factory methods.
 * ConstitutionalObject creation delegated to CompilerAuthority.
 */
class CanonicalIR {
  constructor(irData) {
    this.irData = irData;
    this.version = '1.0.0';
    this.generatedAt = new Date().toISOString();
  }

  validate() {
    if (!this.irData.source) throw new Error('Source required');
    if (!this.irData.source_type) throw new Error('Source type required');
    return true;
  }

  /**
   * Get IR data (for CompilerAuthority to consume)
   */
  getData() {
    return this.irData;
  }
}

/**
 * Versioned Schema Compiler
 */
class VersionedSchemaCompiler {
  constructor() {
    this._schemaVersion = '1.0.0';
  }

  async compile(sourceData, sourceType) {
    // Stage 1: Create DTO (via DTORegistryAuthority)
    const dto = this._createDTO(sourceType, sourceData);
    await dto.validate();

    // Stage 2: Transform to Canonical IR
    const irData = dto.toCanonicalIR();
    const ir = new CanonicalIR(irData);
    await ir.validate();

    // Return CanonicalIR (CompilerAuthority will create ConstitutionalObject)
    return ir;
  }

  async compileBatch(sourceDataArray, sourceType) {
    const results = [];
    for (const sourceData of sourceDataArray) {
      try {
        const ir = await this.compile(sourceData, sourceType);
        results.push({ success: true, ir });
      } catch (error) {
        results.push({ success: false, error: error.message, sourceData });
      }
    }
    return results;
  }

  _createDTO(sourceType, rawData) {
    const dtoClass = dtoRegistryAuthority.lookup(sourceType);
    return new dtoClass(rawData);
  }

  getSchemaVersion() {
    return this._schemaVersion;
  }

  getRegisteredSources() {
    return dtoRegistryAuthority.supportedSources();
  }
}

module.exports = {
  SourceDTO,
  CanonicalIR,
  VersionedSchemaCompiler,
  versionedSchemaCompiler,
};
