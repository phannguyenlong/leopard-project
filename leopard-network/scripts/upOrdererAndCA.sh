#!/bin/bash

# Start up CA server
# upOrdererAndCA.sh company_name ca_username ca_password ca_port orderer_username orderer_password channel_name
# test: ./upOrdererAndCA.sh company.a ordererAdmin ordererPassword 8054 peer pass channel1


function generateOrdererMSP() {
    CAPATH="$PWD/../fabric-ca-server/ca.orderer-$1"
    export FABRIC_CA_CLIENT_HOME=$PWD

    # enroll CA admin
    echo "[+] Enroll CA admin"
    fabric-ca-client enroll -d -u https://$2:$3@localhost:$4 --caname ca.orderer-$1 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts 'localhost' --csr.hosts "orderer.$1" --mspdir ca.orderer-$1/admin/msp

    # Use CA admin for regsier orderer
    echo "[+] Register Orderer identity"
    fabric-ca-client register -d --id.name $5 --id.secret $6 --id.type orderer -u https://localhost:$4 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts 'localhost' --csr.hosts "orderer.$1" --mspdir ca.orderer-$1/admin/msp

    # Enroll Orderer indentity
    echo "[+] Enroll Orderer identity"
    fabric-ca-client enroll -u https://$5:$6@localhost:$4 --caname ca.orderer-$1 --csr.hosts 'localhost' --csr.hosts "orderer.$1" --tls.certfiles $CAPATH/ca-cert.pem --mspdir ../ordererOrganizations/$1/orderers/orderer-$1/msp
    echo "[+] Generate Orderer tls certificate"
    fabric-ca-client enroll -d -u https://$5:$6@localhost:$4 --caname ca.orderer-$1 --tls.certfiles $CAPATH/ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --csr.hosts "orderer.$1" --mspdir ../ordererOrganizations/$1/orderers/orderer-$1/tls

    # use for create orderer
    cp ../ordererOrganizations/$1/orderers/orderer-$1/tls/tlscacerts/* ../ordererOrganizations/$1/orderers/orderer-$1/tls/ca.crt
    cp ../ordererOrganizations/$1/orderers/orderer-$1/tls/signcerts/* ../ordererOrganizations/$1/orderers/orderer-$1/tls/server.crt
    cp ../ordererOrganizations/$1/orderers/orderer-$1/tls/keystore/* ../ordererOrganizations/$1/orderers/orderer-$1/tls/server.key

    mkdir ../ordererOrganizations/$1/msp # channel MSP

    # config.yaml for Orderer
    ORGNAME=`echo  $1 | tr "." -` # replace . to - in order to match the name
    echo "NodeOUs:
    Enable: true
    ClientOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-orderer-$ORGNAME.pem
        OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-orderer-$ORGNAME.pem
        OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-orderer-$ORGNAME.pem
        OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-orderer-$ORGNAME.pem
        OrganizationalUnitIdentifier: orderer" > "../ordererOrganizations/$1/msp/config.yaml"
    
    cp ../ordererOrganizations/$1/msp/config.yaml ../ordererOrganizations/$1/orderers/orderer-$1/msp/config.yaml

    # creating ORG MSP for Organization
    mkdir ../ordererOrganizations/$1/msp/{cacerts,tlscacerts}
    cp ../ordererOrganizations/$1/orderers/orderer-$1/msp/cacerts/* ../ordererOrganizations/$1/msp/cacerts
    cp ../ordererOrganizations/$1/orderers/orderer-$1/tls/tlscacerts/* ../ordererOrganizations/$1/msp/tlscacerts

    # cd back
    cd ../../../scripts
}

# lauch docker CA container
docker-compose -f ../docker/$7/orderer-compose-$1.yaml up -d ca.orderer.$1

# check dir exsist or not
if [ ! -d "../organizations/$7" ] 
then 
    mkdir "../organizations/$7" 
fi

# go to channel organizations
cd "../organizations/$7" 
mkdir fabric-ca-client
cd fabric-ca-client

generateOrdererMSP $1 $2 $3 $4 $5 $6 

docker-compose -f ../docker/$7/orderer-compose-$1.yaml up -d orderer.$1