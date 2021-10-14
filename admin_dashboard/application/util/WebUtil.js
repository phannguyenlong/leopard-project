/**
 * Use for storing some function
 * @author Phan Nguyen Long
 */
'use strict';

const Ajv = require("ajv");
const fs = require('fs');
const jsf = require('json-schema-faker');

let loginUser = {} // object for holding all logged in user to channel

exports.validateSchema = async function (object) {
    const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
    let file = fs.readFileSync("../server-config/mychannel_schema.json")
    const validate = ajv.compile(JSON.parse(file))

    return validate(object)
}

exports.generateFakeObject = function () {
    let file = fs.readFileSync("../server-config/mychannel_schema.json")
    jsf.option({ alwaysFakeOptionals: true, maxItems: 1 }) // fill up all field
    let object = jsf.generate(JSON.parse(file.toString()))
    return object
}

/**
 * This function is use for shareing loginUser array between routes
 * @returns list of all logged user to the server atm
 */
exports.getLoginUser = function () {
    return loginUser
}