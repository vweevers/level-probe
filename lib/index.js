'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var iterator = require('level-iterator'),
    once = require('once'),
    NotFoundError = require('level-errors').NotFoundError,
    noop = function noop() {};

function probe(db, opts, done) {
  if (typeof opts === 'function') done = opts, opts = {};else if ('eq' in opts) return db.get(opts.eq, opts, done);

  opts = _extends({ keys: true, values: true }, opts || {}, { limit: 1 });

  if (opts.iterate !== false && !iterator.available(db)) {
    // Throw if explicitly requested
    if (opts.iterate === true) {
      throw new Error('level-probe: no iterators available on db');
    }

    opts.iterate = false;
  }

  var iter = opts.iterate !== false ? iterator(db, opts) : void 0;

  if (iter) {
    iter.next(function (err, key, value) {
      iter.end(noop); // Cleanup

      if (err) done(err);else if (key === undefined && value === undefined) done(notFound(opts));else if (opts.keys && opts.values) done(null, { key: key, value: value });else if (opts.keys) done(null, key);else done(null, value);
    });
    // Stream fallback (roughly 50% slower, due to tick deferral?)
  } else if (typeof db.createReadStream === 'function') {
      done = once(done);

      db.createReadStream(opts).on('data', done.bind(null, null)).on('error', done).on('end', function () {
        if (!done.called) done(notFound(opts));
      });
    } else {
      var err = new Error('level-probe: no iterators or streams available on db');
      setImmediate(done.bind(null, err));
    }
}

probe.key = function (db, opts, done) {
  var defs = { values: false };

  if (typeof opts === 'function') done = opts, opts = defs;else opts = opts ? _extends({}, opts, defs) : defs;

  probe(db, opts, done);
};

probe.value = function (db, opts, done) {
  var defs = { keys: false };

  if (typeof opts === 'function') done = opts, opts = defs;else opts = opts ? _extends({}, opts, defs) : defs;

  probe(db, opts, done);
};

module.exports = probe;

function notFound(opts) {
  var range = [];['gt', 'gte', 'lt', 'lte'].forEach(function (opt) {
    if (opt in opts) range.push(opt + ': ' + stringify(opts[opt]));
  });

  return new NotFoundError('No result in range { ' + range.join(', ') + ' }');
}

function stringify(v) {
  return v === undefined ? 'undefined' : JSON.stringify(v);
}