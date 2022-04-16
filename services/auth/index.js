const fs = require('fs');
const { v4: uuidv4} = require('uuid');
const validate = require('../../libs/validateSchema');
const db = require('../../libs/db/mongoPromise');
const { verifyHashPassword, encrypt , decrypt} = require('../../libs/encrypting/AEAD');
const dayjs = require('dayjs');
const {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken
} = require('../../libs/encrypting/jwtLibs');

const SIGNIN = JSON.parse(fs.readFileSync(__dirname + '/schema/signin.json'))

const SUCCESS               = 200
const SUCCESS_NO_CONTENT    = 204
const BAD_REQUEST           = 400
const UNAUTHORIZED          = 401
const ACCESS_FORBIDDEN      = 403
const NOT_FOUND             = 404
const UNPROCESSABLE_ENTITY  = 422
const SERVER_ERROR          = 500

const USER_COLLECTION       = 'user'

const signIn = async (req, res)  => {
    let results = {}
    try {
        let payload = await validate(req.body, SIGNIN)
        console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(payload)}`)
        if (payload.length > 0) {
            results.message = 'Validation Error'
            results.errors = payload
            return res.status(BAD_REQUEST).send(results);
        }

        let findUser = await db.findOne(USER_COLLECTION, {username: payload.username} )
        console.debug(`[CHECK][INFO][USER] >>>>> ${JSON.stringify(findUser)}`)
        if (null === findUser) {
            results.message = `Login failed, we dont know who you are...`
            return res.status(NOT_FOUND).send(results);
        }

        let isPasswordValid = await verifyHashPassword(
            findUser.password.hash,
            findUser.password.salt,
            findUser.password.iterations,
            payload.password
        )
        console.debug(`[CHECK][PASSWORD] >>>>> ${JSON.stringify(isPasswordValid)}`)
        if (!isPasswordValid) {
            results.message = 'Incorect Password or Username'
            return res.status(UNAUTHORIZED).send(results);
        }

        const uidToken = uuidv4()

        let dataPayload = {
            userID: findUser._id.toString(),
            username: findUser.username,
            uid: uidToken
        }
        console.debug(`[NEW][PAYLOAD] >>>>> ${JSON.stringify(dataPayload)}`)
        const token = await generateToken(dataPayload, findUser._id.toString(), uidToken)
        if (!token) {
            results.message = 'Invalid Token'
            return res.status(UNAUTHORIZED).send(results);
        }

        res.status(SUCCESS).send({
            message: 'Login Success.',
            data: token
        })

    } catch (e) {
        console.error(`[SIGNIN][ERROR] >>>>> ${JSON.stringify(e.stack)}`)
        results.message = 'Server Internal Error'
        res.status(SERVER_ERROR).send(results)
    }
}

const refreshToken = async (req, res)  => {
    let results = {}

    let refreshToken = req.body.refreshToken || null
    if (null === refreshToken) {
        results.message = 'RefreshToken is required'
        return res.status(BAD_REQUEST).send(results);
    }
    try {
        let isTokenRefreshValid = await verifyRefreshToken(refreshToken)
        console.debug(`[VERIFY][REFRESH][TOKEN] >>>>> ${JSON.stringify(isTokenRefreshValid)}`)
        if (!isTokenRefreshValid || isTokenRefreshValid.message == 'jwt expired') {
            results.message = 'Token Expired'
            return res.status(UNAUTHORIZED).json(results)
        }

        let payloadDecrypted = JSON.parse(decrypt(isTokenRefreshValid.data))
        console.debug(`[TOKEN][PAYLOAD] >>>>> ${JSON.stringify(payloadDecrypted)}`)
        if (!payloadDecrypted) {
            results.message = 'RefreshToken is not valid'
            return res.status(BAD_REQUEST).send(results);
        }

        let findUser = await db.findOne(USER_COLLECTION, { "token.uid": payloadDecrypted.uid } )
        console.debug(`[GET][USERNAME] >>>>> ${JSON.stringify(findUser[0].employee)}`)
        if (null !== findUser) {
            results.message = 'Invalid Token'
            return res.status(UNAUTHORIZED).send(results);
        }

        let dataPayload = {
            userID: findUser._id.toString(),
            username: findUser.username
        }

        const encryptedPayload = encrypt(dataPayload)
        console.debug(`[ENCRYPTED][PAYLOAD] >>>>> ${JSON.stringify(encryptedPayload)}`)
        const newToken = await signAccessToken(encryptedPayload)
        console.debug(`[GENERATE][ACCESS]TOKEN] >>>>> ${JSON.stringify(newToken)}`)

        res.status(SUCCESS).send({
            message: 'Success.',
            data: newToken
        });
    } catch (e) {
        console.error(`[REFRESH][TOKEN][ERROR] >>>>> ${JSON.stringify(e.message)}`)
        // console.error(`[REFRESH][TOKEN][ERROR] >>>>> ${JSON.stringify(e.stack)}`)
        if(e.message == 'jwt expired') {
            let clause = {"token.deviceID": deviceID}
            const dataSet = {
                $pull: {
                    token: { deviceID: deviceID}
                }
            }
            //remove token id from the db
            await db.updateOne(USER_COLLECTION, clause, dataSet)
        }
        results.message = 'Invalid Token'
        return res.status(UNAUTHORIZED).send(results);
    }
}

const signOut = async (req, res)  => {
    let results = {}
    try {
        let payload = await validate(req.body, SIGNOUT)
        console.debug(`[CHECK][PAYLOAD] >>>>> ${JSON.stringify(payload)}`)
        if (payload.length > 0) {
            results.message = 'Validation Error'
            results.errors = payload
            return res.status(BAD_REQUEST).send(results);
        }

        let isTokenRefreshValid = await verifyRefreshToken(payload.refreshToken)
        console.debug(`[VERIFY][REFRESH][TOKEN] >>>>> ${JSON.stringify(isTokenRefreshValid)}`)
        if (!isTokenRefreshValid || isTokenRefreshValid.message == 'jwt expired') {
            results.message = 'Token Expired'
            return res.status(UNAUTHORIZED).json(results)
        }

        let payloadDecrypted = JSON.parse(decrypt(isTokenRefreshValid.data))
        console.debug(`[TOKEN][PAYLOAD] >>>>> ${JSON.stringify(payloadDecrypted)}`)
        if (!payloadDecrypted) {
            results.message = 'RefreshToken is not valid'
            return res.status(BAD_REQUEST).send(results);
        }

        let query = {_id: db.ObjectId(payload.userID)}
        const findUser = await db.findOne(USER_COLLECTION, query)
        console.debug(`[IDENTIFY][USER] >>>>> ${JSON.stringify(findUser)}`)


        const now = dayjs()
        const clause = { _id: db.ObjectId(payload.userID)}
        const options = { upsert: false, returnDocument: 'after'}
        const dataSet = {
            $set: { modified: now.format()},
            $pull: {
                token: { uid: payloadDecrypted}
            }
        }

        const update = await db.findAndUpdate(USER_COLLECTION, clause, dataSet, options)
        console.debug(`[REMOVE][REFRESH][TOKEN] >>>>> ${JSON.stringify(update)}`)

        res.status(SUCCESS_NO_CONTENT)
    } catch (e) {
        console.error(`[SIGNIN][ERROR] >>>>> ${JSON.stringify(e.stack)}`)
        results.message = 'Server Internal Error'
        res.status(SERVER_ERROR).send(results)
    }
}

const generateToken = async (payload, userID, uid )=> {
    try {

        const encryptedPayload = encrypt(payload)
        console.debug(`[ENCRYPTED][PAYLOAD] >>>>> ${JSON.stringify(encryptedPayload)}`)
        const accessToken = await signAccessToken(encryptedPayload)
        console.debug(`[GENERATE][ACCESS]TOKEN] >>>>> ${JSON.stringify(accessToken)}`)

        const refreshToken = await signRefreshToken(encrypt({uid: uid}))
        console.debug(`[GENERATE][REFRESH]TOKEN] >>>>> ${JSON.stringify(refreshToken)}`)

        const now = dayjs()

        let clause = { _id: db.ObjectId(userID) }

        const findUser = await db.findOne(USER_COLLECTION, clause)
        console.debug(`[IDENTIFY][USER] >>>>> ${JSON.stringify(findUser)}`)

        let filterToken = []
        if (typeof findUser.token !== "undefined") {
            filterToken = findUser.token.filter(el => el.uid === uid)
        }

        // console.error(`[FILTER][TOKEN] >>>>> ${JSON.stringify(filterToken)}`)
        if (filterToken.length > 0) {

            clause["token.uid"] = uid

            await db.updateOne(USER_COLLECTION,
                clause,
                {
                    $set: {
                        modified: now.format(),
                        "token.$.uid": uid,
                        "token.$.expireAt": now.add(1, 'day').format()
                    }
                }
            )

            return { accessToken, refreshToken };
        }

        const options = { upsert: false, returnDocument: 'after'}
        const dataSet = {
            $set: { modified: now },
            $push: {
                token: {
                    uid: uid,
                    expireAt: now.add(1, 'day').format()
                }
            }
        }

        const update = await db.findAndUpdate(USER_COLLECTION, clause, dataSet, options)
        if (update) {
            return { accessToken, refreshToken };
        }
    } catch (e) {
        console.error(`[GENERATE][TOKEN] >>>>> ${JSON.stringify(e.stack)}`)
        return false;
    }
}

const extractPayload = async (req, res) => {
    let results = { message: 'Invalid Token' }
    try {
        if (!req.headers['authorization']) return res.status(UNAUTHORIZED).json(results)

        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]

        const isTokenValid = await verifyAccessToken(token, process.env.APP_TOKEN_SECRET)
        console.info(`[VERIFY][TOKEN] >>>>> ${JSON.stringify(isTokenValid)}`)
        if (!isTokenValid || isTokenValid.message == 'jwt expired') {
            results.message = 'Token Expired'
            return res.status(UNAUTHORIZED).json(results)
        }

        let payloadDecrypted = JSON.parse(decrypt(isTokenValid.data))
        console.debug(`[TOKEN][PAYLOAD] >>>>> ${JSON.stringify(payloadDecrypted)}`)
        if(!payloadDecrypted) return results

        payloadDecrypted.expireAt = dayjs(isTokenValid.exp * 1000).format('YYYY-MM-DD hh:mm:ss')

        const query = { _id: db.ObjectId(payloadDecrypted.userID) }
        const options = {
            projection: {
                _id: 1,
                username: 1,
                name: 1
            }
        }

        const findUser = await db.findOne(EMPLOYEE_COLLECTION, query, options)
        console.debug(`[VALIDATE][USER] >>>>> ${JSON.stringify(findUser)}`)
        if (!findUser) {
            results.message = 'Who are you !!?'
            return res.status(ACCESS_FORBIDDEN).json(results)
        }

        res.send(findUser);
    } catch (e) {
        console.error(`[EXTRAC][TOKEN][PAYLOAD] >>>>> ${JSON.stringify(e.message)}`)
        // if something goes wrong, remove all token
        if(e.message == 'jwt expired' && uid) {
            const clause = {"token.uid": uid}
            const dataSet = {
                $set: {
                    token: []
                }
            }
            await db.updateOne(USER_COLLECTION, clause, dataSet)
        }
        return res.status(UNAUTHORIZED).json(results);
    }
}

module.exports = { signIn , refreshToken, signOut, extractPayload}
