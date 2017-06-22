const ssbClient = require('ssb-client')
const pull = require('pull-stream')
const ago = require('s-ago')

const Messages = require('../lib/messages')
const Versions = require('../lib/versions')

if (process.argv.length < 3) {
  console.error(`USAGE: info <module-name>`)
  process.exit(1)
}

const moduleName = process.argv[2]

ssbClient( (err, ssb) => {
  if (err) throw err

  const {chains} = Messages(ssb)
  const {current} = Versions(ssb)

  console.log(`Showing published versions of "${moduleName}" in your feed`)

  ssb.whoami( (err, feed)=>{
    if (err) throw err
    let chainIndex = 0
    pull(
      chains(feed.id, moduleName),
      pull.drain( (chain)=>{
        console.log(`Update-chain #${++chainIndex}`)
        chain.forEach( (msg)=> {
          console.log(`  seq: ${msg.sequence} ${ago(new Date(msg.timestamp))} key: ${msg.key}`)
          console.log(
            msg.versions.map( (v)=>`    - version ${v}`).join('\n')
          )
        })
      }, (err)=>{
        if (err) throw err
        current(feed.id, moduleName, (err, currVersion) => {
          if (err) throw err
          if (currVersion) {
            console.log(`Current version is ${currVersion.version}, published in ${currVersion.key}`)
          } else {
            console.log(`You did not publish "${moduleName}" in your feed.`)
          }
          ssb.close()
        })
      })
    )
  })
})
