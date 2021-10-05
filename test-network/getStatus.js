const { execSync } = require('child_process');

const all = execSync('docker ps -a --format ‘{{.Names}}’', { encoding: 'utf-8' });
allNames = all.split("\n");

const running = execSync('docker ps --format ‘{{.Names}}’', { encoding: 'utf-8' });
runningNames = running.split("\n");

notRunning = []
for(let i =0;i<allNames.length;i++){
    var state = 0
    for(let j=0;j<runningNames.length;j++){
        if(allNames[i] == runningNames[j]){
            state = 1
            break
        }
    }
    if(state ==0){
        notRunning.push(allNames[i])
    }
}

console.log("Running Names: ",runningNames)
console.log("Not running Names: ",notRunning)

console.log("-----------------------")
console.log("Channel Statuses")
channelStatuses = [] 
const namesChannel = execSync('ls log/channels/*.log', { encoding: 'utf-8' }).split("\n");
console.log(namesChannel)
for(let j =0; j<namesChannel.length-1;j++){
    file = namesChannel[j]
    var Status_channel = execSync('cat '+file, { encoding: 'utf-8' });
    channelStatuses.push(JSON.parse(Status_channel.substring(
        Status_channel.indexOf("{"), 
        Status_channel.lastIndexOf("}")+1
    )))
}
console.log(channelStatuses)


console.log("-----------------------")
console.log("Peer Statuses and channel")
var data = execSync('cat log/network_config.log', { encoding: 'utf-8' });
peerStatuses = []
var objectes = data.split("\n")
for(let i=0;i<objectes.length;i++){
    if(objectes[i]!=''){
        peerStatuses.push(JSON.parse(objectes[i]))
    }
}
console.log(peerStatuses)
