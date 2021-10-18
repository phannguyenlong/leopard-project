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
            title:"Organization", 
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
            title: 'Is orderer?',
            field:"isOrderer",
            formatter: 'tickCross',
            cellClick: function(ev, cell){
                if (ev.target.nodeName === 'svg' || ev.target.nodeName === 'path'){
                    cell.setValue(!cell.getValue());
                } else {
                    // You clicked whitespace, not the actual icon.
                }
            }
        }
    ] 
});

var schemaTable = new Tabulator("#schemaTable",{
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
            title:"Field value", 
            field:"title", 
            editor:"input",
            sorter: "string",
            validator: "required" 
        },
        {
            title:"Field type", 
            field:"type",
            editor: "select",
            editorParams: { values: { string: "string", integer: "integer" } },
            validator: "required" 
        },
        {
            title: 'Required',
            field: "isRequired",
            validator: "required",
            formatter: 'tickCross',
            cellClick: function(ev, cell){
                if (ev.target.nodeName === 'svg' || ev.target.nodeName === 'path'){
                    cell.setValue(!cell.getValue());
                } else {
                    // You clicked whitespace, not the actual icon.
                }
            }
        }
    ] 
});
// mock column
table.addData([{}],true)
schemaTable.addData([{}],true)

function makeAlert(type, title) {
    Swal.fire({
      title: title,
      icon: type,
      confirmButtonColor: '#3085d6',
    })
}

document.getElementById("addMemberBtn").addEventListener("click", () =>  table.addData([{}],true));
document.getElementById("addFieldBtn").addEventListener("click", () =>  schemaTable.addData([{}],true));

async function getData(){
    var dataInput = table.getData(true)
    var schemaInput = schemaTable.getData(true)

    console.log(schemaInput)

    var channelName = document.getElementById("channelName").value 
    var orderer=0
    var username = []
    var port = []
    var isValid = true

    for(let i=0;i<dataInput.length;i++){ 
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
    if(channelName===''){
        makeAlert("error","Input channel name")
        isValid=false
    }

    if (schemaTable.validate() != true) {
        makeAlert("error", "Wrong data type of data schema")
        isValid = false
    }
    let submitData = { channel: dataInput, schema: schemaInput}

    console.log(submitData)
    if(isValid==true){
        var log = {}
        var Objlog = document.getElementById("log")
        for(let i=0;i<dataInput.length;i++){
            let orgNameUnderscore = String(dataInput[i]["Org_name"]).replace(" ","_")
            log[orgNameUnderscore] = ""
            // Objlog.innerHTML+=`<p id=log_${orgNameUnderscore}><b>${dataInput[i]["Org_name"]}</b> :<span class="loading"></span></p>`
            Objlog.innerHTML+=`<div class=loader id=log_${orgNameUnderscore}><p><b>${dataInput[i]["Org_name"]}</b> :</p><span></span>
            <span></span>
            <span></span></div>`
        }
        log["Channel"] = ""
        log["Deploy"] = ""
        // Objlog.innerHTML+=`<p id=log_Channel><b>Channel</b> :</p>`
        // Objlog.innerHTML+=`<p id=log_Deploy><b>Deploy</b> :</p>`
        Objlog.innerHTML+=`<div class=loader id=log_Channel><p><b>Channel</b> :</p><span></span>
        <span></span>
        <span></span></div>`
        Objlog.innerHTML+=`<div class=loader id=log_Deploy><p><b>Deploy</b> :</p><span></span>
        <span></span>
        <span></span></div>`


        var response = await fetch(`http://localhost:8080/api/network/createChannel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
        const reader = response.body.getReader();
        var error = false
        // make a loop to recieve data from stream
        while (true) {
            const { value, done } = await reader.read();
            if (done) break; // if stream is done, get out of the loop

            // deccode data from stream
            var stringUnderscore = new TextDecoder().decode(value).replace(" ","_");
            log[stringUnderscore] = true
            console.log(stringUnderscore)
            if (response.status == 500) {
                console.log("eror herer")
                makeAlert("error", stringUnderscore)
                error=true
                break
            }
            document.getElementById(`log_${stringUnderscore}`).innerHTML=`<div><p><b>${stringUnderscore}</b>: <img src="./greenTick.png" alt="correct" width="32" height="32"></p></div>`
            // print it out
            console.log('Received', stringUnderscore);
            
        }
        if(error==true){
            Objlog.innerHTML=""
        }

        if (response.status == 200) makeAlert("success", "Update Sucess")
        else {
            response.text().then(text => {
                makeAlert("error", text)
            })
        }
    }    
}