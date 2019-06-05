# zbox-nodejs

This pacakge is Node.js binding for [ZboxFS].

ZboxFS is a zero-details, privacy-focused in-app file system. Its goal is
to help application store files securely, privately and reliably. Check more
details about [ZboxFS].

# Get Started

## Installation

```sh
npm i @zbox/nodejs
```

## Hello World Example

Visit https://try.zbox.io to create a test repo. Copy its URI and replace
`[your_repo_uri]` in below.

```js
const assert = require('assert').strict;
const Zbox = require('@zbox/nodejs');

(async () => {
  // create a Zbox instance
  const zbox = new Zbox();

  // initialise environment, called once before using Zbox
  await zbox.initEnv({ debug: true });

  // open the repo
  var repo = await zbox.openRepo({
    uri: '[your_repo_uri]',
    pwd: 'secret password',
    opts: { create: true }
  });

  // create a file
  var file = await repo.createFile('/hello_world.txt');

  // write content to file
  await file.writeOnce('Hello, World!');

  // seek to the beginning of file
  await file.seek({ from: Zbox.SeekFrom.Start, offset: 0 });

  // read all content as string
  const str = await file.readAllString()
  assert.strictEqual(str, 'Hello, World!');

  // close file and repo
  await file.close();
  await repo.close();

})();
```

# API Documentation

Check the API documentation at https://docs.zbox.io/api/.

# How to Build

This is for advanced user. If simply use this package, you don't need to build
by yourself as `npm install` will automatically download the pre-built binary.

This library needs to be compiled to platform-specific binary, it currently
supports 64-bit Linux, macOS and Windows.

After running the building command, it will generate `index.node` shared
library in `native` folder. This library must be used with javascript wrappers,
which can be found in `lib` directory.

## Linux

### Prerequisites

[Docker](https://www.docker.com/)

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

## Windows

### Prerequisites

- [Rust](https://www.rust-lang.org/)

- windows-build-tools
  ```sh
  npm install --global --production windows-build-tools
  ```

### Build

Use below command to build the shared library.

```sh
npm run build
```

# License

This package is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE)
file for details.

[ZboxFS]: https://github.com/zboxfs/zbox
