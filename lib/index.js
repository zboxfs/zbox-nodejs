const { Readable, Writable } = require('stream');
const zbox = require('../native');
const utils = require('./utils');

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

  read(param) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = utils.ensureBufType(param);
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
    const buf = Buffer.alloc(8 * 1024, 0);

    return Promise.resolve(
      new Readable({
        read() {
          try {
            const read = self.inner.read(buf.buffer, 0, buf.length);
            if (read === 0) {
              this.push(null);
            } else {
              this.push(buf.slice(0, read));
            }
          } catch (err) {
            process.nextTick(() => this.emit('error', err));
          }
        }
      })
    );
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

  read(param) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = utils.ensureBufType(param);
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
    const buf = Buffer.alloc(8 * 1024, 0);

    return Promise.resolve(
      new Readable({
        read() {
          try {
            const read = self.inner.read(buf.buffer, 0, buf.length);
            if (read === 0) {
              this.push(null);
            } else {
              this.push(buf.slice(0, read));
            }
          } catch (err) {
            process.nextTick(() => this.emit('error', err));
          }
        }
      })
    );
  }

  write(param) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = utils.ensureBufType(param);
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

  writeOnce(param) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const buf = utils.ensureBufTypeOrStr(param);
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
        return callback();
      },

      final(callback) {
        try {
          self.inner.finish();
        } catch (err) {
          return callback(err);
        }
        return callback();
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
    const self = this;
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

  info() {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const info = self.inner.info();
        resolve(info);
      } catch (err) {
        reject(err);
      }
    });
  }

  resetPassword(arg) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(arg);
        utils.ensureString2(arg.oldPwd, arg.newPwd);
        utils.ensureNumber2(arg.opsLimit, arg.memLimit);
        self.inner.resetPassword(
          arg.oldPwd,
          arg.newPwd,
          arg.opsLimit,
          arg.memLimit
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  pathExists(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const result = self.inner.pathExists(path);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  isFile(path) {
    const self = this;
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
    const self = this;
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
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const ptr = self.inner.createFile(path);
        resolve(new File(ptr));
      } catch (err) {
        reject(err);
      }
    });
  }

  openFile(params) {
    const self = this;

    return new Promise((resolve, reject) => {
      let path;
      let opts = {};

      try {
        if (utils.isString(params)) {
          path = params;
        } else if (utils.isObject(params)) {
          utils.ensureString(params.path);
          opts = params.opts || {};
          utils.ensureObject(opts);
          ({ path } = params);
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
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        self.inner.createDir(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  createDirAll(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        self.inner.createDirAll(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  readDir(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const dirs = self.inner.readDir(path);
        resolve(dirs);
      } catch (err) {
        reject(err);
      }
    });
  }

  metadata(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const md = self.inner.metadata(path);
        resolve(md);
      } catch (err) {
        reject(err);
      }
    });
  }

  history(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        const hist = self.inner.history(path);
        resolve(hist);
      } catch (err) {
        reject(err);
      }
    });
  }

  copy(arg) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(arg);
        utils.ensureString2(arg.from, arg.to);
        self.inner.copy(arg.from, arg.to);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  removeFile(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        self.inner.removeFile(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  removeDir(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        self.inner.removeDir(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  removeDirAll(path) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureString(path);
        self.inner.removeDirAll(path);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  rename(arg) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(arg);
        utils.ensureString2(arg.from, arg.to);
        self.inner.rename(arg.from, arg.to);
        resolve();
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

    const logLevel = (opts && opts.log) ? opts.log.level : 'warn';

    // set RUST_LOG env variable
    const directives = (process.env.RUST_LOG || '').split(',');
    const idx = directives.findIndex(d => d.split('=')[0] === 'zbox');
    if (idx >= 0) directives.splice(idx, 1);
    const rustLogEnv = `zbox=${logLevel}`;
    directives.push(rustLogEnv);
    process.env.RUST_LOG = directives.join(',');

    return new Promise((resolve, reject) => {
      try {
        zbox.initEnv();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  version() {
    if (this.exited) {
      return Promise.reject(new Error('ZboxFS exited'));
    }

    return new Promise((resolve, reject) => {
      try {
        const result = zbox.version();
        resolve(result);
      } catch (err) {
        reject(err);
      }
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

  openRepo(params) {
    const args = params;

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

  repairSuperBlock(arg) {
    if (this.exited) {
      return Promise.reject(new Error('ZboxFS exited'));
    }

    return new Promise((resolve, reject) => {
      try {
        utils.ensureObject(arg);
        utils.ensureString2(arg.uri, arg.pwd);
        zbox.repairSuperBlock(arg.uri, arg.pwd);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  exit() {
    this.exited = true;
  }
};
