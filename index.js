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
var filename = process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver';

exports.before = function(next) {
  var localDriverLocation = path.join(path.resolve(path.dirname(module.parent)), filename);
  ensureCachedDriverExists(function(error, cachedDriverLocation) {
    if (error) { return next(error); }
    fs.symlink(cachedDriverLocation, localDriverLocation, function(error) {
      if (error && error.code === 'EEXIST') { return next(); }
      next(error);
    });
  });


exports.after = function(next) {
  var localDriverLocation = path.join(path.resolve(path.dirname(module.parent)), filename);
  fs.unlink(localDriverLocation, function(error) {
    next(error);
  })
}

function ensureCachedDriverExists(callback) {
  var cachedDriverLocation = path.join(__dirname, filename);
  if (fs.existsSync(cachedDriverLocation)) {
    return callback(null, cachedDriverLocation);
  }
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
          var done = false;
          entry.pipe(fs.createWriteStream(cachedDriverLocation + '_', { mode: 0o755 }));
          entry.on('error', function(error) {
            if (!done) { done = true; callback(error); }
          })
          entry.on('end', function() {
            if (!done) {
              done = true;
              fs.renameSync(cachedDriverLocation + '_', cachedDriverLocation)
              callback(null, cachedDriverLocation);
            }
          });
        } else {
          entry.autodrain();
        }
      })
    ;
  });
}

exports.URL = 'http://chromedriver.storage.googleapis.com/';
