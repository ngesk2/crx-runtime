/**
 * File Watcher
 * 
 * Phase 3.2 — Recursive Watch Stability
 * 
 * Replace fs.watch with chokidar for reliable file watching.
 * 
 * Features:
 * - awaitWriteFinish (handle large copy operations)
 * - ignoreInitial (don't process existing files on startup)
 * - persistent (survive restart)
 * - Handle rename, delete, move events
 * - Do not process partially written files
 */

const chokidar = require('chokidar');
const path = require('path');

class FileWatcher {
  constructor(config = {}) {
    this._watchPaths = config.watchPaths || ['./documents'];
    this._ignoredPatterns = config.ignoredPatterns || [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/*.tmp',
      '**/*.swp',
      '**/*~'
    ];
    this._awaitWriteFinish = config.awaitWriteFinish || {
      stabilityThreshold: 2000,
      pollInterval: 100
    };
    this._ignoreInitial = config.ignoreInitial !== false;
    this._persistent = config.persistent !== false;
    this._watcher = null;
    this._handlers = {
      add: [],
      change: [],
      unlink: [],
      addDir: [],
      unlinkDir: [],
      error: [],
      ready: []
    };
  }

  /**
   * Initialize watcher
   */
  async initialize() {
    console.log('[FileWatcher] Initializing');
    
    // Create watcher
    this._watcher = chokidar.watch(this._watchPaths, {
      ignored: this._ignoredPatterns,
      persistent: this._persistent,
      ignoreInitial: this._ignoreInitial,
      awaitWriteFinish: this._awaitWriteFinish,
      usePolling: false,
      interval: 100,
      binaryInterval: 300,
      alwaysStat: false,
      depth: 99,
      ignorePermissionErrors: true,
      atomic: true,
      followSymlinks: true
    });

    // Setup event handlers
    this._setupHandlers();

    console.log('[FileWatcher] Initialized');
  }

  /**
   * Setup event handlers
   */
  _setupHandlers() {
    // File added
    this._watcher.on('add', (filePath, stats) => {
      console.log(`[FileWatcher] File added: ${filePath}`);
      this._emit('add', { filePath, stats });
    });

    // File changed
    this._watcher.on('change', (filePath, stats) => {
      console.log(`[FileWatcher] File changed: ${filePath}`);
      this._emit('change', { filePath, stats });
    });

    // File deleted
    this._watcher.on('unlink', (filePath) => {
      console.log(`[FileWatcher] File deleted: ${filePath}`);
      this._emit('unlink', { filePath });
    });

    // Directory added
    this._watcher.on('addDir', (dirPath, stats) => {
      console.log(`[FileWatcher] Directory added: ${dirPath}`);
      this._emit('addDir', { dirPath, stats });
    });

    // Directory deleted
    this._watcher.on('unlinkDir', (dirPath) => {
      console.log(`[FileWatcher] Directory deleted: ${dirPath}`);
      this._emit('unlinkDir', { dirPath });
    });

    // Error
    this._watcher.on('error', (error) => {
      console.error('[FileWatcher] Error:', error);
      this._emit('error', { error });
    });

    // Ready
    this._watcher.on('ready', () => {
      console.log('[FileWatcher] Ready');
      this._emit('ready', {});
    });
  }

  /**
   * Emit event to handlers
   */
  _emit(event, data) {
    const handlers = this._handlers[event] || [];
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (error) {
        console.error(`[FileWatcher] Handler error for ${event}:`, error.message);
      }
    }
  }

  /**
   * Add event handler
   */
  on(event, handler) {
    if (!this._handlers[event]) {
      this._handlers[event] = [];
    }
    this._handlers[event].push(handler);
  }

  /**
   * Remove event handler
   */
  off(event, handler) {
    if (this._handlers[event]) {
      this._handlers[event] = this._handlers[event].filter(h => h !== handler);
    }
  }

  /**
   * Add watch path
   */
  addWatchPath(watchPath) {
    if (this._watcher) {
      this._watcher.add(watchPath);
      console.log(`[FileWatcher] Added watch path: ${watchPath}`);
    }
  }

  /**
   * Remove watch path
   */
  removeWatchPath(watchPath) {
    if (this._watcher) {
      this._watcher.unwatch(watchPath);
      console.log(`[FileWatcher] Removed watch path: ${watchPath}`);
    }
  }

  /**
   * Get watched paths
   */
  getWatchedPaths() {
    if (this._watcher) {
      return this._watcher.getWatched();
    }
    return [];
  }

  /**
   * Start watching
   */
  async start() {
    if (!this._watcher) {
      await this.initialize();
    }
    console.log('[FileWatcher] Started');
  }

  /**
   * Stop watching
   */
  async stop() {
    if (this._watcher) {
      await this._watcher.close();
      this._watcher = null;
      console.log('[FileWatcher] Stopped');
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      is_running: this._watcher !== null,
      watch_paths: this._watchPaths,
      watched_paths: this.getWatchedPaths(),
      handlers: Object.keys(this._handlers).reduce((acc, key) => {
        acc[key] = this._handlers[key].length;
        return acc;
      }, {})
    };
  }
}

module.exports = { FileWatcher };
