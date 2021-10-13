/**
 * Use for interact with network
 * @author Phan Nguyen Long
 */

const fs = require('fs');
const path = require('path');

exports.buildCCPOrg = (organizaiton, channel) => {
	// normalize the data
    organizaiton = organizaiton.replace(" ", ".").toLowerCase()
    channel = channel.replace(" ", ".").toLowerCase()

	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, ".." , '..', '..', 'leopard-network', 'organizations', channel ,'peerOrganizations', `${organizaiton}`, `connection-${organizaiton}.json`);
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8');

	// build a JSON object from the file contents
	const ccp = JSON.parse(contents);

	console.log(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
}

exports.buildWallet = async (Wallets, walletPath) => {
	// Create a new  wallet : Note that wallet is for managing identities.
	let wallet;
	if (walletPath) {
		wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Built a file system wallet at ${walletPath}`);
	} else {
		wallet = await Wallets.newInMemoryWallet();
		console.log('Built an in memory wallet');
	}

	return wallet;
}