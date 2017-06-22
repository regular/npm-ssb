const test = require('tape')
const pull = require('pull-stream')

const mentions = require('../lib/mentions')

test('Should return mentions for known emojis in readme', (t)=>{
  t.plan(11)

  const ssb = {
    blobs: {
      add: (cb)=> pull.collect( (err, buffers)=>{
        t.ok(buffers.length)
        cb(null, `&myhash`)
      })
    }
  }

  const meta = {
    readme: "This is a Readme :smile::+1: :unknown-emoji:"
  }

  pull(
    mentions(ssb, meta),
    pull.collect( (err, mentions)=>{
      t.equal(mentions.length, 2)
      t.ok(mentions[0].emoji)
      t.ok(mentions[1].emoji)
      t.equal(mentions[0].name, 'smile')
      t.equal(mentions[1].name, '+1')
      t.equal(mentions[0].link, '&myhash')
      t.equal(mentions[1].link, '&myhash')
      t.ok(mentions[0].size)
      t.ok(mentions[1].size)
    })
  )

})
