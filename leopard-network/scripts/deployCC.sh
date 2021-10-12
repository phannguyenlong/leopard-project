#!/bin/bash

# source scripts/utils.sh

# CHANNEL_NAME=${1:-"mychannel"}
# CC_NAME=${2}
# CC_SRC_PATH=${3}
# CC_SRC_LANGUAGE=${4}
# CC_VERSION="1.0"
# CC_SEQUENCE=${6:-"1"}
# CC_INIT_FCN=${7:-"NA"}
# CC_END_POLICY=${8:-"NA"}
# CC_COLL_CONFIG=${9:-"NA"}
# DELAY=${10:-"3"}
# MAX_RETRY=${11:-"5"}
# VERBOSE=${12:-"false"}

# println "executing with the following"
# println "- CHANNEL_NAME: ${C_GREEN}${CHANNEL_NAME}${C_RESET}"
# println "- CC_NAME: ${C_GREEN}${CC_NAME}${C_RESET}"
# println "- CC_SRC_PATH: ${C_GREEN}${CC_SRC_PATH}${C_RESET}"
# println "- CC_SRC_LANGUAGE: ${C_GREEN}${CC_SRC_LANGUAGE}${C_RESET}"
# println "- CC_VERSION: ${C_GREEN}${CC_VERSION}${C_RESET}"
# println "- CC_SEQUENCE: ${C_GREEN}${CC_SEQUENCE}${C_RESET}"
# println "- CC_END_POLICY: ${C_GREEN}${CC_END_POLICY}${C_RESET}"
# println "- CC_COLL_CONFIG: ${C_GREEN}${CC_COLL_CONFIG}${C_RESET}"
# println "- CC_INIT_FCN: ${C_GREEN}${CC_INIT_FCN}${C_RESET}"
# println "- DELAY: ${C_GREEN}${DELAY}${C_RESET}"
# println "- MAX_RETRY: ${C_GREEN}${MAX_RETRY}${C_RESET}"
# println "- VERBOSE: ${C_GREEN}${VERBOSE}${C_RESET}"

# FABRIC_CFG_PATH=$PWD/../../config/

# #User has not provided a name
# if [ -z "$CC_NAME" ] || [ "$CC_NAME" = "NA" ]; then
#   fatalln "No chaincode name was provided. Valid call example: ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go"

# # User has not provided a path
# elif [ -z "$CC_SRC_PATH" ] || [ "$CC_SRC_PATH" = "NA" ]; then
#   fatalln "No chaincode path was provided. Valid call example: ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go"

# # User has not provided a language
# elif [ -z "$CC_SRC_LANGUAGE" ] || [ "$CC_SRC_LANGUAGE" = "NA" ]; then
#   fatalln "No chaincode language was provided. Valid call example: ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go"

# ## Make sure that the path to the chaincode exists
# elif [ ! -d "$CC_SRC_PATH" ]; then
#   fatalln "Path to chaincode does not exist. Please provide different path."
# fi

# CC_SRC_LANGUAGE=$(echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:])

# # do some language specific preparation to the chaincode before packaging
# if [ "$CC_SRC_LANGUAGE" = "go" ]; then
#   CC_RUNTIME_LANGUAGE=golang

#   infoln "Vendoring Go dependencies at $CC_SRC_PATH"
#   pushd $CC_SRC_PATH
#   GO111MODULE=on go mod vendor
#   popd
#   successln "Finished vendoring Go dependencies"

# elif [ "$CC_SRC_LANGUAGE" = "java" ]; then
#   CC_RUNTIME_LANGUAGE=java

#   rm -rf $CC_SRC_PATH/build/install/
#   infoln "Compiling Java code..."
#   pushd $CC_SRC_PATH
#   ./gradlew installDist
#   popd
#   successln "Finished compiling Java code"
#   CC_SRC_PATH=$CC_SRC_PATH/build/install/$CC_NAME

# elif [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
#   CC_RUNTIME_LANGUAGE=node

# elif [ "$CC_SRC_LANGUAGE" = "typescript" ]; then
#   CC_RUNTIME_LANGUAGE=node

