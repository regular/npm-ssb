
var Flume = require('flumedb')
//var MemLog = require('flumelog-memory')
var FlumeQuery = require('flumeview-query')

var tempDir = require('temp').track().mkdirSync
var OffsetLog = require('flumelog-offset')
var codec = require('flumecodec')
 
var indexes = []

//var db = Flume(MemLog())

module.exports = Flume(OffsetLog(tempDir() + "/flume-test.db", codec.json))
  .use('query', FlumeQuery(indexes))
