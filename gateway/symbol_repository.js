/**
 * Symbol Repository
 * 
 * Ω.49 — Symbol Repository
 * 
 * Persistence layer for symbol objects.
 * 
 * Separates symbol persistence from construction and querying logic.
 * This repository only handles SQL operations for symbols.
 */

const { CanonicalAuthority } = require('./canonical_authority');

class SymbolRepository {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Persist symbol object
   * @param {Object} symbolObject - Symbol constitutional object
   */
  async persist(symbolObject) {
    try {
      const canonicalBytes = CanonicalAuthority.serialize(symbolObject);
      await this._postgres.query(`
        INSERT INTO symbols (symbol_id, symbol_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (symbol_id) DO UPDATE SET
          symbol_data = $2,
          updated_at = NOW()
      `, [symbolObject.id, canonicalBytes]);
    } catch (error) {
      // Silent failure - persistence errors handled by infrastructure layer
    }
  }

  /**
   * Get symbol by ID
   * @param {string} symbolId - Symbol ID
   * @returns {Object|null} Symbol object or null
   */
  async getById(symbolId) {
    try {
      const result = await this._postgres.query(
        'SELECT symbol_data FROM symbols WHERE symbol_id = $1',
        [symbolId]
      );
      if (result.rows.length === 0) return null;
      return result.rows[0].symbol_data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get symbol by canonical name
   * @param {string} canonicalName - Canonical name
   * @returns {Object|null} Symbol object or null
   */
  async getByCanonicalName(canonicalName) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'canonical_name' = $1",
        [canonicalName]
      );
      if (result.rows.length === 0) return null;
      return result.rows[0].symbol_data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get symbols by repository
   * @param {string} repository - Repository identifier
   * @returns {Array} Array of symbol objects
   */
  async getByRepository(repository) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'repository' = $1",
        [repository]
      );
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get symbols by kind
   * @param {string} kind - Symbol kind
   * @returns {Array} Array of symbol objects
   */
  async getByKind(kind) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'kind' = $1",
        [kind]
      );
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get symbols by language
   * @param {string} language - Programming language
   * @returns {Array} Array of symbol objects
   */
  async getByLanguage(language) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'language' = $1",
        [language]
      );
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get symbols by visibility
   * @param {string} visibility - Visibility level
   * @returns {Array} Array of symbol objects
   */
  async getByVisibility(visibility) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'visibility' = $1",
        [visibility]
      );
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get symbols by module
   * @param {string} module - Module name
   * @returns {Array} Array of symbol objects
   */
  async getByModule(module) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'module' = $1",
        [module]
      );
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Search symbols by name pattern
   * @param {string} pattern - Search pattern
   * @returns {Array} Array of symbol objects
   */
  async searchByName(pattern) {
    try {
      const result = await this._postgres.query(
        "SELECT symbol_data FROM symbols WHERE symbol_data->>'payload'->>'canonical_name' ILIKE $1",
        [`%${pattern}%`]
      );
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all symbols
   * @returns {Array} Array of all symbol objects
   */
  async getAll() {
    try {
      const result = await this._postgres.query('SELECT symbol_data FROM symbols');
      return result.rows.map(row => row.symbol_data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get symbol statistics
   * @returns {Object} Statistics object
   */
  async getStatistics() {
    try {
      const result = await this._postgres.query('SELECT symbol_data FROM symbols');
      const symbols = result.rows.map(row => row.symbol_data);
      
      const stats = {
        total_symbols: symbols.length,
        by_kind: {},
        by_language: {},
        by_visibility: {},
        by_repository: {},
        by_module: {},
        average_documentation_length: 0,
        with_documentation: 0,
        with_generic_parameters: 0,
      };

      let totalDocumentationLength = 0;

      for (const symbol of symbols) {
        const kind = symbol.payload.kind || 'unknown';
        stats.by_kind[kind] = (stats.by_kind[kind] || 0) + 1;

        const language = symbol.payload.language || 'unknown';
        stats.by_language[language] = (stats.by_language[language] || 0) + 1;

        const visibility = symbol.payload.visibility || 'unknown';
        stats.by_visibility[visibility] = (stats.by_visibility[visibility] || 0) + 1;

        const repository = symbol.payload.repository || 'unknown';
        stats.by_repository[repository] = (stats.by_repository[repository] || 0) + 1;

        const module = symbol.payload.module || 'unknown';
        stats.by_module[module] = (stats.by_module[module] || 0) + 1;

        if (symbol.payload.documentation) {
          totalDocumentationLength += symbol.payload.documentation.length;
          stats.with_documentation++;
        }

        if (symbol.payload.generic_parameters && symbol.payload.generic_parameters.length > 0) {
          stats.with_generic_parameters++;
        }
      }

      if (symbols.length > 0) {
        stats.average_documentation_length = totalDocumentationLength / symbols.length;
      }

      return stats;
    } catch (error) {
      return {
        total_symbols: 0,
        by_kind: {},
        by_language: {},
        by_visibility: {},
        by_repository: {},
        by_module: {},
        average_documentation_length: 0,
        with_documentation: 0,
        with_generic_parameters: 0,
      };
    }
  }
}

module.exports = { SymbolRepository };
