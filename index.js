const registry = require('./registry');
const backend = require('./backend');

module.exports = {
  name: 'npm-ssb',
  version: require('./package').version,
  manifest: {},
  init: function (ssb, config) {
    registry(backend(ssb, config), (err)=>{
        if (err) throw err;
    });
    return {}
  }
}

