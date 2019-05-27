const fs = require('fs');

try {
  fs.unlinkSync('./node_modules/@zbox/nodejs/native/index.js');
  fs.unlinkSync('./node_modules/@zbox/nodejs/native/utils.js');
} catch (err) {
  // ignore errors
}
