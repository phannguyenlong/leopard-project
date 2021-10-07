const { User } = require("./util/User")
const { Gateway } = require('fabric-network');
const { buildCAClient, registerAndEnrollUser, enrollAdmin, regsiterUser, enrollUser } = require('../../test-application/javascript/CAUtil.js');

let user

async function init() {
    user = new User("admin")
    await user.buildUser()

    // console.log(user.wallets)

    // await user.enrollUser('admin', 'adminpw', 'admin')
}

async function main() {
    user = new User("admin")
    await user.buildUser()
    await user.enrollUser('admin', 'adminpw', 'admin')

    const gateway = new Gateway()

    try {
        // let wallet = await user.getWallet('mychannel')
        // await gateway.connect(user.ccp, {
        //     wallet: wallet,
        //     identity: 'admin', // this should be session
        //     discovery: {enabled: true, asLocalhost: true}
        // })

        // const network = await gateway.getNetwork('mychannel') // must input
        // const contract = network.getContract("assembly_line")
        const contract = await user.createContact(gateway, "assembly_line", "admin", "mychannel")

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