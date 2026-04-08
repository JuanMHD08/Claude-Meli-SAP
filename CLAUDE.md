# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Whenever working for a solution plan related to MCB (Meli Central Buying), use the abap-mcb-analyzer agent.

Whenever working for an estimation related to MCB (Meli Central Buying), use the abap-mcb-estimator agent.

Whenever working for a development or implementation related to MCB (Meli Central Buying), use the abap-mcb-developer agent.

Whenever working for a documentation related to MCB (Meli Central Buying), use the abap-mcb-documenter agent.

## Project Overview

`sap-auth.js` is a Node.js CLI tool that authenticates a user against a Meli SAP system via Puppeteer (headless browser), captures the session cookie, encrypts the MCP configuration, and then launches Claude Code with the `abap-adt` MCP server configured for ABAP development.

## Running the Script

```bash
# Initial setup: select system, log in via browser, set passphrase, launch Claude
node sap-auth.js

# Subsequent launches: decrypt existing config and launch Claude
node sap-auth.js --launch
```

## Architecture

The entire project is a single script (`sap-auth.js`) with these responsibilities:

1. **System selection** — interactive prompt to pick one of 9 SAP systems across 3 groups (S4 Corp, S4 Funds, S4 MX Banking).
2. **Browser login** — Puppeteer opens the selected system's Fiori Launchpad URL in a visible browser; the script polls for the `SAP_SESSIONID_*` cookie for up to 3 minutes.
3. **Credential extraction** — derives `SAP_URL`, `SAP_CLIENT` (last 3 chars of cookie name), and `SAP_COOKIE_STRING` from the captured cookie.
4. **Config encryption** — writes `.mcp.json` then encrypts it to `.mcp.json.enc` using AES-256-GCM (scrypt key derivation). The plaintext `.mcp.json` is deleted ~3 s after Claude starts.
5. **Claude launch** — spawns `claude` CLI; the `.mcp.json` file present at launch is picked up automatically by Claude Code as the MCP server config.

## Key Constants

- `VSP_COMMAND` (line 9) — hardcoded path to the `vsp` binary that powers the `abap-adt` MCP server. On first run without an existing `.mcp.json.enc`, the user is prompted to override it.
- `ENCRYPTED_CONFIG_FILE` — `.mcp.json.enc` — survives between sessions and stores all credentials.
- `MCP_CONFIG_FILE` — `.mcp.json` — temporary plaintext file; never commit this.

## SAP Systems

| Group | ID | Env | Client |
|---|---|---|---|
| S4 Corp | DS4 | Development | 200 |
| S4 Corp | TS4 | UAT | 400 |
| S4 Corp | PS4 | Production | 400 |
| S4 Funds | MFD | Development | 200 |
| S4 Funds | MFT | UAT | 400 |
| S4 Funds | MFP | Production | 400 |
| S4 MX Banking | MBD | Development | 200 |
| S4 MX Banking | MBT | UAT | 400 |
| S4 MX Banking | MBP | Production | 400 |

## MCP Server

The `abap-adt` MCP server exposes ABAP Developer Tools (ADT) capabilities to Claude: reading/editing ABAP source, running unit tests, ATC checks, transports, debugger, SQL traces, etc. All tools are available once Claude is launched with a valid `.mcp.json`.

## Important Notes

- `VSP_COMMAND` defaults to a macOS path (`/Users/pabgonzalez/...`). On other machines, provide the correct path on first run or update the constant.
- The `.mcp.json.enc` file can be committed (it is encrypted); `.mcp.json` must never be committed.
- Passphrase requirements: ≥8 chars, uppercase, lowercase, digit, special character.
