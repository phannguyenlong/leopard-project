fetch("http://localhost:8080/api/auth/adminAuth").then(res => {
        if(res.status != 200) {
        window.location.href = "http://localhost:8080/login.html?message=Root Admin only";
        }
    })
loadData()
async function loadData(){    
    channel_name = window.location.href.split("=")[1]
    console.log(channel_name)
    var dataContainer = await fetch(`http://localhost:8080/api/network/showChannelDetail?channel_name=${channel_name}`);
    var data = await dataContainer.json();
    console.log(data)
    var titlePeer = document.getElementsByClassName("headerButtContainer")[0]
    var table = document.getElementById("tablePeer")
    document.getElementById("channelName").innerHTML = `<h2>Channel Name: ${data["channelName"]}</h2>`

    var networkStatus = `
                        <h3>Peer Status</h3>
   `
    var tablePeers = `  <thead>
                            <tr>
                            <th>ID</th> 
                            <th>Peer Name</th>
                            <th>Peer Address</th>
                            </tr>
                            </thead`
    table.innerHTML+=tablePeers
    tablePeers=""
    var peers = data["peers"]
    for(let i=0;i<peers.length;i++){
        tablePeers+=`  
                        
                        <tr>
                        <td>${i+1}</td> 
                        <td>${peers[i]["orgName"]}</td>
                        <td>${peers[i]["port"]}</td>
                        </tr>`
    }
    titlePeer.innerHTML+=networkStatus
    table.innerHTML+=`<tbody class="tableContent">`+tablePeers+`</tbody>`

    //---------------------------------------------------------------------

    var titleOrderer = document.getElementsByClassName("headerButtContainer")[1]
    var table2 = document.getElementById("tableOrderer")
    var networkStatus2 = "<h3>Orderer Status</h3>"
    var tableOrderer = `  <thead >
                            <tr>
                            <th>ID</th> 
                            <th>Orderer Name</th>
                            <th>Orderer Address</th>
                            </tr>
                            </thead`
    table2.innerHTML+=tableOrderer
    var orderer = data["orderer"]
    tableOrderer=`  
                    <tr>
                    <td>1</td> 
                    <td>${orderer["orgName"]}</td>
                    <td>${orderer["port"]}</td>
                    </tr>
                    `
    
    titleOrderer.innerHTML+=networkStatus2
    table2.innerHTML+=`<tbody class="tableContent">`+tableOrderer+`</tbody>`

}
function back(){
    window.location.href = "http://localhost:8080/dashboard/network/";

}
