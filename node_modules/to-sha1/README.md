[![Build Status](https://travis-ci.org/c33k/to-sha1.svg?branch=master)](https://travis-ci.org/c33k/to-sha1)
[![npm version](https://badge.fury.io/js/to-sha1.svg)](https://badge.fury.io/js/to-sha1)

# to-sha1
Convert string or file contents to SHA1.

## usage

### As Command Line
First, install ***to-sha1*** globally:

```sh
npm i -g to-sha1
```

You can then use it with pipes:

```sh
echo -n "some string I want to hash" | to-sha1
```

Or passing arguments.

#### [-s | --string]
Receives *string* as argument and return SHA-1:

```sh
$ to-sha1 -s "Random text..."
```

#### [-f | --filename]
Receives the *filepath* as argument and return SHA-1 of it's content:

```sh
$ to-sha1 -f <filepath>
```

#### [-h | --help]
Displays accepted arguments.

### As Regular Node Module

```javascript
  const { toSHA1, sha1 } = require('to-sha1')
  
  //Using SHA1 function directly
  //... get file content or text from somewhere ...
  var hashedData = sha1(data);

  //Using toSHA1 to hash a specific file
  toSHA1('filepath', (err, hashedContent) => {
    if(err) console.log(`Something went wrong!`, err)
    console.log(hashedContent) //or do something else...
  })
```

## methods
```javascript
  const { toSHA1, sha1 } = require('to-sha1')
```

### sha1(string)
  Returns the hash of a given string.

### toSHA1(filename, cb)
  Hash a file asynchronously. If there is any error during processing (eg. file doesn't exist, invalid permissions or it is a directory) cb function will be called with the error as first argument.
