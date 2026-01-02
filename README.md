# 🚀 HyperDrop

> **Privacy-first, peer-to-peer file transfer in your browser**

![HyperDrop Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)

## 🎯 What is HyperDrop?

HyperDrop is a **modern web application** for transferring files directly between devices without uploading to any cloud service. It uses cutting-edge WebRTC technology to establish secure, peer-to-peer connections between your devices.

### Why HyperDrop?

- **🔒 Privacy First**: Your files never touch a server - they go directly from device to device
- **⚡ No Limits**: Transfer files of any size - whether it's a 5MB photo or a 5GB video
- **🌐 Browser-Based**: No app installation required - works in any modern browser
- **🔐 Encrypted**: All transfers use end-to-end AES-256-GCM encryption
- **🆓 100% Free**: Open source and free forever, no subscriptions or hidden costs

### Perfect For:

- Transferring large files between your laptop and phone
- Sharing files with colleagues on the same office WiFi
- Moving photos/videos without using cloud storage
- Privacy-conscious file sharing

## ✨ Features

- **⚡ Blazing Fast** - Direct peer-to-peer transfer, no server bottleneck
- **🔒 End-to-End Encrypted** - Files are encrypted with AES-256-GCM
- **📱 Cross-Platform** - Works on any device with a modern browser
- **🌐 Multiple Connection Modes** - P2P, Local (hotspot), and TURN fallback
- **📊 Real-time Progress** - Speed, ETA, and transfer status
- **💾 No Size Limits** - Transfer gigabytes without issues

## 📥 Installation

### 🌐 Use Online (Recommended)
**Just open in your browser:** [https://hyperdrop.app](https://hyperdrop.app)

Click the install button in your browser to add to desktop/home screen!

### 💻 Desktop Installation
**One command:**
```bash
curl -fsSL https://raw.githubusercontent.com/jaycode0101/HyperDrop/main/install.sh | sh
```

### 📱 Mobile Installation (Android/iOS)
1. Open [https://hyperdrop.app](https://hyperdrop.app) in your browser
2. Tap "Add to Home Screen" when prompted
3. Done! App installed with icon

### 🛠️ Run Locally (For Developers)
```bash
git clone https://github.com/jaycode0101/HyperDrop.git && cd HyperDrop && npm install && npm run dev -- --host
```
Then visit `http://YOUR_IP:5173` on any device on your network.

## 🚀 How to Use

### Sending Files

1. Click the **"Send"** tab
2. Select one or more files
3. Copy the connection code that appears
4. Share this code with the recipient (via text, email, etc.)
5. Once they connect, files transfer automatically!

### Receiving Files

1. Click the **"Receive"** tab
2. Enter the sender's connection code
3. Click "Connect"
4. Files will download automatically when received
5. Click to save them to your device!

## 🔌 How Same-Network Connectivity Works

### What "Same Network" Means

When we say "same network," we mean both devices are connected to the **same WiFi router** or network. This gives them:

- **Same subnet**: Both devices have IP addresses in the same range (e.g., 192.168.1.x)
- **Direct connectivity**: They can communicate without going through the internet

**Examples of same network:**
- ✅ Both devices connected to your home WiFi
- ✅ Both connected to office WiFi
- ✅ Computer connected via Ethernet, phone on same WiFi
- ❌ One device on WiFi, another on mobile data
- ⚠️ Mobile hotspot scenarios (see note below)

### Connection Method: WebRTC Peer-to-Peer

HyperDrop uses **WebRTC** to create direct peer-to-peer connections:

1. **Signaling Phase**: 
   - Both devices connect to a signaling server (PeerJS)
   - Exchange connection information (ICE candidates)
   - Never send file data through the signaling server!

2. **P2P Connection**:
   - Devices establish a direct WebRTC data channel
   - Files flow directly from sender to receiver
   - End-to-end encrypted with AES-256-GCM

3. **TURN Fallback** (Automatic):
   - If direct P2P fails (restrictive firewall/NAT)
   - Traffic is relayed through TURN servers
   - Still secure, but may be slightly slower

### Mobile Hotspot Limitations

⚠️ **Important**: Many mobile hotspots enable "AP Isolation," which blocks device-to-device communication. In this scenario:

- P2P connections will fail locally
- TURN fallback will activate automatically
- Files relay through internet instead of direct transfer
- You'll see slightly slower speeds

**Recommended Setup for Best Performance:**
- Use same WiFi network (home/office)
- Or tether phone and access app from same IP on both devices

### Network Requirements

- **Ports**: Outbound connections on random high ports (WebRTC)
- **Protocols**: UDP and TCP
- **Firewall**: Most home/office networks work fine
- **Same URL Access**: For optimal P2P, both devices should access the app from the same origin (e.g., both from `http://192.168.1.100:5173`)

## 📡 Connection Modes Explained

### 1. Direct P2P (Default & Best)

**When it works:**
- Both devices on same WiFi
- No restrictive firewalls
- NAT allows peer connections

**What happens:**
- Fastest possible transfer
- Files never touch any server
- True end-to-end encryption

### 2. TURN Relay (Automatic Fallback)

**When it activates:**
- P2P connection fails
- Strict corporate firewall
- Mobile hotspot with AP isolation
- Complex NAT scenarios

**What happens:**
- Traffic routed through TURN server
- Still encrypted end-to-end
- Slightly slower than direct P2P
- HyperDrop includes free public TURN servers

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

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📂 GitHub Repository

**Repository**: [https://github.com/jaycode0101/HyperDrop](https://github.com/jaycode0101/HyperDrop)

### Pushing Your Code to GitHub

If you've made changes and want to push them:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit" 

# Add remote repository
git remote add origin https://github.com/jaycode0101/HyperDrop.git

# Push to GitHub
git push -u origin main
```

### Download Without Git

Don't have Git installed? Download the repository directly:

**Direct Download**: [Download ZIP](https://github.com/jaycode0101/HyperDrop/archive/refs/heads/main.zip)

**Using PowerShell (Windows):**
```powershell
# Download and extract
Invoke-WebRequest -Uri "https://github.com/jaycode0101/HyperDrop/archive/refs/heads/main.zip" -OutFile "HyperDrop.zip"
Expand-Archive -Path "HyperDrop.zip" -DestinationPath "."
cd HyperDrop-main
npm install
npm run dev -- --host
```

**Using curl (Mac/Linux):**
```bash
# Download and extract
curl -L "https://github.com/jaycode0101/HyperDrop/archive/refs/heads/main.zip" -o HyperDrop.zip
unzip HyperDrop.zip
cd HyperDrop-main
npm install
npm run dev -- --host
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

**Copyright © 2026 jaycode0101**

---

**Made with ❤️ for seamless file sharing**
