const fs = require('fs');
const validate = require('../../libs/validateSchema');
const db = require('../../libs/db/mongoPromise');

const { genHashPassword } = require('../../libs/encrypting/AEAD');

const POST = JSON.parse(fs.readFileSync(__dirname + '/schema/post.json'))
const PUT = JSON.parse(fs.readFileSync(__dirname + '/schema/put.json'))

const SUCCESS               = 200
const CREATED               = 201
const SUCCESS_NO_CONTENT    = 204
const BAD_REQUEST           = 400
const NOT_FOUND             = 404
const UNPROCESSABLE_ENTITY  = 422
const SERVER_ERROR          = 500

const USER_COLLECTION       = 'user'
const POINT_COLLECTION      = 'point'

module.exports = {
    postUser: async (req, res) => {
        let results = {}
        try {
            let payload = await validate(req.body, POST)
            console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(payload)}`)
            if (payload.length > 0) {
                results.message = 'Validation error, please check your input data!'
                results.errors = payload
                return res.status(BAD_REQUEST).send(results);
            }

            let where = {
                name: payload.name,
                username: payload.username,
            }
            let checkExist = await db.findOne(USER_COLLECTION, where)
            console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(checkExist)}`)
            if(null !== checkExist) {
                results.message = `Username with ${payload.name} is already exist!`
                return res.status(UNPROCESSABLE_ENTITY).send(results);
            }
            let now = new Date()
            payload.password = await genHashPassword(payload.password)
            payload.createdAt = now,
            payload.updatedAt = now

            let store = await db.insertOne(USER_COLLECTION, payload)
            console.debug(`[POST][DAILYLOG][CATEGORIES] >>>>> ${JSON.stringify(store)}`)
            if (undefined === store.insertedId) {
                results.message = 'Failed when created data'
                return res.status(BAD_REQUEST).send(results);
            }

            res.sendStatus(CREATED)
        } catch (e) {
            console.error(`[POST][USERS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    getUsers: async (req, res) => {
        let results = {}
        try {
            let search = req.query.search || null
            let userID = req.query.userID || null

            //for autocomplete
            let query = {}
            let options = [{ $sort: { name: 1 } }]

            if (search !== null) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { username: { $regex: search, $options: "i" } }
                ]
            }

            let userIDs = []
            if(userID !== null) {
                userIDs = userID.replace(/\s/g, '').split(',');
            }
            if (userIDs.length > 0) {
                let ids = []
                userIDs.forEach(id => {
                    if(db.isValidId(id)) {
                        ids.push(db.ObjectId(id))
                    }
                });

                query._id = { $in: ids }
            }


            let find = await db.findAggregate(USER_COLLECTION, [
                { $match : query },

                ...options
            ])
            console.debug(`[GET][USERS] >>>>> ${JSON.stringify(find)}`)
            if (find.length === 0) {
                results.message = `No data found`
                return res.status(404).send(results);
            }
            results.message= 'Successfully!'
            results.data = find
            res.send(results)
        } catch (e) {
            console.error(`[GET][USERS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    getUser: async (req, res) => {
        let results = {}

        let userID = req.params.userID || null
        if(db.isValidId(userID) === null) {
            results.message = `No data found`
            return res.status(NOT_FOUND).send(results);
        }

        try {
            let find = await db.findOne(USER_COLLECTION, { _id: db.ObjectId(userID) })
            console.debug(`[GET][USERS] >>>>> ${JSON.stringify(find)}`)
            if (find === null) {
                results.message = `No data found`
                return res.status(404).send(results);
            }

            results.message= 'Successfully!'
            results.data = find
            res.send(results)
        } catch (e) {
            console.error(`[GET][USERS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    putUser: async (req, res) => {
        let results = {}
        try {
            let userID = req.params.userID || null
            if(db.isValidId(userID) === null) {
                results.message = 'Data not found'
                return res.status(NOT_FOUND).send(results);
            }
            let payload = await validate(req.body, POST)
            console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(payload)}`)
            if (payload.length > 0) {
                results.message = 'Validation error, please check your input data!'
                results.errors = payload
                return res.status(BAD_REQUEST).send(results);
            }


            let where = {
                _id: {$ne: db.ObjectId(userID)},
                name: payload.name,
                username: payload.username,
            }
            let checkExist = await db.findOne(USER_COLLECTION, where)
            console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(checkExist)}`)
            if(null !== checkExist) {
                results.message = `Username with ${payload.name} is already exist!`
                return res.status(UNPROCESSABLE_ENTITY).send(results);
            }

            payload.password = await genHashPassword(payload.password)
            payload.updatedAt = new Date()

            let filter = { _id: db.ObjectId(userID) }
            let data = { $set: payload }
            let options = { upsert: false, returnDocument: 'after' };

            let update = await db.findAndUpdate(USER_COLLECTION, filter, data, options)
            console.debug(`[PUT][USERS] >>>>> ${JSON.stringify(update)}`)
            if (update.value ===  null) {
                results.message = `Data not found`
                return res.status(BAD_REQUEST).send(results);
            }

            results.message= 'Successfully!'
            results.data = update.value
            res.send(results)
        } catch (e) {
            console.error(`[PUT][USERS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    deleteUser: async (req, res) => {
        let results = {}
        try {
            let userID = req.params.userID || null

            if (userID === null) {
                results.message = 'Data not found'
                return res.status(NOT_FOUND).send(results);
            }

            let remove = await db.deleteOne(USER_COLLECTION, {_id: db.ObjectId(userID)})
            console.debug(`[DELETE][USERS] >>>>> ${JSON.stringify(remove)}`)
            if (remove.deletedCount < 1) {
                results.message = 'Data not found'
                return res.status(NOT_FOUND).send(results);
            }

            res.sendStatus(SUCCESS_NO_CONTENT)
        } catch (e) {
            console.error(`[DELETE][USERS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    }
};
