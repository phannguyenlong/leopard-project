for entry in `find docker -type f`; do
    echo $entry
    docker-compose -f $entry down --volumes --remove-orphans
done

docker volume prune -f # remove all volumes

rm -r organizations/*
rm -r docker/*
rm -r channel-artifacts/*
rm -r channel-config/*