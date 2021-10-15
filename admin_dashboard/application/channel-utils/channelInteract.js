const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const { chdir } = require('process');

// config
const NETWORK_PATH = __dirname + "/../../../leopard-network" // path to network
const UTIL_PATH = __dirname // for comback to this file

module.exports.createChannel = async function createChannel(channel) {
    let orderer = channel.orderer
    let peers = channel.peers
    let file = fs.readFileSync(NETWORK_PATH + "/sample/configtx.yaml")
    let yamlFile = yaml.load(file.toString())
    
    // build a profiles
    let configYamlFile = { Profiles: {} }
    configYamlFile.Profiles = { LeopardGenesis: {} }
    let LeopardGenesis = configYamlFile.Profiles.LeopardGenesis

    // set up Policies
    LeopardGenesis.Policies = yamlFile.Profiles.TwoOrgsApplicationGenesis.Policies

    // setup capalities
    LeopardGenesis.Capabilities = { V2_0: true }

    // set up orderer Organization
    let ordererOrg = {
        Name: `orderer.${orderer.getNormalizeOrg}`,
        ID: `orderer.${orderer.getNormalizeOrg}.msp`,
        MSPDir: `../../organizations/${orderer.getNormalizeChannel}/ordererOrganizations/${orderer.getNormalizeOrg}/msp`,
        Policies: {
            Readers: { Type: "Signature", Rule: `OR('orderer.${orderer.getNormalizeOrg}.msp.member')` },
            Writers: { Type: "Signature", Rule: `OR('orderer.${orderer.getNormalizeOrg}.msp.member')` },
            Admins: { Type: "Signature", Rule: `OR('orderer.${orderer.getNormalizeOrg}.msp.admin')` }
        },
        OrdererEndpoints: [ `orderer.${orderer.getNormalizeOrg}:${orderer.ordererPort}` ]
    }

    // set up Orderer part
    yamlFile.Orderer.Addresses = [`localhost:${orderer.ordererPort}`]
    yamlFile.Orderer.EtcdRaft = {
        Consenters: [{
            Host: 'localhost',
            Port: orderer.ordererPort,
            ClientTLSCert:
                `../../organizations/${orderer.getNormalizeChannel}/ordererOrganizations/${orderer.getNormalizeOrg}/orderers/orderer-${orderer.getNormalizeOrg}/tls/server.crt`,
            ServerTLSCert:
                `../../organizations/${orderer.getNormalizeChannel}/ordererOrganizations/${orderer.getNormalizeOrg}/orderers/orderer-${orderer.getNormalizeOrg}/tls/server.crt`,
        }]
    }
    LeopardGenesis.Orderer = yamlFile.Orderer
    LeopardGenesis.Orderer.Capabilities = { V2_0: true }
    LeopardGenesis.Orderer.Organizations = [ordererOrg]

    // setup Application part
    LeopardGenesis.Application = yamlFile.Application
    LeopardGenesis.Application.Organizations = []

    // add peer org to Application Organizations
    let peerOrgName = ""
    for (let i = 0; i < peers.length; i++) {
        let peer = peers[i]
        let peerOrg = {
            Name: `${peer.getNormalizeOrg}.msp`,
            ID: `${peer.getNormalizeOrg}.msp`,
            MSPDir: `../../organizations/${peer.getNormalizeChannel}/peerOrganizations/${peer.getNormalizeOrg}/msp`,
            Policies: {
                Readers: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.admin', '${peer.getNormalizeOrg}.msp.peer', '${peer.getNormalizeOrg}.msp.client')` },
                Writers: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.admin', '${peer.getNormalizeOrg}.msp.client')` },
                Admins: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.admin', '${peer.getNormalizeOrg}.msp.peer')` },
                Endorsement: { Type: 'Signature', Rule: `OR('${peer.getNormalizeOrg}.msp.peer', '${peer.getNormalizeOrg}.msp.admin')` }
            },
            AnchorPeers: [{Host: `peer.${peer.getNormalizeOrg}`, Port: peer.peerPort}]
        }
        peerOrgName = peerOrgName.concat(`${peer.getNormalizeOrg},`) // get name for sh script
        LeopardGenesis.Application.Organizations.push(peerOrg)
    }
    peerOrgName =  peerOrgName.substring(0, peerOrgName.length - 1); // remove last ","

    // wrtie to file
    let filePath = NETWORK_PATH + `/channel-config/${channel.getNormalizeChannel}`
    if (!fs.existsSync(filePath)) { // if note create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + "/configtx.yaml", yaml.dump(configYamlFile, { lineWidth: -1 }))

    // run shell
    shell.env["PATH"] = UTIL_PATH + "/../../../bin/:" + shell.env["PATH"] // commennt this if already set env
    shell.exec(`bash -c 'cd ${NETWORK_PATH}/scripts; ./setupChannel.sh ${orderer.getNormalizeOrg} ${orderer.ordererPort} ${orderer.getNormalizeChannel} ${peerOrgName}; cd ${UTIL_PATH}; pwd'`)
    chdir(UTIL_PATH) // then set it again to prevent error

    // export config file
    await channel.exportConfig()
}

module.exports.downChannel = async function downChannel(channel) {
    shell.exec(`bash -c 'cd ${NETWORK_PATH}/scripts; ./downComponent.sh peer ${channel.getNormalizeChannel}; cd ${UTIL_PATH}; pwd'`)
    chdir(UTIL_PATH) // then set it again to prevent error
}

module.exports.downPeer = async function downPeer(peer) {
    shell.exec(`bash -c 'cd ${NETWORK_PATH}/scripts; ./downComponent.sh peer ${peer.getNormalizeChannel} ${peer.getNormalizeOrg}; cd ${UTIL_PATH}; pwd'`)
    chdir(UTIL_PATH) // then set it again to prevent error
}