#   infoln "Compiling TypeScript code into JavaScript..."
#   pushd $CC_SRC_PATH
#   npm install
#   npm run build
#   popd
#   successln "Finished compiling TypeScript code into JavaScript"

# else
#   fatalln "The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script. Supported chaincode languages are: go, java, javascript, and typescript"
#   exit 1
# fi

# INIT_REQUIRED="--init-required"
# # check if the init fcn should be called
# if [ "$CC_INIT_FCN" = "NA" ]; then
#   INIT_REQUIRED=""
# fi

# if [ "$CC_END_POLICY" = "NA" ]; then
#   CC_END_POLICY=""
# else
#   CC_END_POLICY="--signature-policy $CC_END_POLICY"
# fi

# if [ "$CC_COLL_CONFIG" = "NA" ]; then
#   CC_COLL_CONFIG=""
# else
#   CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
# fi

# # import utils
# . scripts/envVar.sh

packageChaincode() {
  CC_NAME=$1
  CC_SRC_PATH=$2
  set -x
  peer lifecycle chaincode package ${PWD}/../tmp/${CC_NAME}.tar.gz --path ${PWD}/../../${CC_SRC_PATH} --lang node --label ${CC_NAME}_1.0 >&${PWD}/../tmp/log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat ${PWD}/../tmp/log.txt
  echo "Chaincode is packaged"
}

# installChaincode PEER ORG
installChaincode() {
  ORG=$1
  CC_NAME=$2
  docker cp ${PWD}/../tmp/${CC_NAME}.tar.gz  ${ORG}:/etc/hyperledger/fabric/${CC_NAME}.tar.gz
  echo ${ORG}
  docker exec ${ORG} sh -c "peer lifecycle chaincode install /etc/hyperledger/fabric/${CC_NAME}.tar.gz"
  echo "Chaincode is installed on ${ORG}"
}
# queryInstalled PEER ORG
queryInstalled() {
  ORG=$1
  CC_NAME=$2
  set -x
  docker exec ${ORG} sh -c "peer lifecycle chaincode queryinstalled" > ${PWD}/../tmp/log.txt 
  res=$?
  { set +x; } 2>/dev/null
  cat ${PWD}/../tmp/log.txt
  PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" ${PWD}/../tmp/log.txt)
}

# approveForMyOrg VERSION PEER ORG
approveForMyOrg() {
  ORG=$1
  CC_NAME=$2
  ORDERER_PORT=$3
  ORDERER_NAME=$4
  ORDERER_CA=$5

  queryInstalled $ORG $CC_NAME

  echo $ORDERER_CA - $ORG - $ORDERER_PORT - $ORDERER_NAME
  set -x
  docker cp $PWD/../../application/$ORDERER_CA ${ORG}:/etc/hyperledger/fabric/orderer.crt
  docker exec ${ORG} sh -c "peer lifecycle chaincode approveformyorg -o $ORDERER_NAME:$ORDERER_PORT --tls --cafile /etc/hyperledger/fabric/orderer.crt --channelID $CC_NAME --name ${CC_NAME} --version 1 --package-id $PACKAGE_ID --sequence 1"
  res=$?
  { set +x; } 2>/dev/null
  echo $res "Chaincode definition approved on ${ORG} on channel '$CC_NAME' failed"
  echo "Chaincode definition approved on ${ORG} on channel '$CC_NAME'"
}

# checkCommitReadiness VERSION PEER ORG
checkCommitReadiness() {
  ORG=$1
  CC_NAME=$2
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  docker exec ${ORG} sh -c "peer lifecycle chaincode checkcommitreadiness --channelID ${CC_NAME} --name ${CC_NAME} --version 1 --sequence 1 --output json" >&${PWD}/../tmp/log.txt
  cat ${PWD}/../tmp/log.txt
}

