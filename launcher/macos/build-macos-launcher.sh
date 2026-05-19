#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="${1:-$ROOT_DIR/dist-portable}"

PACKAGE_JSON="$ROOT_DIR/package.json"
VERSION=$(node -e "console.log(require('$PACKAGE_JSON').version)")

APP_NAME="Cost Dashboard"
APP_BUNDLE_NAME="Cost Dashboard.app"
APP_DIR="$OUTPUT_DIR/$APP_BUNDLE_NAME"

echo "=== Building macOS Launcher ==="
echo "Version: $VERSION"
echo "Output: $APP_DIR"

if [ "$(uname -s)" != "Darwin" ]; then
    echo "[ERROR] macOS is required to build the .app launcher."
    echo "        On macOS, run: npm run build:launcher:macos"
    exit 1
fi

if ! command -v swiftc &> /dev/null; then
    echo "[ERROR] swiftc not found. Install Xcode Command Line Tools:"
    echo "        xcode-select --install"
    exit 1
fi

echo ""
echo "[Step 1/7] Creating .app bundle structure..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

echo "[Step 2/7] Generating app icon..."
generate_icon() {
    local iconset_dir="$APP_DIR/Contents/Resources/AppIcon.iconset"
    mkdir -p "$iconset_dir"

    cat > /tmp/gen_icon.swift << 'SWIFT_EOF'
import AppKit
import CoreGraphics

let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil,
    pixelsWide: size, pixelsHigh: size,
    bitsPerSample: 8, samplesPerPixel: 4,
    hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0,
    bitsPerPixel: 0)!

NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

let rect = CGRect(x: 40, y: 40, width: size - 80, height: size - 80)
let radius: CGFloat = 180

let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)

let gradient = NSGradient(colors: [
    NSColor(red: 37/255, green: 99/255, blue: 235/255, alpha: 1.0),
    NSColor(red: 96/255, green: 165/255, blue: 250/255, alpha: 1.0)
])!
gradient.draw(in: path, angle: 315)

let paragraphStyle = NSMutableParagraphStyle()
paragraphStyle.alignment = .center
let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 560, weight: .bold),
    .foregroundColor: NSColor.white,
    .paragraphStyle: paragraphStyle
]
let text = "云" as NSString
let textSize = text.size(withAttributes: attrs)
let textRect = CGRect(
    x: (CGFloat(size) - textSize.width) / 2,
    y: (CGFloat(size) - textSize.height) / 2,
    width: textSize.width, height: textSize.height
)
text.draw(in: textRect, withAttributes: attrs)

if let tiffData = bitmap.tiffRepresentation {
    let output = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/icon_1024.png"
    if let rep = NSBitmapImageRep(data: tiffData),
       let pngData = rep.representation(using: .png, properties: [:]) {
        try! pngData.write(to: URL(fileURLWithPath: output))
    }
}
SWIFT_EOF

    swiftc -o /tmp/gen_icon /tmp/gen_icon.swift -framework AppKit 2>/dev/null || true

    if [ -x /tmp/gen_icon ]; then
        /tmp/gen_icon "/tmp/cost_dashboard_icon_1024.png"
        rm -f /tmp/gen_icon /tmp/gen_icon.swift
    else
        rm -f /tmp/gen_icon /tmp/gen_icon.swift
        sips -z 1024 1024 -s format png --out "/tmp/cost_dashboard_icon_1024.png" "$SCRIPT_DIR/CostDashboard.icns" 2>/dev/null || true
    fi

    if [ ! -f "/tmp/cost_dashboard_icon_1024.png" ]; then
        python3 -c "
import struct, zlib, os

def create_png(width, height, pixels):
    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\\x89PNG\\r\\n\\x1a\\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    raw = b''
    for y in range(height):
        raw += b'\\x00'
        for x in range(width):
            raw += pixels[y * width + x]
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

size = 1024
pixels = []
for y in range(size):
    for x in range(size):
        pixels.append((0, 0, 0, 0))

with open('/tmp/cost_dashboard_icon_1024.png', 'wb') as f:
    f.write(create_png(size, size, pixels))
"
    fi

    local icon_sizes=(16 32 64 128 256 512)
    for s in "${icon_sizes[@]}"; do
        sips -z "$s" "$s" -s format png --out "$iconset_dir/icon_${s}x${s}.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true
    done

    sips -z 32 32 -s format png --out "$iconset_dir/icon_16x16@2x.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true
    sips -z 64 64 -s format png --out "$iconset_dir/icon_32x32@2x.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true
    sips -z 128 128 -s format png --out "$iconset_dir/icon_64x64@2x.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true
    sips -z 256 256 -s format png --out "$iconset_dir/icon_128x128@2x.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true
    sips -z 512 512 -s format png --out "$iconset_dir/icon_256x256@2x.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true
    sips -z 1024 1024 -s format png --out "$iconset_dir/icon_512x512@2x.png" "/tmp/cost_dashboard_icon_1024.png" 2>/dev/null || true

    iconutil -c icns "$iconset_dir" -o "$APP_DIR/Contents/Resources/AppIcon.icns" 2>/dev/null || true
    rm -rf "$iconset_dir"
    rm -f /tmp/cost_dashboard_icon_1024.png
}

