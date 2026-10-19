#!/usr/bin/env bash
# Builds dist/pinterest-mcp.mcpb: a self-contained bundle (code + production deps)
# for Claude Desktop one-click install and Smithery's local-server listing.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

cp -R "$root/src" "$stage/src"
cp "$root/package.json" "$root/package-lock.json" "$root/LICENSE" "$root/README.md" "$root/manifest.json" "$stage/"
cp "$root/assets/logo.png" "$stage/icon.png"
(cd "$stage" && npm ci --omit=dev --no-audit --no-fund --silent)

mkdir -p "$root/dist"
npx -y @anthropic-ai/mcpb@2 validate "$stage/manifest.json"
npx -y @anthropic-ai/mcpb@2 pack "$stage" "$root/dist/pinterest-mcp.mcpb"
