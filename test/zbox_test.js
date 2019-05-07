const isNodeJs = (typeof process !== 'undefined') && (process.release.name === 'node');

const TIMEOUT = 60 * 1000;

let uri = 'zbox://3Qe3SNZ3Pe7PrkHP2UzmVgXn@Cn3yz3rgnsG4SY';
let uri2 = 'zbox://2ak9Ep5AxKsexhEgA8R2373M@MzLf5k47jyX5JC'; // for Node.js
const pwd = 'pwd';

if (isNodeJs) {
  uri += '?cache_type=file&base=./tt';
} else {
  uri += '?cache_type=browser';
}

var chai = chai || undefined;

if (isNodeJs) {
  chai = require('chai');
  Zbox = require('../');
}

let expect = chai.expect;
let assert = chai.assert;

let zbox = new Zbox();

// expect error promise
async function expectError(promise) {
  try {
    await promise;
    expect.fail();
  } catch (err) {
    expect(err).to.be.an('error');
  }
}

// ============================================
// Repo Open/Close Test
// ============================================
describe('Repo Open/Close Test', function() {
  let repo;

  this.timeout(TIMEOUT);

  before(function() {});

  it('should init environment', async function() {
    await zbox.initEnv({ debug: true });
  });

  it('should not open repo with wrong argument', async function() {
    await expectError(zbox.openRepo());
    await expectError(zbox.openRepo(null));
    await expectError(zbox.openRepo(undefined));
    await expectError(zbox.openRepo(123));
    await expectError(zbox.openRepo({}));
    await expectError(zbox.openRepo({ uri }));
    await expectError(zbox.openRepo({ pwd }));
    await expectError(zbox.openRepo({ uri: "", pwd }));
    await expectError(zbox.openRepo({ uri: 123, pwd: 456 }));
    await expectError(zbox.openRepo({ uri: "wrong uri", pwd }));
    await expectError(zbox.openRepo({ uri: "wrong_storage://", pwd }));
    await expectError(zbox.openRepo({ uri: "zbox://wrong_repo", pwd }));
    await expectError(zbox.openRepo({ uri: "zbox://foo@", pwd }));

    if (isNodeJs) {
      await expectError(zbox.openRepo({ uri: "zbox://foo@bar?cache_type=browser", pwd }));
    } else {
      await expectError(zbox.openRepo({ uri: "zbox://foo@bar?cache_type=file", pwd }));
    }
  });

  it('should open repo', async function() {
    repo = await zbox.openRepo({ uri, pwd, opts: { create: true }});
    expect(repo).to.be.an('object');
  });

  it('should close repo', async function() {
    if (repo) await repo.close();
  });

  it('should check repo exists', async function() {
    const result = await zbox.exists(uri);
    expect(result).to.be.true;
  });

  it('should not open repo with wrong password', async function() {
    await expectError(zbox.openRepo({ uri, pwd: null }));
    await expectError(zbox.openRepo({ uri, pwd: "" }));
    await expectError(zbox.openRepo({ uri, pwd: "wrong pwd" }));
    await expectError(zbox.openRepo({ uri, pwd: 123 }));
  });

  it('should not open repo with createNew flag', async function() {
    await expectError(zbox.openRepo({ uri, pwd, opts: { createNew: true }}));
  });

  it('should open repo again', async function() {
    repo = await zbox.openRepo({ uri, pwd, opts: { create: true }});
    expect(repo).to.be.an('object');
  });

  it('should close repo again', async function() {
    if (repo) await repo.close();
  });

  it('should be OK to close repo twice', async function() {
    if (repo) await repo.close();
  });

  it('should open repo with cryptos option in Node.js', async function() {
    if (!isNodeJs) return;

    let repo2 = await zbox.openRepo({ uri: uri2, pwd, opts: {
      create: true,
      opsLimit: Zbox.OpsLimit.Moderate,
      memLimit: Zbox.MemLimit.Moderate,
      cipher: Zbox.Cipher.Aes
    }});
    if (repo2) await repo2.close();
  });

  it('should open repo in read-only', async function() {
    repo = await zbox.openRepo({ uri, pwd, opts: { readOnly: true }});
    await expectError(repo.createFile('/foo'));
    await repo.close();
  });

  it('should delete local cache for browser', async function() {
    if (isNodeJs) return;
    await zbox.deleteLocalCache(uri);
  });

  it('should exit zbox', async function() {
    if (zbox) await zbox.exit();
  });

  it('should not open repo again after exit', async function() {
    await expectError(zbox.openRepo({ uri, pwd, opts: { create: true }}));
  });

  after(async function() {});
});
