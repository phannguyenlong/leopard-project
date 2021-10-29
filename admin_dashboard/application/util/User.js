/**
 * Class for holding information about 1 login user
 * @author Phan Nguyen Long
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
        for (let i = 0; i < serverConfig.rootAdmins.length; i++) {
            if (this.username == serverConfig.rootAdmins[i].username && password == serverConfig.rootAdmins[i].password ) {
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
                    this.chaincodeName = channel
                    this.wallet = await buildWallet(Wallets, WalletDir + channel)
                    this.organization = peers[i].orgName
                }
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

    async createContract(gateway, session) {
        try {
            await gateway.connect(this.ccp, {
                wallet: this.wallet,
                identity: session,
                discovery: {enabled: true, asLocalhost: true}
            })
            // creat hyperfleger network instance
            const network = await gateway.getNetwork(this.channelName)
            // get contract from the network
            return network.getContract(this.chaincodeName)
        } catch (err) {
            console.error(err)
        }
    }

    async regsiterClient(username, password, session) {
        let adminIdentity = await this.wallet.get(session)
        const provider = this.wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, this.username);
        let secret
        try {
            secret = await this.getCAClient.register({
                // affiliation: affiliation,
                enrollmentID: username,
                enrollmentSecret: password,
                maxEnrollments: 1, // 1 enrollment only
                role: 'client'
            }, adminUser);
        } catch (err) {
            throw err
        } 
        return secret
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

    get getNormalizeOrg() {
        return this.organization.replace(" ", ".").toLowerCase();
    }
    
    get getNormalizeChannel() {
        return this.channelName.replace(" ", ".").toLowerCase()
    }
}

exports.User = User