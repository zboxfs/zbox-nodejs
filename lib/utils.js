// check if it is object
exports.isObject = a => {
  return a !== null && typeof a === 'object';
};

// check if it is number
exports.isNumber = n => {
  return typeof n === 'number';
};

// check if it is string
exports.isString = s => {
  return typeof s === 'string';
};

// check if it is array buffer view
exports.isArrayBufferView = value => {
  return (
    value &&
    value.buffer instanceof ArrayBuffer &&
    value.byteLength !== undefined
  );
};

// check if it is Node.js Buffer
exports.isBuffer = value => {
  return Buffer.isBUffer(value);
};

// check if it is ArrayBuffer, TypedArray or Buffer
exports.isBufType = buf => {
  return exports.isArrayBufferView(buf) || exports.isBuffer(buf);
};

// convert ArrayBuffer to String
exports.ab2str = buf => {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
};

// convert String to ArrayBuffer
exports.str2ab = str => {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i += 1) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

// ensure arg is Object
exports.ensureObject = a => {
  if (!exports.isObject(a)) {
    throw new Error('Wrong argument, Object required');
  }
};

// ensure arg is number
exports.ensureNumber = n => {
  if (!exports.isNumber(n)) {
    throw new Error('Wrong argument, number required');
  }
};

// ensure two args are number
exports.ensureNumber2 = (n, n2) => {
  if (!exports.isNumber(n) || !exports.isNumber(n2)) {
    throw new Error('Wrong argument, number required');
  }
};

// ensure arg is string
exports.ensureString = s => {
  if (!exports.isString(s)) {
    throw new Error('Wrong argument, string required');
  }
};

// ensure two args are string
exports.ensureString2 = (s, s2) => {
  if (!exports.isString(s) || !exports.isString(s2)) {
    throw new Error('Wrong argument, string required');
  }
};

// ensure arg is ArrayBuffer, or TypedArray, or Buffer
exports.ensureBufType = buf => {
  if (!exports.isBufType(buf)) {
    throw new Error('Wrong argument, buffer-like type required');
  }

  return {
    ab: buf.buffer || buf,
    offset: buf.byteOffset || 0,
    len: buf.byteLength
  };
};

// ensure arg is buffer-like type or string
exports.ensureBufTypeOrStr = param => {
  let buf = param;

  if (exports.isString(param)) {
    buf = exports.str2ab(param);
  } else if (!exports.isBufType(param)) {
    throw new Error('Wrong argument, string or buffer-like type required');
  }

  return {
    ab: buf.buffer || buf,
    offset: buf.byteOffset || 0,
    len: buf.byteLength
  };
};
