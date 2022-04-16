const fs = require('fs');
const { verifyAccessToken } = require('../../libs/encrypting/jwtLibs');
const { decrypt } = require('../../libs/encrypting/AEAD');
const db = require('../../libs/db/mongoPromise');


const TOKEN_SECRET                  = process.env.APP_TOKEN_SECRET
const USER_COLLECTION               = 'user'

const UNAUTHORIZED                  = 401
const ACCESS_FORBIDDEN              = 403

const verifyToken = async (req, res, next) => {
    let results = { message: 'Invalid Token' }
    try {
        console.info(`[HTTP][URL] <<<<< ${JSON.stringify(req.url)}`)
        console.info(`[HTTP][METHOD] <<<<< ${JSON.stringify(req.method)}`)

        let excludeUrl = ['/api/register', '/api/auth']

        if (excludeUrl.indexOf(req.url) && req.method === "POST") {
            next()
            return ;
        }

        if (!req.headers['authorization']) return res.status(UNAUTHORIZED).json(results)

        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]

        const isTokenValid = await verifyAccessToken(token, TOKEN_SECRET)
        console.info(`[VERIFY][TOKEN][MIDDLEWARE] >>>>> ${JSON.stringify(isTokenValid)}`)
        if (!isTokenValid || isTokenValid.message == 'jwt expired') {
            results.message = 'Token Expired'
            return res.status(UNAUTHORIZED).json(results)
        }

        let payloadDecrypted = JSON.parse(decrypt(isTokenValid.data))
        console.debug(`[TOKEN][PAYLOAD] >>>>> ${JSON.stringify(payloadDecrypted)}`)
        if(!payloadDecrypted) return results

        const query = { _id: db.ObjectId(payloadDecrypted.userID)}
        const options = {
            projection: {
                _id: 1,
                username: 1,
                name: 1
            }
        }
        const findUser = await db.findOne(USER_COLLECTION, query, options)
        console.debug(`[VALIDATE][USER] >>>>> ${JSON.stringify(findUser)}`)
        if (!findUser) {
            results.message = 'User not authorized!'
            return res.status(UNAUTHORIZED).json(results)
        }

        let finalPayload = { ...payloadDecrypted}
        console.debug(`[USER][PAYLOAD][FINAL] >>>>> ${JSON.stringify(finalPayload)}`)

        req.payload = payloadDecrypted

        next()

    } catch (e) {
        console.error(`[VERIFY][TOKEN][MIDDLEWARE] >>>>> ${JSON.stringify(e.message)}`)
        results.message = 'Token Expired'
        return res.status(UNAUTHORIZED).json(results);
    }
}

module.exports = verifyToken;
