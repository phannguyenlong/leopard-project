const peerCountUrl = 'http://localhost:8080/api/network/show_detail?channel=mychannel'; //this show what peers are in a organization in the channel
const peerDetails = 'http://localhost:8080/api/network/getOrgStatus?channel=Channel'; //this show details about the peers that are in the channel

orgInChannel(peerCountUrl);

peersInChannel(peerDetails);

async function orgInChannel(url)
{
    const dataContainer = await fetch(url);
    var data = await dataContainer.json();
    
    console.log(data);
    //console.log(typeof(data));
    
    //console.log(JSON.stringify(data.channel));
    console.log(data.channel);
    console.log(data.Org);
    
    console.log(data.Org[0]);
    console.log(data.Org[1]);
    
    loadOrgsInChannelData(data);
}

async function peersInChannel(url)
{
    const dataContainer = await fetch(url);
    var data = await dataContainer.json();
    
    console.log(data);
    console.log(data["‘peer0.org1.example.com’"]) //In case of ' not working copy ’
    for (let obj in data)
    {
        console.log(obj);
        console.log(data[obj]);
    } 
    
    loadPeersInChannelData(data)
} 

function loadOrgsInChannelData(data)
{
    var tab = '';
    let i = 1;
    for (let obj in data.Org)
    {
        tab +=
          `<tr>
          <td>${i}</td> 
          <td>${data.Org[obj]}</td>
          <td>${data.channel}</td>
          <td><button type="button" class="negativeButton">Kick</button></td>
          <td><button type="button" class="utilButton">More details</button></td>     
          </tr>`;
          i++
    }
    
    document.getElementById("OrgStatus").innerHTML = tab;
}

function loadPeersInChannelData(data)
{
    var tab = '';
    let i = 1;
    for (let obj in data) 
    {
    	if (data[obj].state != "‘running’")
    	{
    	   tab +=
          `<tr>
          <td>${i}</td> 
          <td>${obj}</td>
          <td>${data[obj].operation_port}</td>
          <td class="inactiveStatus">${data[obj].state}</td>
          <td><button type="button" class="utilButton">More details</button></td>      
          </tr>`;
    	}
    	else
    	{
      	   tab +=
          `<tr>
          <td>${i}</td> 
          <td>${obj}</td>
          <td>${data[obj].operation_port}</td>
          <td class="activeStatus">${data[obj].state}</td>
          <td><button type="button" class="utilButton">More details</button></td>      
          </tr>`;  	   
    	}
           i++;    
    }
    
    document.getElementById("NetworkStatus").innerHTML = tab;
}
