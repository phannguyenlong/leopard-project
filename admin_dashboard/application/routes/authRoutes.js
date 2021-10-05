/**
 * File for login/logout routes for the server
 * @author Phan Nguyen Long
 */
const express = require("express")
const router = express.Router()
const crypto = require('crypto');

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, enrollAdmin, regsiterUser, enrollUser } = require('../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../test-application/javascript/AppUtil.js');

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, '../wallet');
const SECRET_KEY = 'mysupersecretkeyhahahahaha'


router.get("/", async function (req, res) {
    try {
        const wallet = await buildWallet(Wallets, walletPath)
        const user = await wallet.get(req.cookies.session)
        if (!user) {
            console.log("RUN here")
            res.send(401)
        } else {
            res.send(200)
        }
    } catch (err) {
        res.status(500).send(err)
    }
})

router.post('/login', async function (req, res) {
    let hash;
    try {
		const ccp = buildCCPOrg1();
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);
        
        // creat hash
        hash = crypto.createHmac('sha256', SECRET_KEY).update(req.body.username).digest('hex');

        await enrollUser(caClient, wallet, mspOrg1, req.body.username, req.body.password, hash);

        // create cookie
        res.cookie('session', hash, { expires: new Date(Date.now() + 9000000000000000)})
        res.redirect("/dashboard/") // success
    } catch (error) {
        console.log(error.message)
        res.redirect('/login.html?message=Authentication failed')
    }
})

router.get('/logout', async function (req, res) {
    const wallet = await buildWallet(Wallets, walletPath);

    wallet.remove(req.cookies.session)
    res.clearCookie("session");
    res.redirect('/login.html')
    
})

module.exports = router

