/**
 * File for ledger route (interact with ledger)
 * @author Lam Xuan Bach, Hieu
 */
const express = require("express")
const router = express.Router()

const { Gateway } = require('fabric-network');
const { createContract } = require('../util/WebUtil.js');
const chaincodeName = "assembly_line"

router.get('/queryAll', async function (req, res) {
    const gateway = new Gateway()

    try {
        // get contract from the network
        const contract = await createContract(gateway, chaincodeName, req.cookies.session)
        // test
        console.log("GET ALL ASSESTS")
        let data = await contract.evaluateTransaction('GetAllProduct')
        res.status(200).json(JSON.parse(data.toString()))
        
    } catch (err) {
        console.error("error: " + err)
        res.redirect('/login')
    } finally {
        gateway.disconnect()
    }
})

router.get("/queryByKey", async function (req, res) {
    let key = req.query.id // get param from request
    console.log(key)
})

module.exports = router