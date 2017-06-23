var {inspect} = require('util')
var test = require('tape')
var Ssb = require('./ssb-mock')
var pull = require('pull-stream')
var publish = require('../lib/publish')

function makeChain(n, versions) {
  let i = 0
  return versions.map( (v)=>{
    return {
      key: '%' + n,
      timestamp: 1000*n,
      value: {
        sequence: n++,
        author: 'me',
        content: {
          previousPublish: i++ ? '%' + (n-2) : null,
          type: 'npm-publish',
          meta: {
            versions: v.reduce( (acc,x)=>{acc[x]=true; return acc}, {}),
            name: "mymodule"
    } } } }
  })
}

function meta(version) {
  return {
    "name": "mymodule",
    "dist-tags": {
      "latest": version
    },
    "versions": {
      [version]: {
        "author": {
          name: "that guy",
          email: "@nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519"
        },
        "dist": {
          "tarball": "tarball url"
  } } } }
}

test('Should reject versiosn lower than current version', (t)=>{
  var ssb = Ssb()
  ssb.whoami = (cb)=>cb(null, {id:'me'})

  ssb.append(
    makeChain(1, [ ['2.1.0', '3.1.0'] ]),
    function (err, seq) {
      t.notOk(err)
      publish(ssb, meta("1.0.0"), new Buffer.from('I am a tarball!'), (err)=>{
        t.ok(err)
        t.end()
      })
    }
  )
})

test('Should reject versiosn equal to current version', (t)=>{
  var ssb = Ssb()
  ssb.whoami = (cb)=>cb(null, {id:'me'})

  ssb.append(
    makeChain(1, [ ['2.1.0', '3.1.0'] ]),
    function (err, seq) {
      t.notOk(err)
      publish(ssb, meta("3.1.0"), new Buffer.from('I am a tarball!'), (err)=>{
        t.ok(err)
        t.end()
      })
    }
  )
})

test('Should upload blob and post publish message', (t)=>{
  var ssb = Ssb()
  ssb.whoami = (cb)=>cb(null, {id:'me'})
  ssb.blobs= {
    add: (cb)=> pull.collect( (err, buffers)=>{
      t.ok(buffers.length, 'should add blob')
      cb(null, `&my-blob-hash`)
    })
  }
  ssb.publish = (msg, cb) => {
    //console.log(inspect(msg, {depth: 8}))
    t.equal(msg.previousPublish, '%2')
    t.deepEqual(msg.meta.versions['4.0.1'].dist, {
      tarball: '&my-blob-hash'
    })
    t.deepEqual(msg.mentions, [
      {
        name: "that guy",
        link: '@nti4TWBH/WNZnfwEoSleF3bgagd63Z5yeEnmFIyq0KA=.ed25519' }
    ])

    cb(null)
  }

  ssb.append(
    makeChain(1, [ ['2.1.0', '3.1.0'], ['4.0.0']]),
    function (err, seq) {
      t.notOk(err)
      publish(ssb, meta("4.0.1"), new Buffer.from('I am a tarball!'), (err)=>{
        t.notOk(err)
        t.end()
      })
    }
  )
})

