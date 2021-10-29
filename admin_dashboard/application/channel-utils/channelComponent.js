/**
 * For creating component node inside the channel (peer and CA, orderer and CA)
 * @author Phan Nguyen Long
 */

const yaml = require("js-yaml")
const fs = require("fs")
const shell = require('shelljs');
const { chdir } = require('process');

// config
const NETWORK_PATH = __dirname + "/../../../leopard-network" // path to network
const UTIL_PATH = __dirname // for comback to this file

module.exports.test = async function test() {
    shell.exec("pwd")
    console.log(__dirname)
}

/**
 * Peer CA using 2 port:
 *  - port: ca orderer listen address
 *  - 1`port`: ca oredere operation address
 * Peer Using 3 port:
 *  - peerPort = port + 1: listen port for peer
 *  - peerPort + 1: peer chaincode address
 *  - 1`peerPort`:  Peer operation listenaddress
 * CouchDB use 1 port
 *  - couchDBport = port + 3
 */
module.exports.creatPeerAndCA =  async function creatPeerAndCA(peer) {
    organization = peer.getNormalizeOrg // normalize data
    channel = peer.getNormalizeChannel // normalize data

    let file = fs.readFileSync(NETWORK_PATH + "/sample/test-docker-compose-ca.yaml")
    let yamlFile = yaml.load(file.toString());

    // add volumn for peer
    yamlFile.volumes[`peer.${organization}`] = null
    
    //=================For CA====================
    let caDockerConfig = yamlFile.services["ca.server"]

    // general config
    caDockerConfig.container_name = `ca.${organization}` // set container name
    caDockerConfig.volumes = [`../../organizations/${channel}/fabric-ca-server/ca-${organization}:/etc/hyperledger/fabric-ca-server`] // mount points arrays
    caDockerConfig.command = `sh -c 'fabric-ca-server start -b ${peer.caAdmin}:${peer.caPassword} -d'` // lauch with username and password
    caDockerConfig.ports = [`${peer.caPort}:${peer.caPort}`, `${peer.caOperationPort}:${peer.caOperationPort}`]

    // add enviroment variable to caConfig
    let caEnvConfig = [
      `FABRIC_CA_SERVER_CA_NAME=ca-${organization}`,
      `FABRIC_CA_SERVER_PORT=${peer.caPort}`,
      `FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS=0.0.0.0:${peer.caOperationPort}`,
    ];
    caDockerConfig.environment = caDockerConfig.environment.concat(caEnvConfig)

    // save file
    yamlFile.services[`ca.${organization}`] = caDockerConfig
    delete yamlFile.services["ca.server"]

    //=================For Peer====================
    let peerDockerConfig = yamlFile.services["peer.server"]
    let peerPort = peer.peerPort // peer run at port 1 higher than orderer

    //general config
    peerDockerConfig.container_name = `peer.${organization}`
    peerDockerConfig.ports = [`${peerPort}:${peerPort}`, `${peer.peerOperationPort}:${peer.peerOperationPort}`] 

    let peerEnvConfig = [
        `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=nft-network`,
        `CORE_PEER_ID=peer.${organization}`,
        `CORE_PEER_ADDRESS=peer.${organization}:${peerPort}`,
        `CORE_PEER_LISTENADDRESS=0.0.0.0:${peerPort}`,
        `CORE_PEER_CHAINCODEADDRESS=peer.${organization}:${peer.chainCodePort}`, // chaincode at 1 higher port than peer
        `CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${peer.chainCodePort}`,
        `CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer.${organization}:${peerPort}`,
        `CORE_PEER_GOSSIP_BOOTSTRAP=peer.${organization}:${peerPort}`,
        `CORE_PEER_LOCALMSPID=${organization}.msp`,
        `CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:${peer.peerOperationPort}`,
        `CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp/user/admin/msp`,
        `CORE_LEDGER_STATE_STATEDATABASE=CouchDB`,
        `CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb.${organization}:5984`, // mapp with internal couchDB address (not localhost)
        `CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=${peer.caAdmin}`,
        `CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=${peer.caPassword}`
    ]
    peerDockerConfig.environment = peerDockerConfig.environment.concat(peerEnvConfig)

    let peerVolumn = [
        `../../organizations/${channel}/peerOrganizations/${organization}/peers/peer-${organization}/msp:/etc/hyperledger/fabric/msp`,
        `../../organizations/${channel}/peerOrganizations/${organization}/peers/peer-${organization}/tls:/etc/hyperledger/fabric/tls`,
        `peer.${organization}:/var/hyperledger/production`
    ]
    peerDockerConfig.volumes = peerDockerConfig.volumes.concat(peerVolumn)
    // peerDockerConfig.depends_on = `couchdb.${organization}`
    // save file
    yamlFile.services[`peer.${organization}`] = peerDockerConfig
    delete yamlFile.services["peer.server"]

    //===========================For CouchDB============================
    let couchDBConfig = yamlFile.services["couchdb"]
    couchDBConfig.container_name = `couchdb.${organization}`
    couchDBConfig.environment = [
        `COUCHDB_USER=${peer.caAdmin}`,
        `COUCHDB_PASSWORD=${peer.caPassword}`
    ]
    couchDBConfig.ports = [`${peer.couchdbPort}:5984`] // use to expose couchDB port to outside (5984 is operation port of couchDB)

    // save file
    yamlFile.services[`couchdb.${organization}`] = couchDBConfig
    delete yamlFile.services["couchdb"]

    // save to file
    let filePath = NETWORK_PATH + `/docker/${channel}`
    if (!fs.existsSync(filePath)) { // if note create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/ca_peer-compose-${organization}.yaml`, yaml.dump(yamlFile, { lineWidth: -1 }))

    // run shell
    let username = peer.caAdmin
    let password = peer.caPassword
    shell.env["PATH"] = UTIL_PATH + "/../../../bin/:" + shell.env["PATH"] // set env
    shell.exec(`bash -c 'cd ${NETWORK_PATH}/scripts; ./upPeerAndCA.sh ${organization} ${username} ${password} ${peer.caPort} ${peer.peerAdmin} peer${peer.peerPassword} ${channel}; cd ${UTIL_PATH}; pwd'`)
    chdir(UTIL_PATH) // then set it again to prevent error

    await generateCCPforOrg(peer.getNormalizeOrg, peer.peerPort, peer.caPort, peer.getNormalizeChannel)
}

/**
 * Ordere CA using 2 port:
 *  - port: ca orderer listen address
 *  - 1`port`: ca oredere operation address
 * Orderer Using 3 port:
 *  - ordererPort = port + 1: listen port for orderer
 *  - ordererPort + 1: Ordere_admin port use for tool osnadmin
 *  - 1`ordererPort`:  Orderer operation listenaddress
 */
module.exports.createOrdererAndCA = async function createOrdererAndCA(orderer) {
    organization = orderer.getNormalizeOrg; // normalize data
    channel = orderer.getNormalizeChannel; // normalize data

    let file = fs.readFileSync(NETWORK_PATH + "/sample/orderer-docker-compose.yaml")
    let yamlFile = yaml.load(file.toString());

    // add volumn for peer
    yamlFile.volumes[`orderer.${organization}`] = null

    //=================For CA====================
    let caDockerConfig = yamlFile.services["ca.orderer"]

    // general config
    caDockerConfig.container_name = `ca.orderer.${organization}` // set container name
    caDockerConfig.volumes = [`../../organizations/${channel}/fabric-ca-server/ca.orderer-${organization}:/etc/hyperledger/fabric-ca-server`] // mount points arrays
    caDockerConfig.command = `sh -c 'fabric-ca-server start -b ${orderer.caAdmin}:${orderer.caPassword} -d'` // lauch with username and password
    caDockerConfig.ports = [`${orderer.caPort}:${orderer.caPort}`, `${orderer.caOperationPort}:${orderer.caOperationPort}`] // set port

    // add enviroment variable to caConfig
    let caEnvConfig = [
      `FABRIC_CA_SERVER_CA_NAME=ca.orderer-${organization}`,
      `FABRIC_CA_SERVER_PORT=${orderer.caPort}`,
      `FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS=0.0.0.0:${orderer.caOperationPort}`,
    ];
    caDockerConfig.environment = caDockerConfig.environment.concat(caEnvConfig)

    // save file
    yamlFile.services[`ca.orderer.${organization}`] = caDockerConfig
    delete yamlFile.services["ca.orderer"]

    //=================For Orderer====================
    let ordererDockerConfig = yamlFile.services["orderer.server"]

    // general config
    ordererDockerConfig.container_name = `orderer.${organization}` // set container name
    ordererDockerConfig.ports = [
      `${orderer.ordererPort}:${orderer.ordererPort}`,
      `${orderer.ordererOperationPort}:${orderer.ordererOperationPort}`,
      `${orderer.ordererAdminPort}:${orderer.ordererAdminPort}`, //  port for ORDERER admin listnet addres
    ];

    let ordererEnv = [
        `ORDERER_GENERAL_LISTENADDRESS=0.0.0.0`,
        `ORDERER_GENERAL_LISTENPORT=${orderer.ordererPort}`,
        `ORDERER_GENERAL_LOCALMSPID=orderer.${organization}.msp`,
        `ORDERER_ADMIN_LISTENADDRESS=0.0.0.0:${orderer.ordererAdminPort}`, // rememeber to connect this port when use osnadmin tool
        `ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:${orderer.ordererOperationPort}`
    ]
    ordererDockerConfig.environment = ordererDockerConfig.environment.concat(ordererEnv)

    let ordererVolumn = [
        `\${PWD}/../../channel-artifacts/${channel}/genesis_block.pb:/var/hyperledger/orderer/orderer.genesis.block`,  // use absolute path for prevent error from docker
        `../../organizations/${channel}/ordererOrganizations/${organization}/orderers/orderer-${organization}/msp:/var/hyperledger/orderer/msp`,
        `../../organizations/${channel}/ordererOrganizations/${organization}/orderers/orderer-${organization}/tls/:/var/hyperledger/orderer/tls`,
        `orderer.${organization}:/var/hyperledger/production/orderer`
    ]

    ordererDockerConfig.volumes = ordererVolumn

    yamlFile.services[`orderer.${organization}`] = ordererDockerConfig
    delete yamlFile.services["orderer.server"]

    // save to file
    let filePath = NETWORK_PATH + `/docker/${channel}`
    if (!fs.existsSync(filePath)) { // if note create new
        fs.mkdirSync(filePath, { recursive: true });
    }
    fs.writeFileSync(filePath + `/orderer-compose-${organization}.yaml`, yaml.dump(yamlFile, { lineWidth: -1 }))

    // run shell
    shell.env["PATH"] =  UTIL_PATH + "/../../../bin/:" + shell.env["PATH"] // commennt this if alread set env
    shell.exec(`bash -c 'cd ${NETWORK_PATH}/scripts; ./upOrdererAndCA.sh ${organization} ${orderer.caAdmin} ${orderer.caPassword} ${orderer.caPort} ${orderer.ordererAdmin} ${orderer.ordererPassword} ${channel}; cd ${UTIL_PATH}; pwd'`)
    chdir(UTIL_PATH) // then set it again to prevent error
}

function generateCCPforOrg(organization, peerPort, caPort, channel) {
    organization = organization.replace(" ", ".").toLowerCase(); // normalize data

    let file = fs.readFileSync( NETWORK_PATH + "/sample/ccp-template.json")
    let ccp = JSON.parse(file.toString())
    let tlsCACerts = fs.readFileSync(NETWORK_PATH + `/organizations/${channel}/peerOrganizations/${organization}/msp/tlscacerts/tls-localhost-${caPort}-ca-${organization.replace(".", "-")}.pem`).toString()

    // console.log(tlsCACerts)

    // general config
    ccp.client.organization = organization
    ccp.name = `nft-network-${organization}`

    // config organizations
    ccp.organizations[`${organization}`] = {
        mspid: `${organization}.msp`,
        peers: [`peer.${organization}`],
        certificateAuthorities: [`ca.${organization}`]
    }

    // config peer of that org
    ccp.peers[`peer.${organization}`] = {
        url: `grpcs://localhost:${peerPort}`,
        tlsCACerts: {
            pem: tlsCACerts
        },
        grpcOptions: {
            "ssl-target-name-override": `peer.${organization}`,
            "hostnameOverride": `peer.${organization}`
        }
    }

    // config orderer of that org
    ccp.certificateAuthorities[`ca.${organization}`] = {
        url: `https://localhost:${caPort}`,
        caName: `ca-${organization}`,
        tlsCACerts: {
            pem: [tlsCACerts]
        },
        httpOptions: {
            verify: false
        }
    }
    // console.log(ccp.certificateAuthorities)
    fs.writeFileSync(NETWORK_PATH + `/organizations/${channel}/peerOrganizations/${organization}/connection-${organization}.json`, JSON.stringify(ccp))
}