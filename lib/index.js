'use strict';

const { Readable, Writable } = require('stream');
const zbox = require('../native');
const utils = require('./utils');

class Repo {
  constructor(ptr) {
    this.inner = new zbox.Repo(ptr);
  }

  close() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self.inner.close();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  static repairSuperBlock(uri, pwd) {
    return new Promise((resolve, reject) => {
      zbox.repoRepairSuperBlock(uri, pwd, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
  }

  info() {
    return this.inner.info();
  }

  resetPassword(oldPwd, newPwd, opsLimit, memLimit) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.resetPassword(oldPwd, newPwd, opsLimit, memLimit, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
  }

  pathExists(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.pathExists(path, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    });
  }

  isFile(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const result = self.inner.isFile(path);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  isDir(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const result = self.inner.isDir(path);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  createFile(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        const ptr = self.inner.createFile(path);
        resolve(new File(ptr));
      } catch (err) {
        reject(err);
      }
    });
  }

  openFile(params) {
    let self = this;

    return new Promise((resolve, reject) => {
      let path, opts = {};

      try {
        if (utils.isString(params)) {
          path = params;
        } else if (utils.isObject(params)) {
          utils.ensureString(params.path);
          opts = params.opts || {};
          utils.ensureObject(opts);
          path = params.path;
        } else {
          throw new Error('Wrong argument, string or Object required');
        }

        const ptr = self.inner.openFile(path, opts);
        resolve(new File(ptr));

      } catch (err) {
        reject(err);
      }
    });
  }

  createDir(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        ensureString(path);
        const ptr = self.inner.createDir(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  createDirAll(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        ensureString(path);
        const ptr = self.inner.createDirAll(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  readDir(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.readDir(path, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  metadata(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.metadata(path, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  history(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.history(path, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  copy(from, to) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.copy(from, to, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  removeFile(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.removeFile(path, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  removeDir(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.removeDir(path, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  removeDirAll(path) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.removeDirAll(path, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }

  rename(from, to) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.inner.rename(from, to, (err, ptr) => {
        if (err) return reject(err);
        resolve(new File(ptr));
      });
    });
  }
}

class File {
  constructor(ptr) {
    this.inner = new zbox.File(ptr);
  }

  close() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self.inner.close();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  read(buf) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        buf = utils.ensureBufType(buf);
        const read = self.inner.read(buf.ab, buf.offset, buf.len);
        resolve(Buffer.from(buf.ab, buf.offset, read));
      } catch (err) {
        reject(err);
      }
    });
  }

  readAll() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = self.inner.readAll();
        resolve(Buffer.from(buf));
      } catch (err) {
        reject(err);
      }
    });
  }

  readAllString() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = self.inner.readAll();
        resolve(utils.ab2str(buf));
      } catch (err) {
        reject(err);
      }
    });
  }

  readStream() {
    const self = this;
    let buf = Buffer.alloc(8 * 1024, 0);

    return Promise.resolve(new Readable({
      read(size) {
        try {
          let read = self.inner.read(buf.buffer, 0, buf.length);
          if (read == 0) {
            this.push(null);
          } else {
            this.push(buf.slice(0, read));
          }
        } catch (err) {
          process.nextTick(() => this.emit('error', err));
          return;
        }
      }
    }));
  }

  write(buf) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        buf = utils.ensureBufType(buf);
        const written = self.inner.write(buf.ab, buf.offset, buf.len);
        resolve(written);
      } catch (err) {
        reject(err);
      }
    });
  }

  finish() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self.inner.finish();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  writeOnce(buf) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        buf = utils.ensureBufTypeOrStr(buf);
        self.inner.writeOnce(buf.ab, buf.offset, buf.len);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  writeStream() {
    const self = this;
    return new Writable({
      write(chunk, encoding, callback) {
        try {
          self.inner.write(chunk.buffer);
        } catch (err) {
          return callback(err);
        }
        callback();
      },

      final(callback) {
        try {
          self.inner.finish();
        } catch (err) {
          return callback(err);
        }
        callback();
      }
    });
  }

  seek(arg) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(arg);
        utils.ensureNumber(arg.from);
        utils.ensureNumber(arg.offset);
        const newPos = self.inner.seek(arg.from, arg.offset);
        resolve(newPos);
      } catch (err) {
        reject(err);
      }
    });
  }

  setLen(len) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureNumber(len);
        self.inner.setLen(len);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  currVersion() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const ver = self.inner.currVersion();
        resolve(ver);
      } catch (err) {
        reject(err);
      }
    });
  }

  versionReader(verNum) {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureNumber(verNum);
        const ptr = self.inner.versionReader(verNum);
        resolve(new VersionReader(ptr));
      } catch (err) {
        reject(err);
      }
    });
  }

  metadata() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const md = self.inner.metadata();
        resolve(md);
      } catch (err) {
        reject(err);
      }
    });
  }

  history() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const hist = self.inner.history();
        resolve(hist);
      } catch (err) {
        reject(err);
      }
    });
  }
}

