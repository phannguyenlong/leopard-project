/**
 * File for network route for server (interact with the network)
 * @author Truong Minh Khoa, Le Vinh Nguyen
 */

const express = require("express");
const router = express.Router();
var glob = require("glob")
const fs = require("fs")

router.get('/getChannelStatus', async function (req, res) {

    console.log("-----------------------")
    console.log("Channel Statuses")
    channelStatuses = []
    namesChannel = glob.sync("../../test-network/log/channels/*")
    var json;
    console.log(namesChannel)
    for (let j = 0; j < namesChannel.length; j++) {
        file = namesChannel[j]
        console.log(file)
        var Status_channel = fs.readFileSync(file, 'utf8')
        console.log(Status_channel); 
        json = JSON.parse(Status_channel.substring(
            Status_channel.indexOf("{"), Status_channel.lastIndexOf("}") + 1
            ));  
        delete json["url"]; 
        delete json["consensusRelation"]; 
        delete json["height"];
        //console.log(json);
        channelStatuses.push(json);
    } 
    console.log(channelStatuses)

    res.json(channelStatuses);
        
    
})

router.get('/show_detail' ,async function (req, res) {
    console.log(req.query.channel)

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