# Pinterest MCP

**Let your AI coding agent browse Pinterest for you.**
A Pinterest MCP server for Claude Code, Codex, and any other MCP client: search pins, actually look at the images, find similar pins, read boards, and download originals.
**No login, no API key, no headless browser.**

[English](#english) · 中文

---

做设计、写前端时最常见的一步就是「先找参考」。这个 MCP 把 Pinterest 接进 AI 助手：你一句话说需求，它去搜、去看、去挑，再把喜欢的原图下载到本地，接着就能直接拿来做原型、写页面。

## 特点

- **快**：直接调用 Pinterest 网页使用的数据接口，不启动浏览器，20 张图约 2–3 秒。
- **AI 真能「看见」图**：可以把缩略图一起交给模型，让它判断风格、配色和版式，而不只是读标题。
- **信息完整**：每个 Pin 都带标题、描述、原图地址和尺寸、主色、来源网站、所属画板、作者、日期；自动过滤广告。
- **能顺藤摸瓜**：找相似图、读整个画板、支持翻页。
- **稳**：翻页会保持会话，遇到 Pinterest 偶发的「假到底」会自动重试。
- **省 token**：折叠大段话题标签，去掉用不上的字段。
- **零门槛**：不用登录 Pinterest，不用申请开发者账号，不用装 Chrome。

## 工具

| 工具 | 作用 |
|---|---|
| `pinterest_search` | 按关键词搜索（中英文都行），可翻页，可附带缩略图 |
| `pinterest_get_pin` | 查看单个 Pin 的完整详情（支持 Pin 链接、`pin.it` 短链或数字 ID） |
| `pinterest_related_pins` | 「更多类似内容」：找与某个 Pin 相似的图 |
| `pinterest_board_pins` | 读取某个公开画板里的 Pin |
| `pinterest_preview_images` | 把图片地址转成缩略图，让模型看到图 |
| `pinterest_download` | 批量下载原图（原图取不到时自动降级到 736px） |

`search` / `related_pins` / `board_pins` 都支持 `previews: N`，会附上前 N 张缩略图。

## 安装

需要 Node.js ≥ 20.18。

```bash
git clone https://github.com/sunkimk/pinterest-mcp.git
cd pinterest-mcp
npm install
```

**Claude Code**

```bash
claude mcp add pinterest --scope user -- node /绝对路径/pinterest-mcp/src/server.js
```

**Codex**（`~/.codex/config.toml`）

```toml
[mcp_servers.pinterest]
command = "node"
args = ["/绝对路径/pinterest-mcp/src/server.js"]
```

**Claude Desktop / Cursor 等**：在各自的 MCP 配置里加入同样的 `command` 和 `args`。

## 用法示例

直接用自然语言说，不用记工具名：

- 「在 Pinterest 上搜 20 张深色风格的数据仪表盘 UI，给我看前 8 张缩略图」
- 「挑出配色最克制的 5 张，总结它们的布局和字体特点」
- 「找和这张类似的：https://www.pinterest.com/pin/1128714725389331478/」
- 「把第 2、5、7 张原图下载到 ~/Desktop/灵感/登录页」

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `MCP_PINTEREST_DOWNLOAD_DIR` | `~/Downloads/pinterest-mcp` | 下载根目录 |
| `MCP_PINTEREST_PROXY` | 系统的 `HTTPS_PROXY` | HTTP 代理（如 `http://127.0.0.1:7890`），连不上 pinterest.com 时设置；不支持 SOCKS |
| `MCP_PINTEREST_LOCALE` | `en-US` | 请求语言 |
| `MCP_PINTEREST_TIMEOUT_MS` | `20000` | 单次请求超时（毫秒） |

## 已知限制

- 未登录状态下，搜索结果只有匿名 ID，不能直接拿去调 `get_pin` / `related_pins`（该有的信息搜索结果里已经都有了）。这两个工具需要真实的 Pin 链接（`pinterest.com/pin/<数字>/`）。
- 用的是 Pinterest 网页自己使用的数据接口，不是官方公开 API，Pinterest 改版时可能需要跟进更新。

## 使用须知

本项目与 Pinterest 官方无关。请只用于个人收集灵感，控制请求频率，遵守 Pinterest 的服务条款，并尊重图片作者的版权：下载的图片仅供参考，不要未经授权商用。

## 测试

```bash
npm test
```

会启动服务，并对线上 pinterest.com 逐个调用所有工具。

---

## English

Pinterest MCP server for Claude Code, Codex and any MCP client. Search pins, let the model see thumbnails, find related pins, read public boards and download full-resolution images — no login, no API key, no headless browser.

```bash
npm install
claude mcp add pinterest --scope user -- node /absolute/path/pinterest-mcp/src/server.js
```

Tools: `pinterest_search`, `pinterest_get_pin`, `pinterest_related_pins`, `pinterest_board_pins`, `pinterest_preview_images`, `pinterest_download`. Not affiliated with Pinterest; use responsibly and respect image copyrights.

## 致谢

感谢 [terryso/mcp-pinterest](https://github.com/terryso/mcp-pinterest) 最早探索了把 Pinterest 接入 MCP 的思路。

## License

MIT
