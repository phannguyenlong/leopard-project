var tabledata = [
    {
        "Org_name":"company1", 
        "CA_username":"certiauth",
        "CA_password":"bobo",
        "peer_username":"peer0",
        "peer_password":"12345",
        "channel_name":"channel1",
        "port_number":"0000"
    },
    {
        "Org_name":"company2", 
        "CA_username":"certiauth",
        "CA_password":"12345",
        "peer_username":"peer0",
        "peer_password":"12345",
        "channel_name":"channel1",
        "port_number":"0000"
    },
];

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
            field:"channel_name",
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
            title:"Channel name", 
            field:"channel_name",
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

function addData()
{
    table.addData([{}],true);
    console.log(table)
}

//document.getElementById("nameFilter").addEventListener("change", filterTable);
document.getElementById("addMemberBtn").addEventListener("click", addData);