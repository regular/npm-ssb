// jshint esversion: 6
const {inspect} = require('util');
const pull = require('pull-stream');

const ssbHash = require('pull-hash/ext/ssb');
const multicb = require('multicb');

function isPeerPackage(pkg) {
    console.log('isPeerPackage', pkg);
    return false;
}
    
module.exports = (sbot) => {

    // taken from ssb-git-repo/lib/repo.js
    function addBlobRaw(cb) {
        // work around sbot.blobs.add not calling back with blob id
        var done = multicb({ pluck: 1, spread: true });
        var sink = pull(
            ssbHash(done()),
            sbot.blobs.add(done())
        );
        done(cb);
        return sink;
    }

    return ()=>{
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
            console.log('total tarball size is', tarballSize);
            console.log('creating blobs ...');
            pull(
                pull.values(tarballs),
                pull.asyncMap( ({buffer}, cb) => {
                    console.log(`Uploading ${buffer.byteLength} bytes ... `);
                    pull(
                        pull.once(buffer),
                        pull.through(console.log),
                        addBlobRaw( (err, hash) => {
                            console.log('blob.add', err, hash);
                            cb(err, hash);
                        })
                    );
                }),
                pull.drain( (hash)=>{
                    console.log(`done. hash is ${hash}`);
                }, cb)
            );
        }

        return {
            isPeerPackage,
            fetchMetadata,
            writeMetadata,
            writeTarball,
            publishRelease
        };
    };
};
