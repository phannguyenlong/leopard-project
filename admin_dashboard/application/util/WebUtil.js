/**
 * Use for storing some function
 * @author Phan Nguyen Long
 */
'use strict';

const { Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../test-application/javascript/AppUtil.js');
const Ajv = require("ajv");
const path = require('path');
const fs = require('fs');
const jsf = require('json-schema-faker');

const walletPath = path.join(__dirname, '../wallet');
const channelName = 'mychannel';
const org1UserId = 'admin';

exports.createContract = async function (gateway, chaincodeName, indentity) {
     //================ set up part =============
    // build connection profile, which is org1
    const ccp = buildCCPOrg1() // this is client
    // set up wallet
    const wallet = await buildWallet(Wallets, walletPath)

    try {
        await gateway.connect(ccp, {
            wallet,
            identity: indentity,
            discovery: {enabled: true, asLocalhost: true}
        })

        // creat hyperfleger network instance
        const network = await gateway.getNetwork(channelName)
        // get contract from the network
        return network.getContract(chaincodeName)

    } catch (err) {
        console.error("error: " + err)
    }
}

exports.validateSchema = async function (object) {
    const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
    let file = fs.readFileSync("../../server-config/mychannel_schema.json")
    const validate = ajv.compile(JSON.parse(file))

    return validate(object)
}

exports.generateFakeObject = function () {
    let file = fs.readFileSync("../server-config/mychannel_schema.json")
    jsf.option({ alwaysFakeOptionals: true, maxItems: 1 }) // fill up all field
    let object = jsf.generate(JSON.parse(file.toString()))
    return object
}