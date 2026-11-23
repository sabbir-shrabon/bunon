# Bunon MCP Server (`bunon-mcp-server`)
> **International AI Builders Congress 2026 Deliverable** • Milestone 5.5

The `bunon-mcp-server` exposes Bunon's core goal completion and comeback companion domain engine to external AI clients (Claude Desktop, Cursor, Antigravity) via the standard **Model Context Protocol (MCP)** stdio transport.

---

## ⚡ 30-Second Quick Start for Judges

### 1. Run the Smoke Test
Verify all 4 tools and test live execution against Supabase:
```bash
npm run mcp:test
```

### 2. Start the Server Manually
```bash
npm run mcp:start
```

---

## 🔌 One-Click Client Configuration

### Claude Desktop
Add this to your `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bunon": {
      "command": "node",
      "args": [
        "--conditions=react-server",
        "--env-file=.env.local",
        "node_modules/tsx/dist/cli.mjs",
        "mcp/server.ts"
      ],
      "cwd": "/absolute/path/to/bunon-app",
      "env": {
        "BUNON_USER_ID": "d2394218-0785-484d-8f2d-1b392daddf21"
      }
    }
  }
}
```
*(Note: Replace `/absolute/path/to/bunon-app` in `cwd` with your local repository path, or omit `cwd` if launching from the repository root).*

### Cursor / Windsurf
Add to `.cursor/mcp.json` or workspace settings:
```json
{
  "mcpServers": {
    "bunon": {
      "command": "node",
      "args": [
        "--conditions=react-server",
        "--env-file=.env.local",
        "node_modules/tsx/dist/cli.mjs",
        "mcp/server.ts"
      ],
      "env": {
        "BUNON_USER_ID": "d2394218-0785-484d-8f2d-1b392daddf21"
      }
    }
  }
}
```

---

## 🛠️ The 4 Exposed Domain Tools

| Tool | Pure Domain Service | Purpose |
| :--- | :--- | :--- |
| `get_today_plan` | `getTodayPlan()` | Assembles the complete Today screen state: 3-slot fluid morph deck, hero task, inline sub-steps, $0 persona profile, streak count, and context banner. |
| `tick_substep` | `tickSubstep()` | Ticks or unticks an inline sub-step (1 to N-1) with 0 proof. Final Step N is completion-gated and strictly requires proof via app UI. |
| `log_day_note` | `logDayNote()` | Records user daily notes at $0 token cost after a 0ms deterministic regex crisis & safety check. |
| `get_what_bunon_knows` | `getWhatBunonKnows()` | Retrieves the full Page 50a memory store: Person facts, weekly day-time availability map, and journey-specific facts. |

---

## 🛡️ Architecture & Standalone Runtime Compatibility

1. **Pure Domain Functions (`src/lib/services/`):** The MCP server does not reimplement business logic; it directly imports the same pure server functions powering Next.js 16 API routes.
2. **`server-only` Bypass:** Pure services import `'server-only'` to protect browser client security. The MCP runtime uses `--conditions=react-server` so Node resolves `server-only/empty.js` cleanly in standalone execution without compromising web bundling.
3. **Deterministic Demo Scoping:** If `BUNON_USER_ID` is set in the environment, tool calls automatically scope to that user without requiring the AI agent to pass a UUID in every prompt.
