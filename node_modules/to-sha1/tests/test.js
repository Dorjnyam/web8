const tape = require('tape');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { sha1, toSHA1 } = require('../');

tape('test sha1 function with different arguments', function(t) {
  t.plan(3);

  const str = 'test string';
  const expected = crypto
    .createHash('sha1')
    .update(str, 'utf-8')
    .digest('hex');
  const result = sha1(str);

  t.equal(result, expected);
  t.throws(function testThrowsErrorWithEmptyArgumentList() {
    sha1(undefined);
  });

  t.throws(function testThrowsErrorWithObject() {
    sha1({});
  });
});

tape('test "toSHA1" function', function(t) {
  t.plan(4);
  const TEST_FILE = path.resolve('./tests/testfile.txt');

  const fileContent = fs.readFileSync(TEST_FILE);
  const expectedHash = sha1(fileContent);

  toSHA1(TEST_FILE, (err, hash) => {
    t.equal(err, null);
    t.equal(hash, expectedHash);
  });

  const INVALID_TEST_FILE = path.resolve('invalid.txt');

  toSHA1(INVALID_TEST_FILE, err => {
    t.equal(err.message, `Invalid file: ${INVALID_TEST_FILE}`);
  });

  const DIRECTORY_PATH = path.resolve('./');

  toSHA1(DIRECTORY_PATH, err => {
    t.equal(err.message, `${DIRECTORY_PATH} must be a file!`);
  });
});
