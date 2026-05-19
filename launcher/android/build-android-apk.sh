#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

PACKAGE_JSON="$ROOT_DIR/package.json"
VERSION=$(node -e "console.log(require('$PACKAGE_JSON').version)")

OUTPUT_DIR="$ROOT_DIR/dist-android"
APK_NAME="Cost-Dashboard-Android-${VERSION}"

echo "=== Building Android APK ==="
echo "Version: $VERSION"
echo "Output: $OUTPUT_DIR"

echo ""
echo "[Step 1/5] Building frontend..."
cd "$ROOT_DIR"
npm run build:frontend

echo ""
echo "[Step 2/5] Syncing Capacitor..."
npx cap sync android

echo ""
echo "[Step 3/4] Building release APK..."
cd "$ROOT_DIR/android"

chmod +x gradlew

./gradlew assembleRelease

echo ""
echo "[Step 4/4] Collecting APK files..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

RELEASE_APK="$ROOT_DIR/android/app/build/outputs/apk/release/app-release-unsigned.apk"

if [ -f "$RELEASE_APK" ]; then
    cp "$RELEASE_APK" "$OUTPUT_DIR/${APK_NAME}-release-unsigned.apk"
    echo "  Release APK: $OUTPUT_DIR/${APK_NAME}-release-unsigned.apk"
fi

echo ""
echo "=== Android APK Built ==="
echo "Output directory: $OUTPUT_DIR"
if [ -f "$RELEASE_APK" ]; then
    APK_SIZE=$(du -h "$OUTPUT_DIR/${APK_NAME}-release-unsigned.apk" | cut -f1 | xargs)
    echo "Release APK size: $APK_SIZE"
fi
echo ""
echo "Note: The release APK is unsigned. To sign it, configure keystore in"
echo "      android/app/build.gradle and run: ./gradlew assembleRelease"
