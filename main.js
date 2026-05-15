"use strict";

// ─────────────────────────────────────────────────────────────
// PROCESS LOG HELPERS
// ─────────────────────────────────────────────────────────────

function clearLog() {
  document.getElementById("logBox").innerHTML = "";
}

function logTitle(title) {
  const box = document.getElementById("logBox");
  const el  = document.createElement("div");
  el.className   = "log-title";
  el.textContent = title;
  box.appendChild(el);
  box.scrollTop  = box.scrollHeight;
}

function logRow(label, value) {
  const box = document.getElementById("logBox");
  const el  = document.createElement("div");
  el.className = "log-row";
  el.innerHTML  = `<span class="log-label">${label}</span><span class="log-value">${value}</span>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function logFormula(formula) {
  const box = document.getElementById("logBox");
  const el  = document.createElement("div");
  el.className   = "log-formula";
  el.textContent = formula;
  box.appendChild(el);
  box.scrollTop  = box.scrollHeight;
}

function logResult(message, success) {
  const box = document.getElementById("logBox");
  const el  = document.createElement("div");
  el.className   = `log-result ${success ? "success" : "failure"}`;
  el.textContent = `${success ? "✓" : "✗"} ${message}`;
  box.appendChild(el);
  box.scrollTop  = box.scrollHeight;
}

function logSpacer() {
  const box = document.getElementById("logBox");
  const el  = document.createElement("div");
  el.style.marginBottom = "6px";
  box.appendChild(el);
}

// Helper — truncate long numbers for display but keep enough to be meaningful
function short(val, len = 20) {
  const s = val.toString();
  return s.length > len ? s.slice(0, len) + "…" : s;
}


// ─────────────────────────────────────────────────────────────
// DISPLAY RECORDS — loads from server JSON files
// ─────────────────────────────────────────────────────────────

async function displayRecords() {
  document.querySelector(".warehouse_A tbody").innerHTML = "";
  document.querySelector(".warehouse_B tbody").innerHTML = "";
  document.querySelector(".warehouse_C tbody").innerHTML = "";
  document.querySelector(".warehouse_D tbody").innerHTML = "";

  const all = await loadAllRecords();

  ["A", "B", "C", "D"].forEach(name => {
    const records = all[name] || [];
    records.forEach(record => {
      const row = `
        <tr>
          <td>${record.itemId}</td>
          <td>${record.quantity}</td>
          <td>${record.unitPrice}</td>
          <td>${record.nodeId}</td>
        </tr>
      `;
      document.querySelector(`.warehouse_${name} tbody`).innerHTML += row;
    });
  });
}

const addModeBtn = document.getElementById("addModeBtn");
const searchModeBtn = document.getElementById("searchModeBtn");

const addSystem = document.getElementById("addSystem");
const searchSystem = document.getElementById("searchSystem");

addModeBtn.addEventListener("click", () => {
    addSystem.style.display = "block";
    searchSystem.style.display = "none";
});

searchModeBtn.addEventListener("click", () => {
    addSystem.style.display = "none";
    searchSystem.style.display = "block";
});
// ─────────────────────────────────────────────────────────────
// SUBMIT HANDLER
// ─────────────────────────────────────────────────────────────

document.getElementById("addRecordForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  clearLog();

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const record = {
    action:    "ADD",
    itemId:    document.getElementById("ItemID").value,
    quantity:  Number(document.getElementById("ItemQTY").value),
    unitPrice: Number(document.getElementById("ItemPrice").value),
    nodeId:    document.getElementById("Location").value.toUpperCase(),
    itemName:  "Item",
    timestamp: new Date().toLocaleString(),
  };

  const node = getNode(record.nodeId);

  // ── [1] KEY GENERATION ─────────────────────────────────────
  logTitle(`[1] KEY GENERATION — Node ${node.name}`);
  logRow("p",   node.p.toString());
  logRow("q",   node.q.toString());
  logRow("e",   node.pk.e.toString());
  logSpacer();

  // n = p × q
  logFormula(
    `n = p × q\n` +
    `n = ${short(node.p)} × ${short(node.q)}\n` +
    `n = ${short(node.pk.n)}`
  );
  logSpacer();

  // φ(n) = (p-1)(q-1)
  logFormula(
    `φ(n) = (p - 1)(q - 1)\n` +
    `φ(n) = (${short(node.p)} - 1)(${short(node.q)} - 1)\n` +
    `φ(n) = ${short(node.phi)}`
  );
  logSpacer();

  // d = e⁻¹ mod φ(n)
  logFormula(
    `d = e⁻¹ mod φ(n)\n` +
    `d = ${short(node.pk.e)}⁻¹ mod ${short(node.phi)}\n` +
    `d = ${short(node.sk.d)}`
  );
  logSpacer();

  logRow("Public key  pk = (e, n)", `e = ${short(node.pk.e)}, n = ${short(node.pk.n)}`);
  logRow("Private key sk = (d)",    `d = ${short(node.sk.d)}`);
  logSpacer();
  await delay(600);

  // ── [2] SIGNING ────────────────────────────────────────────
  logTitle(`[2] SIGNING — Node ${node.name}`);
  logRow("Message (record)", canonicalise(record));
  await delay(300);

  const signedRecord = await signRecord(record);
  const m = BigInt("0x" + signedRecord.digest);

  // SHA-256
  logFormula(
    `digest = SHA-256(payload)\n` +
    `digest = ${signedRecord.digest}`
  );
  logSpacer();

  // Convert hex digest to decimal (m)
  logFormula(
    `Converting hex digest to decimal\n` +
    `m = ${short(m)}`
  );
  logSpacer();

  // s = m^d mod n
  logFormula(
    `s = m^d mod n\n` +
    `s = ${short(m)}^${short(node.sk.d)} mod ${short(node.pk.n)}\n` +
    `s = ${short(signedRecord.signature)}`
  );
  logSpacer();
  await delay(600);

  // ── [3] VERIFICATION ───────────────────────────────────────
  const otherNodes = NODES.filter(n => n.name !== record.nodeId);
  logTitle(`[3] VERIFICATION — Nodes ${otherNodes.map(n => n.name).join(", ")}`);
  logRow("Using sender public key", `e = ${short(node.pk.e)}, n = ${short(node.pk.n)}`);
  logSpacer();
  await delay(300);

  const verificationResults = await verifyAcrossNodes(signedRecord);

  for (const v of verificationResults) {
    logRow(`Node ${v.verifyingNode} — recompute digest`, "SHA-256(payload)");

    // m' = s^e mod n
    logFormula(
      `m' = s^e mod n\n` +
      `m' = ${short(signedRecord.signature)}^${short(node.pk.e)} mod ${short(node.pk.n)}\n` +
      `m' = ${short(v.recovered)}`
    );
    logSpacer();

    // compare
    logFormula(
      `digest == m'?\n` +
      `${short(v.digest)} == ${short(v.recovered)}\n` +
      `${v.valid ? "✓ TRUE — signature is valid" : "✗ FALSE — signature is invalid"}`
    );

    logResult(
      `Node ${v.verifyingNode}: signature ${v.valid ? "VALID" : "INVALID"}`,
      v.valid
    );
    logSpacer();
    await delay(300);
  }

  // ── [4] CONSENSUS — PBFT (3 Phases) ───────────────────────
  logTitle("[4] CONSENSUS — Proof of Authority (PoA)");
