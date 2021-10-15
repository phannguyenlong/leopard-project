// const { main } = require("../../../main");

// const {  } = require("../../../channel-utils/Organizations");
var tabledata = []
fetch("http://localhost:8080/api/auth/adminAuth").then(res => {
        if(res.status != 200) {
        window.location.href = "http://localhost:8080/login.html?message=Root Admin only";
        }
    })

var table = new Tabulator("#channelTable",{
    data:tabledata, 
    layout:"fitColumns",
    responsiveLayout:"hide",
    addRowPos:"bottom",
    history:true,
    pagination:"local",
    paginationSize:7,         //allow 7 rows per page of data
    movableColumns:true,      //allow column order to be changed
    resizableRows:true,       //allow row order to be changed
    validationMode: "highlight",
    printAsHtml: true,
    initialSort:
    [             //set the initial sort order of the data
        {column:"name", dir:"asc"},
    ],
    columns:
    [
        {
            title:"Org name", 
            field:"Org_name", 
            editor:"input",
            sorter:"string",
        },
        {
            title:"CA username", 
            field:"CA_username",
            editor:"input",
            sorter:"string",
        },
        {
            title:"CA password", 
            field:"CA_password",
            editor:"input",
            sorter:"string",
        },
        {
            title:"Peer username", 
            field:"peer_username",
            editor:"input",
            sorter:"string",
        },
        {
            title:"Peer password", 
            field:"peer_password",
            editor:"input",
            sorter:"string",
        },
        {
            title:"Port number", 
            field:"port_number",
            editor:"input",
            sorter:"string",
        },
        {
            title: 'Orderer',
            field:"isOrderer",
            formatter: 'tickCross',
            cellClick: function(ev, cell){
                    if (ev.target.nodeName === 'svg' || ev.target.nodeName === 'path'){
                cell.setValue(!cell.getValue());
            } else {
                // You clicked whitespace, not the actual icon.
            }
            }
        },
        {
            formatter:"buttonCross", 
            width:60, 
            align:"center", 
            cellClick:function(e, cell){
                cell.getRow().delete();}
        },
    ] 
});

var nameFilter = document.getElementById("nameFilter");
// function filterTable()
// {
//     table.setFilter("channel_name", "like", nameFilter.value);
// }
function makeAlert(type, title) {
    Swal.fire({
      title: title,
      icon: type,
      confirmButtonColor: '#3085d6',
    })
  }
function addData()
{
    table.addData([{}],true);
    console.log(table)
}

//document.getElementById("nameFilter").addEventListener("change", filterTable);
document.getElementById("addMemberBtn").addEventListener("click", addData);
async function getData(){
    var dataInput = table.getData(true)

    var channelName = document.getElementById("channelName").value 
    var orderer=0
    var username = []
    var port = []
    var isValid = true
    for(let i=0;i<dataInput.length;i++){
        console.log(username,orderer,port)
        
        if(dataInput[i]["isOrderer"] == true){
            orderer+=1
        }
        if(dataInput[i]["CA_username"]==dataInput[i]["peer_username"]){
            makeAlert("error", "CA username and peer username must't be identical")
            isValid=false
            break
        }
        else{
            if(username.indexOf(dataInput[i]["CA_username"])==-1 && username.indexOf(dataInput[i]["peer_username"])==-1 && port.indexOf(parseInt(dataInput[i]["port_number"]))==-1){
                username.push(dataInput[i]["CA_username"])
                username.push(dataInput[i]["peer_username"])
                port.push(parseInt(dataInput[i]["port_number"]))
            }
            else{
                makeAlert("error", "CA username, peer username or port number has existed")
                isValid=false
                break
            }
        }
        dataInput[i]["channel_name"] = channelName
    }
    isValid = true
    if(orderer!=1){
        makeAlert("error","Just 1 Orderer")
        isValid=false
    }

    if(isValid==true){
        const response = await fetch(`http://localhost:8080/api/network/createChannel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataInput)
        })
        if (response.status == 200) makeAlert("success", "Update Sucess")
        else makeAlert("error", "Update error")
    }
    
    

    
}