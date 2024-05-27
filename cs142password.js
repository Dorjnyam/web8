const { createHash } = require('node:crypto');
const { randomBytes } = require('node:crypto');

function makePasswordEntry(clearTextPassword) {
    const saltText = randomBytes(8).toString('hex');
    const sha1 = createHash('sha1');
    sha1.update(saltText + clearTextPassword);
    return {
        salt: saltText,
        hash: sha1.digest('hex'),
    };
}

function doesPasswordMatch(hash, salt, clearTextPassword) {
    const sha1 = createHash('sha1');
    return hash === sha1.update(salt + clearTextPassword).digest('hex');
}

module.exports = {
    makePasswordEntry: makePasswordEntry,
    doesPasswordMatch: doesPasswordMatch,
};

