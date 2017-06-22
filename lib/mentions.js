const fs = require('fs')
const path = require('path')
const {inspect} = require('util');

const debug = require('debug')('npm-ssb-mentions')
const pull = require('pull-stream')
const getMentions = require('ssb-mentions')
const findEmoji = require('emojis-with-ssb-hashes')

function getReadMeText(meta) {
  return meta.readme || meta.versions[getVersionFromMeta(meta)].readme
}

function emojiMentions(ssb) {
  return pull(
    pull.asyncMap( (em, cb)=>{
      const emoji = findEmoji(em.name)
      if (!emoji) {
        debug(`Unknown emoji "${em.name}" (ignored)`)
        return cb(null) // error is ignored
      }
      em.size = emoji.size
      pull(
        pull.once(emoji.file),
        pull.asyncMap( fs.readFile.bind(fs) ),
        ssb.blobs.add( (err, hash) => {
          if (err || !hash) {
            debug(`emoji blob.add error ${err} (ignored)`)
            return cb(null) // ignore error
          }
          em.link = hash
          cb(null, em)
        })
      )
    }),
    pull.filter()
  )
}

// returns a source of mention objects
module.exports = function mentions(ssb, meta) {
  let mentions = []
  const readmeText = getReadMeText(meta)
  if (readmeText) {
    mentions = getMentions(readmeText, {emoji: true});
    debug('mentions in readme', inspect(mentions, {depth: 8, colors: true}));
  }
  return pull(
    pull.values(mentions),
    pull.filter( (m)=>m.emoji ),
    emojiMentions(ssb)
  )
}
