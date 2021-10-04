/**
 * File for login/logout routes for the server
 * @author Phan Nguyen Long
 */

const express = require("express")
const router = express.Router()

router.get('/', async function (req, res) {
    res.send("hello")
})

module.exports = router

