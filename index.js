'use strict';

var chokidar = require('chokidar');
var debounce = require('lodash.debounce');
var asyncDone = require('async-done');
var assignWith = require('lodash.assignwith');

function assignNullish(objValue, srcValue) {
  return (srcValue == null ? objValue : srcValue);
}

var defaults = {
  ignoreInitial: true,
  delay: 100,
  queue: true,
};

function watch(glob, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opt = assignWith({}, defaults, options, assignNullish);

  var debouncedAsyncDone;
  if (opt.delay) {
    debouncedAsyncDone = debounce(asyncDone, opt.delay, opt);
  } else {
    debouncedAsyncDone = asyncDone;
  }

  var queued = false;
  var running = false;

  var watcher = chokidar.watch(glob, opt);

  function runComplete(err) {
    running = false;

    if (err) {
      watcher.emit('error', err);
    }

    // If we have a run queued, start onChange again
    if (queued) {
      queued = false;
      onChange();
    }
  }

  function onChange() {
    if (running) {
      if (opt.queue) {
        queued = true;
      }
      return;
    }

    if (typeof cb === 'function') {
      running = true;
      debouncedAsyncDone(cb, runComplete);
    }
  }

  watcher
    .on('change', onChange)
    .on('unlink', onChange)
    .on('add', onChange);

  return watcher;
}

module.exports = watch;
