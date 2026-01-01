# 🚀 HyperDrop

**Lightning-fast P2P file transfer in your browser**

Transfer files directly between devices with no server upload, no file size limits, and end-to-end encryption.

![HyperDrop Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **⚡ Blazing Fast** - Direct peer-to-peer transfer, no server bottleneck
- **🔒 End-to-End Encrypted** - Files are encrypted with AES-256-GCM
- **📱 Cross-Platform** - Works on any device with a modern browser
- **🌐 Multiple Connection Modes** - P2P, Local (hotspot), and TURN fallback
- **📊 Real-time Progress** - Speed, ETA, and transfer status
- **💾 No Size Limits** - Transfer gigabytes without issues

## 🎯 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/jaycode0101/HyperDrop.git
cd HyperDrop

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Usage

1. **Sender**: Select files → Copy the connection code
2. **Receiver**: Enter the code → Files transfer automatically
3. **Download**: Save received files to your device

## 🔌 Connection Modes

HyperDrop supports multiple connection modes for maximum compatibility:

### 1. P2P Mode (Default)
Direct WebRTC connection between devices. Works when:
- Both devices are on the same WiFi network
- Both devices have unrestricted internet access
- NAT allows peer-to-peer connections

### 2. Local Mode (Hotspot Fallback)
For mobile hotspot scenarios where P2P fails due to AP isolation:

1. **Host**: Start HyperDrop → Switch to "Local Mode" → Host session
2. **Join**: On the other device, open the shared URL or scan QR code
3. Both devices must access the same HyperDrop URL (e.g., `http://192.168.x.x:5173`)

> **Note**: Local mode works via BroadcastChannel and has a 5MB file size limit. For larger files, use P2P mode.

### 3. TURN Server Mode
When P2P fails due to strict firewalls/NAT, traffic is relayed through TURN servers. This is automatic - HyperDrop includes free public TURN servers by default.

## 🚢 Deployment

### Static Site (Vercel/Netlify)

```bash
# Build for production
npm run build

# The 'dist' folder contains the static site
```

**Vercel:**
1. Connect your GitHub repo to Vercel
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

**Netlify:**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

### Signaling Server (Railway)

For better reliability, deploy your own signaling server:

```bash
cd server
npm install
npm start
```

**Deploy to Railway:**
1. Create a new project on [Railway](https://railway.app)
2. Connect the `server` folder
3. Railway will auto-detect the Dockerfile
4. Set environment variable: `PORT=9000`

Then update your client to use the custom server:
```env
# .env
VITE_SIGNALING_SERVER=https://your-server.railway.app/peerjs
```

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```env
# Optional: Self-hosted signaling server
VITE_SIGNALING_SERVER=wss://your-signaling-server.railway.app

# Optional: Custom TURN server (for production)
VITE_TURN_SERVER=turn:your-turn-server.com:443
VITE_TURN_USERNAME=username
VITE_TURN_CREDENTIAL=credential
```

### TURN Server Options

| Option | Cost | Reliability | Setup |
|--------|------|-------------|-------|
| Default (OpenRelay) | Free | Low | None |
| [Metered](https://metered.ca) | ~$0.40/GB | High | 5 min |
| [Xirsys](https://xirsys.com) | Limited free | Medium | 10 min |
| Self-hosted coturn | ~$5/mo VPS | High | 30 min |

## 🐛 Troubleshooting

### "Connection timeout" or "ICE failed"

**Cause**: NAT/firewall blocking P2P connections

**Solutions**:
1. Ensure both devices are on the same network
2. Try Local Mode if on mobile hotspot
3. The app will automatically try TURN servers as fallback

### "Peer not found"

**Cause**: The sender's session expired or they disconnected

**Solutions**:
1. Ask the sender to generate a new code
2. Ensure both devices have internet access
3. Try refreshing both pages

### Mobile Hotspot Issues

Mobile hotspots often have "AP Isolation" which blocks P2P:

1. Switch to **Local Mode** in HyperDrop
2. Host the session on the laptop
3. Connect to `http://<laptop-ip>:5173` from the phone

### Files Corrupt After Transfer

This was fixed in the latest version. Ensure you're using the latest code:
```bash
git pull origin main
npm install
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        HyperDrop                             │
├─────────────────────────────────────────────────────────────┤
│  React Frontend (Vite)                                       │
│  ├── File Selection & Preview                               │
│  ├── QR Code Generation/Scanning                            │
│  └── Transfer Progress UI                                   │
├─────────────────────────────────────────────────────────────┤
│  Transfer Layer                                              │
│  ├── useTransfer.ts - WebRTC/PeerJS (P2P)                  │
│  ├── useLocalTransfer.ts - BroadcastChannel (Local)        │
│  └── ICE Servers - STUN/TURN (NAT Traversal)               │
├─────────────────────────────────────────────────────────────┤
│  Encryption                                                  │
│  └── AES-256-GCM via Web Crypto API                        │
├─────────────────────────────────────────────────────────────┤
│  Storage                                                     │
│  └── IndexedDB (Encrypted file storage)                    │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
hyperdrop/
├── src/
│   ├── App.tsx              # Main application
│   ├── components/          # React components
│   │   ├── FileSelector.tsx
│   │   ├── LocalModePanel.tsx
│   │   └── TransferProgress.tsx
│   ├── hooks/
│   │   ├── useTransfer.ts       # WebRTC transfer
│   │   ├── useLocalTransfer.ts  # Local mode transfer
│   │   └── useDeviceName.ts     # Device identification
│   ├── utils/
│   │   ├── crypto.ts        # Encryption utilities
│   │   ├── network.ts       # Network utilities
│   │   └── storage.ts       # IndexedDB storage
│   └── types.ts             # TypeScript definitions
├── server/                  # Signaling server (optional)
│   ├── index.js
│   ├── Dockerfile
│   └── railway.json
├── .env.example
└── vite.config.ts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ for seamless file sharing**
