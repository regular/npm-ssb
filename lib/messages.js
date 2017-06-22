const pull = require('pull-stream')
const defer = require('pull-defer')
const debug = require('debug')('npm-ssb-messages')
const {inspect} = require('util')
const semver = require('semver')

module.exports = (ssb)=> {

  function published(feedId, moduleName) {
    return pull(
      ssb.query.read({
        //reverse: true,
        query: [
          {$filter: {
            value: {
              author: feedId,
              content: {
                type: 'npm-publish',
                meta: {
                  name: moduleName
                }
              }
            }
          }},
          {$map: {
            key: ['key'], 
            sequence: ['value','sequence'],
            timestamp: ['timestamp'],
            prev: ['value','content','previousPublish'],
            meta: ['value', 'content', 'meta']
          }}
        ]
      })
    )
  }

  function chains(feed, moduleName) {
    let ret = defer.source()
    pull(
      published(feed, moduleName),
      pull.collect( (err, msgs)=>{
        if (err) return ret.resolve(pull.error(err))
        //console.log(inspect(msgs, {depth: 3}))
        msgs = msgs.reduce( (acc, m) => {
          acc[m.key] = m
          return acc
        }, {})
        //console.log(inspect(msgs, {depth: 3}))
        let roots = []
        Object.values(msgs).forEach( (m)=>{
          if (m.prev) {
            let prev = msgs[m.prev]
            if (!prev) return debug(`Dangling prev reference from ${m.key}`)
            prev.next = m
          } else roots.push(m)
        })
        let chains = roots.map( (n)=>{
          let l = []
          do {
            let v = n.meta ? n.meta.versions : {}
            l.push({
              key: n.key,
              sequence: n.sequence,
              timestamp: n.timestamp,
              versions: Object.keys(v || {}).sort(semver.compare)
            })
            n = n.next
          } while(n)
          return l
        })
        //console.log(inspect(chains, {depth: 3}))
        ret.resolve(pull.values(chains))
      })
    )
    return ret
  }

  return {
    published,
    chains
  }
}
