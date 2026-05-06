/**
 * server.js
 * Node.js Express server for Blockchain Assignment 2
 *
 * Responsibilities:
 *   - Serves all frontend files (HTML, CSS, JS, keys)
 *   - GET  /api/records/:node  → read a node's records from JSON file
 *   - POST /api/records/:node  → append a record to a node's JSON file
 *   - GET  /api/records        → read all nodes' records
 */

"use strict";

const express = require("express");
const fs      = require("fs");
const path    = require("path");

const app  = express();
const PORT = 3000;

// ── Serve all frontend files from project root ────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Helper: path to a node's record file ─────────────────────
function recordFile(nodeName) {
  return path.join(__dirname, "records", `node${nodeName}_records.json`);
}

// ── Helper: read a node's records ────────────────────────────
function readRecords(nodeName) {
  const fp = recordFile(nodeName);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

// ── Helper: write a node's records ───────────────────────────
function writeRecords(nodeName, records) {
  fs.writeFileSync(recordFile(nodeName), JSON.stringify(records, null, 2), "utf8");
}

// ── GET /api/records — all nodes ─────────────────────────────
app.get("/api/records", (req, res) => {
  const all = {};
  ["A", "B", "C", "D"].forEach(name => {
    all[name] = readRecords(name);
  });
  res.json(all);
});

// ── GET /api/records/:node — single node ─────────────────────
app.get("/api/records/:node", (req, res) => {
  const node = req.params.node.toUpperCase();
  if (!["A","B","C","D"].includes(node)) {
    return res.status(400).json({ error: "Invalid node" });
  }
  res.json(readRecords(node));
});

// ── POST /api/records/:node — store record for one node ──────
app.post("/api/records/:node", (req, res) => {
  const node   = req.params.node.toUpperCase();
  if (!["A","B","C","D"].includes(node)) {
    return res.status(400).json({ error: "Invalid node" });
  }
  const record  = req.body;
  const current = readRecords(node);
  current.push(record);
  writeRecords(node, current);
  res.json({ success: true, total: current.length });
});

// ── POST /api/records/store/all — store to all nodes ─────────
// Called by storeRecord() in consensus.js after consensus passes
app.post("/api/store", (req, res) => {
  const record = req.body;
  try {
    ["A", "B", "C", "D"].forEach(name => {
      const current = readRecords(name);
      current.push(record);
      writeRecords(name, current);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/reset — clear all records (demo reset) ─────────
app.post("/api/reset", (req, res) => {
  ["A", "B", "C", "D"].forEach(name => writeRecords(name, []));
  res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Server running → http://localhost:${PORT}`);
  console.log(`  Open your browser at http://localhost:${PORT}\n`);
});