generate_icon

echo "[Step 3/7] Processing Info.plist..."
sed -e "s/__VERSION__/$VERSION/g" \
    -e "s/__COPYRIGHT_YEAR__/$(date +%Y)/g" \
    "$SCRIPT_DIR/Info.plist" > "$APP_DIR/Contents/Info.plist"

echo "[Step 4/7] Compiling Swift launcher..."
TEMP_SOURCE="$OUTPUT_DIR/CostDashboardLauncher.swift.tmp"
sed "s/__VERSION__/$VERSION/g" "$SCRIPT_DIR/CostDashboardLauncher.swift" > "$TEMP_SOURCE"
mv "$TEMP_SOURCE" "${TEMP_SOURCE%.tmp}"

swiftc \
    -o "$APP_DIR/Contents/MacOS/CostDashboardLauncher" \
    "${TEMP_SOURCE%.tmp}" \
    -framework AppKit \
    -framework Foundation \
    -framework UserNotifications \
    -O \
    -module-name CostDashboardLauncher

rm -f "${TEMP_SOURCE%.tmp}"

chmod +x "$APP_DIR/Contents/MacOS/CostDashboardLauncher"

echo "[Step 5/7] Copying launcher source to tools..."
TOOLS_DIR="$OUTPUT_DIR/tools/launcher/macos"
mkdir -p "$TOOLS_DIR"
cp "$SCRIPT_DIR/CostDashboardLauncher.swift" "$TOOLS_DIR/"
cp "$SCRIPT_DIR/Info.plist" "$TOOLS_DIR/"
cp "$SCRIPT_DIR/build-macos-launcher.sh" "$TOOLS_DIR/"

echo "[Step 6/7] Copying application files into .app bundle..."
if [ -d "$OUTPUT_DIR/app" ]; then
    ditto "$OUTPUT_DIR/app" "$APP_DIR/Contents/Resources/app"
    echo "  Copied app/ into .app bundle"
else
    echo "  WARNING: $OUTPUT_DIR/app not found, skipping"
fi

if [ -d "$OUTPUT_DIR/node/macos-arm64" ]; then
    mkdir -p "$APP_DIR/Contents/Resources/node"
    ditto "$OUTPUT_DIR/node/macos-arm64" "$APP_DIR/Contents/Resources/node/macos-arm64"
    echo "  Copied node/macos-arm64/ into .app bundle"
fi
if [ -d "$OUTPUT_DIR/node/macos-x64" ]; then
    mkdir -p "$APP_DIR/Contents/Resources/node"
    ditto "$OUTPUT_DIR/node/macos-x64" "$APP_DIR/Contents/Resources/node/macos-x64"
    echo "  Copied node/macos-x64/ into .app bundle"
fi

if [ -d "$OUTPUT_DIR/data" ]; then
    ditto "$OUTPUT_DIR/data" "$APP_DIR/Contents/Resources/data"
    echo "  Copied data/ into .app bundle (will be migrated to Application Support on first launch)"
fi

echo "[Step 7/7] Checking for Liquid Glass icon (Assets.car)..."
if [ -f "$SCRIPT_DIR/Assets.car" ]; then
    cp "$SCRIPT_DIR/Assets.car" "$APP_DIR/Contents/Resources/Assets.car"
    echo "  Copied pre-built Assets.car (Liquid Glass icon) into .app bundle"
elif [ -d "$SCRIPT_DIR/AppIcon.icon" ] && command -v actool &> /dev/null; then
    echo "  Compiling Liquid Glass icon from AppIcon.icon..."
    actool "$SCRIPT_DIR/AppIcon.icon" \
        --compile "$APP_DIR/Contents/Resources" \
        --app-icon AppIcon \
        --enable-on-demand-resources NO \
        --development-region zh_CN \
        --target-device mac \
        --platform macosx \
        --minimum-deployment-target 10.15 \
        --output-partial-info-plist /dev/null \
        2>/dev/null
    if [ -f "$APP_DIR/Contents/Resources/Assets.car" ]; then
        echo "  Compiled Assets.car (Liquid Glass icon) into .app bundle"
    else
        echo "  WARNING: actool compilation failed, using .icns icon (pre-macOS 26)"
    fi
else
    echo "  No Liquid Glass icon source found, using .icns icon (pre-macOS 26)"
fi

echo ""
echo "=== macOS Launcher Built ==="
echo "App bundle: $APP_DIR"
echo "Executable: $APP_DIR/Contents/MacOS/CostDashboardLauncher"
