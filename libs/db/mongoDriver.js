class MongoDB {
    init(database) {
        this.MongoClient = require('mongodb').MongoClient;
        this.url = `mongodb://${database.user}:${database.password}@${database.host}/${database.database}?authSource=admin`;
        this.interval = database.interval || 5000;
        this.cachedDB = null;
        this.cacheClient = null;
    }

    connect(callback = null) {
        const self = this;
        if(this.cachedDB) {
            callback(this.cachedDB, this.cacheClient);
        } else {

            let options = {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }

            let self = this

            this.MongoClient.connect(this.url, options, (err, client) => {
                // assert.equal(null, err);
                if (err) return self.reconnect(callback)

                let db = client.db()
                self.cachedDB = db;
                self.cacheClient = client;

                if (callback) {
                    callback(db, client)
                }
            })
        }
    }

    reconnect(callback = null) {
        console.log('[DB][MONGODB] Reconnecting...')

        setTimeout(() => {
            this.connect(callback)
        }, this.interval)
    }

    find(collection, document, options = null, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).find(document, options).toArray((err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    findOpt(collection, document, options= null, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).find(document, options).toArray((err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    checkData(collection, document, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).find(document).sort({created: -1}).limit(1).toArray((err, results) => {
                if (callback) {
                    callback(err, results)
                }
            });
        })
    }

    aggregate(collection, document, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).aggregate(document).toArray((err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    findOne(collection, document, options= null, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).findOne(document, options, (error, result) => {
                if (callback) {
                    callback(error, result)
                }
            })
        })
    }

    findOneAndUpdate(collection, clause, document, options, callback = null) {
        this.connect((db, client) => {
            db.collection(collection).findOneAndUpdate(clause, document, options, (err, result) => {
                if(callback) {
                    callback(err, result);
                }
            });
        });
    }

    findOneAndDelete(collection, clause, options, callback = null) {
        this.connect((db, client) => {
            db.collection(collection).findOneAndDelete(clause, options, (err, result) => {
                if(callback) {
                    callback(err, result);
                }
            });
        });
    }

    findLast(collection, document, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).find(document).sort({'_id':-1}).limit(1).toArray((err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    insertOne(collection, document, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).insertOne(document, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    insertMany(collection, document, option= {}, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).insertMany(document, option, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    updateOne(collection, clause, document, options = {}, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).updateOne(clause, document, options, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    updateOneWithOpt(collection, clause, document, option = {}, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).updateOne(clause, document, option, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    updateMany(collection, clause, document, option = {}, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).updateMany(clause, document, option, (err, results) => {
                if (callback) {
                    callback(err, results)
                }

            })
        })
    }

    removeFields(collection, clause, document, option, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).updateOne(clause, document, option, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    replaceOne(collection, clause, document, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).replaceOne(clause, document, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    deleteOne(collection, document, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).deleteOne(document, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    bulkWrite(collection, operation, option, callback = null) {
        this.connect( (db, client) => {
            db.collection(collection).bulkWrite(operation, option, (err, results) => {
                if (callback) {
                    callback(err, results)
                }
            })
        })
    }

    ping( callback = null) {
        this.connect( (db, client) => {
            db.admin().ping((err, res) => {
                if (callback) {
                    callback(err, res)
                }
            })
        })
    }

}

module.exports = new MongoDB()
