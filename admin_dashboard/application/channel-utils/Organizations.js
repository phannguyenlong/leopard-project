const fs = require("fs")

class Organization {
    constructor(orgName, caAdmin, caPassword, channelName, caPort) {
        this.orgName = orgName
        this.caAdmin = caAdmin
        this.caPassword = caPassword
        this.channelName = channelName
        this.caPort = caPort
        this.caOperationPort = `1${caPort}`
    }

    // use for getting org name like company.c
    get getNormalizeOrg() {
        return this.orgName.replace(" ", ".").toLowerCase();
    }
    
    get getNormalizeChannel() {
        return this.channelName.replace(" ", ".").toLowerCase()
    }
}

class PeerOrganization extends Organization {
    constructor(orgName, caAdmin, caPassword, peerAdmin, peerPassword, channelName, portNumber) {
        super(orgName, caAdmin, caPassword, channelName, portNumber)
        this.peerAdmin = peerAdmin
        this.peerPassword = peerPassword
        this.peerPort = portNumber + 1
        this.peerOperationPort = `1${this.peerPort}`
        this.chainCodePort = this.peerPort + 1
        this.couchdbPort = portNumber + 3
        this.peerMSPID = `${this.getNormalizeOrg}.msp`
    }
}

class OrdererOrganization extends Organization {
    constructor(orgName, caAdmin, caPassword, ordererAdmin, ordererPassword, channelName, portNumber) {
        super(orgName, caAdmin, caPassword, channelName, portNumber)
        this.ordererAdmin = ordererAdmin
        this.ordererPassword = ordererPassword
        this.ordererPort = portNumber + 1
        this.ordererOperationPort = `1${this.ordererPort}`
        this.ordererAdminPort = this.ordererPort + 1 // use by onsadmin
        this.ordererMSPID = `orderer.${this.getNormalizeOrg}.msp`
    }
}

class Channel {
    // need the 4th parameter
    //constructor(channelName, orderer, peers, proposedPeers) {
    constructor(channelName, orderer, peers) {
        this.channelName = channelName
        this.orderer = orderer
        this.peers = [] // it is a array
        this.proposedPeers = [] // array of peers not yet in channel
        this.peers = peers
        //this.proposedPeers = proposedPeers // 4th parameter
    }

    get getNormalizeChannel() {
        return this.channelName.replace(" ", ".").toLowerCase()
    }

    set addPeer(peer) {
        this.peers.push(peer)
    }
    // use to save channel config to file
    async exportConfig() {
        let filePath = __dirname + "/../../server-config/server-config.json"
        let configFile = JSON.parse(fs.readFileSync(filePath).toString())

        // export current channel config to file
        configFile.channels[this.channelName] = { ...this }

        // save back to file
        fs.writeFileSync(filePath, JSON.stringify(configFile, null, 4)) // null, 4 this for beauty
    }

    async addProposedPeers(peer) {
        this.proposedPeers.push(peer)
    }
    async moveProposedPeer(peer) {
        for (var iteration = 0; iteration < this.proposedPeers.length; iteration++) {
            if (this.proposedPeers[iteration].orgName == peer.orgName) {
                this.proposedPeers.splice(iteration, 1)
            }
        }
        await this.addPeer(peer)
    }
    async checkNoDupeName(peer) {
        for (let iteration = 0; iteration < this.peers.length; iteration++) {
            if (this.peers[iteration].orgName == peer.orgName) {
                return false
            }
        }
        for (let iteration = 0; iteration < this.proposedPeers.length; iteration++) {
            if (this.proposedPeers[iteration].orgName == peer.orgName) {
                return false
            }
        }
        return true
    }
    async getPeer(orgName) {
        for (let iteration = 0; iteration < this.peers.length; iteration++) {
            console.log(this.peers[iteration].orgName)
            if (this.peers[iteration].orgName == orgName) {
                return this.peers[iteration]
            }
        }
    }
    async getProposedPeer(orgName) {
        for (let iteration = 0; iteration < this.peers.length; iteration++) {
            if (this.proposedPeers[iteration].orgName == orgName) {
                return this.proposedPeers[iteration]
            }
        }
    }
}


// exports.Organization = Organization
exports.PeerOrganization = PeerOrganization
exports.OrdererOrganization = OrdererOrganization
exports.Channel = Channel