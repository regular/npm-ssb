// jshint esversion: 6
const {inspect} = require('util');
const pull = require('pull-stream');

const ssbHash = require('pull-hash/ext/ssb');
const multicb = require('multicb');

function isPeerPackage(pkg) {
    console.log('isPeerPackage', pkg);
    return false;
}

function getVersionFromMeta(meta) {
  // find out what version is currently being published
  // (this should be more obvious)
  return meta['dist-tags'].latest;
}

module.exports = (sbot) => {
    //console.log('XXXXXXXXXXXXXXXX npm ssb flume', sbot._flumeUse);

    function findPreviousVersions(name, cb) {
      sbot.whoami( (err, feed)=>{
        console.log('feed', feed);
        pull(
          sbot.query.read({
            reverse: true,
            query: [
              {$filter: {
                value: {
                  author: feed.id,
                  content: {type: 'npm-publish', meta: {name: name}}
                }
              }},
              {$map: {key: ['key'], meta: ['value', 'content', 'meta']}}
            ]
          }),
          pull.collect(cb)
        )
      });
    }

    return ()=>{
        let meta = {};
        let tarballs = [];

        function fetchMetadata(addr, cb) {
            console.log('fetchMetadata', addr);
            cb(null);
        }

        function writeMetadata(name, data) {
            Object.assign(meta, data);
        }

        function writeTarball(packageName, filename, buffer) {
            tarballs.push({buffer, filename});
        }

        function createBlobs(tarballs, cb) {
            pull(
                pull.values(tarballs),
                pull.asyncMap( ({buffer}, cb) => {
                    console.log(`Uploading ${buffer.byteLength} bytes ... `);
                    pull(
                        pull.once(buffer),
                        sbot.blobs.add( (err, hash) => {
                            console.log('blob.add', err, hash);
                            cb(err, hash);
                        })
                    );
                }),
                pull.collect(cb)
            );
        }

        function publishRelease(cb) {
            let version = getVersionFromMeta(meta);
            console.log(`publishRelease: ${meta.name}@${version}, ${tarballs.length} tarball(s)`);
            console.log('metadata size is', Buffer.from(JSON.stringify(meta)).byteLength);
            let tarballSize = tarballs.reduce( (acc, {buffer, filename})=>{
                console.log(`  ${filename} ${buffer.byteLength} bytes`);
                return acc + buffer.byteLength;
            }, 0); 
            console.log('total tarball size is', tarballSize);
            console.log('creating blobs ...');
            createBlobs(tarballs, (err, hashes)=>{
              if (err) return cb(err);
              // replace localhost URL with ssb tarball link
              meta.versions[version].dist.tarball = hashes[0];
              return findPreviousVersions(meta.name, (err, versions)=>{
                console.log('previous versions', versions);
                const previousKey = versions[0].key;
                const previousMeta = versions[0].meta;
                const previousVersion = getVersionFromMeta(previousMeta);
                if (version === previousVersion) return cb(new Error(`Version ${version} was published already in ${previousKey}`));
                console.log('posting publish message', inspect(meta, {depth: 8, colors: true}));
                sbot.publish({
                  type: 'npm-publish',
                  previousPublish: previousKey,
                  meta
                }, cb);
              });
            });
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
