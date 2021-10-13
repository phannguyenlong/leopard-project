const { creatPeerAndCA, createOrdererAndCA } = require("./channel-utils/channelComponent")
const {createChannel} = require("./channel-utils/channelInteract")
const {PeerOrganization, OrdererOrganization, Channel} = require("./channel-utils/Organizations")

async function main() {
    // create mock orderer and ca
    let orderer = new OrdererOrganization("Company C", 'ordererAdmin', 'ordererPassword', 'admin', 'password', 'channel1', 8054)
    let peers = [
        new PeerOrganization("Company A", 'admin', 'password', 'admin', 'password', 'channel1', 6054),
        new PeerOrganization("Company B", 'admin', 'password', 'admin', 'password', 'channel1', 7054)
    ]
    let channel1 = new Channel("channel1", orderer, peers)

    // create orderer
    await createOrdererAndCA(orderer)

    // create peer
    for (let i = 0; i < peers.length; i++) {
        await creatPeerAndCA(peers[i])
    }
    
    // join channel
    await createChannel(channel1)
    // create another channel code

    // let orderer2 = new OrdererOrganization("Company E", 'ordererAdmin', 'ordererPassword', 'admin', 'password', 'channel2', 8064)
    // let peers2 = [
    //     new PeerOrganization("Company F", 'admin', 'password', 'admin', 'password', 'channel2', 6064),
    //     new PeerOrganization("Company G", 'admin', 'password', 'admin', 'password', 'channel2', 7064)
    // ]
    // let channel2 = new Channel("channel2", orderer2, peers2)

    // // create orderer
    // await createOrdererAndCA(orderer2)

    // // create peer
    // for (let i = 0; i < peers2.length; i++) {
    //     await creatPeerAndCA(peers2[i])
    // }

    // // join channel
    // await createChannel(channel2)
}

main()
