#!/usr/bin/env node
// DS2 brain — stdio MCP shim.
//
// Gives LOCAL Claude Code agents (on either founder's laptop) the same shared
// pgvector brain the deployed copilot uses. It forwards tool calls over HTTPS to
// the /api/admin/brain bridge route, authenticated with a narrow BRAIN_BRIDGE
// token — the powerful Supabase service-role key never leaves the server.
//
// Zero dependencies: implements the MCP stdio protocol (newline-delimited
// JSON-RPC 2.0) directly, so there is nothing to install. Node 18+ (global fetch).
//
// Env:
//   DS2_BRAIN_URL     bridge endpoint (default https://www.ds2-consulting.com/api/admin/brain)
//   DS2_BRAIN_TOKEN   must match BRAIN_BRIDGE_TOKEN set in Vercel (required)
//   DS2_BRAIN_AUTHOR  who to attribute saved facts to, e.g. "dath" (optional)

// Trailing slash: the app runs trailingSlash:true, so the slashless path 308-redirects.
const BRAIN_URL = process.env.DS2_BRAIN_URL || "https://www.ds2-consulting.com/api/admin/brain/";
const TOKEN = process.env.DS2_BRAIN_TOKEN || "";
const AUTHOR = process.env.DS2_BRAIN_AUTHOR || "";
const SERVER_INFO = { name: "ds2-brain", version: "1.0.0" };

const TOOLS = [
  {
    name: "brain_recall",
    description:
      "Search the shared DS2 brain for durable facts — client preferences, decisions, who-owns-what, rules. Hybrid semantic + keyword search. Use before answering anything that might depend on prior context.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look up." },
        k: { type: "number", description: "Max facts to return (1-20, default 6)." },
      },
      required: ["query"],
    },
  },
  {
    name: "brain_remember",
    description:
      "Save a durable fact to the shared DS2 brain so it persists across conversations and is shared with the other founder and the deployed copilot. Near-identical facts are refreshed, not duplicated. Save decisions, preferences, and rules — not transient chatter.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The fact, stated plainly in one sentence." },
        kind: { type: "string", description: 'Category, e.g. "preference", "decision", "rule", "fact".' },
        tags: { type: "array", items: { type: "string" }, description: "Optional tags for grouping." },
      },
      required: ["content"],
    },
  },
  {
    name: "brain_list",
    description: "List recent facts in the shared DS2 brain (most-recently-updated first).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", description: "Max facts (1-500, default 100)." } },
    },
  },
  {
    name: "brain_forget",
    description: "Permanently delete a fact from the shared DS2 brain by its id.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "The fact id to delete." } },
      required: ["id"],
    },
  },
];

async function callBridge(action, payload) {
  if (!TOKEN) throw new Error("DS2_BRAIN_TOKEN is not set — cannot reach the brain.");
  const res = await fetch(BRAIN_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) throw new Error(data?.error || `bridge returned HTTP ${res.status}`);
  return data;
}

async function runTool(name, args) {
  const a = args || {};
  switch (name) {
    case "brain_recall": {
      const { facts = [] } = await callBridge("recall", { query: a.query, k: a.k });
      if (facts.length === 0) return "No matching facts in the brain.";
      return facts
        .map((f) => `• [${f.kind}] ${f.content}${f.tags?.length ? `  (${f.tags.join(", ")})` : ""}  {id:${f.id}}`)
        .join("\n");
    }
    case "brain_remember": {
      const { fact } = await callBridge("remember", {
        content: a.content,
        kind: a.kind,
        tags: a.tags,
        source: "local-agent",
        createdBy: AUTHOR,
      });
      return fact ? `Saved: ${fact.content}  {id:${fact.id}}` : "Nothing saved (empty content).";
    }
    case "brain_list": {
      const { facts = [] } = await callBridge("list", { limit: a.limit });
      if (facts.length === 0) return "The brain is empty.";
      return facts.map((f) => `• [${f.kind}] ${f.content}  {id:${f.id}}`).join("\n");
    }
    case "brain_forget": {
      await callBridge("forget", { id: a.id });
      return `Forgotten: ${a.id}`;
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

// ── MCP stdio protocol (newline-delimited JSON-RPC 2.0) ──────────────────────

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}
function reply(id, result) {
  send({ jsonrpc: "2.0", id, result });
}
function replyError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;

  switch (method) {
    case "initialize":
      reply(id, {
        protocolVersion: params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
      return;
    case "notifications/initialized":
    case "notifications/cancelled":
      return; // notifications — no response
    case "ping":
      if (isRequest) reply(id, {});
      return;
    case "tools/list":
      reply(id, { tools: TOOLS });
      return;
    case "tools/call": {
      const toolName = params?.name;
      try {
        const text = await runTool(toolName, params?.arguments);
        reply(id, { content: [{ type: "text", text }] });
      } catch (err) {
        reply(id, {
          content: [{ type: "text", text: `Error: ${String(err?.message ?? err)}` }],
          isError: true,
        });
      }
      return;
    }
    default:
      if (isRequest) replyError(id, -32601, `method not found: ${method}`);
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue; // skip malformed lines
    }
    handle(msg).catch((err) => {
      if (msg?.id !== undefined && msg?.id !== null) {
        replyError(msg.id, -32603, String(err?.message ?? err));
      }
    });
  }
});
process.stdin.on("end", () => process.exit(0));
