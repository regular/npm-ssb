var http = require('http')
var fs = require('fs')
var routes = require('routes')
var url = require('url')
var body = require('body')
var request = require('request')

module.exports = function (Driver, done) {
  var router = routes()
  router.addRoute('/:pkg', onPackage)
  router.addRoute('/-/user/org.couchdb.user\::user', onAddUser)
  router.addRoute('/:pkg/-/:tarball', onTarball)

  var server = http.createServer(function (req, res) {
    console.log(req.method.toUpperCase() + ' ' + req.url)

    var path = url.parse(req.url).pathname
    var match = router.match(path)
    if (match) {
      match.fn(req, res, match)
    } else {
      res.statusCode = 404
      res.end()
    }
  })

  server.listen(9000, function () {
    done(null, server)
  })

  function onPackage (req, res, match) {
    if (req.method === 'GET') {
      var pkg = match.params.pkg
      if (Driver().isPeerPackage(pkg)) {
        console.log(pkg + ' is a peer network package')
        // use peer network
        Driver().fetchMetadata(pkg, function (err, meta) {
          if (err) {
            res.statusCode = 404
          } else {
            res.statusCode = 201
            res.write(JSON.stringify(meta))
          }
          res.end()
        })
      } else {
        // use npm
        console.log(pkg + ' is an npm package')
        req.pipe(request('http://registry.npmjs.org/'+pkg)).pipe(res)
      }
    } else if (req.method === 'PUT') {
      console.log('wants to publish', match.params.pkg)
      body(req, function (err, data) {
        if (err) {
          res.statusCode = 500
          res.end()
          return
        }
        data = JSON.parse(data)
        publishPackage(data, function (err) {
          if (err) {
            console.log(err);
            res.statusCode = 500
          } else {
            res.statusCode = 201
          }
          res.end()
        })

      })
    } else {
      res.statusCode = 404
      res.end()
    }
  }

  function publishPackage (data, done) {
    var attachments = data._attachments
    delete data._attachments

    var pending = 2
    var pkg = data.name
    var driver = Driver()
    driver.writeMetadata(pkg, data, function (err) {
      console.log('wrote meta')
      if (--pending === 0) done(err)
    })
    writeAttachments(driver, pkg, attachments, function (err) {
      console.log('wrote tarball')
      if (--pending === 0) driver.publishRelease(done)
    })
  }

  function writeAttachments (driver, pkg, attachments, done) {
    var pending = Object.keys(attachments).length

    Object.keys(attachments).forEach(function (filename) {
      var data = new Buffer(attachments[filename].data, 'base64')
      driver.writeTarball(pkg, filename, data, function (err) {
        if (--pending === 0) done(err)
      })
    })
  }

  function onAddUser (req, res, match) {
    body(req, function (err, data) {
      Driver().addUser({
        name: data.name,
        email: data.email
      }, function (err) {
        if (err) {
          res.statusCode = 404
        } else {
          res.statusCode = 201
        }
        res.end()
      })
    })
  }

  function onTarball (req, res, match) {
    var tarball = match.params.tarball
    console.log('wants tarball:', tarball)
    Driver().fetchTarball(tarball, function (err, stream) {
      if (err) {
        res.statusCode = 404
        res.end()
      } else {
        stream.pipe(res)
      }
    })
  }

  return server
}
