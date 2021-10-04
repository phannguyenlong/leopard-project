./network.sh up createChannel -s couchdb -ca

# Account chaincode
./network.sh deployCC -ccn assembly_line -ccp ../admin_dashboard/chaincode/admin-chaincode -ccl javascript
# for update (increase version and sequence after each upgrade)
# ./network.sh deployCC -ccn assembly_line -ccp ../admin_dashboard/chaincode/admin-chaincode -ccl javascript -ccs 2 -ccv 2.1

rm -r ../admin_dashboard/application/wallet