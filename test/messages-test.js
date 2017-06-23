var test = require('tape')
var Ssb = require('./ssb-mock')
var pull = require('pull-stream')
var Messages = require('../lib/messages')

test('Should return publish messages by author and module name', (t)=>{
  var ssb = Ssb()
  var {published} = Messages(ssb)
  ssb.append([{
    key: '%1',
    timestamp: 1498130523459,
    value: {
      author: 'me',
      content: {
        previousPublish: '%0',
        type: 'npm-publish',
        meta: {
          name: "some other module",
        }
      }
    }
  }, {
    key: '%2',
    timestamp: 1498130523459,
    value: {
      author: 'me',
      content: {
        previousPublish: '%0',
        type: 'npm-publish',
        meta: {
          name: "mymodule",
        }
      }
    }
  },{
    key: '%3',
    timestamp: 1498130523459,
    value: {
      author: 'someone else',
      content: {
        previousPublish: '%0',
        type: 'npm-publish',
        meta: {
          name: "mymodule",
        }
      }
    }
  }], function (err, seq) {
    console.log(err, seq)
    pull(
      published('me', 'mymodule'),
      pull.collect( (err, msgs)=>{
        t.notOk(err)
        t.equal(msgs.length, 1)
        t.equal(msgs[0].key, '%2')
        t.equal(msgs[0].prev, '%0')
        t.equal(msgs[0].timestamp, 1498130523459)
        t.deepEqual(msgs[0].meta, {  name: 'mymodule' } )
        t.end()
      })
    )
  })
})

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
          }
        }
      }
    }
  })
}

test('Should return all update-chains', (t)=>{
  var ssb = Ssb()
  var {chains} = Messages(ssb)

  ssb.append(
    makeChain(1, [['0.0.1']]).concat(
      makeChain(2, [
        ['1.0.0'],
        ['2.0.0', '3.0.0'],
        ['4.0.0']
      ])
    ).concat(
      makeChain(5, [
        ['5.0.1'],
        ['6.2.0', '7.2.4'],
      ])
    ),
    function (err, seq) {
      t.notOk(err)
      pull(
        chains('me', 'mymodule'),
        pull.collect( (err, chains)=>{
          t.equal(chains.length, 3)
          t.equal(chains[0].length, 1)
          t.equal(chains[1].length, 3)
          t.equal(chains[2].length, 2)
          t.end()
        })
      )
    }
  )
})

