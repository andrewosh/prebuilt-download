var fs = require('fs')
var os = require('os')
var path = require('path')

var test = require('tape')
var homePath = require('home-path')
var _ = require('lodash')

var download = require('./index')

test('electron download test', function (t) {
  t.plan(2)
  var filename = 'electron-v{version}-{platform}-{arch}.zip'
  download({
    name: 'electron',
    filename: filename,
    version: '1.1.0',
    url: 'https://github.com/electron/electron/releases/download/v{version}/' + filename
  }, function (err, p) {
    t.error(err)
    var desiredName = 'electron-v1.1.0-' + os.platform() + '-' + os.arch() +'.zip'
    var desiredPath = path.join(homePath(), './.node_prebuilts/electron-1.1.0/' + desiredName)
    fs.unlinkSync(desiredPath)
    t.equal(p, desiredPath)
  })
})

test('docker download test', function (t) {
  t.plan(2)
  var filename = 'docker-{version}.tgz'
  if (os.platform() !== 'linux') {
    console.log('performing test using the linux prebuilt')
    var forcedPlatform = true
  }
  download({
    name: 'docker',
    filename: filename,
    version: '1.11.0',
    arch: function (a) {
      if (a === 'ia32') {
        return 'i386'
      } else if (a === 'x64') {
        return 'x86_64'
      }
      return a
    },
    platform: function (p) {
      if (forcedPlatform) {
        return 'Linux'
      }
      return _.capitalize(p)
    },
    url: 'https://get.docker.com/builds/{platform}/{arch}/' + filename
  }, function (err, p) {
    t.error(err)
    var desiredName = 'docker-1.11.0.tgz'
    var desiredPath = path.join(homePath(), './.node_prebuilts/docker-1.11.0/' + desiredName)
    fs.unlinkSync(desiredPath)
    t.equal(p, desiredPath)
  })
})
