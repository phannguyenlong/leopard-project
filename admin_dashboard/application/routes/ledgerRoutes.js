/**
 * File for ledger route (interact with ledger)
 * @author Lam Xuan Bach, Hieu
 */
const express = require("express")
const router = express.Router()

router.get('/', async function (req, res) {
    res.send("hello")
})

module.exports = router