// jshint esversion: 6
const {inspect} = require('util');

function isPeerPackage(pkg) {
    console.log('isPeerPackage', pkg);
    return false;
}
    
module.exports = () => {
    let meta = {};
    let tarballs = [];

    function fetchMetadata(addr, cb) {
        console.log('fetchMetadata', addr);
        cb(null);
    }

    function writeMetadata(name, data, cb) {
        console.log('writeMetadata', name, inspect(data, {depth: 8, colors: true}));
        Object.assign(meta, data);
        cb(null);
    }

    function writeTarball(packageName, filename, buffer, cb) {
        console.log('writeTarball', packageName, filename);
        tarballs.push({buffer, filename});
        cb(null);
    }

    function publishRelease(cb) {
        console.log(`publishRelease: ${meta.name} ${tarballs.length} tarball(s)`);
        console.log('metadata size is', Buffer.from(JSON.stringify(meta)).byteLength);
        let tarballSize = tarballs.reduce( (acc, {buffer, filename})=>{
            console.log(`  ${filename} ${buffer.byteLength} bytes`);
            return acc + buffer.byteLength;
        }, 0); 
        console.log('tarball size is', tarballSize);
        cb(null);
    }

    return {
        isPeerPackage,
        fetchMetadata,
        writeMetadata,
        writeTarball,
        publishRelease
    };
};
