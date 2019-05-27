const assert = require('assert').strict;
const Zbox = require('@zbox/nodejs');

const zbox = new Zbox();

(async function run() {
  // initialise environment, called once before using ZboxFS
  await zbox.initEnv({ debug: true });

  // open the repo
  var repo = await zbox.openRepo({
    uri: 'zbox://d9Ysc4PJa5sT7NKJyxDjMpZg@jRpbY2DEra6qMR',
    pwd: 'pwd',
    opts: { create: true }
  });

  // create a file
  var file = await repo.createFile('/hello_world.txt')

  // write content to file
  await file.writeOnce('Hello World!')

  // seek to start of the file
  await file.seek({ from: Zbox.SeekFrom.Start, offset: 0 });

  // read all content as string
  const str = await file.readAllString()
  assert.strictEqual(str, 'Hello World!');

  // close file and repo
  await file.close();
  await repo.close();

})();
