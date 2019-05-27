const fs = require('fs');
const path = require('path');

const npath = path.join(__dirname, '..', 'node_modules/@zbox/nodejs/native/');

try {
  fs.readdirSync(npath)
    .filter(f => /[.]js$/.test(f))
    .map(f => fs.unlinkSync(npath + f));
} catch (err) {
  // ignore errors
}
