# zbox-nodejs

This pacakge is Node.js binding for `ZboxFS`.

ZboxFS is a zero-details, privacy-focused in-app file system. Its goal is
to help application store files securely, privately and reliably. More details
about ZboxFS: https://github.com/zboxfs/zbox.

# Get Started

To use this pacakge, first visit https://try.zbox.io to create a test repo, and
then copy its URI and use it by replacing `[your_repo_uri]` in below code.

## Installation

```sh
npm i @zbox/nodejs
```

## Hello World

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

  // seek to begining of the file
  await file.seek({ from: Zbox.SeekFrom.Start, offset: 0 });

  // read all content as string
  const str = await file.readAllString()
  assert.strictEqual(str, 'Hello World!');

  // close file and repo
  await file.close();
  await repo.close();

})();
```

# API Documentation

Check the API documentation at https://docs.zbox.io/api/.

# How to build ZboxFS shared library by yourself

This is for advanced user.

If just use this package, you don't need to build the shared library yourself
as `npm install` will automatically download the pre-built binary.

This library needs to be compiled to platform-specific binary, it currently
supports 64-bit Linux, macOS and Windows.

After running the building command below, it will generate `index.node` shared
library in `native` folder. This library must be used with javascript wrappers,
which can be found in `lib` directory.

## Linux

### Prerequisites
Docker

### Build

Use `zboxfs/nodejs` docker image to build the shared library.

```sh
docker run --rm -v $PWD:/root/zbox zboxfs/nodejs npm run build
```

## macOS

### Prerequisites

[Rust](https://www.rust-lang.org/)

### Build

Use below command to build the shared library.

```sh
npm run build
```

# License

This package is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE)
file for details.
