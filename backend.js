// jshint esversion: 6
const {inspect} = require('util');

module.exports = () => {
    function isPeerPackage(pkg) {
        console.log('isPeerPackage', pkg);
    }
    
    function fetchMetadata(addr, cb) {
        console.log('fetchMetadata', addr);
        cb(null);
    }

    function writeMetadata(name, data, cb) {
        console.log('writeMetadata', name, inspect(data, {depth: 8, colors: true}));
        console.log('metadata size is', Buffer.from(JSON.stringify(data)).length);
        cb(null);
    }

    function writeTarball(name, filename, buffer, cb) {
        console.log('writeTarball', name, filename, buffer);
        console.log('tarball size is', buffer.length);
        cb(null);
    }

    return {
        isPeerPackage,
        fetchMetadata,
        writeMetadata,
        writeTarball
    };
};
