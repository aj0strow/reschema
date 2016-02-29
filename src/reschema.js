var r = require("rethinkdb")
var bluebird = require("bluebird")
var _ = require("lodash")
var colors = require("colors/safe")
var util = require("util")



var CREATE = colors.green("CREATE")
var EXISTS = colors.blue("EXISTS")

var report = function (created, message) {
  if (created) {
    console.log(CREATE, message)
  } else {
    console.log(EXISTS, message)
  }
}



module.exports = function (f) {
  var db = new Database()
  if (_.isFunction(f)) {
    f.call(db, db)
  }  
  return db
}



function Database () {
  this.tables = []
}

Database.prototype = {
  table: function (name, options, f) {
    if (_.isFunction(options)) {
      f = options
    }
    if (!_.isPlainObject(options)) {
      options = null
    }
    var table = new Table(name, options)
    this.tables.push(table)
    if (_.isFunction(f)) {
      f.call(table, table)
    }
    return table
  },
  
  run: function (connection) {
    var self = this
    if (!connection.db) {
      throw new Error("please specify database")
    }
    return r.dbList().contains(connection.db).do(function (exists) {
      return r.branch(exists, {dbs_created: 0}, r.dbCreate(connection.db))
    }).run(connection)
    .then(function (result) {
      report(result.dbs_created, util.format("database `%s`", connection.db))
    })
    .then(function () {
      return bluebird.map(self.tables, function (table) {
        return table.run(connection)
      }, {concurrency: 1})
    })
  },
}



function Table (name, options) {
  this.name = name
  this.options = options || {}
  this.indexes = []
}

Table.prototype = {
  run: function (connection) {
    var self = this    
    return r.tableList().contains(self.name)
      .do(function (exists) {
        return r.branch(exists, {tables_created: 0}, r.tableCreate(self.name, self.options))
      }).run(connection)
    .tap(function () {
      return r.table(self.name).wait().run(connection)
    })
    .then(function (result) {
      report(result.tables_created, util.format("table `%s`", self.name))
    })
    .then(function () {
      return bluebird.map(self.indexes, function (index) {
        return index.run(connection, self)
      })
    })
  },
  
  index: function (name) {
    var index = new Index(name)
    this.indexes.push(index)
  },
}



function Index (name) {
  this.name = name
}

Index.prototype = {
  run: function (connection, table) {
    var self = this
    var t = r.table(table.name)
    
    return t.indexList().contains(self.name).do(function (exists) {
      return r.branch(exists, {created: 0}, t.indexCreate(self.name))
    }).run(connection)
    .tap(function () {
      return t.indexWait(self.name).run(connection)
    })
    .then(function (result) {
      report(result.created, util.format("  index `%s`", self.name))
    })
  },
}
