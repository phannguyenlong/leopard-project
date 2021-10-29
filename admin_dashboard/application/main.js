/**
 * For initialize at phase 2
 * @deprecated
 */
const { creatPeerAndCA, createOrdererAndCA } = require("./channel-utils/channelComponent")
const { addOrg, removeOrg } = require("./channel-utils/channelConfiguration")
const {createChannel} = require("./channel-utils/channelInteract")
const { deployCC } = require("./channel-utils/deployChaincode")
const {PeerOrganization, OrdererOrganization, Channel} = require("./channel-utils/Organizations")

// exports.main = async function main(orderer, peers,channel) {
//     await createOrdererAndCA(orderer)

//     // create peer
//     for (let i = 0; i < peers.length; i++) {
//         await creatPeerAndCA(peers[i])
//     }

//     // join channel
//     await createChannel(channel)
//     await deployCC(channel.channelName,"admin_dashboard/chaincode/admin-chaincode")
// }


async function main() {
    // create mock orderer and ca
    let orderer = new OrdererOrganization("Company C", 'adminC', 'pass', 'peerC', 'pass', 'channel1', 8054)
    let peers = [
        new PeerOrganization("Company A", 'adminA', 'pass', 'peerA', 'pass', 'channel1', 6054),
        new PeerOrganization("Company B", 'adminB', 'pass', 'peerb', 'pass', 'channel1', 7054)
    ]
    let channel1 = new Channel("channel1", orderer, peers)

    // // create orderer
    // await createOrdererAndCA(orderer)

    // // create peer
    // for (let i = 0; i < peers.length; i++) {
    //     await creatPeerAndCA(peers[i])
    // }

    // // join channel
    // await createChannel(channel1)
    // await deployCC('channel1',"admin_dashboard/chaincode/admin-chaincode")

    let d = new PeerOrganization("Company D", "adminD", "pass", "peerD", "pass", "channel1", 9054)
    
    // adding
    // await creatPeerAndCA(d)
    // await addOrg(d,channel1)

    // await deployCC('channel1',"admin_dashboard/chaincode/admin-chaincode")
    // testing
    // peer chaincode query -C channel1 -n channel1 -c '{"Args":["GetAllProduct"]}'

    // remo e
    await removeOrg(d, channel1)
}
main()
