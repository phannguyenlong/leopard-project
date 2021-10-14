/**
 * File for network route for server (interact with the network)
 * @author Truong Minh Khoa, Le Vinh Nguyen
 */

 const express = require("express");
 const router = express.Router();
 var glob = require("glob")
 const fs = require("fs")
 const {getChannelConfig, getLoginUser} = require("../util/WebUtil")
 const { spawn } = require('child_process');
 

 router.get('/getAllChannelName',async function(req,res){
    var namesChannels = glob.sync("../../leopard-network/docker/*")
    var output=[]
    for(let i=0;i<namesChannels.length;i++){
        let channel_name = namesChannels[i].split("/")
        let channel = {}
        channel["index"]=i+1
        channel["channelName"] = channel_name[channel_name.length-1]
        output.push(channel)
    }
    console.log(output)
    res.json(output)
 })

 router.get('/showChannelDetail',async function(req,res){
    var requestChannel = req.query.channel_name
    var channelConfig = getChannelConfig()
    var channel = channelConfig[requestChannel]
    var orderer = channel["orderer"]
    var peers = channel["peers"]

    var outputOrderer = {}
    outputOrderer["orgName"]=orderer["orgName"]
    outputOrderer["port"]="localhost:"+orderer["ordererPort"]

    var outputPeers = []
    for(let i=0;i<peers.length;i++){
        let outputPeer = {}
        outputPeer["orgName"] = peers[i]["orgName"]
        outputPeer["port"] = "localhost:"+peers[i]["peerPort"]
        outputPeers.push(outputPeer)
    }

    output={}
    output["channelName"] = channel["channelName"]
    output["orderer"] = outputOrderer
    output["peers"] = outputPeers

    console.log(output)
    res.json(output)
 })
 
 router.get('/getChannelStatus', async function (req, res) {
    console.log("Channel Status")
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
     res.json(channelStatuses);
         
     
 })
 
 router.get('/show_detail' ,async function (req, res) {
     console.log(req.query.channel)
 
     try {
     const data = fs.readFileSync('../../test-network/log/network_config.log', 'utf8').split("\n")
     var result = {}
     var org = []
     for(let i=0;i<data.length-1;i++){
         json = JSON.parse(data[i])
         orgName = json["Org"]
         channelName = json["Channel"]
         if(channelName===req.query.channel){
             org.push(orgName)
         }
         
     }
     result['channel'] = req.query.channel
     result["Org"] = org
     // result = JSON.stringify(result)
     res.json(result)
     } catch (err) {
         res.status(404).end('Not Found')
     }
 })
 
 router.get('/getOrgStatus' ,async function (req, res) {
     const { execSync } = require('child_process');
 
     const all = execSync('docker ps -a --format ‘{{.Names}}’', { encoding: 'utf-8' });
     allNames = all.split("\n");
 
     const states = execSync('docker ps -a --format ‘{{.State}}’', { encoding: 'utf-8' });
     allStates = states.split("\n");
 
     const ports = execSync('docker ps -a --format ‘{{.Ports}}’', { encoding: 'utf-8' });
     allPorts = ports.split("\n");
 
    
     var result = {}
     for(let i=0;i<allNames.length;i++){
         if(String(allNames[i]).slice(1,5) == "peer"){
             var element = {}
             console.log(allStates[i].slice(1, allStates[i].length-1))
             element["state"] = allStates[i].slice(1, allStates[i].length-1)
             if(allStates[i].slice(1, allStates[i].length-1) !=="exited"){
                dataPort = String(allPorts[i]).split(",")
                element["peer_port"] = dataPort[0].slice(1,dataPort[0].length)
                element["operation_port"] = dataPort[dataPort.length -2].slice(1,dataPort[dataPort.length -2].length)
             }
             else{
                element["peer_port"] = "N/a"
                element["operation_port"] = "N/a"
             }
             result[allNames[i].slice(1,allNames[i].length -1)] =element

 
         }
     }
     res.json(result)
 })
 
 module.exports = router