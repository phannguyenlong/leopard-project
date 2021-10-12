for entry in `find docker -type f`; do
    echo $entry
    docker-compose -f $entry down --volumes --remove-orphans
done

docker volume prune -f # remove all volumes
docker rm -f $(docker ps -a -q)

rm -r organizations/*
rm -r docker/*
rm -r channel-artifacts/*
rm -r channel-config/*
rm -r tmp/*