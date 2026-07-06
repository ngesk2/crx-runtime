/**
 * Unstructured Adapter
 * 
 * Infrastructure adapter for Unstructured ingestion pipelines
 * 
 * Responsibilities:
 * - partition(file, options)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 * Unstructured already implements the behavior.
 */

class UnstructuredAdapter {
  constructor(apiUrl = 'http://localhost:8000') {
    this._apiUrl = apiUrl;
  }

  /**
   * Partition file into elements
   * 
   * @param {Buffer|string} file - File buffer or path
   * @param {Object} options - Partition options
   * @returns {Array} Partitioned elements
   */
  async partition(file, options = {}) {
    try {
      const formData = new FormData();
      
      if (Buffer.isBuffer(file)) {
        formData.append('file', new Blob([file]));
      } else {
        formData.append('file', file);
      }

      // Add options
      if (options.strategy) {
        formData.append('strategy', options.strategy);
      }
      if (options.include_page_breaks) {
        formData.append('include_page_breaks', options.include_page_breaks);
      }
      if (options.ocr_languages) {
        formData.append('ocr_languages', options.ocr_languages);
      }
      if (options.skip_infer_table_types) {
        formData.append('skip_infer_table_types', options.skip_infer_table_types);
      }

      const response = await fetch(`${this._apiUrl}/general/v0/general`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Unstructured partition failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Unstructured partition failed: ${error.message}`);
    }
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      const response = await fetch(`${this._apiUrl}/health`);
      
      if (response.ok) {
        return {
          healthy: true,
        };
      }

      return {
        healthy: false,
        error: response.statusText,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

module.exports = { UnstructuredAdapter };
