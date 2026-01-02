#!/bin/bash
# HyperDrop Desktop Installer

set -e

echo "🚀 Installing HyperDrop..."

# Create app directory
APP_DIR="$HOME/.hyperdrop"
mkdir -p "$APP_DIR"

# Download latest release
echo "📥 Downloading..."
cd "$APP_DIR"
curl -fsSL https://github.com/jaycode0101/HyperDrop/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1

# Install dependencies
echo "📦 Installing dependencies..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first: https://nodejs.org/"
    exit 1
fi

npm install --silent

# Build
echo "🔨 Building..."
npm run build

# Create desktop launcher
DESKTOP_FILE="$HOME/.local/share/applications/hyperdrop.desktop"
mkdir -p "$HOME/.local/share/applications"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=HyperDrop
Comment=Lightning Fast File Sharing
Exec=npx vite preview --host --port 5173 --open
Path=$APP_DIR
Icon=$APP_DIR/public/icons/icon-512.svg
Terminal=false
Type=Application
Categories=Utility;Network;FileTransfer;
EOF

echo "✅ HyperDrop installed!"
echo "🎉 You can now launch HyperDrop from your applications menu"
echo ""
echo "Or run manually:"
echo "  cd $APP_DIR && npm run dev -- --host"
