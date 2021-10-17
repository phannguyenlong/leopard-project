/**
 * File for network route for server (interact with the network)
 * @author Truong Minh Khoa, Le Vinh Nguyen
 */

 const express = require("express");
 const router = express.Router();
 var glob = require("glob")
 const fs = require("fs")
const { loadChannelConfig, generateSchema } = require("../util/WebUtil")
const { createChannel } = require("../channel-utils/channelInteract")
const { deployCC } = require("../channel-utils/deployChaincode")
const { OrdererOrganization, PeerOrganization, Channel } = require("../../application/channel-utils/Organizations")
const { creatPeerAndCA, createOrdererAndCA } = require("../channel-utils/channelComponent")
const shell = require('shelljs');

 const { spawn } = require('child_process');
// const { main } = require("../main");
 

 router.get('/getAllChannelName',async function(req,res){
    let file = fs.readFileSync(__dirname+"/../../server-config/server-config.json")
    var data = JSON.parse(file).channels
    var namesChannels = Object.keys(data)

    var output=[]
    for(let i=0;i<namesChannels.length;i++){
        let channel_name = namesChannels[i]
        let channel = {}
        channel["index"]=i+1
        channel["channelName"] = channel_name
        output.push(channel)
    }
    console.log(output)
    res.json(output)
 })

 router.get('/showChannelDetail',async function(req,res){
    var requestChannel = req.query.channel_name
    let file = fs.readFileSync(__dirname+"/../../server-config/server-config.json")
    var data = JSON.parse(file).channels
    console.log(data[requestChannel])
    var channel = data[requestChannel]
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
//  var log = ""
//  router.get("/getLog", async function (req, res) {
//     // 2 must have header
//     res.setHeader("Connection", 'keep-alive')
//     res.setHeader('Content-Type', 'text/event-stream');

//     // send data
//     for (let i = 0; i < 5; i++) {
//         console.log("run")
//         res.write(("hello")) // using res.write() to write stream
//         await sleep(1000) // wait 1s after each line after each stream
//     }
//     res.end()
// })

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
router.post("/createChannel", async function (req, res) {
    let dataInput = req.body.channel
    let schemaInput = req.body.schema
    let file = fs.readFileSync(__dirname+"/../../server-config/server-config.json")
    var data = JSON.parse(file).channels
    var oldChannelNames = Object.keys(data)

    var oldPorts = []
    var oldOrgNames = []
    for(let i=0;i<oldChannelNames.length;i++){
        var oldChannel = data[oldChannelNames[i]]
        var orderer = oldChannel["orderer"]
        oldPorts.push(orderer["ordererPort"])
        oldOrgNames.push(orderer["orgName"])

        var peers = oldChannel["peers"]
        for(let j=0;j<peers.length;j++){
            oldPorts.push(peers[j]["peerPort"])
            oldOrgNames.push(peers[j]["orgName"])
        }

    }
    console.log(oldPorts)
    console.log(oldOrgNames)
    console.log(oldChannelNames)
    if(oldChannelNames.indexOf(dataInput[0]["channel_name"])==-1){
        var peers = []
        var orderer;
        console.log(dataInput)
        var isError=false
        for(let i=0;i<dataInput.length;i++){
            if(oldOrgNames.indexOf(dataInput[i]["Org_name"]) !=-1){
                res.status(500).send(` Name: ${dataInput[i]["Org_name"]} has existed `)
                isError=true
                break
            }
            if(oldPorts.indexOf(parseInt(dataInput[i]["port_number"])) !=-1){
                res.status(500).send(` Port: ${dataInput[i]["port_number"]} has existed `)
                isError=true
                break
            }
            if(dataInput[i]["isOrderer"]==true){
                orderer=new OrdererOrganization(dataInput[i]["Org_name"],dataInput[i]["CA_username"],dataInput[i]["CA_password"],
                                                dataInput[i]["peer_username"],dataInput[i]["peer_password"],dataInput[i]["channel_name"],parseInt(dataInput[i]["port_number"]))
            }
            else{
                peers.push(new PeerOrganization(dataInput[i]["Org_name"],dataInput[i]["CA_username"],dataInput[i]["CA_password"],
                dataInput[i]["peer_username"],dataInput[i]["peer_password"],dataInput[i]["channel_name"],parseInt(dataInput[i]["port_number"])))
            }
        }
        if(isError==false){
            let channel = new Channel(dataInput[0]["channel_name"],orderer,peers)
            // await main(orderer,peers,channel)
            res.setHeader("Connection", 'keep-alive')
            res.setHeader('Content-Type', 'text/event-stream');
            await createOrdererAndCA(orderer)
            await sleep(100)
            res.write(orderer.orgName)
            // create peer
            for (let i = 0; i < peers.length; i++) {
                await creatPeerAndCA(peers[i])
                await sleep(100)
                res.write(peers[i].orgName)

            }

            // join channel
            await createChannel(channel)
            await sleep(100)
            res.write("Channel")
            await sleep(100)
            await deployCC(channel.channelName,"admin_dashboard/chaincode/admin-chaincode")
            res.write("Deploy")
            console.log(peers, orderer, channel)
            
            // update channelList
            loadChannelConfig() // load channel config file

            // creat schema config
            let schema = { titles: [], required: [] }
            for (let i = 0; i < schemaInput.length; i++) {
                let field = schemaInput[i]
                schema.titles.push({ name: field.title, type: field.type })
                if (field.isRequired) schema.required.push(field.title)
            }
            generateSchema(dataInput[0]["channel_name"], schema)

            // res.sendStatus(200)
            res.end()
        }
    }
    else{
        res.sendStatus(500).send("Channel name has existed")
    }
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

router.get('/downChannel',async function(req,res){
    var channel = req.query.channel_name
    let file = JSON.parse(fs.readFileSync(__dirname+"/../../server-config/server-config.json"))
    var data = file.channels
    console.log(data[channel])
    delete data[channel]
    file["channels"] = data
    console.log(file)
    fs.writeFileSync(__dirname+"/../../server-config/server-config.json",JSON.stringify(file, null, 4)) // more redable json

    const NETWORK_PATH = __dirname + "/../../../leopard-network"
    const UTIL_PATH = __dirname+"/../" // for comback to this file
    shell.exec("pwd")
    shell.exec(`bash -c 'cd ${NETWORK_PATH}/scripts; ./downComponent.sh channel ${channel}; cd ${UTIL_PATH};pwd; exit'`)
    
    res.redirect("http://localhost:8080/admin/")

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