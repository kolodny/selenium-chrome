var path = require('path');
var fs = require('fs');
var Module = require('module');

var unzip = require('unzip');
var request = require('request');
var isNode = require('detect-node');

if (!isNode) {
  throw new Error('selenium-chrome only works in node');
}

Module._cache[module.filename] = undefined;

exports = module.exports = function(callback) {
  var filename = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';
  var localDriverLocation = path.join(path.resolve(path.dirname(module.parent)), filename);
  request(exports.URL + 'LATEST_RELEASE', function(error, latestRelease) {
    if (error) { return callback(error); }
    var zipUrl = {
      darwinx64: 'chromedriver_mac32.zip',
    }[process.platform + process.arch];
    if (!zipUrl) { return console.error(new Error('unknown driver')); }
    var stream = request(exports.URL + latestRelease.body + '/' + zipUrl);
    stream
      .pipe(unzip.Parse())
      .on('entry', function (entry) {
        if (entry.path === filename) {
          entry.pipe(fs.createWriteStream(localDriverLocation, { mode: 0o755 }));
        } else {
          entry.autodrain();
        }
      })
    ;
  });
}

exports.URL = 'http://chromedriver.storage.googleapis.com/';

module.exports();