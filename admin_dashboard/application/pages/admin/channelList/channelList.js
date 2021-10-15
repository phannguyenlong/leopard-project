const getAllChannelUrl = 'http://localhost:8080/api/network/getAllChannelName'; //this show what peers are in a organization in the channel

console.log("Hello");
getAllChannelName(getAllChannelUrl);

async function getAllChannelName(url)
{
    const dataContainer = await fetch(url);
    var data = await dataContainer.json();
    
    console.log(data);
    console.log("Index: "+data[0].index);
    console.log("Name: " +data[0].channelName)
    loadChannelList(data);
}

function loadChannelList(data)
{
    var tab = '';
    let i = 0;
    for (let obj in data)
    {
        tab +=
          `<div class="row">
          	<span class="rowContent">
          		<span>${data[i].index}</span> 
          		<span>${data[i].channelName}</span>
          	</span>
          	<span>
		  	<button class="btn negativeButton">Kill</button>
		  	<button class="btn utilButton">
			    <a href=../channelDetail/index.html?channel_name=${data[i].channelName}>More Details</a>
			</button>
          	</span>  
          </div>`;
          i++
    }
    
    document.getElementById("channelList").innerHTML = tab;
}
