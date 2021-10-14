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

// api/auth
router.use('/auth', authRoute)

// api/auth
router.use('/ledger', ledgerRoute)

// api/network
// this route is for root admin only
router.use('/network', function (req, res, next) {
    let user = getLoginUser()[req.cookies.session]
    if (user && user.isRootAdmin) next() // allow RootAdmin
    else res.redirect('/login.html?message=Root admin only')
}, netwrokRoute)

router.use("/channel", function (req, res, next) {
    
})

module.exports = router