const fs = require('fs');

const path = './node_modules/@zbox/nodejs/native/';

try {
  fs.readdirSync(path)
    .filter(f => /[.]js$/.test(f))
    .map(f => fs.unlinkSync(path + f));
} catch (err) {
  // ignore errors
}
