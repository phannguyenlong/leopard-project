/**
 * File for directing routes for server
 * @author Phan Nguyen Long
 */
const express = require("express")
const router = express.Router()

// api route
const authRoute = require("./authRoutes")
const ledgerRoute = require("./ledgerRoutes")
const netwrokRoute = require("./networkRoutes")


router.use('/auth', authRoute)
router.use('/ledger', ledgerRoute)
router.use('/network', netwrokRoute)

module.exports = router