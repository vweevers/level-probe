const probe = require('./')
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
