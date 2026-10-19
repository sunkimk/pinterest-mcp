# Changelog

All notable changes to Pinterest MCP are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Claude Desktop one-click bundle (`pinterest-mcp.mcpb`) attached to releases; build it with `scripts/build-mcpb.sh`.

## [1.0.0] - 2026-10-19

First public release. 🎉

### Added
- `pinterest_search` — keyword search in any language, with pagination (`next_bookmark`) and optional thumbnails (`previews`).
- `pinterest_get_pin` — full pin details from a pin URL, `pin.it` short link or numeric id.
- `pinterest_related_pins` — "more like this" for a pin.
- `pinterest_board_pins` — list the pins on a public board.
- `pinterest_preview_images` — return thumbnails the model can see.
- `pinterest_download` — save full-resolution images, falling back to 736px; only `*.pinimg.com` URLs are accepted.
- One-line install with `npx` for Claude Code, Codex, Cursor and Claude Desktop.
- `MCP_PINTEREST_PROXY`, `MCP_PINTEREST_DOWNLOAD_DIR`, `MCP_PINTEREST_LOCALE` and `MCP_PINTEREST_TIMEOUT_MS` settings.
- End-to-end test suite against live pinterest.com.

### Reliability
- Keeps an anonymous session cookie so pagination bookmarks stay valid.
- Detects Pinterest's occasional "fake end of feed" or replayed page and retries with a fresh session.
- Promoted pins are filtered out; hashtag walls in descriptions are collapsed to save tokens.

[Unreleased]: https://github.com/sunkimk/pinterest-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/sunkimk/pinterest-mcp/releases/tag/v1.0.0
