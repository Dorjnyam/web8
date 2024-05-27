const crypto = require('crypto');
const concat = require('concat-stream');
const fs = require('fs');
const path = require('path');

module.exports = { sha1, toSHA1 };

function toSHA1(filename, cb) {
  checkFileValidity(filename, (err, file) => {
    if (err) return cb(err);
    fs.createReadStream(file).pipe(createWriteStream(cb));
  });
}

function sha1(str) {
  return crypto
    .createHash('sha1')
    .update(str, 'utf-8')
    .digest('hex');
}

function createWriteStream(cb) {
  return concat(body => cb(null, sha1(body)));
}

function checkFileValidity(filepath, cb) {
  if (typeof filepath === 'undefined')
    cb(new Error(`filepath can't be undefined`));

  let file = path.resolve(filepath);

  fs.lstat(file, (err, stat) => {
    if (err) return cb(new Error(`Invalid file: ${file}`));
    if (!stat.isFile()) return cb(new Error(`${file} must be a file!`));

    fs.access(file, fs.F_OK, err => {
      if (err) return cb(err);
      cb(null, file);
    });
  });
}
