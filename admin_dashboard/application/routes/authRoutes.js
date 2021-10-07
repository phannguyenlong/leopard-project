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
const { getLoginUser } = require("../util/WebUtil");
const {User} = require("../util/User")

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, '../wallet');
const SECRET_KEY = 'mysupersecretkeyhahahahaha'


router.get("/", async function (req, res) {
    try {
        const user = getLoginUser()[req.cookies.session]
        if (!user) {
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
        let user = new User(req.body.username)
        await user.buildUser()
        // creat hash
        hash = crypto.createHmac('sha256', SECRET_KEY).update(req.body.username).digest('hex');

        await user.enrollUser(req.body.username, req.body.password, hash)

        getLoginUser()[hash] = user

        // create cookie
        res.cookie('session', hash, { expires: new Date(Date.now() + 9000000000000000)})
        res.redirect("/dashboard/") // success
    } catch (error) {
        console.log(error.message)
        res.redirect('/login.html?message=Authentication failed')
    }
})

router.get('/logout', async function (req, res) {
    let session = req.cookies.session

    let user = getLoginUser()[session]
    await user.unEnrollUser(session)
    delete user
    res.clearCookie("session");
    res.redirect('/login.html')
})

module.exports = router

