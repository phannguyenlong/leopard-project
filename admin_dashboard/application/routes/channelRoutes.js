/**
 * Route for org admin
 * @author Phan Nguyen Long
 */

const express = require("express")
const router = express.Router()
const { getLoginUser, getChannelConfig, buildChannelObject, buildPeerObject, addProposedPeer, moveProposedPeer } = require("../util/WebUtil")
const { creatPeerAndCA } = require("../channel-utils/channelComponent")
const { createConfigtx, fetchConfig, decodePBtoJSON, updateConfig, encodeJSONtoPB, deltaFinalBlock, submitConfig, PeerJoinChannel, cleanFiles, removeConfig } = require("../channel-utils/channelConfiguration")

router.get("/getChannelInfo", (req, res) => {
    const user = getLoginUser()[req.cookies.session]
    if (user && user.channelName) {
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        let orderer = channel.orderer
        let data = { channelName: user.channelName }
        data[`${orderer.getNormalizeOrg}`] = {
            org: `${orderer.getNormalizeOrg}`,
            node: `orderer.${orderer.getNormalizeOrg}:${orderer.ordererPort}`,
            caNode: `ca.orderer.${orderer.getNormalizeOrg}:${orderer.caPort}`,
            dbNode: ``
        }

        for (let i = 0; i < channel.peers.length; i++) {
            let peer = channel.peers[i]
            data[peer.getNormalizeOrg] = {
                org: `${peer.getNormalizeOrg}`,
                node: `peer.${peer.getNormalizeOrg}:${peer.peerPort}`,
                caNode: `ca.${peer.getNormalizeOrg}:${peer.caPort}`,
                dbNode: `couchdb.${peer.getNormalizeOrg}:${peer.couchdbPort}`
            }
        }

        console.log(data)
        res.status(200).json(data)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})

router.post("/submitProposalAddPeer", async function (req, res) {
    // take in new peer json
    const user = getLoginUser()[req.cookies.session]
    console.log(user)
    if (user && user.channelName) {
        let data = req.body
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        let orderer = channel.orderer
        let newPeer = buildPeerObject(data, user.channelName)
        // logic: check dupe name
        if (await channel.checkNoDupeName(newPeer)) {
            await addProposedPeer(newPeer, getChannelConfig()[user.channelName])
        } else {
            res.sendStatus(404)
            return// idk how to stop api here?
        }
        // build peerCA here
        await creatPeerAndCA(newPeer)

        await createConfigtx(newPeer) // create config of the org that want to join channel
        await fetchConfig(channel.peers[0], orderer) // use a member of the channel to fetch the config block
        await decodePBtoJSON("config_block", `${user.channelName}`)
        await updateConfig("config_block", `${newPeer.getNormalizeOrg}`, `${user.channelName}`) // update the config block by appending the json file in step 1
        await encodeJSONtoPB("config_block", `${user.channelName}`)
        await encodeJSONtoPB("modified_config", `${user.channelName}`)
        // calculate the delta and wrap it in the evelope to create the final block
        await deltaFinalBlock("config_block", "modified_config", `${user.channelName}`)
        console.log(req.body)
        res.sendStatus(200)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})

// does not work as we thought it supposed to be
router.post("/signConfig", async function (req, res) {
    // no data needed
    const user = getLoginUser()[req.cookies.session]
    if (user && user.channelName) {
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        let peer = await channel.getPeer(user.organization) // get a peer member
        let isUpdated = await submitConfig(peer, channel) // submit and attemp update (if satisfied endorsement polocy, new config is accepted)
        console.log(isUpdated)
        if (isUpdated) { // means "Successfully submitted channel update"
            // do something here 
        }
        res.sendStatus(200)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})

router.post("/joinPeer", async function (req, res) {
    // no data needed
    const user = getLoginUser()[req.cookies.session]
    if (user && user.channelName) {
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        let orderer = channel.orderer
        let peer = channel.getProposedPeer[user.organization] // get a peer member (identified by peer name)
        await PeerJoinChannel(peer, orderer) // join peer to channel
        await moveProposedPeer(peer, getChannelConfig()[user.channelName])
        // add chaincode
        await deployCC(user.channelName, "admin_dashboard/chaincode/admin-chaincode")
        await cleanFiles(channel)
        res.sendStatus(200)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})

router.delete("/submitProposalRemovePeer",async function (req, res) {
    // no data needed
    const user = getLoginUser()[req.cookies.session]
    console.log(user)
    if (user && user.channelName) {
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        let orderer = channel.orderer

        // remove peerCA here
        await fetchConfig(channel.peers[0], orderer) // use a member of the channel to fetch the config block
        await decodePBtoJSON("config_block", `${user.channelName}`)
        await removeConfig("config_block", `${user.organization.replace(" ", ".").toLowerCase()}`, `${user.channelName}`) // update the config block by appending the json file in step 1
        await encodeJSONtoPB("config_block", `${user.channelName}`)
        await encodeJSONtoPB("modified_config", `${user.channelName}`)
        res.sendStatus(200)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})

router.get("/getProposedPeer", (req, res) => {
    const user = getLoginUser()[req.cookies.session]
    if (user && user.channelName) {
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        console.log(channel.proposedPeers)
        let data = { channelName: user.channelName }

        for (let i = 0; i < channel.proposedPeers.length; i++) {
            let peer = channel.proposedPeers[i]
            data[peer.getNormalizeOrg] = {
                org: `${peer.getNormalizeOrg}`,
                node: `peer.${peer.getNormalizeOrg}:${peer.peerPort}`,
                caNode: `ca.${peer.getNormalizeOrg}:${peer.caPort}`,
                dbNode: `couchdb.${peer.getNormalizeOrg}:${peer.couchdbPort}`
            }
        }

        console.log(data)
        res.status(200).json(data)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})
// api query peer proposol
module.exports = router