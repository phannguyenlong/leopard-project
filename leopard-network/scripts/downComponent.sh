# This script is using for down peer or channel
# test: ./downComponent.sh mode(peer or channel) channelName organization(if peer mode)
# ex: ./downComponent.sh channel channel1
# ex: ./downComponent.sh channel channel1 company.a

if [ "$1" = "peer" ]; then
    docker-compose -f ../docker/$2/ca_peer-compose-$3.yaml down --volumes
    rm ../docker/$2/ca_peer-compose-$3.yaml
    rm -r ../organizations/$2/peerOrganizations/$3
fi

if [ "$1" = "channel" ]; then
    for entry in `find ../docker/$2 -type f`; do
        echo $entry
        docker-compose -f $entry down --volumes
    done
    rm -r ../docker/$2/
    rm -r ../organizations/$2
    rm -r ../channel-config/$2
    rm -r ../channel-artifacts/$2
fi