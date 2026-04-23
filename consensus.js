"use strict";

// Select and justify an appropriate consensus
// mechanism for the given scenario.
// ─────────────────────────────────────────────────────────────

/*
  CHOSEN MECHANISM: Majority Voting (simplified PBFT)

  How it works:
    - After a record is signed and verified, each receiving node
      casts a vote: ACCEPT if the signature is valid, REJECT if not.
    - A record is only accepted if at least 3 out of 4 nodes
      vote ACCEPT.

  Why it suits this scenario:
    - 4 inventory nodes — a clear majority threshold (≥3) can
      always be determined without ambiguity.
    - A single faulty or malicious node cannot force acceptance
      of an invalid record on its own.
    - Lightweight and simple — no complex multi-round messaging
      needed for a small trusted inventory network.

  Trade-offs:
    - Latency: All 3 verifying nodes must respond before
    a decision is made.
    - Security: Tolerates 1 faulty node. If 2 or more nodes
   are compromised the system can be misled.
    - Fault tolerance: An offline node counts as a non-vote,
   making majority harder to reach — the system
   prioritises safety over availability.

  THRESHOLD: 3 out of 4 nodes must approve
*/

const CONSENSUS_THRESHOLD = 3;


// Implement the selected consensus mechanism to
// determine whether a newly submitted record should
// be accepted or rejected.
// ─────────────────────────────────────────────────────────────

function runConsensus(record, verificationResults) {
  const votes = verificationResults.map(result => ({
    node:  result.verifyingNode,
    vote:  result.valid ? "ACCEPT" : "REJECT",
    valid: result.valid,
  }));

  const acceptCount = votes.filter(v => v.vote === "ACCEPT").length;
  const rejectCount = votes.filter(v => v.vote === "REJECT").length;
  const approved    = acceptCount >= CONSENSUS_THRESHOLD;

  return {
    approved,
    votes,
    acceptCount,
    rejectCount,
    threshold: CONSENSUS_THRESHOLD,
  };
}


// Ensure that all inventory nodes reach a consistent
// decision before the record is stored locally.
// ─────────────────────────────────────────────────────────────

function allNodesAgree(consensusResult) {
  const votes  = consensusResult.votes.map(v => v.vote);
  const unique = new Set(votes);
  return unique.size === 1;
}


// After a successful consensus outcome, store the
// accepted record in each inventory node's local
// database.
// ─────────────────────────────────────────────────────────────


function storeRecord(record) {
  NODES.forEach(node => {
    const key     = `node_${node.name}_records`;
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.push(record);
    localStorage.setItem(key, JSON.stringify(current));
    node.records  = current;
  });
}

/*
  loadRecords() retrieves stored records for a given node
  from localStorage — called on page load to restore state.
*/
function loadRecords(nodeName) {
  const key = `node_${nodeName}_records`;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

/*
  clearAllRecords() wipes all node storage 
*/
function clearAllRecords() {
  NODES.forEach(node => {
    localStorage.removeItem(`node_${node.name}_records`);
    node.records = [];
  });
}
