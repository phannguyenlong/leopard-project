/**
 * Use for internact with CA
 * @author Phan Nguyen long
 */
const {buildCCPOrg} = require("./AppUtils")
const FabricCAServices = require('fabric-ca-client');

exports.enrollUser = async (caClient, wallet, orgMspId, userId, secret, label) => {
	try {

		const enrollment = await caClient.enroll({
			enrollmentID: userId,
			enrollmentSecret: secret
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(label, x509Identity);
		console.log(`Successfully enrolled user ${userId} and imported it into the wallet`);
	} catch (error) {
		throw new Error(error)
	}
};

// exports.enrollClient = async()
exports.enrollClient = async (caClient, userId, secret) => {
	try {

		const enrollment = await caClient.enroll({
			enrollmentID: userId,
			enrollmentSecret: secret
		});

		return enrollment
		// console.log(enrollment.certificate)
		// console.log(enrollment.key)
		// const x509Identity = {
		// 	credentials: {
		// 		certificate: enrollment.certificate,
		// 		privateKey: enrollment.key.toBytes(),
		// 	},
		// 	mspId: orgMspId,
		// 	type: 'X.509',
		// };
		// await wallet.put(label, x509Identity);
		// console.log(`Successfully enrolled user ${userId} and imported it into the wallet`);
	} catch (error) {
		throw new Error(error)
	}
};

exports.buildCAClient = async function buildCAClient(organizaiton, channelName) {
	let ccp = await buildCCPOrg(organizaiton, channelName)

	let orgConfig = ccp.organizations[organizaiton.toLowerCase().replace(" ", ".")];
	let ca = orgConfig.certificateAuthorities[0]
	const caInfo = ccp.certificateAuthorities[ca]; //lookup CA details from config
	const caTLSCACerts = caInfo.tlsCACerts.pem;
	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

	return caClient
}