# @author Truong Minh Khoa
#!/bin/bash


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
  docker cp $PWD/../../admin_dashboard/chaincode/admin-chaincode/$ORDERER_CA ${ORG}:/etc/hyperledger/fabric/orderer.crt
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
    peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} -c '{"Args":["GetAllProduct"]}' >&${PWD}/../tmp/log.txt
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
