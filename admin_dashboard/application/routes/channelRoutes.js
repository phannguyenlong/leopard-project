/**
 * Route for org admin
 * @author Phan Nguyen Long
 */

const express = require("express")
const router = express.Router()
const { getLoginUser, getChannelConfig, buildChannelObject } = require("../util/WebUtil")

router.get("/getChannelInfo", (req, res) => {
    const user = getLoginUser()[req.cookies.session]
    if (user && user.channelName) {
        let channel = buildChannelObject(getChannelConfig()[user.channelName])
        let orderer = channel.orderer
        let data = {channelName : user.channelName}
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

router.post("/submitProposal", function (req, res) {
    const user = getLoginUser()[req.cookies.session]
    console.log(user)
    if (user && user.channelName) {
        let data = req.body

        console.log(req.body)
        res.sendStatus(200)
    } else {
        res.sendStatus(403) // unauthorzied
    }
})


module.exports = router