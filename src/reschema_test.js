var r = require("rethinkdb")
var reschema = require("./reschema")
var bluebird = require("bluebird")

var connect = function () {
  return r.connect({db: "test4"})
}

var getConnection = function () {
  return connect().disposer(connection => connection.close())
}

var withConnection = function (f) {
  return bluebird.using(getConnection(), f)
}

var schema = reschema(db => {
  db.table("artists")
  
  db.table("posters", {primaryKey: "sku"})
  
  db.table("customers", t => {
    t.index("email")
  })
  
  db.table("orders", t => {
    t.index("artist_id")
    t.index("customer_id")
  })
})

withConnection(connection => {
  return schema.run(connection)
})
