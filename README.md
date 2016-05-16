# prebuilt-download

Downloads prebuilt binaries (or arbitrary files, for that matter) according to a URL template string that can be parameterized by architecture, platform and version.

Most of the code is taken from [electron-download](https://github.com/electron-userland/electron-download), and [java-download](https://github.com/blahah/java-download).

### install
`npm install prebuilt-download`

### api
#### `download(opts, cb(err, path))`
Downloads to specified binary, optionally using a cached version instead (see [electron-download](https://github.com/electron-userland/electron-download) for additional options)

### usage

In the simplest case, you only need to pass in filename and url template strings that will be populated with OS values: 
```js
var download = require('prebuilt-download')
var filename = 'electron-v{version}-{platform}-{arch}.zip'
download({
  name: 'electron',
  filename: filename,
  version: '1.1.0',
  url: 'https://github.com/electron/electron/releases/download/v{version}/' + filename
}, function (err, p) {
  ...
})
```

In other cases, you might need to pass in transformation functions that modify the OS values:
``` js
  var filename = 'docker-{version}.tgz'
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
      return _.capitalize(p)
    },
    url: 'https://get.docker.com/builds/{platform}/{arch}/' + filename
  }, function (err, p) {
    ...
  })
})
```
### license
MIT
