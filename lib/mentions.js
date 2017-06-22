const fs = require('fs')
const path = require('path')
const {inspect} = require('util');

const debug = require('debug')('npm-ssb-mentions')
const pull = require('pull-stream')
const cat = require('pull-cat')
const getMentions = require('ssb-mentions')
const findEmoji = require('emojis-with-ssb-hashes')
const ref = require('ssb-ref')

const {getVersionFromMeta} = require('./versions')

function getPkg(meta) {
  let version = getVersionFromMeta(meta)
  return (meta.versions || {})[version]
}

function contributorMentions(meta) {
  const pkg =  getPkg(meta) || {}
  let people = pkg.contributors || []
  if (pkg.author) people.unshift(pkg.author)
  let feedIds = people.reduce( (acc, p)=>
    acc.concat([p, p.ssb].filter(ref.isFeedId))
  , [])
  return pull.values(feedIds.map((f)=>{return {
    link: f
  }}))
}

function processEmojiMentions(ssb) {
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
  let readme = meta.readme || (getPkg(meta) || {}).readme || ""
  let description = meta.description || (getPkg(meta) || {}).description || ""
  let text = description + " " + readme

  let emoji = pull(
    pull.values(getMentions(text, {emoji: true})),
    pull.filter( (m)=>m.emoji ),
    pull.unique( (m)=>m.name ),
    processEmojiMentions(ssb)
  )
  let others = pull(
    pull.values(getMentions(text))
  )
  let people = contributorMentions(meta)

  return cat([people, others, emoji])
}
