const test = require('tape')
const pull = require('pull-stream')

const mentions = require('../lib/mentions')

test('Should return mentions for feeds, blobs and messages in readme', (t)=>{
  const meta = {
    readme: `
A message [faq](%rHFe7Y3fFqU/R7ncDWrhhQHPWrgTVjQBDkXz998Veqc=.sha256)
A blob &7jUKRp3XTtRmCpLRXXsfg8HimRqTCTLp9iVPsu51geU=.sha256
A feed @nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519
      `
  }

  pull(
    mentions({}, meta),
    pull.collect( (err, mentions)=>{
      t.equal(mentions.length, 3)
      t.end()
    })
  )
})

test('Should return mentions for author and contributors', (t)=>{
  const meta = {
    "dist-tags": {
      "latest": "1.0.2"
    },
    "versions": {
      "1.0.2": {
        author: {
          name: "nacho",
          ssb: "@nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519"
        },
        contributors: [
          "@nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519"
        ]
      }
    }
  }

  pull(
    mentions({}, meta),
    pull.collect( (err, mentions)=>{
      t.equal(mentions.length, 2)
      t.end()
    })
  )
})

test('Should return mentions for known emojis in readme and description', (t)=>{
  t.plan(16)

  const ssb = {
    blobs: {
      add: (cb)=> pull.collect( (err, buffers)=>{
        t.ok(buffers.length, 'should add blob')
        cb(null, `&myhash`)
      })
    }
  }

  const meta = {
    description: "This is a Readme :smile: :rainbow:",
    readme: "This is a Readme :smile::+1: :unknown-emoji:"
  }

  pull(
    mentions(ssb, meta),
    pull.collect( (err, mentions)=>{
      t.equal(mentions.length, 3)
      t.ok(mentions[0].emoji)
      t.ok(mentions[1].emoji)
      t.ok(mentions[2].emoji)
      t.equal(mentions[0].name, 'smile')
      t.equal(mentions[1].name, 'rainbow')
      t.equal(mentions[2].name, '+1')
      t.equal(mentions[0].link, '&myhash')
      t.equal(mentions[1].link, '&myhash')
      t.equal(mentions[2].link, '&myhash')
      t.ok(mentions[0].size)
      t.ok(mentions[1].size)
      t.ok(mentions[2].size)
    })
  )

})
