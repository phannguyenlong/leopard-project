/**
 * File for network route for server (interact with the network)
 * @author Truong Minh Khoa, Le Vinh Nguyen
 */
const express = require("express")
const router = express.Router()

router.get('/', async function (req, res) {
    res.send("hello")
})

router.get('/show_detail' ,async function (req, res) {
    console.log(req.query.channel)
    const fs = require('fs')

    try {
    const data = fs.readFileSync('../../test-network/log/network_config.log', 'utf8').split("\n")
    var result = {}
    console.log(data)
    var org = []
    for(let i=0;i<data.length-1;i++){
        json = JSON.parse(data[i])
        orgName = json["Org"]
        channelName = json["Channel"]
        if(channelName===req.query.channel){
            org.push(orgName)
        }
        
    }
    console.log(org)
    result['channel'] = req.query.channel
    result["Org"] = org
    // result = JSON.stringify(result)
    res.json(result)
    } catch (err) {
        res.status(404).end('Not Found')
    }
})

module.exports = router