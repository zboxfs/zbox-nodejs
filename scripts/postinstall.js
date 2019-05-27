const fs = require('fs');
const path = require('path');

const npath = path.join(__dirname, '..', 'native/');

fs.readdirSync(npath)
  .filter(f => /[.]js$/.test(f))
  .map(f => {
    try {
      fs.unlinkSync(npath + f)
    } catch (err) {
      // ignore error
    }
  });
