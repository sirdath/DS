# DS2 brain — MCP shim for local agents

Gives Claude Code (and any MCP client) on a founder's laptop the **same shared
pgvector brain** the deployed DS2 copilot uses. Durable facts — client
preferences, decisions, who-owns-what, rules — are written once and shared across
both founders and the copilot, persisting across conversations.

It's a tiny stdio server that forwards tool calls over HTTPS to the
`/api/admin/brain` bridge route. **Zero dependencies, nothing to install** — just
Node 18+. The powerful Supabase service-role key stays on the server; your laptop
holds only a narrow bridge token.

## Tools it exposes

| Tool | What it does |
| --- | --- |
| `brain_recall` | Hybrid semantic + keyword search over the brain. |
| `brain_remember` | Save a durable fact (near-identical facts are refreshed, not duplicated). |
| `brain_list` | List recent facts, newest first. |
| `brain_forget` | Delete a fact by id. |

## One-time setup

### 1. Set the bridge token on the server (Vercel)

In the **ds2consulting** Vercel project → Settings → Environment Variables, add:

```
BRAIN_BRIDGE_TOKEN = <a long random secret>
```

Generate one with: `openssl rand -hex 32`. Redeploy so it takes effect.

### 2. Register the shim in Claude Code (each laptop)

Add this to `~/.claude.json` (or your MCP client's config) under `mcpServers`,
using the **same** token you set in Vercel:

```json
{
  "mcpServers": {
    "ds2-brain": {
      "command": "node",
      "args": ["/absolute/path/to/DathStel/tools/ds2-brain-mcp/brain-mcp.mjs"],
      "env": {
        "DS2_BRAIN_TOKEN": "<same secret as BRAIN_BRIDGE_TOKEN>",
        "DS2_BRAIN_AUTHOR": "dath"
      }
    }
  }
}
```

- `DS2_BRAIN_AUTHOR` (optional) attributes facts you save — set `"dath"` or
  `"stelios"` per laptop.
- `DS2_BRAIN_URL` (optional) overrides the endpoint; defaults to
  `https://www.ds2-consulting.com/api/admin/brain`.

Restart Claude Code. You should see the `ds2-brain` tools available.

## Quick check

With the token exported, you can smoke-test the bridge directly:

```bash
curl -s https://www.ds2-consulting.com/api/admin/brain/ \
  -H "authorization: Bearer $DS2_BRAIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"action":"list","limit":5}'
```

(Note the trailing slash — the site runs `trailingSlash:true`, so the slashless
path returns a 308 redirect.)

A `200` with a `{"facts":[...]}` body means the bridge is live. `401` means the
token doesn't match; `503` means `BRAIN_BRIDGE_TOKEN` isn't set on the server yet.
