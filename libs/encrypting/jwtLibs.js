const JWT = require('jsonwebtoken');
const TOKEN_SECRET          = process.env.APP_TOKEN_SECRET
const TOKEN_EXPIRY          = process.env.APP_TOKEN_EXPIRED
const REFRESH_TOKEN_SECRET  = process.env.APP_REFRESH_TOKEN_SECRET
const REFRESH_TOKEN_EXPIRY  = process.env.APP_REFRESH_TOKEN_EXPIRED

const ISSUER                = 'dansmultipro.com'

const signAccessToken = (payload) => {
    return new Promise((resolve, reject) => {
        let options = {
            expiresIn: TOKEN_EXPIRY,
            issuer: ISSUER,
            audience: ISSUER,
        }
        JWT.sign({data: payload}, TOKEN_SECRET, options, (err, token) => {
            if (err) reject(err)

            resolve(token)
        })
    });
}

const verifyAccessToken = (token) => {
    return new Promise((resolve, reject) => {
        JWT.verify(token, TOKEN_SECRET, (err, payload) => {
            if (err) {
                reject(err)
            }

            resolve(payload)
        })
    });
}

const signRefreshToken = (payload) => {
    return new Promise((resolve, reject) => {
        let options = {
            expiresIn: REFRESH_TOKEN_EXPIRY,
            issuer: ISSUER,
            audience: ISSUER,
        }
        JWT.sign({data: payload}, REFRESH_TOKEN_SECRET, options, (err, token) => {
            if (err) reject(err)

            resolve(token)
        })
    });
}

const verifyRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        JWT.verify(token, REFRESH_TOKEN_SECRET, (err, payload) => {
            if (err) {
                reject(err)
            }

            resolve(payload)
        })
    });
}

const updateAccessToken = (payload) => {
    return new Promise((resolve, reject) => {
        let options = {
            expiresIn: 0,
            issuer: ISSUER,
            audience: ISSUER,
        }
        JWT.sign({data: payload}, TOKEN_SECRET, options, (err, token) => {
            if (err) reject(err)

            resolve(token)
        })
    });
}

const updateRefreshToken = (payload) => {
    return new Promise((resolve, reject) => {
        let options = {
            expiresIn: 0,
            issuer: ISSUER,
            audience: userID,
        }
        JWT.sign({data: payload}, REFRESH_TOKEN_SECRET, options, (err, token) => {
            if (err) reject(err)

            resolve(token)
        })
    });
}


module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    updateAccessToken,
    updateRefreshToken
};
