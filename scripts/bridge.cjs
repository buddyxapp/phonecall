// Voice bridge helper — check for pending requests or write a response
// Usage:
//   node bridge.cjs poll          — returns oldest pending request (or "none")
//   node bridge.cjs reply <id> <text>  — write response for request id
//   node bridge.cjs status        — show all pending requests
const fs = require("fs");
const path = require("path");
const BRIDGE = "/home/node/.openclaw/workspace/skills/phone-call/bridge";
fs.mkdirSync(BRIDGE, { recursive: true });

const cmd = process.argv[2];

if (cmd === "poll") {
  const files = fs.readdirSync(BRIDGE).filter(f => f.startsWith("request_")).sort();
  if (files.length === 0) { console.log("none"); process.exit(0); }
  const req = JSON.parse(fs.readFileSync(path.join(BRIDGE, files[0]), "utf-8"));
  console.log(JSON.stringify(req));
} else if (cmd === "reply") {
  const id = process.argv[3];
  const text = process.argv.slice(4).join(" ");
  if (!id || !text) { console.error("Usage: node bridge.cjs reply <id> <text>"); process.exit(1); }
  // Write response
  fs.writeFileSync(path.join(BRIDGE, `response_${id}.json`), JSON.stringify({ text }));
  // Remove request
  const reqFile = path.join(BRIDGE, `request_${id}.json`);
  if (fs.existsSync(reqFile)) fs.unlinkSync(reqFile);
  console.log("ok");
} else if (cmd === "status") {
  const files = fs.readdirSync(BRIDGE).filter(f => f.startsWith("request_"));
  if (files.length === 0) { console.log("No pending requests"); process.exit(0); }
  for (const f of files) {
    const req = JSON.parse(fs.readFileSync(path.join(BRIDGE, f), "utf-8"));
    console.log(`[${req.id}] ${req.text}`);
  }
} else {
  console.error("Usage: node bridge.cjs poll|reply|status");
  process.exit(1);
}
