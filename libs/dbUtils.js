const mongodb = require('mongodb')

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
    ObjectId,
    isValidID
}
