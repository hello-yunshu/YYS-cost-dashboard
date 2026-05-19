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
echo "Source: $APP_BUNDLE"
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
echo "[Step 1/4] Preparing DMG staging directory..."
rm -rf "$DMG_DIR"
mkdir -p "$DMG_DIR"
STAGING_DIR="$DMG_DIR/staging"

echo "[Step 2/4] Copying app bundle..."
ditto "$APP_BUNDLE" "$STAGING_DIR/Cost Dashboard.app"
SetFile -a B "$STAGING_DIR/Cost Dashboard.app" 2>/dev/null || true

ln -sf /Applications "$STAGING_DIR/Applications"

echo "[Step 3/4] Creating DMG image..."

hdiutil create \
    -volname "Cost Dashboard" \
    -srcfolder "$STAGING_DIR" \
    -ov \
    -format UDZO \
    -imagekey zlib-level=9 \
    "$DMG_OUTPUT"

echo "[Step 4/4] Cleaning up..."
rm -rf "$STAGING_DIR"

DMG_SIZE=$(du -h "$DMG_OUTPUT" | cut -f1 | xargs)
echo ""
echo "=== macOS DMG Built ==="
echo "File: $DMG_OUTPUT"
echo "Size: $DMG_SIZE"

echo ""
echo "Verifying DMG contents..."
MOUNT_POINT=$(mktemp -d)
hdiutil attach "$DMG_OUTPUT" -readonly -nobrowse -mountpoint "$MOUNT_POINT" 2>/dev/null

if [ -d "$MOUNT_POINT/Cost Dashboard.app" ]; then
    echo "  OK: Cost Dashboard.app found in DMG"
    if [ -f "$MOUNT_POINT/Cost Dashboard.app/Contents/MacOS/CostDashboardLauncher" ]; then
        echo "  OK: Launcher executable found"
    else
        echo "  WARNING: Launcher executable not found in .app bundle"
    fi
    if [ -d "$MOUNT_POINT/Cost Dashboard.app/Contents/Resources/app" ]; then
        echo "  OK: Application files found in .app bundle"
    else
        echo "  WARNING: Application files not found in .app bundle"
    fi
    if [ -d "$MOUNT_POINT/Cost Dashboard.app/Contents/Resources/node" ]; then
        echo "  OK: Node.js runtime found in .app bundle"
    else
        echo "  WARNING: Node.js runtime not found in .app bundle"
    fi
else
    echo "  ERROR: Cost Dashboard.app NOT found in DMG!"
    echo "  DMG root contents:"
    ls -la "$MOUNT_POINT/"
fi

ITEMS_COUNT=$(ls -1 "$MOUNT_POINT/" | wc -l | tr -d ' ')
if [ "$ITEMS_COUNT" -eq 2 ]; then
    echo "  OK: DMG contains only .app and Applications shortcut"
else
    echo "  WARNING: DMG contains $ITEMS_COUNT items (expected 2):"
    ls -1 "$MOUNT_POINT/"
fi

hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
rmdir "$MOUNT_POINT" 2>/dev/null || true
