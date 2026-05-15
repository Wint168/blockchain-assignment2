"use strict";

/*
==============================================================
  consensus.js
  Task 2: Consensus Protocol Integration

  Chosen Mechanism: Proof of Authority (PoA)

  PoA is chosen because:
    - The system consists of 4 known, pre-approved inventory
      nodes — a small permissioned network where all
      participants are established in advance
    - No cryptocurrency, mining, or staking is required 
      consensus is reached through authority validation
    - Suited for private, controlled environments such as
      this inventory management system
    - Each node is a recognised authority — only authorised
      nodes can submit and validate records

  How it works:
    - The submitting node must be a recognised authority
    - All other authority nodes validate the digital signature
    - If the submitting node is authorised AND a majority of
      other nodes approve → record is accepted
    - If the submitting node is not authorised → rejected

  Trade-offs:
    - Latency:        All authority nodes must validate before
                      a decision is made
    - Trust:          Relies on pre-approved node identities —
                      suitable for a controlled inventory system
    - Fault tolerance: If an authority node goes offline it
                      cannot validate — system prioritises
                      consistency over availability
    - Scalability:    Best for small fixed networks of known
                      participants — suits this 4-node system
    - Efficiency:     No computational overhead — faster than
                      PoW and simpler than BFT voting rounds

  AUTHORISED NODES: A, B, C, D
  APPROVAL THRESHOLD: majority of validating nodes (>= 2 of 3)
==============================================================
*/

const AUTHORISED_NODES    = ["A", "B", "C", "D"];
const CONSENSUS_THRESHOLD = 2; // majority of 3 validating nodes


// ─────────────────────────────────────────────────────────────
// PoA — Proof of Authority Consensus
// ─────────────────────────────────────────────────────────────

/*
  runPoAConsensus() implements PoA consensus:

  Step 1 — AUTHORITY CHECK:
    Verify the submitting node is a recognised authority.
    If not authorised → reject immediately.

  Step 2 — AUTHORITY VALIDATION:
    Each other authority node verifies the digital signature:
      m' = s^e mod n
    If m' == m → APPROVED
    If m' != m → REJECTED

  Step 3 — CONSENSUS DECISION:
    If node is authorised AND majority of validators approve
    → record is accepted and stored.
*/

function runPoAConsensus(record, verificationResults) {

  // ── Step 1: AUTHORITY CHECK ────────────────────────────────
  // Verify the submitting node is a recognised authority
  const isAuthorised = AUTHORISED_NODES.includes(record.nodeId);

  if (!isAuthorised) {
    return {
      approved:      false,
      phase:         "AUTHORITY_FAILED",
      isAuthorised:  false,
      submittingNode: record.nodeId,
      votes:         [],
      approvedCount: 0,
      threshold:     CONSENSUS_THRESHOLD,
      formula:       `Node ${record.nodeId} is NOT a recognised authority → REJECTED`,
    };
  }

  // ── Step 2: AUTHORITY VALIDATION ──────────────────────────
  // Each authority node verifies the digital signature
  // Formula: m' = s^e mod n, valid if m' == m
  const votes = verificationResults.map(result => ({
    node:    result.verifyingNode,
    vote:    result.valid ? "APPROVED" : "REJECTED",
    valid:   result.valid,
    formula: `m' = s^e mod n → m' ${result.valid ? "==" : "!="} m → ${result.valid ? "APPROVED" : "REJECTED"}`,
  }));

  const approvedCount = votes.filter(v => v.vote === "APPROVED").length;
  const rejectedCount = votes.filter(v => v.vote === "REJECTED").length;
  const approved      = isAuthorised && approvedCount >= CONSENSUS_THRESHOLD;

  // ── Step 3: CONSENSUS DECISION ─────────────────────────────
  return {
    approved,
    phase:          approved ? "ACCEPTED" : "REJECTED",
    isAuthorised,
    submittingNode: record.nodeId,
    votes,
    approvedCount,
    rejectedCount,
    threshold:      CONSENSUS_THRESHOLD,
    formula:        `${approvedCount} >= ${CONSENSUS_THRESHOLD} ? ${approved ? "YES → ACCEPTED" : "NO → REJECTED"}`,
  };
}


// ─────────────────────────────────────────────────────────────
// Consensus Check
// PoA uses majority approval from authority nodes
// ─────────────────────────────────────────────────────────────

function hasConsensus(consensusResult) {
  return consensusResult.approved;
}


// ─────────────────────────────────────────────────────────────
// Store accepted record in each node's local database
// ─────────────────────────────────────────────────────────────

async function storeRecord(record) {
  const response = await fetch("/api/store", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error("Failed to store record on server");
  }

  return await response.json();
}


// ─────────────────────────────────────────────────────────────
// Load Records
// ─────────────────────────────────────────────────────────────

async function loadRecords(nodeName) {
  const response = await fetch(`/api/records/${nodeName}`);
  if (!response.ok) return [];
  return await response.json();
}

async function loadAllRecords() {
  const response = await fetch("/api/records");
  if (!response.ok) return { A: [], B: [], C: [], D: [] };
  return await response.json();
}

async function clearAllRecords() {
  await fetch("/api/reset", { method: "POST" });
}
