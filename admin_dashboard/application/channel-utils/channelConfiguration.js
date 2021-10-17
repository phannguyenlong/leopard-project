const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const path = require("path");
const { chdir, cwd } = require('process');
/*const { PeerOrganization } = require('Organizations');
const { OrdererOrganization } = require('Organizations');
const { Channel } = require('Organizations');
const { create } = require("domain");
const { decode } = require("punycode");*/
// config path
let NETWORK_PATH = __dirname + "/../../../leopard-network/" // path to network
let UTIL_PATH = __dirname // for comback to this file

// Some comments on naming convention of the fetch/encode/decode file
// fetchConfig file name = config_block.pb
// decodePBtoJSON: same name, different type (.pb -> .json)
// encodeJSONtoPB: same name, different type (.json -> .pb)
// PeerJoinChannel: fetching the first (0) block: block0.block
// submitConfigDemo: after calculating the delta -> config_update.pb -> ready for submit and sign (updated to channel)

async function createConfigtx(peer) {
    shell.cp('-f', `${UTIL_PATH}/../../../config/core.yaml`, `${NETWORK_PATH}/channel-config/${peer.channelName}`)
    companyname = peer.getNormalizeOrg; // normalize data

    let jsonConfig = {
        Organizations:
            [{
                Name: `${companyname}.msp`,
                ID: `${companyname}.msp`,
                // rememeber to change when change dir     
                MSPDir: `${NETWORK_PATH}/organizations/${peer.getNormalizeChannel}/peerOrganizations/${companyname}/msp`,
                Policies:
                {
                    Readers:
                    {
                        Type: 'Signature',
                        Rule: `OR('${companyname}.msp.member' )`,
                    },
                    Writers:
                    {
                        Type: 'Signature',
                        Rule: `OR('${companyname}.msp.member')`,
                    },
                    Admins:
                    {
                        Type: 'Signature',
                        Rule: `OR('${companyname}.msp.member')`,
                    },
                    Endorsement:
                    {
                        Type: 'Signature',
                        Rule: `OR('${companyname}.msp.member')`,
                    }

                }
            }]
    }

    // wrtie to file
    let filePath = NETWORK_PATH + `/channel-artifacts/${peer.getNormalizeChannel}`
    if (!fs.existsSync(filePath)) { // if not create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/configtx.yaml`, yaml.dump(jsonConfig, { lineWidth: -1 }))
    console.log('yaml creation sucess');

    shell.env["PATH"] = NETWORK_PATH + "../bin/:" + shell.env["PATH"]
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-artifacts/${peer.getNormalizeChannel}/`
    console.log('export ok');
 
    shell.exec(`configtxgen -printOrg ${companyname}.msp > ${NETWORK_PATH}/channel-artifacts/${peer.getNormalizeChannel}/${companyname}.json`)
    console.log('JSONified success');
    chdir(filePath) // then set it again to prevent error
}

async function fetchConfig(PeerOrganization, OrdererOrganization) {
    // 2 organization objects 
    // PeerOrganization = peer object that is a member of the channel
    // OdererOrganization = orderer of the channel
    // Impersonating a member of the channel
    shell.env["PATH"] = NETWORK_PATH + "../bin/:" + shell.env["PATH"] // set path to bin
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-config/${PeerOrganization.getNormalizeChannel}` // path to configtx of the channel
    shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
    shell.env["CORE_PEER_LOCALMSPID"] = `${PeerOrganization.peerMSPID}`
    shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer.${PeerOrganization.getNormalizeOrg}/tls/ca.crt`
    shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/msp/user/admin/msp`
    shell.env["CORE_PEER_ADDRESS"] = `localhost:${PeerOrganization.peerPort}`
    // fetch the latest config block
    shell.exec(`peer channel fetch config ${NETWORK_PATH}/channel-artifacts/${OrdererOrganization.getNormalizeChannel}/config_block.pb -o localhost:${OrdererOrganization.ordererPort} -c ${OrdererOrganization.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${OrdererOrganization.getNormalizeChannel}/ordererOrganizations/${OrdererOrganization.getNormalizeOrg}/msp/tlscacerts/tls-localhost-${OrdererOrganization.caPort}-ca-orderer-${OrdererOrganization.getNormalizeOrg.replace(".", "-")}.pem"`)
    chdir(UTIL_PATH) // change back to prevent error
    console.log('fetch config block done');

}

async function decodePBtoJSON(blockName, channelName) {
    // blockName = name of the block to be encode

    shell.env["PATH"] = NETWORK_PATH + `../bin/:` + shell.env["PATH"] // set path to bin
    // Convert config block to json
    shell.exec(`configtxlator proto_decode --input ${NETWORK_PATH}/channel-artifacts/${channelName}/${blockName}.pb --type common.Block --output ${NETWORK_PATH}/channel-artifacts/${channelName}/${blockName}.json`)
    console.log(`decode ${blockName}.pb to ${blockName}.json done`);
}

async function encodeJSONtoPB(blockName, channelName) {
    // blockName = name of the block to be decode

    shell.env["PATH"] = NETWORK_PATH + `../bin/:` + shell.env["PATH"] // set path to bin
    // Convert config json back to pb
    shell.exec(`configtxlator proto_encode --input ${NETWORK_PATH}/channel-artifacts/${channelName}/${blockName}.json --type common.Config --output ${NETWORK_PATH}/channel-artifacts/${channelName}/${blockName}.pb`)
    console.log(`encode ${blockName}.pb to ${blockName}.json done`);
}

//add the org*.json to config.json
async function updateConfig(configName, companyName, channelName) {

    //shell.env["PATH"] = NETWORK_PATH + `channel-artifacts/${channelName}` + shell.env["PATH"]
    let path = NETWORK_PATH + `/channel-artifacts/${channelName}/`

    var data1 = fs.readFileSync(path + `${configName}.json`);
    var myObject1 = JSON.parse(data1);
    myObject1 = { ...myObject1.data.data[0].payload.data.config }

    fs.writeFileSync(path + `${configName}.json`, JSON.stringify(myObject1, null, 4))

    var data2 = fs.readFileSync(path + `${companyName}.json`);
    var myObject2 = JSON.parse(data2);

    myObject1.channel_group.groups.Application.groups[`${companyName}.msp`] = myObject2
    fs.writeFileSync(path + "modified_config.json", JSON.stringify(myObject1, null, 4)) //
}

//delete the org*.json to config.json
async function removeConfig(configName, companyName, channelName) {

    //shell.env["PATH"] = NETWORK_PATH + `channel-artifacts/${channelName}` + shell.env["PATH"]
    let path = NETWORK_PATH + `/channel-artifacts/${channelName}/`

    var data1 = fs.readFileSync(path + `${configName}.json`);
    var myObject1 = JSON.parse(data1);
    myObject1 = { ...myObject1.data.data[0].payload.data.config }

    fs.writeFileSync(path + `${configName}.json`, JSON.stringify(myObject1, null, 4))

    delete myObject1.channel_group.groups.Application.groups[`${companyName}.msp`]
    
    fs.writeFileSync(path + "modified_config.json", JSON.stringify(myObject1, null, 4)) //
}

async function PeerJoinChannel(PeerOrganization, OrdererOrganization) {
    // 2 organization objects 
    // PeerOrganization = peer object that is the newly joined member of the channel
    // OdererOrganization = orderer of the channel
    shell.env["PATH"] = NETWORK_PATH + `../bin/:` + shell.env["PATH"] // set path to bin

    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-config/${PeerOrganization.getNormalizeChannel}` // path to configtx of the channel
    shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
    shell.env["CORE_PEER_LOCALMSPID"] = `${PeerOrganization.peerMSPID}`
    shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/tls/ca.crt`
    shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/msp/user/admin/msp`
    shell.env["CORE_PEER_ADDRESS"] = `localhost:${PeerOrganization.peerPort}`

    // join channel by the genesis block
    // As a result of the successful channel update, the ordering service will verify that the new org can pull the genesis block and join the channel
    // If not successfully joined, the ordering service would reject this request
    shell.exec(`peer channel fetch 0 ${NETWORK_PATH}channel-artifacts/${OrdererOrganization.getNormalizeChannel}/block0.block -o localhost:${OrdererOrganization.ordererPort} -c ${OrdererOrganization.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${OrdererOrganization.getNormalizeChannel}/ordererOrganizations/${OrdererOrganization.getNormalizeOrg}/msp/tlscacerts/tls-localhost-${OrdererOrganization.caPort}-ca-orderer-${OrdererOrganization.getNormalizeOrg.replace(".", "-")}.pem"`)

    // join peer
    shell.exec(`peer channel join -b ${NETWORK_PATH}/channel-artifacts/${OrdererOrganization.getNormalizeChannel}/block0.block`)
}

async function submitConfigDemo(Channel) {
    // this function is for demo only
    // logic: all peer member of the channel will sign (approve) the change
    // Channel = channel object. Channel we want to approve the modified block
    shell.env["PATH"] = NETWORK_PATH + `../bin/:` + shell.env["PATH"] // set path to bin
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-config/${Channel.getNormalizeChannel}/`
    for (iterator = 0; iterator < Channel.peers.length; iterator++) {
        let peer = Channel.peers[iterator]

        // exported the necessary environment variables to operate as the org admin
        shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
        shell.env["CORE_PEER_LOCALMSPID"] = `${peer.peerMSPID}`
        shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${peer.getNormalizeChannel}/peerOrganizations/${peer.getNormalizeOrg}/peers/peer.${peer.getNormalizeOrg}/tls/ca.crt`
        shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${peer.getNormalizeChannel}/peerOrganizations/${peer.getNormalizeOrg}/peers/peer-${peer.getNormalizeOrg}/msp/user/admin/msp`
        shell.env["CORE_PEER_ADDRESS"] = `localhost: ${peer.peerPort}`

        // sign the update
        // might need to change path to bin for signconfigtx
        if (iterator != Channel.peers.length - 1) {
            shell.exec(`peer channel signconfigtx -f ${NETWORK_PATH}/channel-artifacts/${peer.getNormalizeChannel}/conifg_update_in_envelope.pb`)
        } else {
            // logic: the last peer sign and update 
            shell.exec(`peer channel update -f ${NETWORK_PATH}/channel-artifacts/${peer.getNormalizeChannel}/conifg_update_in_envelope.pb -o localhost:${Channel.orderer.ordererPort} -c ${Channel.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${Channel.getNormalizeChannel}/ordererOrganizations/${Channel.orderer.getNormalizeOrg}/msp/tlscacerts/tls-localhost-${Channel.orderer.caPort}-ca-orderer-${Channel.orderer.getNormalizeOrg.replace(".", "-")}.pem"`)
        }
    }
}

async function cleanFiles(Channel){
    let CLEANING_PATH = NETWORK_PATH + `/channel-artifacts/${Channel.getNormalizeChannel}/`
    fs.readdir(CLEANING_PATH, (err, files) => {
        if (err) {
            console.log(err);
        }
    
        files.forEach(file => {
            const fileDir = path.join(CLEANING_PATH, file);
    
            if (file !== 'genesis_block.pb') {
                fs.unlinkSync(fileDir);
            }
        });
    });
    
}

// write main here to demo
async function addOrg(PeerOrganization, Channel) {
    // Prerequisite: need core.yaml in channel-config/${channelName}
    shell.cp('-f', `${UTIL_PATH}/../../../config/core.yaml`, `${NETWORK_PATH}/channel-config/${Channel.getNormalizeChannel}`)
    // first create config of the org that want to join channel
    await createConfigtx(PeerOrganization)
    // // // second, use a member of the channel to fetch the config block
    await fetchConfig(Channel.peers[0], Channel.orderer)
    // // third, decode the config block
    await decodePBtoJSON("config_block", `${Channel.getNormalizeChannel}`)
    // // // fourth, update the config block by appending the json file in step 1
    await updateConfig("config_block", `${PeerOrganization.getNormalizeOrg}`, `${Channel.getNormalizeChannel}`)
    // // // // fifth, encode the 2 blocks back to pb
    await encodeJSONtoPB("config_block", `${Channel.getNormalizeChannel}`)
    await encodeJSONtoPB("modified_config", `${Channel.getNormalizeChannel}`)
    // // // // sixth, run the demo submit&sign
    await deltaFinalBlock("config_block", "modified_config", `${Channel.getNormalizeChannel}`)
    await submitConfigDemo(Channel)
    // // // join the peer into the channel
    await PeerJoinChannel(PeerOrganization, Channel.orderer)
    await cleanFiles(Channel)
}

async function removeOrg(PeerOrganization, Channel) {
    // Prerequisite: need core.yaml in channel-config/${channelName}
    shell.cp('-f', `${UTIL_PATH}/../../../config/core.yaml`, `${NETWORK_PATH}/channel-config/${Channel.getNormalizeChannel}`)
    // // First, use a member of the channel to fetch the config block
    await fetchConfig(Channel.peers[0], Channel.orderer)
    // // second, decode the config block
    await decodePBtoJSON("config_block", `${Channel.getNormalizeChannel}`)
    // // third, remove the peer.msp in the config block
    await removeConfig("config_block", `${PeerOrganization.getNormalizeOrg}`, `${Channel.getNormalizeChannel}`)
    // // fourth, encode the 2 blocks back to pb
    await encodeJSONtoPB("config_block", `${Channel.getNormalizeChannel}`)
    await encodeJSONtoPB("modified_config", `${Channel.getNormalizeChannel}`)
    await deltaFinalBlock("config_block", "modified_config", `${Channel.getNormalizeChannel}`)
    // // fifth, run the demo submit&sign
    await submitConfigDemo(Channel)
    await cleanFiles(Channel)
    
}

exports.createConfigtx = createConfigtx
exports.addOrg = addOrg
exports.removeOrg = removeOrg
exports.fetchConfig = fetchConfig
exports.decodePBtoJSON = decodePBtoJSON
exports.updateConfig = updateConfig
exports.removeConfig = removeConfig
exports.encodeJSONtoPB = encodeJSONtoPB
exports.submitConfigDemo = submitConfigDemo
exports.PeerJoinChannel = PeerJoinChannel
exports.submitConfig = submitConfig
exports.deltaFinalBlock = deltaFinalBlock
exports.cleanFiles = cleanFiles

async function submitConfig(PeerOrganization, Channel) {
    // exported the necessary environment variables to operate as the org admin
    shell.env["PATH"] = NETWORK_PATH + `../bin/:` + shell.env["PATH"] // set path to bin
    shell.env["FABRIC_CFG_PATH"] = NETWORK_PATH + `/channel-config/${PeerOrganization.getNormalizeChannel}/`
    shell.env["CORE_PEER_TLS_ENABLED"] = true // enable TLS
    shell.env["CORE_PEER_LOCALMSPID"] = `${PeerOrganization.peerMSPID}`
    shell.env["CORE_PEER_TLS_ROOTCERT_FILE"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer.${PeerOrganization.getNormalizeOrg}/tls/ca.crt`
    shell.env["CORE_PEER_MSPCONFIGPATH"] = NETWORK_PATH + `/organizations/${PeerOrganization.getNormalizeChannel}/peerOrganizations/${PeerOrganization.getNormalizeOrg}/peers/peer-${PeerOrganization.getNormalizeOrg}/msp/user/admin/msp`
    shell.env["CORE_PEER_ADDRESS"] = `localhost: ${PeerOrganization.peerPort}`
    // sign and attemp to update
    // if not enough endorsement for the policy, update is reject
    shell.exec(`peer channel update -f ${NETWORK_PATH}/channel-artifacts/${PeerOrganization.getNormalizeChannel}/conifg_update_in_envelope.pb -o localhost:${Channel.orderer.ordererPort} -c ${Channel.getNormalizeChannel} --tls --cafile "${NETWORK_PATH}/organizations/${Channel.getNormalizeChannel}/ordererOrganizations/${Channel.orderer.getNormalizeOrg}/msp/tlscacerts/tls-localhost-${Channel.orderer.caPort}-ca-orderer-${Channel.orderer.getNormalizeOrg.replace(".", "-")}.pem"`)
}

async function deltaFinalBlock(originalBlock, modifiedBlock, channelName) {
    shell.env["PATH"] = NETWORK_PATH + `../bin:` + shell.env["PATH"] // set path to bin
    // calculate the delta between these two config protobufs
    // config_update.pb is now ready to submit and sign (update the channel config)
    shell.exec(`configtxlator compute_update --channel_id ${channelName} --original ${NETWORK_PATH}/channel-artifacts/${channelName}/${originalBlock}.pb --updated ${NETWORK_PATH}/channel-artifacts/${channelName}/${modifiedBlock}.pb --output ${NETWORK_PATH}/channel-artifacts/${channelName}/config_update.pb`)

    shell.exec(`configtxlator proto_decode --input ${NETWORK_PATH}/channel-artifacts/${channelName}/config_update.pb --type common.ConfigUpdate --output ${NETWORK_PATH}/channel-artifacts/${channelName}/config_update.json`)

    let json = fs.readFileSync(`${NETWORK_PATH}/channel-artifacts/${channelName}/config_update.json`)
    let data = {
        payload: {
            header: {
                channel_header: {
                    channel_id: channelName,
                    type: 2
                }
            },
            data: {
                config_update: JSON.parse(json.toString())
            }
        }
    }
    fs.writeFileSync(`${NETWORK_PATH}/channel-artifacts/${channelName}/config_update_in_envelope.json`, JSON.stringify(data, null, 2))

    shell.exec(`configtxlator proto_encode --input ${NETWORK_PATH}/channel-artifacts/${channelName}/config_update_in_envelope.json --type common.Envelope --output ${NETWORK_PATH}/channel-artifacts/${channelName}/conifg_update_in_envelope.pb`)
}