<div align="center">
  <a href="https://github.com/sunkimk/pinterest-mcp">
    <img src="https://raw.githubusercontent.com/sunkimk/pinterest-mcp/main/assets/banner.png" alt="Pinterest MCP" width="820" />
  </a>

  <p>
    <a href="https://www.npmjs.com/package/@sunkimkk/pinterest-mcp"><img alt="npm version" src="https://img.shields.io/npm/v/@sunkimkk/pinterest-mcp?color=F0245E&label=npm" /></a>
    <a href="https://www.npmjs.com/package/@sunkimkk/pinterest-mcp"><img alt="npm downloads" src="https://img.shields.io/npm/dw/@sunkimkk/pinterest-mcp?color=A3127F" /></a>
    <a href="https://github.com/sunkimk/pinterest-mcp/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/sunkimk/pinterest-mcp?style=flat&color=FF6B57" /></a>
    <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/sunkimk/pinterest-mcp?color=444" /></a>
    <img alt="Node.js" src="https://img.shields.io/badge/node-%E2%89%A520.18-444" />
    <img alt="MCP" src="https://img.shields.io/badge/MCP-compatible-1D0B1F" />
  </p>

  <p><b>English</b> · <a href="./README.zh-CN.md">简体中文</a></p>
</div>

**Pinterest MCP** gives Claude Code, Codex, Cursor and any other MCP client direct access to Pinterest — search pins, *actually look at* the images, follow "more like this", read boards, and download originals. It's built for designers and front-end developers who start every task by collecting references.

No Pinterest login. No API key. No headless browser.

## ❌ Without Pinterest MCP

- You switch to the browser, search, scroll, save images by hand, and drag them back into the chat.
- The AI only gets the images you remembered to paste, without their source, colours or context.

## ✅ With Pinterest MCP

```text
> Find 20 dark dashboard UIs on Pinterest, look at the first 8,
  pick the 3 with the most restrained palette and download them.
```

The agent searches, looks at the thumbnails, explains its picks, saves full-resolution files to disk — and can go straight on to build the screen from them.

## Features

- ⚡ **Fast** — talks to the same JSON endpoints pinterest.com uses; ~2–3 s for 20 pins, no Chrome to launch.
- 👀 **The model can see** — optional thumbnails are returned as images, so the agent judges style, layout and colour, not just titles.
- 🧾 **Rich metadata** — title, description, full-size URL and dimensions, dominant colour, source site, board, creator, date. Ads are filtered out.
- 🔁 **Go deeper** — related pins, whole boards, pagination with bookmarks.
- 🛡️ **Robust** — keeps an anonymous session and retries Pinterest's occasional "fake end of feed".
- 🪶 **Token-friendly** — hashtag walls collapsed, unusable fields dropped.
- 📥 **Downloads** — originals with automatic 736px fallback, only from `*.pinimg.com`.

## Quick start

Requires **Node.js ≥ 20.18**.

<details open>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add pinterest --scope user -- npx -y @sunkimkk/pinterest-mcp
```
</details>

<details>
<summary><b>Codex</b> — <code>~/.codex/config.toml</code></summary>

```toml
[mcp_servers.pinterest]
command = "npx"
args = ["-y", "@sunkimkk/pinterest-mcp"]
```
</details>

<details>
<summary><b>Cursor / Claude Desktop / Windsurf / others</b> — JSON config</summary>

```json
{
  "mcpServers": {
    "pinterest": {
      "command": "npx",
      "args": ["-y", "@sunkimkk/pinterest-mcp"]
    }
  }
}
```

Cursor: `~/.cursor/mcp.json` · Claude Desktop: `claude_desktop_config.json`
</details>

<details>
<summary><b>From source</b></summary>

```bash
git clone https://github.com/sunkimk/pinterest-mcp.git
cd pinterest-mcp && npm install
claude mcp add pinterest --scope user -- node "$PWD/src/server.js"
```
</details>

## Tools

| Tool | What it does |
|---|---|
| `pinterest_search` | Keyword search in any language, with pagination and optional thumbnails |
| `pinterest_get_pin` | Full details of one pin (pin URL, `pin.it` short link or numeric id) |
| `pinterest_related_pins` | "More like this" for a pin |
| `pinterest_board_pins` | Pins saved on a public board |
| `pinterest_preview_images` | Turn image URLs into thumbnails the model can see |
| `pinterest_download` | Save full-resolution images to disk |

`search`, `related_pins` and `board_pins` accept `previews: N` to attach thumbnails of the first N results.

## Example prompts

- *"Search Pinterest for glassmorphism login screens and show me 8 thumbnails."*
- *"What do these have in common — layout, palette, typography?"*
- *"Find pins similar to https://www.pinterest.com/pin/1128714725389331478/"*
- *"List everything on https://www.pinterest.com/awsmd_com/app-design/"*
- *"Download #2, #5 and #7 to ~/Desktop/refs/login."*

> Tip: English keywords return far more results. Add words like `ui`, `app`, `dribbble`, `poster` or `moodboard` to steer the style.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `MCP_PINTEREST_DOWNLOAD_DIR` | `~/Downloads/pinterest-mcp` | Download root |
| `MCP_PINTEREST_PROXY` | system `HTTPS_PROXY` | HTTP proxy, e.g. `http://127.0.0.1:7890` (SOCKS not supported) |
| `MCP_PINTEREST_LOCALE` | `en-US` | Request language |
| `MCP_PINTEREST_TIMEOUT_MS` | `20000` | Per-request timeout |

Example with Claude Code:

```bash
claude mcp add pinterest --scope user -e MCP_PINTEREST_PROXY=http://127.0.0.1:7890 -- npx -y @sunkimkk/pinterest-mcp
```

## FAQ

**Why can't I get details for a search result?**
Logged-out search results carry anonymous ids that Pinterest won't resolve. Everything they have is already in the search result; `get_pin` and `related_pins` need a real pin link (`pinterest.com/pin/<number>/`).

**Network errors?**
If pinterest.com is blocked where you are, set `MCP_PINTEREST_PROXY`.

**Will it break?**
It uses Pinterest's web endpoints rather than the official API, so a Pinterest redesign may require an update. Watch the repo or check the [changelog](./CHANGELOG.md).

## Development

```bash
npm install
npm test        # spins up the server and calls every tool against live pinterest.com
```

See [CHANGELOG.md](./CHANGELOG.md) for release history. Issues and PRs are welcome.

## Disclaimer

Not affiliated with, endorsed by, or sponsored by Pinterest. Use it for personal inspiration at a reasonable request rate, follow Pinterest's Terms of Service, and respect creators' copyright — downloaded images are for reference only.

## Acknowledgements

Thanks to [terryso/mcp-pinterest](https://github.com/terryso/mcp-pinterest) for first exploring Pinterest over MCP.

## Star History

<a href="https://star-history.com/#sunkimk/pinterest-mcp&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=sunkimk/pinterest-mcp&type=Date&theme=dark" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=sunkimk/pinterest-mcp&type=Date" width="600" />
  </picture>
</a>

## License

[MIT](./LICENSE) © sunkimk
