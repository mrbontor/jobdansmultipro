const mongo = require(__dirname + '/mongoDriver')
const mongodb = require('mongodb')

const insertOne = (collection, data) => {
    return new Promise( (resolve, reject) => {
        mongo.insertOne(collection, data, (err, result) => {
            if(err) reject (err)
            resolve(result)
        })
    })
}


const insertMany = (collection, data, options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.insertMany(collection, data, options, (err, result) => {
            if(err) reject (err)
            resolve(result)
        })
    })
}

const updateOne = (collection, clause, data, options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.updateOne(collection, clause, data, options, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}

const updateMany = (collection, clause, data,  options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.updateMany(collection, clause, data, options, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}

const find = (collection, data, options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.find(collection, data, options, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}

const findOne = (collection, data, options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.findOne(collection, data, options, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}

const findAndUpdate = (collection, clause, data, options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.findOneAndUpdate(collection, clause, data, options, (err, result) => {
            if(err) reject(err);
            resolve(result);
        });
    });
}

const findAndDelete = (collection, clause, options = {}) => {
    return new Promise( (resolve, reject) => {
        mongo.findOneAndDelete(collection, clause, options, (err, result) => {
            if(err) reject(err);
            resolve(result);
        });
    });
}

const findAggregate = (collection, data ) => {
    return new Promise( (resolve, reject) => {
        mongo.aggregate(collection, data, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}

const deleteOne = (collection, clause) => {
    return new Promise( (resolve, reject) => {
        mongo.deleteOne(collection, clause, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}

const ObjectId = (id) => {
    if (id) return new mongodb.ObjectId(id)
    else return new mongodb.ObjectId()
}

const isValidId = (id) => {
    if(mongodb.ObjectId.isValid(id)){
        if((String)(new mongodb.ObjectId(id)) === id)
            return true;
        return false;
    }
    return false;
}

module.exports = {
    insertOne,
    insertMany,
    updateOne,
    updateMany,
    find,
    findOne,
    findAndUpdate,
    findAndDelete,
    deleteOne,

    findAggregate,
    ObjectId,
    isValidId
}
