/**
 * File for network route for server (interact with the network)
 * @author Truong Minh Khoa, Le Vinh Nguyen
 */
const express = require("express")
const router = express.Router()

router.get('/', async function (req, res) {
    res.send("hello")
})

module.exports = router