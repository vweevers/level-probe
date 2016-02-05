# level-probe

**Get the first result in a range, using an [iterator](https://github.com/vweevers/level-iterator) or stream.**

[![npm status](http://img.shields.io/npm/v/level-probe.svg?style=flat-square)](https://www.npmjs.org/package/level-probe) [![Travis build status](https://img.shields.io/travis/vweevers/level-probe.svg?style=flat-square&label=travis)](http://travis-ci.org/vweevers/level-probe) [![AppVeyor build status](https://img.shields.io/appveyor/ci/vweevers/level-probe.svg?style=flat-square&label=appveyor)](https://ci.appveyor.com/project/vweevers/level-probe) [![Dependency status](https://img.shields.io/david/vweevers/level-probe.svg?style=flat-square)](https://david-dm.org/vweevers/level-probe)

## example

```js
const probe = require('level-probe')
const disk = require('test-level')({ clean: true })

const db = disk()

db.batch([
  { key: 'a', value: 'value a' },
  { key: 'b', value: 'value b' },
  { key: 'c', value: 'value c' }
], function(err) {
  probe(db, { gte: 'b' }, function(err, kv){
    console.log(kv)
  })

  probe.value(db, { lt: 'x', reverse: true }, function(err, val){
    console.log(val)
  })

  probe(db, { gt: 'd', lt: 'x' }, function(err){
    console.log(err.message)
    console.log(err.notFound)
  })
})
```

Output:

```
{ key: 'b', value: 'value b' }
value c
No result in range { gt: "d", lt: "x" }
true
```

## `probe(db, [opts], callback)`

- If `opts.iterate` is `false`, `level-probe` will use a stream. If `true`, it will use an iterator or throw if iterators are not available. If not specified, it will prefer iterators and fall back to streams.
- Other options are passed to [level-iterator](https://github.com/vweevers/level-iterator) or `db.createReadStream()`

## `probe.key(db, [opts], callback)`

Shortcut to `probe(db, { values: false }, callback)`.

## `probe.value(db, [opts], callback)`

Shortcut to `probe(db, { keys: false }, callback)`.

## install

With [npm](https://npmjs.org) do:

```
npm install level-probe
```

## license

[MIT](http://opensource.org/licenses/MIT) © Vincent Weevers
