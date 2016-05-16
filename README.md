# prebuilt-download

Downloads prebuilt binaries (or arbitrary files, for that matter) according to a URL template string that can be parameterized by architecture, platform and version.

Most of the code is taken from [electron-download](https://github.com/electron-userland/electron-download), and [java-download](https://github.com/blahah/java-download).

### usage

```js
var download = require('prebuilt-download')

download({
  version: 8,
  arch: 'x64',
  platform: 'windows',
  cache: './zips' // defaults to <user home directory>/.java
}, function (err, path) {
  // path will be the path of the file that it downloaded.
  // if the file was already cached it will skip
  // downloading and call the cb with the cached file path
  // if it wasn't cached it will download the file and save
  // it in the cache path
})
```
