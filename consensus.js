"use strict";

/*
==============================================================
  consensus.js
  Task 2: Consensus Protocol Integration

  Chosen Mechanism: Practical Byzantine Fault Tolerance (PBFT)

  PBFT is chosen because:
    - 4 known inventory nodes — small permissioned network
    - Designed for networks where nodes may be faulty/malicious
    - Tolerates f Byzantine nodes where n >= 3f + 1
        n = 4, f = 1 → 4 >= 3(1) + 1 = 4 ✓
      meaning 1 malicious node can be tolerated
    - No cryptocurrency or mining required — purely vote based
    - Assignment requires handling malicious updates — PBFT
      explicitly addresses this

  3 Phases:
    1. PRE-PREPARE — leader node proposes the signed record
    2. PREPARE     — all other nodes verify and cast votes
    3. COMMIT      — if threshold met, record is committed

  Note on implementation:
    In a real PBFT system, nodes exchange prepare and commit
    messages across the network. In this implementation, we
    simulate this behaviour through aggregated vote collection,
    as a full distributed network is not required per the
    assignment specification.

  Trade-offs:
    - Latency:        All verifying nodes must respond before
                      a decision is made
    - Security:       Tolerates 1 Byzantine node out of 4
    - Fault tolerance: Offline node = non-vote, system
                      prioritises safety over availability
    - Scalability:    Best for small networks — suits 4 nodes

  THRESHOLD: 3 out of 4 nodes (satisfies n >= 3f + 1)
==============================================================
*/

const TOTAL_NODES         = 4;
const CONSENSUS_THRESHOLD = 3;


// ─────────────────────────────────────────────────────────────
// PBFT — 3 Phase Consensus
// ─────────────────────────────────────────────────────────────

/*
  runPBFTConsensus() implements the 3 PBFT phases:

  Phase 1 — PRE-PREPARE:
    Leader (originating node) proposes the signed record
    to all other nodes for validation.

  Phase 2 — PREPARE:
    Each receiving node verifies the digital signature:
      m' = s^e mod n
    If m' == m → vote ACCEPT
    If m' != m → vote REJECT
    Threshold check: acceptCount >= 3

  Phase 3 — COMMIT:
    If threshold is met in PREPARE, nodes commit.
    Final decision is broadcast — record is either
    accepted and stored, or rejected.
*/

function runPBFTConsensus(record, verificationResults) {

  // ── Phase 1: PRE-PREPARE ───────────────────────────────────
  // Leader node proposes the signed record to all other nodes
  const proposal = {
    phase:    "PRE-PREPARE",
    leader:   record.nodeId,
    recordId: record.itemId,
    digest:   record.digest || "N/A",
  };

  // ── Phase 2: PREPARE ───────────────────────────────────────
  // Each node verifies the signature and casts a vote
  // Formula: m' = s^e mod n, valid if m' == m
  const prepareVotes = verificationResults.map(result => ({
    node:    result.verifyingNode,
    vote:    result.valid ? "ACCEPT" : "REJECT",
    valid:   result.valid,
    formula: `m' = s^e mod n → m' ${result.valid ? "==" : "!="} m → ${result.valid ? "ACCEPT" : "REJECT"}`,
  }));

  const prepareCount  = prepareVotes.filter(v => v.vote === "ACCEPT").length;
  const prepareResult = prepareCount >= CONSENSUS_THRESHOLD;

  // If threshold not met in PREPARE phase — fail early
  if (!prepareResult) {
    return {
      approved:    false,
      phase:       "PREPARE_FAILED",
      proposal,
      prepareVotes,
      prepareCount,
      commitVotes: [],
      commitCount: 0,
      threshold:   CONSENSUS_THRESHOLD,
      formula:     `${prepareCount} >= ${CONSENSUS_THRESHOLD} ? NO → REJECTED`,
    };
  }

  // ── Phase 3: COMMIT ────────────────────────────────────────
  // Threshold met in PREPARE — nodes commit to the decision
  const commitVotes = prepareVotes.map(v => ({
    node: v.node,
    vote: v.vote,
  }));

  const commitCount = commitVotes.filter(v => v.vote === "ACCEPT").length;
  const approved    = commitCount >= CONSENSUS_THRESHOLD;

  return {
    approved,
    phase:       "COMMIT",
    proposal,
    prepareVotes,
    prepareCount,
    commitVotes,
    commitCount,
    threshold:   CONSENSUS_THRESHOLD,
    formula:     `${commitCount} >= ${CONSENSUS_THRESHOLD} ? ${approved ? "YES → APPROVED" : "NO → REJECTED"}`,
  };
}


// ─────────────────────────────────────────────────────────────
// Consensus Check
// PBFT uses majority — NOT unanimity
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