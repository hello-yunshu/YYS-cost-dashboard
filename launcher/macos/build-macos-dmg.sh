#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PORTABLE_DIR="${1:-$ROOT_DIR/dist-portable}"

PACKAGE_JSON="$ROOT_DIR/package.json"
VERSION=$(node -e "console.log(require('$PACKAGE_JSON').version)")

DMG_NAME="Cost-Dashboard-macOS-${VERSION}"
DMG_DIR="$ROOT_DIR/dist-dmg"
DMG_OUTPUT="$DMG_DIR/${DMG_NAME}.dmg"

APP_BUNDLE="$PORTABLE_DIR/Cost Dashboard.app"

echo "=== Building macOS DMG ==="
echo "Version: $VERSION"
echo "Source: $PORTABLE_DIR"
echo "Output: $DMG_OUTPUT"

if [ "$(uname -s)" != "Darwin" ]; then
    echo "[ERROR] macOS is required to build DMG."
    exit 1
fi

if [ ! -d "$APP_BUNDLE" ]; then
    echo "[ERROR] App bundle not found: $APP_BUNDLE"
    echo "        Run 'npm run build:launcher:macos' first."
    exit 1
fi

if ! command -v hdiutil &> /dev/null; then
    echo "[ERROR] hdiutil not found. This tool is built into macOS."
    exit 1
fi

echo ""
echo "[Step 1/5] Preparing DMG staging directory..."
rm -rf "$DMG_DIR"
mkdir -p "$DMG_DIR"
STAGING_DIR="$DMG_DIR/staging"

echo "[Step 2/5] Copying app bundle..."
cp -R "$APP_BUNDLE" "$STAGING_DIR/"

echo "[Step 3/5] Copying portable application files..."
if [ -d "$PORTABLE_DIR/app" ]; then
    cp -R "$PORTABLE_DIR/app" "$STAGING_DIR/"
fi

mkdir -p "$STAGING_DIR/data"
mkdir -p "$STAGING_DIR/uploads"
mkdir -p "$STAGING_DIR/logs"

if [ -d "$PORTABLE_DIR/node/macos-arm64" ]; then
    mkdir -p "$STAGING_DIR/node"
    cp -R "$PORTABLE_DIR/node/macos-arm64" "$STAGING_DIR/node/"
fi
if [ -d "$PORTABLE_DIR/node/macos-x64" ]; then
    mkdir -p "$STAGING_DIR/node"
    cp -R "$PORTABLE_DIR/node/macos-x64" "$STAGING_DIR/node/"
fi

if [ -f "$PORTABLE_DIR/start.sh" ]; then
    cp "$PORTABLE_DIR/start.sh" "$STAGING_DIR/"
    chmod +x "$STAGING_DIR/start.sh"
fi
if [ -f "$PORTABLE_DIR/stop.sh" ]; then
    cp "$PORTABLE_DIR/stop.sh" "$STAGING_DIR/"
    chmod +x "$STAGING_DIR/stop.sh"
fi

if [ -f "$PORTABLE_DIR/README.txt" ]; then
    cp "$PORTABLE_DIR/README.txt" "$STAGING_DIR/"
fi

if [ -f "$PORTABLE_DIR/package.json" ]; then
    cp "$PORTABLE_DIR/package.json" "$STAGING_DIR/"
fi

ln -sf /Applications "$STAGING_DIR/Applications"

echo "[Step 4/5] Creating DMG image..."

hdiutil create \
    -volname "Cost Dashboard" \
    -srcfolder "$STAGING_DIR" \
    -ov \
    -format UDZO \
    -imagekey zlib-level=9 \
    "$DMG_OUTPUT"

echo "[Step 5/5] Cleaning up..."
rm -rf "$STAGING_DIR"

DMG_SIZE=$(du -h "$DMG_OUTPUT" | cut -f1 | xargs)
echo ""
echo "=== macOS DMG Built ==="
echo "File: $DMG_OUTPUT"
echo "Size: $DMG_SIZE"
