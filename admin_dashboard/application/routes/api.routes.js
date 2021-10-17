/**
 * File for directing routes for server
 * @author Phan Nguyen Long
 */
const express = require("express")
const {getLoginUser} = require("../util/WebUtil")
const router = express.Router()

// api route
const authRoute = require("./authRoutes")
const ledgerRoute = require("./ledgerRoutes")
const netwrokRoute = require("./networkRoutes")
const channelRoute = require("./channelRoutes")

// api/auth
router.use('/auth', authRoute)

// api/auth
router.use('/ledger', ledgerRoute)

// this route is use for org admin
router.use("/channel", channelRoute)

// api/network
// this route is for root admin only
router.use('/network', function (req, res, next) {
    let user = getLoginUser()[req.cookies.session]
    if (user && user.isRootAdmin) next() // allow RootAdmin
    else res.redirect('/login.html?message=Root admin only')
}, netwrokRoute)

// testng route deme for streaming
router.get("/test", async function (req, res) {
    // 2 must have header
    res.setHeader("Connection", 'keep-alive')
    res.setHeader('Content-Type', 'text/event-stream');

    // send data
    for (let i = 0; i < 5; i++) {
        console.log("run")
        res.write(("hello")) // using res.write() to write stream
        await sleep(1000) // wait 1s after each line after each stream
    }
    res.end()
})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router