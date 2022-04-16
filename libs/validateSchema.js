const Ajv = require("ajv")
const AjvFormats = require("ajv-formats")
const AjvErrors = require('ajv-errors')

async function isRequestValidated(request, type, allErrors = true, asyn = true) {
    const ajv = new Ajv.default({
        allErrors: allErrors,
        // jsonPointers: true,
        async: asyn,
        loopRequired: 'Infinity',
        useDefaults: true
    });
    require("ajv-keywords")(ajv, "transform")
    AjvFormats(ajv, {mode: "fast", keywords: true})
    AjvErrors(ajv)

    // ajv.addFormat("ObjectId", /^a-z\$_[a-zA-Z$_0-9]*$/)
    ajv.addFormat("ObjectId", /^[0-9a-fA-F]{24}$/)

    let valid = ajv.validate(type, request);

    let result = request
    if (!valid) {
        result = await parseErrors(ajv.errors);
    }

    return Promise.resolve(result);
}

async function parseErrors(validationErrors) {
    return validationErrors.map(el => {
        // console.error(`err1`, JSON.stringify(el));
        let param = ''
        let currentParams = el.instancePath.split('/')
        if (currentParams.length > 1) {
            param = el.instancePath +'/'+ el.params.additionalProperty
        }else if(el.instancePath === ""){
            param = el.params.missingProperty || el.params.additionalProperty
        }
        let keyword = el.keyword
        if (el.keyword == "errorMessage") {
            el.params.errors.forEach(ele => {
                // console.error(`err2`, JSON.stringify(ele));
                param = ele.params.missingProperty || ele.instancePath.slice(1)
                keyword = ele.keyword
            });
        }
        return {
            param: param,
            key: keyword,
            message: el.message
        };

    });
}

module.exports = isRequestValidated;
