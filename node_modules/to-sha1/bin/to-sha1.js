#!/usr/bin/env node

const { toSHA1, sha1 } = require('../index');
const through = require('through2');

const COMMAND = 2;
const ARGUMENT = 3;

if (process.argv.length <= 2) {
  return process.stdin
    .pipe(
      through((chunk, enc, next) => {
        next(null, sha1(chunk.toString()));
      })
    )
    .pipe(process.stdout);
}

switch (process.argv[COMMAND]) {
  case '-h':
  case '--help':
    console.log('usage: [-f|--file] <filepath>');
    break;
  case '-f':
  case '--file':
    processFile(process.argv[ARGUMENT]);
    break;
  case '-s':
  case '--string':
    processString(process.argv[ARGUMENT]);
    break;
  default:
    console.log('invalid argument');
    process.exit(1);
}

function processFile(filepath) {
  toSHA1(filepath, (err, messageDigest) => {
    if (err) {
      console.log(`Unable to process file: ${err}`);
      process.exit(2);
    }

    console.log(messageDigest);
  });
}

function processString(string) {
  if (typeof string == 'undefined' || string.length === 0) {
    console.log('[-s|--string] option requires string argument');
    process.exit(3);
  }

  console.log(sha1(string));
}
