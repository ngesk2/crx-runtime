/**
 * Functional Utilities
 * 
 * Phase 36 PATCH 8 — Immutable Operations
 * 
 * Provides functional, immutable alternatives to mutation operations.
 * 
 * Constitutional Constraint: State must be replay-safe.
 * All state transformations must be pure functions.
 */

/**
 * Immutable array push
 * @param {Array} arr - Original array
 * @param {*} item - Item to add
 * @returns {Array} New array with item appended
 */
function push(arr, item) {
  return [...arr, item];
}

/**
 * Immutable array push multiple
 * @param {Array} arr - Original array
 * @param {Array} items - Items to add
 * @returns {Array} New array with items appended
 */
function pushMany(arr, items) {
  return [...arr, ...items];
}

/**
 * Immutable array splice (remove/insert)
 * @param {Array} arr - Original array
 * @param {number} start - Start index
 * @param {number} deleteCount - Number of items to delete
 * @param {*} items - Items to insert
 * @returns {Array} New array with spliced changes
 */
function splice(arr, start, deleteCount = 0, ...items) {
  return [
    ...arr.slice(0, start),
    ...items,
    ...arr.slice(start + deleteCount)
  ];
}

/**
 * Immutable array sort
 * @param {Array} arr - Original array
 * @param {Function} compareFn - Compare function
 * @returns {Array} New sorted array
 */
function sort(arr, compareFn) {
  return [...arr].sort(compareFn);
}

/**
 * Immutable object assign (merge)
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} New merged object
 */
function assign(target, source) {
  return { ...target, ...source };
}

/**
 * Immutable object delete
 * @param {Object} obj - Original object
 * @param {string} key - Key to delete
 * @returns {Object} New object without key
 */
function deleteKey(obj, key) {
  const { [key]: deleted, ...rest } = obj;
  return rest;
}

/**
 * Immutable array map
 * @param {Array} arr - Original array
 * @param {Function} fn - Map function
 * @returns {Array} New mapped array
 */
function map(arr, fn) {
  return arr.map(fn);
}

/**
 * Immutable array filter
 * @param {Array} arr - Original array
 * @param {Function} predicate - Filter predicate
 * @returns {Array} New filtered array
 */
function filter(arr, predicate) {
  return arr.filter(predicate);
}

/**
 * Immutable array reduce
 * @param {Array} arr - Original array
 * @param {Function} fn - Reduce function
 * @param {*} initial - Initial value
 * @returns {*} Reduced value
 */
function reduce(arr, fn, initial) {
  return arr.reduce(fn, initial);
}

/**
 * Immutable object update
 * @param {Object} obj - Original object
 * @param {string} key - Key to update
 * @param {*} value - New value
 * @returns {Object} New object with updated key
 */
function update(obj, key, value) {
  return { ...obj, [key]: value };
}

/**
 * Immutable nested object update
 * @param {Object} obj - Original object
 * @param {Array<string>} path - Path to update
 * @param {*} value - New value
 * @returns {Object} New object with updated nested path
 */
function updateIn(obj, path, value) {
  if (path.length === 0) {
    return value;
  }
  if (path.length === 1) {
    return update(obj, path[0], value);
  }
  const [head, ...tail] = path;
  return update(obj, head, updateIn(obj[head] || {}, tail, value));
}

/**
 * Immutable array set (replace at index)
 * @param {Array} arr - Original array
 * @param {number} index - Index to replace
 * @param {*} value - New value
 * @returns {Array} New array with replaced value
 */
function set(arr, index, value) {
  return [
    ...arr.slice(0, index),
    value,
    ...arr.slice(index + 1)
  ];
}

module.exports = {
  push,
  pushMany,
  splice,
  sort,
  assign,
  deleteKey,
  map,
  filter,
  reduce,
  update,
  updateIn,
  set
};
