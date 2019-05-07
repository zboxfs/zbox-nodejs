'use strict';

// check if it is object
exports.isObject = a => {
  return a !== null && typeof a === 'object';
}

// check if it is string
exports.isString = s => {
  return typeof s === 'string';
}

// check if it is array buffer view
exports.isArrayBufferView = value => {
  return value
    && value.buffer instanceof ArrayBuffer
    && value.byteLength !== undefined;
}

// ensure arg is Object
exports.ensureObject = a => {
  if (!exports.isObject(a)) {
    throw new Error('Wrong argument, Object required');
  }
}

// ensure arg is string
exports.ensureString = s => {
  if (!exports.isString(s)) {
    throw new Error('Wrong argument, string required');
  }
}

// ensure two args are string
exports.ensureString2 = (s, s2) => {
  if (!exports.isString(s) || !exports.isString(s2)) {
    throw new Error('Wrong argument, string required');
  }
}

