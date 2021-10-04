/**
 * This file is using for generarte mock data
 * @author Phan Nguyen Long
 */
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin, regsiterUser, enrollUser } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const userId = 'test';

// creating test schema
async function createSchema() {
	// mock scheme (will be generate in phase 3)
	const schema = {
		"type": "object",
		"properties": {
			"productID": {"type": "string"},
			"productType": {"type": "string"},
			"productDescription": {"type": "string"},
			"numberOfProcedure": {"type": "integer"},
			"procedures": {
				"type": "array",
				"items": {
					"type": "object",
					"properties": {
						"name": {"type": "string"},
						"status": {"type": "string"},
						"company": {"type": "string"},
						"worker": {"type": "string"},
						"comment": {"type": "string"}
					}
				}
			}
		},
		"additionalProperties": false
	}
	fs.writeFileSync("../server-config/mychannel_schema.json", JSON.stringify(schema), 'utf-8')
}

async function main() {
	let skipInit = false;
	if (process.argv.length > 2) {
		if (process.argv[2] === 'skipInit') {
			skipInit = true;
		}
	}

	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, 'org1.department1'); // use for running app

		await regsiterUser(caClient, wallet, mspOrg1, 'account1', 'password1', 'org1.department1')
		await regsiterUser(caClient, wallet, mspOrg1, 'account2', 'password2', 'org1.department1')
		await regsiterUser(caClient, wallet, mspOrg1, 'account3', 'password3', 'org1.department1')

		// InitLedger
		const gateway = new Gateway()
		try {
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true }
			})

			// creat hyperfleger network instance
			const network = await gateway.getNetwork("mychannel")
			// get contract from the network
			const contract = network.getContract("assembly_line")
        
			// Call initLedger function
			console.log('\n--> Evaluate Transaction: InitLedger');
			await contract.submitTransaction('InitLedger');

		} catch (err) {
			console.error("error: " + err)
		} finally {
			gateway.disconnect()
		}

	} catch (error) {
		console.error(`******** FAILED to run the init file: ${error}`);
	}

	console.log('*** application ending');

}

createSchema()
main();
