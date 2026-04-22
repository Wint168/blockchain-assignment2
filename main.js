let records = JSON.parse(localStorage.getItem("records")) || [];


function displayRecords() {
    
    document.querySelector(".warehouse_A tbody").innerHTML = "";
    document.querySelector(".warehouse_B tbody").innerHTML = "";
    document.querySelector(".warehouse_C tbody").innerHTML = "";
    document.querySelector(".warehouse_D tbody").innerHTML = "";

    records.forEach(record => {
        let row = `
            <tr>
                <td>${record.id}</td>
                <td>${record.qty}</td>
                <td>${record.price}</td>
                <td>${record.location}</td>
            </tr>
        `;

        
        if (record.location === "A") {
            document.querySelector(".warehouse_A tbody").innerHTML += row;
        } else if (record.location === "B") {
            document.querySelector(".warehouse_B tbody").innerHTML += row;
        } else if (record.location === "C") {
            document.querySelector(".warehouse_C tbody").innerHTML += row;
        } else if (record.location === "D") {
            document.querySelector(".warehouse_D tbody").innerHTML += row;
        }
    });
}


document.getElementById("addRecordForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let newRecord = {
        id: document.getElementById("ItemID").value,
        qty: document.getElementById("ItemQTY").value,
        price: document.getElementById("ItemPrice").value,
        location: document.getElementById("Location").value.toUpperCase()
    };

    records.push(newRecord);
    localStorage.setItem("records", JSON.stringify(records));

    displayRecords();
    this.reset();
});


window.onload = displayRecords;

