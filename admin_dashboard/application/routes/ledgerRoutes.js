/**
 * File for ledger route (interact with ledger)
 * @author Lam Xuan Bach, Vuong Chi Hieu, Phan Nguyen Long
 */
const bodyParser = require("body-parser");
const { application } = require("express");
const express = require("express")
const router = express.Router()

const { Gateway } = require('fabric-network');
const { createContract } = require('../util/WebUtil.js');
const chaincodeName = "assembly_line"

// GET /api/ledger/queryAll
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
        res.send(500) // return error code
    } finally {
        gateway.disconnect()
    }
})

// GET /api/ledger/queryByKey
router.get("/queryByKey", async function (req, res) {
    const gateway = new Gateway()
    let key = req.query.id // get param from request
    let queryString = {
        selector: {_id: key} // put the key here to query
    }
    console.log(queryString)
    try {
        // get contract from the network
        const contract = await createContract(gateway, chaincodeName, req.cookies.session)

        console.log("GET Asset by key")
        let data = await contract.evaluateTransaction('QuerryProduct', JSON.stringify(queryString)) // remember to convert to stirng pass
        res.status(200).json(JSON.parse(data.toString()))
        
    } catch (err) {
        console.error("error: " + err)
        res.send(500)
    } finally {
        gateway.disconnect()
    }
})


// PUT /api/ledger/updateProduct
router.put("/updateProduct", async function (req, res) {
    
    //const gateway = new Gateway()
    
   //var product = req.body
        //var a = fetch('/updateProduct', body)
        console.log('Got body:', req.body);
        res.sendStatus(200);
     
    // try {
    //     // get contract from the network
    //     const contract = await createContract(gateway, chaincodeName, req.cookies.session)

    //     console.log('Got body:', req.body);
    //     let data = await contract.submitTransaction('UpdateProduct', product) // remember to convert to stirng pass
    //     res.status(200).json(JSON.parse(data.toString()))
        
    // } catch (err) {
    //     console.error("error: " + err)
    //     res.send(500)
    // } finally {
    //     gateway.disconnect()
    // }
})

// DELETE /api/ledger/DeleteValueByKey
router.delete("/deleteValueByKey", async function (req, res) {
    const gateway = new Gateway()
    let key = req.query.id // get param from request

    let queryString = {
        selector: {_id: key} // put the key here to query
    }
    console.log(queryString)
    try {
        // get contract from the network
        const contract = await createContract(gateway, chaincodeName, req.cookies.session)

        console.log("DELETE Asset by key")
        await contract.submitTransaction('DeleteProduct', key) // remember to convert to stirng pass
        res.sendStatus(200)
        
    } catch (err) {
        console.error("error: " + err)
        res.sendStatus(500)
    } finally {
        gateway.disconnect()
    }
})

// GET /api/ledger/GetProductHistory
router.get("/getProductHistory", async function (req, res) {
    const gateway = new Gateway()
    let key = req.query.id // get param from request
   
    try {
        // get contract from the network
        const contract = await createContract(gateway, chaincodeName, req.cookies.session)

        console.log("GET Product history")
        let data = await contract.evaluateTransaction('GetProductHistory', key) // remember to convert to stirng pass
        res.status(200).json(JSON.parse(data.toString()))
        
    } catch (err) {
        console.error("error: " + err)
        res.send(500)
    } finally {
        gateway.disconnect()
    }
})

module.exports = router