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
const { buildCCPOrg, buildWallet } = require("../../../test-application/javascript/AppUtil")
const { enrollUser } = require('../../../test-application/javascript/CAUtil.js');

const WalletDir = path.join(__dirname, "../wallet/")
const SERVER_CONFIG =  path.join(__dirname, "../../server-config/server-config.json")

class User {
    constructor(username) {
        // TODO: add LFI prevention here
        this.username = username
        this.wallets = {} // list of wallet that map with channelName (e.g {channelName: wallet})
    }

    async buildUser() {
        let file = fs.readFileSync(SERVER_CONFIG)
        let serverConfig = JSON.parse(file.toString())

        // check if admin or not
        this.isAdmin = serverConfig.rootAdmins.includes(this.username)
        // get list of channel
        for (let channel in serverConfig.channels) {
            let accounts = serverConfig.channels[channel]
            for (let i = 0; i < accounts.length; i++) {
                if (accounts[i].id === this.username) {
                    this.organization = accounts[i].organization
                        .replace(" ", ".")
                        .toLowerCase(); // normalize
                    
                    // build wallet
                    this.wallets[channel] = await buildWallet(Wallets, WalletDir + channel)
                }
            }
        }

        // build other datas
        if (Object.keys(this.wallets).length > 0) {
            this.ccp = buildCCPOrg(this.organization)
            this.orgConfig =
                this.ccp.organizations[
                Object.keys(this.ccp.organizations).find(
                    (key) => key.toLowerCase() === this.organization.toLowerCase()
                )
                ];
        }
    }

    // will enroll indentity of user to all wallet that user belong to
    async enrollUser(usernanme, password, label) {
        for (let channel in this.wallets) {
            await enrollUser(this.getCAClient, this.wallets[channel], this.orgConfig.mspid, usernanme, password, label)
        }
    }

    async unEnrollUser(session) {
        for (let channel in this.wallets) {
            this.wallets[channel].remove(session)
        }
    }

    async getWallet(channelName) {
        return this.wallets[channelName]
    }

    async createContact(gateway, chaincodeName, session, channelName) {
        try {
            await gateway.connect(this.ccp, {
                wallet: this.wallets[channelName],
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
        let ca = this.orgConfig.certificateAuthorities[0]
    	const caInfo = this.ccp.certificateAuthorities[ca]; //lookup CA details from config
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        return caClient
    }
}

exports.User = User