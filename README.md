# `reschema`

Idempotent schema declaration for rethinkdb. Instead of running migrations, define the table structure and indexes. 

It won't remove tables, indexes, or data. It only adds tables and indexes you don't already have. You have to change index names and delete tables outside of the declarative model. 

The goal of this project is to get up and running quickly. Define what you need, and run the schema as part of your bootstrap step. 

### Example

```js
const reschema = require("reschema")

const schema = reschema(db => {
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

schema.run(connection)
```

And the output.

```sh
$ node schema.js

CREATE database `test4`
CREATE table `artists`
CREATE table `orders`
CREATE   index `artist_id`
CREATE   index `customer_id`
CREATE table `customers`
CREATE   index `email`
CREATE table `posters`

$ node schema.js

EXISTS database `test4`
EXISTS table `artists`
EXISTS table `orders`
EXISTS   index `artist_id`
EXISTS   index `customer_id`
EXISTS table `customers`
EXISTS   index `email`
EXISTS table `posters`
```
