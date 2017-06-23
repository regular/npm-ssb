const {inspect} = require('util')
const publish = require('./lib/publish')

function isPeerPackage(pkg) {
  console.log('isPeerPackage', pkg)
  return false
}

module.exports = (ssb) => {

  function fetchMetadata(addr, cb) {
    console.log('fetchMetadata', addr)
    cb(null)
  }

  function publishRelease(meta, tarball, cb) {
    publish(ssb, meta, tarball, cb)
  }

  return {
    isPeerPackage,
    fetchMetadata,
    publishRelease
  }
}
