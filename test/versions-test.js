var test = require('tape')
var Ssb = require('./ssb-mock')
var pull = require('pull-stream')
var Versions = require('../lib/versions')

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

test('Should return the current version and msg key', (t)=>{
  var ssb = Ssb()
  var {current} = Versions(ssb)

  ssb.append(
    makeChain(1, [
      ['0.0.1'],
      ['2.1.0', '3.1.0']
    ]).concat(
      makeChain(3, [
        ['1.0.0'],
        ['2.0.0', '3.0.0'],
        ['4.0.0']
      ])
    ).concat(
      makeChain(6, [
        ['5.0.1'],
        ['6.2.0', '7.2.4'],
      ])
    ),
    function (err, seq) {
      t.notOk(err)
      current('me', 'mymodule', (err, curr)=>{
        t.equal(curr.version, '3.1.0')
        t.equal(curr.key, '%2')
        t.end()
      })
    }
  )
})

