# zbox-nodejs

This pacakge is Node.js binding for `ZboxFS`.

ZboxFS is a zero-details, privacy-focused in-app file system. Its goal is
to help application store files securely, privately and reliably. Check more
details about ZboxFS: https://github.com/zboxfs/zbox.

## Installation

```sh
npm i @zbox/nodejs
```

## Get Started

To use this pacakge, first visit https://try.zbox.io to create a test repo. And
then copy its URI and use it in below example code by replacing `[your_repo_uri]`.

### Hello World

```js
const assert = require('assert').strict;
const Zbox = require('@zbox/nodejs');

// create a Zbox instance
const zbox = new Zbox();

(async function run() {
  // initialise environment, called once before using Zbox
  await zbox.initEnv({ debug: true });

  // open the repo
  var repo = await zbox.openRepo({
    uri: '[your_repo_uri]',
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
  var const = await file.readAllString()
  assert.strictEqual(str, 'Hello World!');

  // close file and repo
  await file.close();
  await repo.close();

})();
```

## API Documentation

Check the API documentation at https://docs.zbox.io/api/.

## How to build this package by yourself

Make sure you've installed [Rust](https://www.rust-lang.org/), then use below
command to build this binary library.

```sh
npm run build
```

This will generate `index.node` shared library in `native` folder. This library
is platform-specific, which currently supports 64-bit Linux, macOS and Windows.

