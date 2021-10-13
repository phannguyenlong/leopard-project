/**
 * Class for holding information about 1 login user
 * should these attribute
 * - ccp (common connection prodfile)
 * - organizaiton 
 * - affiliation (affiliation of that user inside organizaiton eg. org1.department1)
 * - channel (channel that user belong to) this should be an array
 * - wallet holding a wallet of that user
 */
const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const {buildCCPOrg, buildWallet} = require("../util/AppUtils")
const { enrollUser } = require('../util/CAUtils');

const WalletDir = path.join(__dirname, "../wallet/")
const SERVER_CONFIG =  path.join(__dirname, "../../server-config/server-config.json")

class User {
    constructor() {}

    async enrollUser(usernanme, password, label) {
        let file = fs.readFileSync(SERVER_CONFIG)
        let serverConfig = JSON.parse(file.toString())
        this.username = usernanme

        // check if admin or not
        // this.isRootAdmin = serverConfig.rootAdmins.includes(this.username)
        for (let i = 0; i < serverConfig.rootAdmins; i++) {
            if (this.username === serverConfig.rootAdmins[i].username && password === serverConfig.rootAdmins[i].password ) {
                this.isRootAdmin = true;
                return true; // if root admin dont do other thing
            }
        }
        
        // get channel name
        for (let channel in serverConfig.channels) {
            let peers = serverConfig.channels[channel].peers
            for (let i = 0; i < peers.length; i++) {
                if (this.username === peers[i].caAdmin) {
                    this.channelName = channel
                    this.wallet = await buildWallet(Wallets, WalletDir + channel)
                    this.organization = peers[i].orgName
                }
                break;
            }
        }

        // build other datas
        if (this.wallet) {
            this.ccp = buildCCPOrg(this.organization, this.channelName)
            this.orgConfig =
                this.ccp.organizations[this.organization.toLowerCase().replace(" ", ".")];
            // enrroll user here
            await enrollUser(this.getCAClient, this.wallet, this.orgConfig.mspid, usernanme, password, label)
            return true
        }
        return false
    }

    async unEnrollUser(session) {
        this.wallet.remove(session)
    }

    async createContact(gateway, chaincodeName, session, channelName) {
        try {
            await gateway.connect(this.ccp, {
                wallet: this.wallet,
                identity: session,
                discovery: {enabled: true, asLocalhost: true}
            })
            // creat hyperfleger network instance
            const network = await gateway.getNetwork(channelName)
            // get contract from the network
            return network.getContract(chaincodeName)
        } catch (err) {
            console.error(err)
        }
    }

    get getChannelName() {
        return this.channelName
    }

    get getOrgConfig() {
        return this.orgConfig
    }

    get getCAClient() {
        console.log(this.orgConfig)
        let ca = this.orgConfig.certificateAuthorities[0]
    	const caInfo = this.ccp.certificateAuthorities[ca]; //lookup CA details from config
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        return caClient
    }
}

exports.User = User