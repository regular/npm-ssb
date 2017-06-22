const pull = require('pull-stream')

module.exports = function published(ssb, feedId, moduleName) {
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
          timestamp: ['timestamp'],
          prev: ['value','content','previousPublish'],
          meta: ['value', 'content', 'meta']
        }}
      ]
    })
  )
}
