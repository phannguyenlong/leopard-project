/**
 * File for ledger route (interact with ledger)
 * @author Lam Xuan Bach, Vuong Chi Hieu, Phan Nguyen Long
 */
const express = require("express")
const router = express.Router()
const diff = require('deep-diff')

const { Gateway } = require('fabric-network');
const { validateSchema, generateFakeObject, getLoginUser } = require('../util/WebUtil.js');

// GET /api/ledger/queryAll
router.get('/queryAll', async function (req, res) {
    let user = getLoginUser()[req.cookies.session]
    const gateway = new Gateway()

    try {
        // get contract from the network
        const contract = await user.createContract(gateway, req.cookies.session)
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
    let user = getLoginUser()[req.cookies.session]
    let queryString = {selector: {_id: { $regex: req.query.id}}}; // get key from params
    try {
        // get contract from the network
        const contract = await user.createContract(gateway, req.cookies.session)

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

// GET /api/ledger/getData
router.get("/getData", async function (req, res) {
    const gateway = new Gateway()
    let user = getLoginUser()[req.cookies.session]
    let queryString = { selector: { _id: req.query.id}}; // get param from request
    try {
        // get contract from the network
        const contract = await user.createContract(gateway, req.cookies.session)

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
    const gateway = new Gateway()
    let user = getLoginUser()[req.cookies.session]
    let data = req.body
    try {
        // get contract from the network
        const contract = await user.createContract(gateway, req.cookies.session)

        console.log("Update Product")
        await contract.submitTransaction('UpdateProduct', JSON.stringify(data)) // remember to convert to stirng pass
        res.sendStatus(200)
        
    } catch (err) {
        console.error("error: " + err)
        res.sendStatus(500)
    } finally {
        gateway.disconnect()
    }
})

// DELETE /api/ledger/DeleteValueByKey
router.delete("/deleteValueByKey", async function (req, res) {
    const gateway = new Gateway()
    let user = getLoginUser()[req.cookies.session]
    let key = req.query.id // get param from request

    try {
        // get contract from the network
        const contract = await user.createContract(gateway, req.cookies.session)

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
    let user = getLoginUser()[req.cookies.session]
    let key = req.query.id // get param from request
   
    try {
        // get contract from the network
        const contract = await user.createContract(gateway, req.cookies.session)

        console.log("GET Product history")
        let data = await contract.evaluateTransaction('GetProductHistory', key) // remember to convert to stirng pass
        data = JSON.parse(data.toString())
        let returnData = []
        
        let status = {N: "Add", E: "Edited", D: "Deleted", A: "Changes"}
        returnData[data.length - 1] = { TxId: data[0].TxId, Timestamp: data[0].Timestamp.seconds, changes: [{ status: "Created", location: '', old: '', new: '' }]}
        for (let i = 1; i < data.length; i++) {
            returnData[i-1] = {}
            let differ = diff.diff(data[i - 1].Value.procedures, data[i].Value.procedures)
            console.log(differ)
            returnData[i-1].TxId = data[i].TxId
            returnData[i-1].Timestamp = data[i].Timestamp.seconds
            returnData[i-1].changes = []
            for (let x = 0; x < differ.length; x++) {
                returnData[i-1].changes.push({
                    status: status[differ[x].kind],
                    location: differ[x].path ? differ[x].path.join("/") : '.',
                    old: differ[x].rhs, new: differ[x].lhs
                })
            }
        }

        res.status(200).json(returnData)
        
    } catch (err) {
        console.error("error: " + err)
        res.sendStatus(500)
    } finally {
        gateway.disconnect()
    }
})

// POST /api/ledger/addData
router.post("/addData", async function (req, res) {
    const gateway = new Gateway()
    let user = getLoginUser()[req.cookies.session]
    let data = req.body
    if (!validateSchema(data, user.getNormalizeChannel)) {
        res.status(500).send("Unvalid data type")
    }
    try {
        const contract = await user.createContract(gateway, req.cookies.session)
        await contract.submitTransaction('createProduct', JSON.stringify(data))
        res.status(200).send('Data added successfully')
    } catch (err) {
        console.error("error: " + err)
        res.status(500).send('Something broke!')
    } finally {
        gateway.disconnect()
    }
})


// GET /api/ledger/fakeData
// Use for generate fake object from user define schema
router.get("/fakeData", async function (req, res) {
    let user = getLoginUser()[req.cookies.session]
    let obj = await generateFakeObject(user.getNormalizeChannel)
    res.status(200).json(obj)
})

module.exports = router