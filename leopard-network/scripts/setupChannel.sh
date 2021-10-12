#!/bin/bash

# cretea geneisis block
# ./setupChannel.sh ordererOrg ordererPort channelName arrays_of_peersOrg
# ./setupChannel.sh company.c 8055 channel1 company.a,company.b

configtxgen -profile LeopardGenesis -outputBlock ../channel-artifacts/$3/genesis_block.pb -channelID $3 -configPath ../channel-config/$3/
# configtxgen -profile LeopardGenesis -outputBlock channel-artifacts/genesis_block.pb -channelID channel1 -configPath test/channel-config/channel1/

osnadmin channel join --channelID $3  --config-block ../channel-artifacts/$3/genesis_block.pb -o localhost:$(expr $2 + 1) \
    --ca-file ../organizations/$3/ordererOrganizations/$1/msp/tlscacerts/* \
    --client-cert ../organizations/$3/ordererOrganizations/$1/orderers/orderer-$1/tls/server.crt \
    --client-key ../organizations/$3/ordererOrganizations/$1/orderers/orderer-$1/tls/server.key

array=(${4//,/ })
for i in "${!array[@]}"
do
    # copy genesis block to peer
    docker cp ../channel-artifacts/$3/genesis_block.pb  peer.${array[i]}:/etc/hyperledger/fabric/genesis_block.pb
    # join channel on peer CLI
    docker exec peer.${array[i]} sh -c "peer channel join -b /etc/hyperledger/fabric/genesis_block.pb --tls --cafile tls/ca.crt -o localhost:$2"
done