var test = require('tape')
var ssb = require('./ssb-mock')
var pull = require('pull-stream')
var messages = require('../lib/messages')

test('Should return publish messages by author and module name', (t)=>{
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
      messages(ssb, 'me', 'mymodule'),
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
