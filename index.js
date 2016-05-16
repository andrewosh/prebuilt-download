var os = require('os')
var path = require('path')
var pathExists = require('path-exists')
var mkdir = require('mkdirp')
var nugget = require('nugget')
var homePath = require('home-path')
var mv = require('mv')
var debug = require('debug')('prebuilt-download')
var npmrc = require('rc')('npm')
var URL = require('./url.js')
var _ = require('lodash')

/**
 * opts can contain the following required/optional fields:
 *  - name: name of the prebuilt (i.e. electron, java)
 *  - url: template string optionally containing version, arch, and platform fields
 *  - filename: template string optionally containing version, arch, and platform fields
 *  - version: version to download
 *  - arch: (optional) function that transforms os.arch into the correct form
 *  - platform: (optional) function that transforms os.platform into the correct form
 *  - requestOpts: (optional) additional HTTP request options
 */
module.exports = function download (opts, cb) {
  if (!opts.version) return cb(new Error('must specify version'))
  if (!opts.url) return cb(new Error('must specify a URL template string'))
  if (!opts.filename) return cb(new Error('must specify a filename template string'))
  if (!opts.name) return cb(new Error('must specify a name'))

  var buildString = function (template, arch, platform, version) {
    var str = template.replace(/\{arch\}/g, arch)
    str = str.replace(/\{platform\}/g, platform) 
    str = str.replace(/\{version\}/g, version)
    return str
  }

  var arch = (opts.arch) ? opts.arch(os.arch()) : os.arch()
  var platform = (opts.platform) ? opts.platform(os.platform()) : os.platform()
  var version = opts.version
  console.log('arch: ', arch)
  
  // construct the url and filenames based on the above options
  
  var url = buildString(opts.url, arch, platform, version)
  var filename = buildString(opts.filename, arch, platform, version)

  var homeDir = homePath()
  var cache = opts.cache || path.join(homeDir, './.node_prebuilts/' + opts.name + '-' + opts.version)

  debug('platform/arch', platform, arch)

  var strictSSL = true
  if (opts.strictSSL === false) {
    strictSSL = false
  }

  var proxy
  if (npmrc && npmrc.proxy) proxy = npmrc.proxy
  if (npmrc && npmrc['https-proxy']) proxy = npmrc['https-proxy']

  debug('cache', cache)
  debug('filename', filename)
  debug('url', url)

  var cachedZip = path.join(cache, filename)
  debug('cached ' + opts.ext, cachedZip)

  if (pathExists.sync(cachedZip)) {
    debug(opts.ext + 'exists', cachedZip)
    return cb(null, cachedZip)
  }

  debug('creating cache/tmp dirs')
  // otherwise download it
  mkCacheDir(function (err, actualCache) {
    if (err) return cb(err)
    cachedZip = path.join(actualCache, filename) // in case cache dir changed
    // download to tmpdir
    var tmpdir = path.join(os.tmpdir(), opts.name + '-tmp-download-' + process.pid + '-' + Date.now())
    mkdir(tmpdir, function (err) {
      if (err) return cb(err)
      debug('downloading zip', url, 'to', tmpdir)
      var defaultOpts = {
        target: filename,
        dir: tmpdir,
        resume: true,
        verbose: true,
        strictSSL: strictSSL,
        proxy: proxy,
      }
      var nuggetOpts = _.merge(defaultOpts, opts.requestOpts) 
      nugget(url, nuggetOpts, function (errors) {
        if (errors) {
          var error = errors[0] // nugget returns an array of errors but we only need 1st because we only have 1 url
          if (error.message.indexOf('404') === -1) return cb(error)
          error.message = 'Failed to find ' + opts.name + ' v' + opts.version + ' for ' + platform + '-' + arch + ' at ' + url
          return cb(error)
        }
        // when dl is done then put in cache
        debug('moving ' + opts.ext + ' to', cachedZip)
        mv(path.join(tmpdir, filename), cachedZip, function (err) {
          if (err) return cb(err)
          cb(null, cachedZip)
        })
      })
    })
  })

  function mkCacheDir (cb) {
    mkdir(cache, function (err) {
      if (err) {
        if (err.code !== 'EACCES') return cb(err)
        // try local folder if homedir is off limits (e.g. some linuxes return '/' as homedir)
        var localCache = path.resolve('./node_prebuilts/' + opts.name)
        debug('local cache', localCache)
        return mkdir(localCache, function (err) {
          if (err) return cb(err)
          cb(null, localCache)
        })
      }
      cb(null, cache)
    })
  }
}
