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

  <p><a href="./README.md">English</a> · <b>简体中文</b></p>
</div>

**Pinterest MCP** 是一个开源的 MCP Server，让 Claude Code、Codex、Cursor 等任何 MCP 客户端直接用上 Pinterest：搜图、**真正看到图**、顺着「更多类似内容」往下找、读画板、下载原图。专为每次动手前都要先找参考的设计师和前端开发者打造。

不用登录 Pinterest，不用 API Key，不用启动浏览器。

## ❌ 没有 Pinterest MCP 时

- 切到浏览器搜、翻、一张张手动存图，再拖回对话框。
- AI 只能看到你记得贴进来的那几张，没有来源、配色和上下文。

## ✅ 有了 Pinterest MCP

```text
> 在 Pinterest 上找 20 张深色仪表盘 UI，看一下前 8 张，
  挑出配色最克制的 3 张并下载下来。
```

AI 会自己去搜、看缩略图、说明挑选理由、把原图存到本地，接着还能直接照着参考把页面做出来。

## 特点

- ⚡ **快**：直接调用 pinterest.com 自己用的数据接口，20 张图约 2–3 秒，不用启动 Chrome。
- 👀 **AI 看得见**：可选返回缩略图，让模型判断风格、版式和配色，而不只是读标题。
- 🧾 **信息完整**：标题、描述、原图地址和尺寸、主色、来源网站、画板、作者、日期；自动过滤广告。
- 🔁 **能深挖**：相似图、整个画板、按书签翻页。
- 🛡️ **稳**：保持匿名会话，遇到 Pinterest 偶发的「假到底」会自动重试。
- 🪶 **省 token**：折叠大段话题标签，去掉用不上的字段。
- 📥 **可下载**：下载原图，取不到时自动降级到 736px；只接受 `*.pinimg.com` 的图片。

## 快速开始

需要 **Node.js ≥ 20.18**。

<details open>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add pinterest --scope user -- npx -y @sunkimkk/pinterest-mcp
```
</details>

<details>
<summary><b>Codex</b>：<code>~/.codex/config.toml</code></summary>

```toml
[mcp_servers.pinterest]
command = "npx"
args = ["-y", "@sunkimkk/pinterest-mcp"]
```
</details>

<details>
<summary><b>Claude Desktop</b>：一键安装</summary>

从最新 Release 下载 [`pinterest-mcp.mcpb`](https://github.com/sunkimk/pinterest-mcp/releases/latest/download/pinterest-mcp.mcpb)，双击即可。Claude Desktop 会弹出安装窗口，可以选择下载文件夹和代理（可选）。
</details>

<details>
<summary><b>Cursor / Claude Desktop / Windsurf 等</b>：JSON 配置</summary>

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

Cursor：`~/.cursor/mcp.json` · Claude Desktop：`claude_desktop_config.json`
</details>

<details>
<summary><b>从源码安装</b></summary>

```bash
git clone https://github.com/sunkimk/pinterest-mcp.git
cd pinterest-mcp && npm install
claude mcp add pinterest --scope user -- node "$PWD/src/server.js"
```
</details>

## 工具

| 工具 | 作用 |
|---|---|
| `pinterest_search` | 按关键词搜索（任何语言），支持翻页和缩略图 |
| `pinterest_get_pin` | 单个 Pin 的完整详情（Pin 链接、`pin.it` 短链或数字 ID） |
| `pinterest_related_pins` | 某个 Pin 的「更多类似内容」 |
| `pinterest_board_pins` | 公开画板里的 Pin |
| `pinterest_preview_images` | 把图片地址转成模型能看到的缩略图 |
| `pinterest_download` | 把原图保存到本地 |

`search`、`related_pins`、`board_pins` 都支持 `previews: N`，附上前 N 张缩略图。

## 用法示例

- 「在 Pinterest 上搜玻璃拟态的登录页，给我看 8 张缩略图」
- 「这些图有什么共同点？布局、配色、字体分别怎么样？」
- 「找和这张类似的：https://www.pinterest.com/pin/1128714725389331478/」
- 「把这个画板里的图都列出来：https://www.pinterest.com/awsmd_com/app-design/」
- 「把第 2、5、7 张下载到 ~/Desktop/参考/登录页」

> 小技巧：英文关键词结果多得多。加上 `ui`、`app`、`dribbble`、`poster`、`moodboard` 这类词可以引导风格。

## 配置

| 变量 | 默认值 | 说明 |
|---|---|---|
| `MCP_PINTEREST_DOWNLOAD_DIR` | `~/Downloads/pinterest-mcp` | 下载根目录 |
| `MCP_PINTEREST_PROXY` | 系统的 `HTTPS_PROXY` | HTTP 代理，如 `http://127.0.0.1:7890`（不支持 SOCKS） |
| `MCP_PINTEREST_LOCALE` | `en-US` | 请求语言 |
| `MCP_PINTEREST_TIMEOUT_MS` | `20000` | 单次请求超时（毫秒） |

在 Claude Code 里设置代理的例子：

```bash
claude mcp add pinterest --scope user -e MCP_PINTEREST_PROXY=http://127.0.0.1:7890 -- npx -y @sunkimkk/pinterest-mcp
```

## 常见问题

**为什么搜索结果不能查详情？**
未登录时搜索结果只有匿名 ID，Pinterest 不允许反查。该有的信息搜索结果里都已经有了；`get_pin` 和 `related_pins` 需要真实的 Pin 链接（`pinterest.com/pin/<数字>/`）。

**报网络错误？**
如果你所在的网络访问不了 pinterest.com，请设置 `MCP_PINTEREST_PROXY`。

**会失效吗？**
用的是 Pinterest 网页接口而不是官方 API，Pinterest 改版时可能需要更新。可以关注（Watch）本仓库，或查看[更新日志](./CHANGELOG.md)。

## 开发

```bash
npm install
npm test        # 启动服务，并对线上 pinterest.com 逐个调用所有工具
```

版本历史见 [CHANGELOG.md](./CHANGELOG.md)。欢迎提 Issue 和 PR。

## 免责声明

本项目与 Pinterest 官方无关，未获其认可或赞助。请只用于个人收集灵感、控制请求频率、遵守 Pinterest 服务条款，并尊重创作者版权：下载的图片仅供参考。

## 致谢

感谢 [terryso/mcp-pinterest](https://github.com/terryso/mcp-pinterest) 最早探索了通过 MCP 接入 Pinterest。

## Star History

<a href="https://star-history.com/#sunkimk/pinterest-mcp&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=sunkimk/pinterest-mcp&type=Date&theme=dark" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=sunkimk/pinterest-mcp&type=Date" width="600" />
  </picture>
</a>

## License

[MIT](./LICENSE) © sunkimk
