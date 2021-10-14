/**
 * File for login/logout routes for the server
 * @author Phan Nguyen Long
 */
const express = require("express")
const router = express.Router()
const crypto = require('crypto');
const fs = require("fs")
var path = require('path');

const { getLoginUser } = require("../util/WebUtil");
const {enrollClient, buildCAClient} = require("../util/CAUtils")
const {User} = require("../util/User")

const SECRET_KEY = 'mysupersecretkeyhahahahaha'


router.get("/", async function (req, res) {
    try {
        const user = getLoginUser()[req.cookies.session]
        if (!user) {
            res.sendStatus(401)
        } else {
            res.sendStatus(200)
        }
    } catch (err) {
        res.status(500).send(err)
    }
})

router.get("/adminAuth", async function (req, res) {
    try {
        const user = getLoginUser()[req.cookies.session]
        if (!user) {
            res.sendStatus(401)
        } else {
            if (!user.isRootAdmin) res.sendStatus(401)
            else res.sendStatus(200)
        }
    } catch (err) {
        res.status(500).send(err)
    }
})

router.post('/login', async function (req, res) {
    let hash;
    try {
        let user = new User()
        // await user.buildUser()
        // creat hash
        hash = crypto.createHmac('sha256', SECRET_KEY).update(req.body.username).digest('hex');
        
        let validate = await user.enrollUser(req.body.username, req.body.password, hash)
        if (!validate) throw new Error("User not found")

        getLoginUser()[hash] = user

        // create cookie
        res.cookie('session', hash, { expires: new Date(Date.now() + 9000000000000000)})
        
        // redirect
        if (user.isRootAdmin) 
            res.redirect("/admin/")
        else
            res.redirect("/dashboard/") // success
    } catch (error) {
        console.log(error.message)
        res.redirect('/login.html?message=Authentication failed')
    }
})

router.post("/registerClient", async function (req, res) {
    let session = req.cookies.session

    let user = getLoginUser()[session]
    let clientUsername = req.body.username
    // generate random password
    let password = ''
    for (let i = 0; i < 5; i++) {
        password += Math.random().toString(36).slice(-8)
    }

    try {
        let secret = await user.regsiterClient(clientUsername, password, session)
        res.status(200).send(secret)
    } catch (err) {
        console.log(err.message)
        res.status(403).send("User is registered before")
    }
})

router.post("/clientEnroll", async function (req, res) {
    let caClient, enroll
    try {
        caClient = await buildCAClient(req.body.organization, req.body.channel)
    } catch (err) {
        res.redirect("/get_access?message=Channel or Organization not found")
    }

    try {
        enroll =await enrollClient(caClient, req.body.username, req.body.password)
    } catch (err) {
        console.log(err)
        res.redirect("/get_access?message=Credential not valid")
    }
    if (!enroll) res.redirect("/get_access?message=Credential not valid")
    // wrtie file to tmp
    fs.mkdir(__dirname + `/../tmp/${req.body.password}/`, { recursive: true }, x => {
        fs.writeFileSync(__dirname + `/../tmp/${req.body.password}/client.crt`, enroll.certificate)
        fs.writeFileSync(__dirname + `/../tmp/${req.body.password}/client.key`, enroll.key.toBytes())
    })
    res.redirect("/get_access/download.html?token=" + req.body.password)
})

router.get("/getCert/:token/:file", async function (req, res) {
    if (req.params.file === "client.crt" || req.params.file == "client.key") {
        let filePath = path.join(__dirname + `/../tmp/${req.params.token}/${req.params.file}`)
        let fileRoot = path.join(__dirname + "/../tmp/")
        if (filePath.indexOf(fileRoot) != 0) {
            res.sendStatus(405) // prevent LFI to other file
        } else {
            res.download(filePath, function (err) {
                if (!err) {
                    fs.unlink(filePath, () => console.log("delete"))
                }
            })
        }
    } else res.sendStatus(405)
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

