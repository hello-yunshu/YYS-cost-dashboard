#!/bin/bash
set -e

echo "============================================"
echo "   Cost Dashboard"
echo "============================================"
echo

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$(uname -s)" = "Darwin" ]; then
    if [ "$(uname -m)" = "arm64" ]; then
        NODE_BIN="$SCRIPT_DIR/node/macos-arm64/bin/node"
        PLATFORM="macOS ARM64"
    else
        NODE_BIN="$SCRIPT_DIR/node/macos-x64/bin/node"
        PLATFORM="macOS x64"
    fi
elif [ "$(uname -s)" = "Linux" ]; then
    NODE_BIN="$SCRIPT_DIR/node/linux-x64/bin/node"
    PLATFORM="Linux x64"
else
    echo "[ERROR] Unsupported operating system: $(uname -s)"
    exit 1
fi

if [ ! -f "$NODE_BIN" ]; then
    echo "[ERROR] Node.js runtime not found at: $NODE_BIN"
    echo "        Please run build-portable.js first to download Node.js."
    exit 1
fi

APP_DIR="$SCRIPT_DIR/app"
DATA_DIR="$SCRIPT_DIR/data"
UPLOADS_DIR="$SCRIPT_DIR/uploads"
LOGS_DIR="$SCRIPT_DIR/logs"

if [ ! -f "$APP_DIR/server.bundle.js" ]; then
    echo "[ERROR] Application file not found: $APP_DIR/server.bundle.js"
    echo "        Please run build-portable.js first."
    exit 1
fi

mkdir -p "$DATA_DIR" "$UPLOADS_DIR" "$LOGS_DIR"

export DB_MODE=sqljs
export DB_PATH="$DATA_DIR/cost_dashboard.db"
export UPLOADS_DIR="$UPLOADS_DIR"
export NODE_ENV=production
export PORT="${PORT:-3113}"

echo
echo "[INFO] Platform: $PLATFORM"
echo "[INFO] DB Mode: $DB_MODE"
echo "[INFO] DB Path: $DB_PATH"
echo "[INFO] Uploads: $UPLOADS_DIR"
echo "[INFO] Port: $PORT"
echo
echo "[INFO] Open your browser and visit: http://localhost:$PORT"
echo "[INFO] Press Ctrl+C to stop the server."
echo

"$NODE_BIN" "$APP_DIR/server.bundle.js"
