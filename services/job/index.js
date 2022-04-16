const fs = require('fs');
const apiRequest = require('../../libs/request');

const SUCCESS               = 200
const BAD_REQUEST           = 400
const NOT_FOUND             = 404
const SERVER_ERROR          = 500

const USER_COLLECTION       = 'user'

const API      = process.env.API_DANSMULTIPRO || `http://dev3.dansmultipro.co.id/api/`

module.exports = {
    getJobs: async (req, res) => {
        let results = {}
        try {

            let search = req.query.search || null
            let description = req.query.description || null
            let location = req.query.location || null
            let isFulltime = req.query.full_time || null
            let jobID = req.query.jobID || null



            let pageSize = parseInt(req.query.page) || 1;
            let pageNumber = parseInt(req.query.page) ||  1;

            //for autocomplete
            let query = {}
            let options = [{ $sort: { name: 1 } }]

            if (search !== null) query.search = search
            if (description !== null) query.description = description
            if (location !== null) query.location = location
            if (isFulltime !== null) query.full_time = isFulltime

            let getData = await apiRequest.get(API + `recruitment/positions.json`, query)
            console.debug(`[GET][JOBS] >>>>> ${JSON.stringify(getData)}`)
            if (getData.length === 0) {
                results.message = `No data found`
                return res.status(404).send(results);
            }
            res.send(getData)
        } catch (e) {
            console.error(`[GET][JOBS] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    },

    getJob: async (req, res) => {
        let results = {}
        try {
            let jobID = req.params.jobID || null
            if (jobID === null) {
                results.message = "Data Not found!"
                return results;
            }

            let getData = await apiRequest.get(API + `recruitment/positions/${jobID}`)
            console.debug(`[GET][JOB][DETAIL] >>>>> ${JSON.stringify(getData)}`)
            res.send(getData)
        } catch (e) {
            console.error(`[GET][JOB][DETAIL] >>>>> ${JSON.stringify(e.stack)}`)
            results.message = 'Something went wrong, please try again!'
            res.status(SERVER_ERROR).send(results)
        }
    }
};
