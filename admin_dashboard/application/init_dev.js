const { User } = require("./util/User")
const { Gateway } = require('fabric-network');
// const { buildCAClient, registerAndEnrollUser, enrollAdmin, regsiterUser, enrollUser } = require('../../test-application/javascript/CAUtil.js');

let user

async function init() {
    user = new User("admin")
    await user.buildUser()

    console.log(user.wallet)

    await user.enrollUser('admin', 'password', 'admin')
}

async function main() {
    user = new User("admin")
    // await user.buildUser()
    await user.enrollUser('admin', 'password', 'admin')

    const gateway = new Gateway()

    try {
        // let wallet = await user.getWallet('channel1')
        // await gateway.connect(user.ccp, {
        //     wallet: wallet,
        //     identity: 'admin', // this should be session
        //     discovery: {enabled: true, asLocalhost: true}
        // })

        // const network = await gateway.getNetwork('channel1') // must input
        // console.log(network)
        // const contract = network.getContract("channel1")
        const contract = await user.createContact(gateway, "channel1", "admin", "channel1")

        let result = await contract.submitTransaction('GetAllProduct');
        console.log(JSON.parse(result.toString()))
    } catch (err) {
        console.log(err)
    } finally {
        gateway.disconnect()
    }
}

// init()
main()
// enroll()