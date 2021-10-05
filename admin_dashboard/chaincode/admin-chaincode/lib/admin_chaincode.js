/**
 * List of all funcion
 * createProduct(ctx, product) # with product is the full object of product (IN STRING JSON.stringtify())
 * GetALlProduct(ctx) # return product in the database
 * productExists(ctx, id) # check product exists or not
 * DeleteProduct(ctx, productID) # delete product base on productID
 * UpdateProduct(ctx, product) # with product is the full object of product (IN STRING JSON.stringtify())
 * GetProductHistory(ctx, productID) # return all the transaction of that product
 */

'use strict';

const { Contract, Info } = require('fabric-contract-api');

class Chaincode extends Contract {

	// CreateAsset - create a new asset, store into chaincode state
	async createProduct(ctx, product) {
		product = JSON.parse(product)
		const exists = await this.productExists(ctx, product.productID);
		if (JSON.parse(exists.toString())) {
			throw new Error(`The product ${product.productID} already exists`);
		}

		// === Save product to state ===
		await ctx.stub.putState(product.productID, Buffer.from(JSON.stringify(product)));
	}


	async GetAllProduct(ctx) {
		let queryString = {
			selector: {
				_id: {$gt: null}
			}
		}
		const accountJSON = await this.QuerryProduct(ctx, JSON.stringify(queryString)); // get the asset from chaincode state
		return accountJSON.toString();
	}

	async productExists(ctx, id) {
		// ==== Check if asset already exists ====
		let product = await ctx.stub.getState(id);

		return product && product.length > 0;
	}

	// delete - remove a asset key/value pair from state
	async DeleteProduct(ctx, productID) {
		if (!productID) {
			throw new Error('Product id must not be empty');
		}

		let exists = await this.productExists(ctx, productID);
		if (!exists) {
			throw new Error(`Product ${productID} does not exist`);
		}

		await ctx.stub.deleteState(productID); //remove the asset from chaincode state
	}

	async UpdateProduct(ctx, product) {
		product = JSON.parse(product)
		let exists = await this.productExists(ctx, product.productID);
		if (!exists) {
			throw new Error(`Product ${product.productID} does not exist`);
		}

		try {
			await ctx.stub.putState(product.productID, Buffer.from(JSON.stringify(product)))
		} catch (err) {
			throw new Error(err)
		}
	}

	// GetAssetHistory returns the chain of custody for an asset since issuance.
	async GetProductHistory(ctx, productID) {

		let resultsIterator = await ctx.stub.getHistoryForKey(productID);
		let results = await this._GetAllResults(resultsIterator, true);

		return JSON.stringify(results);
	}

	// Example: Ad hoc rich query
	// QueryAssets uses a query string to perform a query for assets.
	// Query string matching state database syntax is passed in and executed as is.
	// Supports ad hoc queries that can be defined at runtime by the client.
	// If this is not desired, follow the QueryAssetsForOwner example for parameterized queries.
	// Only available on state databases that support rich query (e.g. CouchDB)
	async QuerryProduct(ctx, queryString) {
		return await this.GetQueryResultForQueryString(ctx, queryString);
	}

	// GetQueryResultForQueryString executes the passed in query string.
	// Result set is built and returned as a byte array containing the JSON results.
	async GetQueryResultForQueryString(ctx, queryString) {

		let resultsIterator = await ctx.stub.getQueryResult(queryString);
		let results = await this._GetAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}

	// This is JavaScript so without Funcation Decorators, all functions are assumed
	// to be transaction functions
	//
	// For internal functions... prefix them with _
	async _GetAllResults(iterator, isHistory) {
		let allResults = [];
		let res = await iterator.next();
		while (!res.done) {
			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));
				if (isHistory && isHistory === true) {
					jsonRes.TxId = res.value.txId;
					jsonRes.Timestamp = res.value.timestamp;
					try {
						jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Value = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.Key = res.value.key;
					try {
						jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Record = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			res = await iterator.next();
		}
		iterator.close();
		return allResults;
	}

	// InitLedger creates sample assets in the ledger
	async InitLedger(ctx) {
		const products = [
			{
				productID: "1",
				productType: "car",
				productDescription: "this is a car",
				numberOfProcedure: 2,
				procedures: [
				{
					name: "Chasis create",
					status: "finish",
					company: "Company A",
					worker: "Long",
					comment: "good",
				},
				{
					name: "Painting",
					status: "processing",
					company: "Company B",
					worker: "The killer",
					comment: "I am killing this car",
				}]
			},
			{
				productID: "2",
				productType: "car",
				productDescription: "this is another car",
				numberOfProcedure: 2,
				procedures: [
				{
					name: "Chasis create",
					status: "finish",
					company: "Company A",
					worker: "Superman",
					comment: "not good",
				},
				{
					name: "Painting",
					status: "finish",
					company: "Company B",
					worker: "wonder woman",
					comment: "hey i am a girl",
				}]
			},
			{
				productID: "3",
				productType: "car",
				productDescription: "this is batman car",
				numberOfProcedure: 2,
				procedures: [
				{
					name: "Chasis create",
					status: "undone",
					company: "Company A",
					worker: "lazy man",
					comment: "nope",
				},
				{
					name: "Painting",
					status: "undone",
					company: "Company B",
					worker: "lazy girl",
					comment: "urghhh",
				}]
			}
		]

		for (const product of products) {
			await this.createProduct(ctx, JSON.stringify(product));
		}
	}
}

module.exports = Chaincode;
