let records = JSON.parse(localStorage.getItem("records")) || [];


function displayRecords() {

    document.querySelector(".warehouse_A tbody").innerHTML = "";
    document.querySelector(".warehouse_B tbody").innerHTML = "";
    document.querySelector(".warehouse_C tbody").innerHTML = "";
    document.querySelector(".warehouse_D tbody").innerHTML = "";

    NODES.forEach(node => {
        const records = loadRecords(node.name);

        records.forEach(record => {
            let row = `
                <tr>
                    <td>${record.itemId}</td>
                    <td>${record.quantity}</td>
                    <td>${record.unitPrice}</td>
                    <td>${record.nodeId}</td>
                </tr>
            `;

            document.querySelector(`.warehouse_${node.name} tbody`).innerHTML += row;
        });
    });
}

function log(message) {
    const box = document.getElementById("logBox");
    const p = document.createElement("p");
    p.innerText = message;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
}


document.getElementById("addRecordForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    let record = {
        action: "ADD",
        itemId: document.getElementById("ItemID").value,
        quantity: document.getElementById("ItemQTY").value,
        unitPrice: document.getElementById("ItemPrice").value,
        nodeId: document.getElementById("Location").value.toUpperCase(),
        itemName: "Item",
        timestamp: Date.now()
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    log("Signing record...");
    await delay(500);
    const signedRecord = await signRecord(record);
    log(`Digest (SHA-256): ${signedRecord.digest}`);
    log(`Signature: ${signedRecord.signature}`);

    log("Verifying across nodes...");
    await delay(500);
    const verificationResults = await verifyAcrossNodes(signedRecord);

    verificationResults.forEach(v => {
    log(`Node ${v.verifyingNode} recovered digest: ${v.recovered}`);
    log(`Node ${v.verifyingNode}: ${v.valid ? "✓ valid" : "✗ invalid"}`);
    });
    
    log("Running consensus...");
    await delay(500);
    const consensusResult = runConsensus(signedRecord, verificationResults);

    log(`${consensusResult.acceptCount}/3 nodes accepted`);

    if (consensusResult.approved) {
        log("Consensus reached. Storing record...");
        await delay(500);
        storeRecord(signedRecord);
        displayRecords();
        log("Record stored in all warehouses");
        alert("Record accepted and stored in all warehouses!");
    } 
    else {
        log("Consensus failed. Record rejected");
        alert("Record rejected by consensus!");
    }


    this.reset();
});



window.onload = displayRecords;

