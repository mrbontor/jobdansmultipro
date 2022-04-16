const bodyParser = require('body-parser')
const express = require('express')

const env = process.env.ENV || 'development'

const mongo = require(__dirname + '/libs/db/mongoDriver')
const app = express()

// Initialize config file
require('dotenv').config();

process.env.TZ = 'Asia/Jakarta'

let dataMongo = {
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASS,
    host: process.env.MONGO_HOST,
    // port: process.env.MONGO_PORT,
    database: process.env.MONGO_DB,
    interval: process.env.MONGO_INTERVAL
}


// Initialize mongo connection
mongo.init(dataMongo)
mongo.ping( (err, res) => {
    if (err) return console.error(JSON.stringify(err.stack))

    if ( ! res.ok)
    return console.error(`[MONGO] CONNECTION NOT ESTABLISHED. Ping Command not returned OK`)

    console.info(`[MONGO] CONNECTION ESTABLISHED`)
});

app.use( (err, req, res, next) => {
    if (err) {
        console.error('[MIDDLEWAREERROR] ' + JSON.stringify(err));
        let response = {
            errors: [err.message]
        };
        res.status(500).json(response);
    } else {
        next();
    }
});

//setup CORS
const allowCrossDomain = (req, res, next) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Origin", "*");
    // res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-access-token, Authorization, tdid');
    res.header("Access-Control-Allow-Methods", "POST, GET,PUT, OPTIONS, DELETE, PATCH");
    // next()
    if (req.method == "OPTIONS") {
        res.sendStatus(200)
    }else{
        next();
    }
};
//enable CORS
app.use(allowCrossDomain);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const verifyToken = require(__dirname + `/services/middleware`)
app.use(verifyToken)

const routes = require(__dirname + '/router');
routes.setup(app);

const port = process.env.PORT || 4000;
app.listen(port);
console.info('[APP] API STARTED on ' + port);
