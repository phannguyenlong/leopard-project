#!/bin/bash

# Start up CA server
# upPeerAndCA.sh company_name ca_username ca_password ca_port peer_username peer_password channel_name
# test: ./upPeerAndCA.sh company.a admin password 7054 peer pass channel1


function generatePeerMSP() {
    CAPATH="$PWD/../fabric-ca-server/ca-$1"
    export FABRIC_CA_CLIENT_HOME=$PWD

    # enroll CA admin
    echo "[+] Enroll CA admin"
    fabric-ca-client enroll -d -u https://$2:$3@localhost:$4 --caname ca-$1 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts peer.$1 --csr.hosts 'localhost' --mspdir ca-$1/admin/msp
    
    # Use CA admin for regsier peer
    echo "[+] Register Peer identity"
    fabric-ca-client register -d --id.name $5 --id.secret $6 --id.type peer -u https://localhost:$4 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts peer.$1 --csr.hosts 'localhost' --mspdir ca-$1/admin/msp

    echo "[+] Register Peer admin"
    fabric-ca-client register -d --id.name admin$5 --id.secret admin$6 --id.type admin -u https://localhost:$4 --tls.certfiles $CAPATH/ca-cert.pem --csr.hosts peer.$1 --csr.hosts 'localhost' --mspdir ca-$1/admin/msp

    # Enroll peer indentity
    echo "[+] Enroll peer identity"
    fabric-ca-client enroll -u https://$5:$6@localhost:$4 --caname ca-$1 --csr.hosts peer.$1 --csr.hosts 'localhost' --tls.certfiles $CAPATH/ca-cert.pem --mspdir ../peerOrganizations/$1/peers/peer-$1/msp
    echo "[+] Generate peer tls certificate"
    fabric-ca-client enroll -d -u https://$5:$6@localhost:$4 --caname ca-$1 --csr.hosts peer.$1 --tls.certfiles $CAPATH/ca-cert.pem --enrollment.profile tls --csr.hosts 'localhost' --mspdir ../peerOrganizations/$1/peers/peer-$1/tls
    echo "[+] Enroll peer admin"
    fabric-ca-client enroll -u https://admin$5:admin$6@localhost:$4 --caname ca-$1 --csr.hosts peer.$1 --csr.hosts 'localhost' --tls.certfiles $CAPATH/ca-cert.pem --mspdir ../peerOrganizations/$1/peers/peer-$1/msp/user/admin/msp

    # use for create peer
    cp ../peerOrganizations/$1/peers/peer-$1/tls/tlscacerts/* ../peerOrganizations/$1/peers/peer-$1/tls/ca.crt
    cp ../peerOrganizations/$1/peers/peer-$1/tls/signcerts/* ../peerOrganizations/$1/peers/peer-$1/tls/server.crt
    cp ../peerOrganizations/$1/peers/peer-$1/tls/keystore/* ../peerOrganizations/$1/peers/peer-$1/tls/server.key
    mkdir ../peerOrganizations/$1/msp # channel MSP

    # config.yaml for peers
    ORGNAME=`echo  $1 | tr "." -` # replace . to - in order to match the name
    echo "NodeOUs:
    Enable: true
    ClientOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: client
    PeerOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: peer
    AdminOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: admin
    OrdererOUIdentifier:
        Certificate: cacerts/localhost-$4-ca-$ORGNAME.pem
        OrganizationalUnitIdentifier: orderer" > "../peerOrganizations/$1/msp/config.yaml"
    
    cp ../peerOrganizations/$1/msp/config.yaml ../peerOrganizations/$1/peers/peer-$1/msp/config.yaml
    cp ../peerOrganizations/$1/msp/config.yaml ../peerOrganizations/$1/peers/peer-$1/msp/user/admin/msp/config.yaml

    # creating ORG MSP for Organization
    mkdir ../peerOrganizations/$1/msp/{cacerts,tlscacerts}
    cp ../peerOrganizations/$1/peers/peer-$1/msp/cacerts/* ../peerOrganizations/$1/msp/cacerts
    cp ../peerOrganizations/$1/peers/peer-$1/tls/tlscacerts/* ../peerOrganizations/$1/msp/tlscacerts

    # cd back
    cd ../../../scripts
}

# lauch docker CA container
docker-compose -f ../docker/$7/ca_peer-compose-$1.yaml up -d ca.$1 couchdb.$1

# check dir exsist or not
if [ ! -d "../organizations/$7" ] 
then 
    mkdir "../organizations/$7" 
fi

# go to channel organizations
cd "../organizations/$7" 
mkdir fabric-ca-client
cd fabric-ca-client

generatePeerMSP $1 $2 $3 $4 $5 $6 

# Launch peer container
docker-compose -f ../docker/$7/ca_peer-compose-$1.yaml up -d peer.$1