logSpacer();
await delay(400);

const consensusResult = runPoAConsensus(signedRecord, verificationResults);

// Step 1 — Authority Check
logTitle("  Step 1: AUTHORITY CHECK");
logFormula(
  `Authorised nodes: ${AUTHORISED_NODES.join(", ")}\n` +
  `Submitting node: ${consensusResult.submittingNode}\n` +
  `Is authorised? ${consensusResult.isAuthorised ? "✓ YES — Node " + consensusResult.submittingNode + " is a recognised authority" : "✗ NO — Node " + consensusResult.submittingNode + " is NOT authorised"}`
);
logSpacer();
await delay(400);

// Step 2 — Authority Validation
logTitle("  Step 2: AUTHORITY VALIDATION");
logRow("Formula", "m' = s^e mod n, valid if m' == m");
logSpacer();

consensusResult.votes.forEach(v => {
  logFormula(v.formula);
  logFormula(`Node ${v.node} → vote = ${v.vote}`);
  logSpacer();
});

logFormula(
  `Approved count = ${consensusResult.approvedCount} / ${otherNodes.length}\n` +
  `Rejected count = ${consensusResult.rejectedCount} / ${otherNodes.length}\n` +
  `Threshold = ${consensusResult.threshold} approvals required\n` +
  `${consensusResult.approvedCount} >= ${consensusResult.threshold} ? ${consensusResult.approvedCount >= consensusResult.threshold ? "✓ YES" : "✗ NO"}`
);
logSpacer();
await delay(400);

// Step 3 — Consensus Decision
logTitle("  Step 3: CONSENSUS DECISION");
logFormula(
  `Node ${consensusResult.submittingNode} is authorised: ${consensusResult.isAuthorised ? "✓ YES" : "✗ NO"}\n` +
  `Majority approval: ${consensusResult.approvedCount >= consensusResult.threshold ? "✓ YES" : "✗ NO"}\n` +
  `Final decision: ${consensusResult.approved ? "✓ ACCEPTED" : "✗ REJECTED"}`
);
logSpacer();
await delay(400);

  // ── [5] STORAGE ────────────────────────────────────────────
  if (consensusResult.approved) {
    logTitle("[5] STORAGE — Writing to node record files");
    await delay(300);

    try {
      await storeRecord(signedRecord);

      for (const n of NODES) {
        logFormula(`node${n.name}_records.json ← record appended ✓`);
        await delay(150);
      }

      logSpacer();
      logResult(
        `CONSENSUS APPROVED — ${consensusResult.approvedCount}/${otherNodes.length} authority nodes approved. Record stored in all nodes.`,
        true
      );

      await displayRecords();

    } catch (err) {
      logResult(`Storage error: ${err.message}`, false);
    }

  } else {
    logSpacer();
    logResult(
        `CONSENSUS FAILED — only ${consensusResult.approvedCount}/${otherNodes.length} authority nodes approved. Threshold not met.`,
        false
      );
  }

  this.reset();
});



// ─────────────────────────────────────────────────────────────
// PAGE LOAD
// ─────────────────────────────────────────────────────────────

window.onload = displayRecords;
