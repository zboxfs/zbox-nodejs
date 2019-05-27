const fs = require('fs');

try {
  fs.unlinkSync('./native/index.node');
} catch (err) {
  // ignore errors
}
