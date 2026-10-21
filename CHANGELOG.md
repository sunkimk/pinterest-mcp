# Changelog

All notable changes to Pinterest MCP are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-10-21

### Added
- Pins whose largest image is under 500px wide (some pins only exist as a 236px thumbnail, even at their `originals` URL) are marked `low_res: true`, and previews label them with their size.

## [1.1.0] - 2026-10-19

### Added
- Video pins now include `video_url` (an MP4 when Pinterest has one), `video_hls`, `video_seconds` and the video size.
- `media` option on `pinterest_search`, `pinterest_related_pins` and `pinterest_board_pins`: `"video"` returns only video pins, `"image"` only stills.
- `pinterest_download` saves videos as `.mp4`, including the fragmented-MP4 renditions Pinterest uses for newer video pins.

### Fixed
- Thumbnails and previews of PNG/GIF originals now use Pinterest's JPEG renditions instead of falling back to the full-size original (~16 KB instead of ~1.6 MB per preview).

## [1.0.1] - 2026-10-19

### Added
- Listed on the official MCP Registry as `io.github.sunkimk/pinterest-mcp`.
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

[Unreleased]: https://github.com/sunkimk/pinterest-mcp/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/sunkimk/pinterest-mcp/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/sunkimk/pinterest-mcp/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/sunkimk/pinterest-mcp/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/sunkimk/pinterest-mcp/releases/tag/v1.0.0