# commitChaincodeDefinition VERSION PEER ORG (PEER ORG)...
commitChaincodeDefinition() {
  ORG=$1
  CC_NAME=$2
  ORDERER_PORT=$3
  ORDERER_NAME=$4
  CONFIG=`cat ${PWD}/../tmp/info.txt`
  echo $ORG $CC_NAME $ORDERER_PORT $ORDERER_NAME $CONFIG
  docker exec ${ORG} sh -c "peer lifecycle chaincode commit -o ${ORDERER_NAME}:${ORDERER_PORT} --tls --cafile /etc/hyperledger/fabric/orderer.crt --channelID $CC_NAME --name ${CC_NAME} ${CONFIG} --version 1 --sequence 1" >${PWD}/../tmp/log.txt
  cat ${PWD}/../tmp/log.txt
}

# queryCommitted ORG
queryCommitted() {
  ORG=$1
  CC_NAME=$2
  docker exec ${ORG} sh -c "peer lifecycle chaincode querycommitted --channelID $CC_NAME --name ${CC_NAME} ">&${PWD}/../tmp/log.txt
  cat ${PWD}/../tmp/log.txt
  
}

chaincodeInvokeInit() {
  ORG=$1
  CC_NAME=$2
  ORDERER_PORT=$3
  ORDERER_NAME=$4
  CONFIG=`cat ${PWD}/../tmp/info.txt`
  INIT=\'{\"function\":\"InitLedger\",\"Args\":[]}\'
  echo "peer chaincode invoke -o ${ORDERER_NAME}:${ORDERER_PORT} --tls --cafile /etc/hyperledger/fabric/orderer.crt -C $CC_NAME -n ${CC_NAME} ${CONFIG} -c ${INIT}"
  docker exec ${ORG} sh -c "peer chaincode invoke -o ${ORDERER_NAME}:${ORDERER_PORT} --tls --cafile /etc/hyperledger/fabric/orderer.crt -C $CC_NAME -n ${CC_NAME} ${CONFIG} -c ${INIT} ">${PWD}/../tmp/log.txt
  cat ${PWD}/../tmp/log.txt
}

chaincodeQuery() {
  ORG=$1
  setGlobals $ORG
  infoln "Querying on peer0.org${ORG} on channel '$CHANNEL_NAME'..."
  local rc=1
  local COUNTER=1
  # continue to poll
  # we either get a successful response, or reach MAX RETRY
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ]; do
    sleep $DELAY
    infoln "Attempting to Query peer0.org${ORG}, Retry after $DELAY seconds."
    set -x
    peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} -c '{"Args":["queryAllCars"]}' >&${PWD}/../tmp/log.txt
    res=$?
    { set +x; } 2>/dev/null
    let rc=$res
    COUNTER=$(expr $COUNTER + 1)
  done
  cat ${PWD}/../tmp/log.txt
  if test $rc -eq 0; then
    successln "Query successful on peer0.org${ORG} on channel '$CHANNEL_NAME'"
  else
    fatalln "After $MAX_RETRY attempts, Query result on peer0.org${ORG} is INVALID!"
  fi
}
$1 $2 $3 $4 $5 $6 $7

## package the chaincode
# packageChaincode

# ## Install chaincode on peer0.org1 and peer0.org2
# infoln "Installing chaincode on peer0.org1..."
# installChaincode 1
# infoln "Install chaincode on peer0.org2..."
# installChaincode 2

# ## query whether the chaincode is installed
# queryInstalled 1

# ## approve the definition for org1
# approveForMyOrg 1

# ## check whether the chaincode definition is ready to be committed
# ## expect org1 to have approved and org2 not to
# checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": false"
# checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": false"

# ## now approve also for org2
# approveForMyOrg 2

# ## check whether the chaincode definition is ready to be committed
# ## expect them both to have approved
# checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": true"
# checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": true"

# ## now that we know for sure both orgs have approved, commit the definition
# commitChaincodeDefinition 1 2

# ## query on both orgs to see that the definition committed successfully
# queryCommitted 1
# queryCommitted 2

# ## Invoke the chaincode - this does require that the chaincode have the 'initLedger'
# ## method defined
# if [ "$CC_INIT_FCN" = "NA" ]; then
#   infoln "Chaincode initialization is not required"
# else
#   chaincodeInvokeInit 1 2
# fi

# exit 0