class VersionReader {
  constructor(ptr) {
    this.inner = new zbox.VersionReader(ptr);
  }

  close() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        self.inner.close();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  read(buf) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        buf = utils.ensureBufType(buf);
        const read = self.inner.read(buf.ab, buf.offset, buf.len);
        resolve(Buffer.from(buf.ab, buf.offset, read));
      } catch (err) {
        reject(err);
      }
    });
  }

  readAll() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = self.inner.readAll();
        resolve(Buffer.from(buf));
      } catch (err) {
        reject(err);
      }
    });
  }

  readAllString() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = self.inner.readAll();
        resolve(utils.ab2str(buf));
      } catch (err) {
        reject(err);
      }
    });
  }

  readStream() {
    const self = this;
    let buf = Buffer.alloc(8 * 1024, 0);

    return Promise.resolve(new Readable({
      read(size) {
        try {
          let read = self.inner.read(buf.buffer, 0, buf.length);
          if (read == 0) {
            this.push(null);
          } else {
            this.push(buf.slice(0, read));
          }
        } catch (err) {
          process.nextTick(() => this.emit('error', err));
          return;
        }
      }
    }));
  }

  seek(arg) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(arg);
        utils.ensureNumber(arg.from);
        utils.ensureNumber(arg.offset);
        const newPos = self.inner.seek(arg.from, arg.offset);
        resolve(newPos);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = class Zbox {
  constructor() {
    this.exited = false;
  }

  static get OpsLimit() {
    return {
      Interactive: 0,
      Moderate: 1,
      Sensitive: 2
    };
  }

  static get MemLimit() {
    return {
      Interactive: 0,
      Moderate: 1,
      Sensitive: 2
    };
  }

  static get Cipher() {
    return {
      Xchacha: 0,
      Aes: 1
    };
  }

  static get SeekFrom() {
    return {
      Start: 0,
      End: 1,
      Current: 2
    };
  }

  initEnv(opts) {
    if (this.exited) {
      return Promise.reject(new Error('ZboxFS exited'));
    }

    const debugOn = opts ? opts.debug : false;

    // set RUST_LOG env variable
    let directives = (process.env.RUST_LOG || '').split(',');
    let idx = directives.findIndex(d => d.split('=')[0] === 'zbox');
    if (idx >= 0) directives.splice(idx, 1);
    let rustLogEnv = 'zbox=' + (debugOn ? 'debug' : 'warn');
    directives.push(rustLogEnv);
    process.env.RUST_LOG = directives.join(',');

    return new Promise((resolve, reject) => {
      zbox.initEnv();
      resolve();
    });
  }

  exists(uri) {
    if (this.exited) {
      return Promise.reject(new Error('ZboxFS exited'));
    }

    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(uri);

        const result = zbox.repoExists(uri);
        resolve(result);

      } catch (err) {
        reject(err);
      }
    });
  }

  openRepo(args) {
    if (this.exited) {
      return Promise.reject(new Error('ZboxFS exited'));
    }

    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(args);
        utils.ensureString2(args.uri, args.pwd);
        args.opts = args.opts || {};
        utils.ensureObject(args.opts);

        const ptr = zbox.openRepo(args);
        resolve(new Repo(ptr));

      } catch (err) {
        reject(err);
      }
    });
  }

  exit() {
    this.exited = true;
  }
};
