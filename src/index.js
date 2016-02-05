'use strict';

const iterator = require('level-iterator')
    , once = require('once')
    , NotFoundError = require('level-errors').NotFoundError
    , noop = function() {}

function probe(db, opts, done) {
  if (typeof opts === 'function') done = opts, opts = {}
  else if ('eq' in opts) return db.get(opts.eq, opts, done)

  opts = { keys: true, values: true, ...( opts || {} ), limit: 1 }

  if (opts.iterate !== false && !iterator.available(db)) {
    // Throw if explicitly requested
    if (opts.iterate === true) {
      throw new Error('level-probe: no iterators available on db')
    }

    opts.iterate = false
  }

  const iter = opts.iterate !== false ? iterator(db, opts) : void 0;

  if (iter) {
    iter.next(function(err, key, value){
      iter.end(noop) // Cleanup

      if (err) done(err)
      else if (key === undefined && value === undefined) done(notFound(opts))
      else if (opts.keys && opts.values) done(null, { key, value })
      else if (opts.keys) done(null, key)
      else done(null, value)
    })
  // Stream fallback (roughly 50% slower, due to tick deferral?)
  } else if (typeof db.createReadStream === 'function') {
    done = once(done)

    db.createReadStream(opts)
      .on('data', done.bind(null, null))
      .on('error', done)
      .on('end', function() {
        if (!done.called) done(notFound(opts))
      })
  } else {
    const err = new Error('level-probe: no iterators or streams available on db')
    setImmediate(done.bind(null, err))
  }
}

probe.key = function(db, opts, done) {
  const defs = { values: false }

  if (typeof opts === 'function') done = opts, opts = defs
  else opts = opts ? { ...opts, ...defs } : defs

  probe(db, opts, done)
}

probe.value = function(db, opts, done) {
  const defs = { keys: false }

  if (typeof opts === 'function') done = opts, opts = defs
  else opts = opts ? { ...opts, ...defs } : defs

  probe(db, opts, done)
}

module.exports = probe

function notFound(opts) {
  const range = []

  ;['gt', 'gte', 'lt', 'lte'].forEach(opt => {
    if (opt in opts) range.push(`${opt}: ${stringify(opts[opt])}`)
  })

  return new NotFoundError(`No result in range { ${range.join(', ')} }`)
}

function stringify(v) {
  return v === undefined ? 'undefined' : JSON.stringify(v)
}
