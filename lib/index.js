const { Readable, Writable } = require('stream');
const zbox = require('../native');

const OpsLimit = {
    Interactive: 0,
    Moderate: 1,
    Sensitive: 2
};

const MemLimit = {
    Interactive: 0,
    Moderate: 1,
    Sensitive: 2
};

const Cipher = {
    Xchacha: 0,
    Aes: 1
};

function openRepo(uri, pwd, opts) {
    return new Promise((resolve, reject) => {
        zbox.openRepo(uri, pwd, opts, (err, ptr) => {
            if (err) return reject(err);
            resolve(new Repo(ptr));
        });
    });
}

class Repo {
    constructor(ptr) {
        this.inner = new zbox.Repo(ptr);
    }

    close() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.close((err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    static exists(uri) {
        return new Promise((resolve, reject) => {
            zbox.repoExists(uri, (err, value) => {
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
            self.inner.isFile(path, (err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    isDir(path) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.isFile(path, (err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    createFile(path) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.createFile(path, (err, ptr) => {
                if (err) return reject(err);
                resolve(new File(ptr));
            });
        });
    }

    openFile(path, options) {
        let self = this;
        let opts = options || {};
        return new Promise((resolve, reject) => {
            self.inner.openFile(path, opts, (err, ptr) => {
                if (err) return reject(err);
                resolve(new File(ptr));
            });
        });
    }

    createDir(path) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.createDir(path, (err, ptr) => {
                if (err) return reject(err);
                resolve(new File(ptr));
            });
        });
    }

    createDirAll(path) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.createDirAll(path, (err, ptr) => {
                if (err) return reject(err);
                resolve(new File(ptr));
            });
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
        this.inner.close();
    }

    readAll() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.readAll((err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    readStream() {
        let self = this;
        let buf = Buffer.alloc(16 * 1024, 0);

        return new Readable({
            read(size) {
                let read = 0;
                try {
                    read = self.inner.read(buf.buffer);
                } catch (err) {
                    process.nextTick(() => this.emit('error', err));
                    return;
                }
                if (read == 0) {
                    this.push(null);
                } else {
                    this.push(buf.slice(0, read));
                }
            }
        });
    }

    writeOnce(buf) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.writeOnce(buf.buffer, (err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    writeStream() {
        let self = this;
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

    seek(from, offset) {
        return this.inner.seek(from, offset);
    }

    setLen(len) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.setLen(len, (err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    currVersion() {
        return this.inner.currVersion();
    }

    versionReader(verNum) {
        let ptr = this.inner.versionReader(verNum);
        return new VersionReader(ptr);
    }

    metadata() {
        return this.inner.metadata();
    }

    history() {
        return this.inner.history();
    }
}

class VersionReader {
    constructor(ptr) {
        this.inner = new zbox.VersionReader(ptr);
    }

    close() {
        this.inner.close();
    }

    readAll() {
        let self = this;
        return new Promise((resolve, reject) => {
            self.inner.readAll((err, value) => {
                if (err) return reject(err);
                resolve(value);
            });
        });
    }

    readStream() {
        let self = this;
        let buf = Buffer.alloc(16 * 1024, 0);

        return new Readable({
            read(size) {
                let read = 0;
                try {
                    read = self.inner.read(buf.buffer);
                } catch (err) {
                    process.nextTick(() => this.emit('error', err));
                    return;
                }
                if (read == 0) {
                    this.push(null);
                } else {
                    this.push(buf.slice(0, read));
                }
            }
        });
    }
}

module.exports = {
    OpsLimit,
    MemLimit,
    Cipher,
    initEnv: zbox.initEnv,
    openRepo,
    Repo,
    File,
    VersionReader
};
