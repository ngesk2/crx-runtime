/**
 * DEEP FREEZE UTILITY
 * 
 * Recursively freezes objects to prevent mutation.
 * 
 * Constitutional law: Certified replay outputs must become observationally immutable.
 */

export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Freeze Maps
  if (obj instanceof Map) {
    obj.forEach((value, key) => {
      deepFreeze(value);
    });
    Object.freeze(obj);
    return obj;
  }

  // Freeze Sets
  if (obj instanceof Set) {
    obj.forEach(value => {
      deepFreeze(value);
    });
    Object.freeze(obj);
    return obj;
  }

  // Freeze Arrays
  if (Array.isArray(obj)) {
    obj.forEach(item => deepFreeze(item));
    Object.freeze(obj);
    return obj;
  }

  // Freeze Objects
  Object.keys(obj).forEach(key => {
    deepFreeze((obj as any)[key]);
  });
  Object.freeze(obj);
  return obj;
}
