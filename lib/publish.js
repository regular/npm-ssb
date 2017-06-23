const debug = require('debug')('npm-ssb-publish')
const {inspect} = require('util')
const pull = require('pull-stream')
const semver = require('semver')
const multicb = require('multicb')
const Versions = require('./versions')
const mentions = require('./mentions')

function item(n, cb) {
  return (err, arr)=>{
    if (err) return cb(err)
    if (n>=arr.length) return cb(new RangeError(`n>=${arr.length}`))
    cb(err, arr[n])
  }
} 

module.exports = (ssb, meta, tarball, cb) => {
  const {current} = Versions(ssb)

  function isNew(feedId, moduleName, version, cb) {
    current(feedId, meta.name, (err, curr) => {
      if (err) return cb(err)
      debug(`current version: ${curr.version}, new version: ${version}`)
      if (!semver.gt(version, curr.version)) return cb(new Error(`The version you try to publish (${version}) must be greater than the current version (${curr.version})`))
      return cb(null, curr)
    })
  }

  let version = Versions.getVersionFromMeta(meta)
  debug(`publishRelease: ${meta.name}@${version}`)
  debug(`metadata size is ${Buffer.from(JSON.stringify(meta)).byteLength}`)
  debug(`tarball size is ${tarball.byteLength}`)

  ssb.whoami( (err, feed)=>{
    if (err) return cb(err)
    debug(`who am i: ${feed.id}`)
    isNew(feed.id, meta.name, version, (err, curr)=>{
      if (err) {
        debug(err.message)
        return cb(err)
      }
      upload(curr.key, tarball, meta, cb)
    })
  })

  function upload(prevKey, tarball, meta, cb) {
    debug('uploading ...')
    // upload tarball ...
    let done = multicb({pluck:1, spread:true})
    pull(
      pull.once(tarball),
      pull.asyncMap( (tarball, cb)=> pull(
        pull.once(tarball),
        ssb.blobs.add(cb)
      )),
      pull.collect(item(0, done()))
    )
    // ... and emojis in parallel
    pull(
      mentions(ssb, meta),
      pull.collect(done())
    )
    done( (err, hash, mentions) => {
      if (err) return cb(err)
      debug(`tarball hash: ${hash}`)
      debug(`mentions: ${inspect(mentions, {depth:5})}`)

      meta.versions[version].dist.tarball = hash

      ssb.publish({
        type: 'npm-publish',
        previousPublish: prevKey,
        meta,
        mentions
      }, cb)
    })
  }
}
