const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const path = require("path");
const { chdir, cwd } = require('process');
var glob = require("glob")


module.exports.deployCC = async function deployCC(channelName,ccpath){
    shell.env["PATH"] =  __dirname + "/../../../bin/:" + shell.env["PATH"] // commennt this if alread set env
    shell.env["FABRIC_CFG_PATH"] = __dirname+"/../../../config/"
    console.log("-------Package Chaincode----------")
    shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh packageChaincode ${channelName} ${ccpath} ; cd ../../admin_dashboard/application/channel-utils; pwd'`)

    shell.env["CORE_PEER_TLS_ENABLED"] = true
    
    files = glob.sync("../../../leopard-network/docker/"+channelName+"/*.yaml")
    console.log(files)

    console.log("-------Install Chaincode----------")
    for(let i=0;i<files.length;i++){
        var value=await setEnv(channelName,files[i])
        if(value[1] === "peer"){
            shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh installChaincode ${value[0]} ${channelName} ; cd ../../admin_dashboard/application/channel-utils; pwd'`)
        }
    }
    console.log("---------Approve a chaincode--------")
    var ordererName=""
    var ordererPort=0
    
    for(let i=0;i<files.length;i++){
        var value=await setEnv(channelName,files[i])
        if(value[1] ==="orderer"){
            ordererName=value[0]
            ordererPort=value[2]
            orgName = String(value[0]).slice(8,String(value[0]).length)
            pemFile = glob.sync(`../../../leopard-network/organizations/${channelName}/ordererOrganizations/${orgName}/orderers/orderer-${orgName}/tls/tlscacerts/*.pem`)
            ORDERER_CA=pemFile[0]
        }
    }
    for(let i=0;i<files.length;i++){
        var value=await setEnv(channelName,files[i])
        if(value[1] === "peer"){
            ordererPort = await getPort(channelName)
            shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh approveForMyOrg  ${value[0]} ${channelName} ${ordererPort} ${ordererName} ${ORDERER_CA}; cd ../../admin_dashboard/application/channel-utils; pwd'`)
        }
    }
    console.log("---------Check commit readiness--------------")
    for(let i=0;i<files.length;i++){
        var value=await setEnv(channelName,files[i])
        if(value[1] === "peer"){
            shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh checkCommitReadiness  ${value[0]} ${channelName}; cd ../../admin_dashboard/application/channel-utils; pwd'`)
        }
    }

    console.log("--------commit definition--------------")
    // All peer, included the first peer, will copy their ca.crt to the first peer. 
    // Their crt will leave at the hyper/fabric folder of the first peer.
    count = 0
    var firstPeer = ""
    var info = ""
    for(let i=0;i<files.length;i++){
        var value=await setEnv(channelName,files[i])
        if(value[1] === "peer"){
            count+=1 
            var namePeer = String(value[0]).slice(5,String(value[0]).length)
            console.log("Value 3",value[3])
            info+=` --peerAddresses ${value[3]} --tlsRootCertFiles /etc/hyperledger/fabric/${value[0]}.crt`
            if(count==1){
                firstPeer=String(value[0])
            }
            shell.exec(`bash -c 'docker cp ${__dirname}/../../../leopard-network/organizations/${channelName}/peerOrganizations/${namePeer}/peers/peer-${namePeer}/tls/ca.crt  ${firstPeer}:/etc/hyperledger/fabric/${value[0]}.crt'` )
            // shell.exec(`bash -c 'cd ../leopard-network/scripts; ./deployCC.sh checkCommitReadiness  ${value[0]} ${channelName}; cd ../../application; pwd'`)
        }
    }
    var fs = require('fs');
    fs.writeFileSync(`${__dirname}/../../../leopard-network/tmp/info.txt`,info , function (err) {
    if (err) throw err;
    console.log('Saved!');
    });
    shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh commitChaincodeDefinition ${firstPeer} ${channelName} ${ordererPort} ${ordererName} ${info}; cd ../../admin_dashboard/application/channel-utils; pwd'`)

    console.log("--------------Query Committed ---------------")
    for(let i=0;i<files.length;i++){
        var value=await setEnv(channelName,files[i])
        if(value[1] === "peer"){
            shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh queryCommitted  ${value[0]} ${channelName}; cd ../../admin_dashboard/application/channel-utils; pwd'`)
        }
    }
    console.log("-----------Chain code init -----------------")
    shell.exec(`bash -c 'cd ../../../leopard-network/scripts; ./deployCC.sh chaincodeInvokeInit ${firstPeer} ${channelName} ${ordererPort} ${ordererName} ${info}; cd ../../admin_dashboard/application/channel-utils; pwd'`)



}
async function getPort(channelName){
    files = glob.sync("../../../leopard-network/docker/"+channelName+"/*.yaml")
    for(let i=0;i<files.length;i++){
        var value1=await setEnv(channelName,files[i])
        if(value1[1] ==="orderer"){
            ordererName=value1[0]
            ordererPort=value1[2]
            orgName = String(value1[0]).slice(8,String(value1[0]).length)
            pemFile = glob.sync(`../../../leopard-network/organizations/${channelName}/ordererOrganizations/${orgName}/orderers/orderer-${orgName}/tls/tlscacerts/*.pem`)
            ORDERER_CA=pemFile[0]
        }
    }
    return ordererPort
}

async function setEnv(channelName, file){
    file = fs.readFileSync(file)
    yamlFile = yaml.load(file.toString())
    volumeName = Object.keys(yamlFile.volumes)
    let nodeName = String(volumeName).split(".")
    typeFile = nodeName[0]
    nameFile = nodeName[1]+"."+nodeName[2] 

    var port = 0

    ordererPort = 0
    // console.log(typeFile, nameFile)
    if(typeFile = "peer"){
        environments = yamlFile.services[volumeName].environment
        for(let j = 0;j<environments.length;j++){
            var value = String(environments[j]).split("=")
            key = value[0]
            value = value[1]
            if(key == "CORE_PEER_ADDRESS"){
                port = value
            }
        }
    }

    if(typeFile = "orderer"){
        environments = yamlFile.services[volumeName].environment
        for(let j = 0;j<environments.length;j++){
            var value = String(environments[j]).split("=")
            key = value[0]
            value = value[1]
            if(key == "ORDERER_GENERAL_LISTENPORT"){
                ordererPort = value
            }
        }
    }
    return [volumeName,nodeName[0],ordererPort,port]
}

async function main(){
    await deployCC("channel1","admin_dashboard/chaincode/admin-chaincode")
}
// main()
