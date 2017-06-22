const pull = require('pull-stream')
const debug = require('debug')('npm-ssb-versions')
const semver = require('semver')

const Messages = require('./messages')

module.exports = (ssb)=> {
  const {chains} = Messages(ssb)

  function current(feedId, moduleName, cb) {
    pull(
      chains(feedId, moduleName),
      pull.collect( (err, chains) => {
        if (err) return cb(err)
        if (!chains.length) return cb(null, null)

        // TODO:
        // - if we pick the oldest chain, we prevent
        // publishers from altering history (newer chains are ignored)
        // - if we pcik the newest chain, we ensure that users install freshly
        // published versions. What do we do?
        //
        // For now we pick the first one, because that's easiest.
        let msg = chains[0].slice(-1)[0]
        let version = msg.versions.sort(semver.rcompare)[0]
        cb(null, {version, key: msg.key})
      })
    )
  }

  return {
    current
  }
}

module.exports.getVersionFromMeta = function (meta) {
  return (meta['dist-tags'] || {}).latest;
}
