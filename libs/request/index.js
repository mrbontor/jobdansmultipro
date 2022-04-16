const Axios = require('axios')

module.exports = {
    async doRequest(method, url, data = {}, options = {}) {
        console.error(url);
        let response
        try {
            const results = await httpRequest(method, url, data, options)
            //console.info(`[HTTP REQUEST]${method.toUpperCase()} IN >>>> ${JSON.stringify(results.data)}`)

            return results.data
        } catch(e) {
            console.error(`[HTTP REQUEST]${method.toUpperCase()} ERROR >>>> ${JSON.stringify(e.stack)}`)
            console.error(`[HTTP REQUEST]${method.toUpperCase()} URL >>>> ${url}`)
            console.error(`[HTTP REQUEST][ERROR]${method.toUpperCase()} STATUSCODE >>>> ${JSON.stringify(e.response.statusText)}`)
            // console.error(`[HTTP REQUEST][ERROR]${method.toUpperCase()} HEADERS >>>> ${JSON.stringify(err.response.headers)}`)
            console.error(`[HTTP REQUEST][ERROR]${method.toUpperCase()} RESULT >>>> ${JSON.stringify(e.response.data)}`)
            return false
        }
    },

    post(url, data, options) {
        return this.doRequest('post', url, data, options)
    },

    get(url, params, options) {
        return this.doRequest('get', url, params, options)
    },

    delete(url, params, options) {
        return this.doRequest('delete', url, params, options)
    },

    put(url, data, options) {
        return this.doRequest('put', url, data, options)
    },

    patch(url, data, options) {
        return this.doRequest('patch', url, data, options)
    }
}

function httpRequest(method, url, data = {}, options = {}) {
    const configs = {
        method: method,
        url: url,
        headers: options,
        maxRedirects: 5
    }
    if('get' === method) configs.params = data
    else configs.data = data

    return Axios(configs)
}
