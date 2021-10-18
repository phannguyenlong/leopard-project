/**
 * Use for storing some function
 * @author Phan Nguyen Long
 */
'use strict';

const Ajv = require("ajv");
const fs = require('fs');
const jsf = require('json-schema-faker');
const {Channel, OrdererOrganization, PeerOrganization} = require("../channel-utils/Organizations")

let loginUser = {} // object for holding all logged in user to channel
let channelList = {} // object for holding all the existing channel on the network

exports.validateSchema = async function (object, channel) {
    const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
    let file = fs.readFileSync( __dirname + `/../../server-config/${channel}_schema.json`)
    const validate = ajv.compile(JSON.parse(file))

    return validate(object)
}

exports.generateSchema = async function generateSchema(channleName, schemaObject) {
    const schema = {
		"type": "object",
		"properties": {
			"productID": {"type": "string"},
			"productType": {"type": "string"},
			"productDescription": {"type": "string"},
			"numberOfProcedure": {"type": "integer"},
			"procedures": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {}
				}
			}
		},
		"additionalProperties": false
    }
    for (let i = 0; i < schemaObject.titles.length; i++) {
        schema.properties.procedures.items.properties[schemaObject.titles[i].name] = { type: schemaObject.titles[i].type }
    }
    schema.properties.procedures.required =  schemaObject.required
    fs.writeFileSync(__dirname + `/../../server-config/${channleName}_schema.json`, JSON.stringify(schema, null, 4))
}

exports.generateFakeObject = function (channel) {
    let file = fs.readFileSync( __dirname + `/../../server-config/${channel}_schema.json`)
    jsf.option({ alwaysFakeOptionals: true, maxItems: 1 }) // fill up all field
    let object = jsf.generate(JSON.parse(file.toString()))
    return object
}

exports.loadChannelConfig = async function () {
    let file = fs.readFileSync( __dirname + "/../../server-config/server-config.json")
    channelList = JSON.parse(file).channels
}

exports.buildChannelObject = function (jsonObj) {
    let channelName = jsonObj.channelName

    let orderer = jsonObj.orderer
    let ordererObj = new OrdererOrganization(orderer.orgName, orderer.caAdmin, orderer.caPassword, orderer.ordererAdmin, orderer.ordererPassword, orderer.channelName, orderer.caPort)

    let peersObjc = [] // it is a array
    let peers = jsonObj.peers
    for (let i = 0; i < peers.length; i++) {
        peersObjc.push(new PeerOrganization(peers[i].orgName, peers[i].caAdmin, peers[i].caPassword, peers[i].peerAdmin, peers[i].peerPassword, peers[i].channelName, peers[i].caPort))
    }
    // add array for the proposed peers
    // let proposedPeersObj = []
    // let proposedPeers = jsonObj.proposedPeers
    // for (let i = 0; i < proposedPeers.length; i++) {
    //    proposedPeersObj.push(new PeerOrganization(proposedPeers[i].orgName, proposedPeers[i].caAdmin, proposedPeers[i].caPassword, proposedPeers[i].peerAdmin, proposedPeers[i].peerPassword, proposedPeers[i].channelName, proposedPeers[i].caPort))
    // }
    // return new Channel(channelName, ordererObj, peersObjc, proposedPeersObj)
    return new Channel(channelName, ordererObj, peersObjc)
}

exports.buildPeerObject = function (jsonObj, channel) {
    return new PeerOrganization(jsonObj.orgName, jsonObj.caAdmin, jsonObj.caPassword, jsonObj.peerAdmin, jsonObj.peerPassword, channel, parseInt(jsonObj.portNumber))
}
/**
 * This function is use for shareing loginUser array between routes
 * @returns list of all logged user to the server atm
 */

/**
 * This function is use for shareing loginUser array between routes
 * @returns list of all logged user to the server atm
 */
exports.getLoginUser = function () {
    return loginUser
}

/**
 * This function is use for returning all the channel config that is store in the network
 * @returns object of channel config (peer and orderer)
 */
exports.getChannelConfig = function () {
    return channelList
}