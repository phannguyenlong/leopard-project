/**
 * Use for internact with CA
 * @author Phan Nguyen long
 */

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