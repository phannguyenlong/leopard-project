//============================Init part===============================
    // Check Auth
    fetch("http://localhost:8080/api/auth/").then(res => {
      if (res.status != 200) {
        window.location.href = "http://localhost:8080/login.html";
      }
    })

    let product, table
    let id = (new URL(window.location.href)).searchParams.get("id");
    document.getElementById("headerText").innerHTML = `${id}`
    
    // fetch data and constrcut table
    fetch(`http://localhost:8080/api/ledger/getData?id=${id}`).then(res => res.json())
      .then(data => {
        data = data[0].Record
        product = data
        var tabledata = data.procedures

        // add data to product information
        document.getElementById("productID").innerHTML = data.productID
        document.getElementById("productDescription").innerHTML = data.productDescription
        document.getElementById("productType").innerHTML = data.productType
        document.getElementById("numberOfProcedure").innerHTML = data.numberOfProcedure
	
        // Config column
        keys = Object.keys(data.procedures[0])
        let columns_config = []
        for (let i = 0; i < keys.length; i++) {
          columns_config[i] = { title: keys[i], field: keys[i], editor: "input", validator: "required" }
        }

        //initialize table
        table = new Tabulator("#table", {
          data: tabledata, //assign data to table
          layout: "fitColumns",
          selectable:true, //make rows selectable
          // selectableRangeMode:"click",
          // tooltips: true,            //show tool tips on cell
          addRowPos: "top",          //when adding a new row, add it to the top of the table
          history: true,             //allow undo and redo actions on the table
          movableColumns: true,      //allow column order to be changed
          printAsHtml: true, //enable html table printing
          printHeader: `<h2>Product ${data.productID} report<h1>`,
          columns: columns_config,
          validationMode: "highlight"
        });
        
        updateTimeline(data.productID);
      })
      

    //trigger download of data.xlsx file
    document.getElementById("download-xlsx").addEventListener("click", function () {
      table.download("xlsx", "data.xlsx", { sheetName: `product ${id} report` });
    });

    //trigger download of data.pdf file
    document.getElementById("download-pdf").addEventListener("click", function () {
      table.download("pdf", "data.pdf", {
        orientation: "portrait", //set page orientation to portrait
        title: `Product ${id} Report`, //add title to report
      });
    });

    // for doing timeline
    async function updateTimeline(productID)
    {
        console.log("Product ID: " + productID);
        
        const url = `http://localhost:8080/api/ledger/GetProductHistory?id=${productID}`;
        
        const dataContainer = await fetch(url);
        
        var data = await dataContainer.json();
        console.log(data);
        console.log("Timestamp: " + data[0].Timestamp);
        
	//let timeElements = [];
	var timeline = document.getElementById("timelineContent");
        
        for(var i = 0; i < data.length; i++)
        {
		var tmp = data[i].Timestamp;
		var time = new Date(parseInt(tmp) * 1000);
		console.log(time);

		var date = time.getDate();
		var month = time.getMonth() + 1;
		var year = time.getFullYear();
		
		var hours = time.getHours();
		
		var minutes = time.getMinutes();
		var seconds = time.getSeconds();
		
		var dateFormat = date + "/" + month + "/" + year;
		var timeFormat = hours + ":" + minutes + ":" + seconds;
	        console.log(dateFormat + " - " + timeFormat);        
		/*var p = 
		`<li>
			  <div class="timeContainer">
			    <div class="time">
				<p>${timeFormat}</p>
			    </div>
			    <div class="content">
				<p>Product was updated</p>
			    </div>
			  </div>
		  </li>`;
		
		timeElements[i] = p;*/

		
		for(var j = 0; j < data[i].changes.length; j++)
		{
   		   var li = document.createElement("li");
		   var div = document.createElement('div');
		   div.className = "timeContainer";
		
		   var div2 = document.createElement('div');
		   div2.className = "time";
		   var el = document.createTextNode(timeFormat);
		   div2.appendChild(el);
		
		   var div3 = document.createElement('div');
		   div3.className = "content";
		
		   console.log("Change status: " + data[i].changes[j].status);
		   if(data[i].changes[j].status == "Edited")
		   {
		      var el2 = document.createTextNode("Attribute " + data[i].changes[j].location + " has changed " + data[i].changes[j].old + " to " + data[i].changes[j].new);
		   }
		   else if(data[i].changes[j].status == "Changes")
		   {
		      continue;
		   }
		   else if(data[i].changes[j].status == "Created")
		   {
		      var el2 = document.createTextNode("Product is created");
		   }
		   
		   div3.appendChild(el2);
		
		   div.appendChild(div2);
		   div.appendChild(div3);
		
		   li.appendChild(div);
		   timeline.appendChild(li);
		}
        }
        
        let div4 = document.createElement('div');
        div4.style.cssText="clear: both;";
        timeline.appendChild(div4);
        
    }

    //=======================Function part========================================
    // for makeAlert
    function makeAlert(type, title) {
      Swal.fire({
        title: title,
        icon: type,
        confirmButtonColor: '#3085d6',
      })
    }

    async function updateData() {
      product.procedures = table.getData()
      product.numberOfProcedure = product.procedures.length

      if (table.validate() == true) {
        const response = await fetch(`http://localhost:8080/api/ledger/updateProduct`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(product)
        })
        if (response.status == 200) makeAlert("success", "Update Sucess")
        else makeAlert("error", "Update error")
      } else {
        makeAlert("error", "Wrong data type")
      }
    }

    async function deleteData() {
      const response = await fetch(`http://localhost:8080/api/ledger/deleteValueByKey?id=${product.productID}`, {
          method: 'DELETE',
        })
        if (response.status == 200) makeAlert("success", "Delete Sucess")
        else makeAlert("error", "Delete error")
    }
