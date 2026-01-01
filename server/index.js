/**
 * HyperDrop Signaling Server
 * 
 * A simple PeerJS signaling server that can be self-hosted.
 * Deploy to Railway, Render, Fly.io, or any Node.js host.
 * 
 * Usage:
 *   npm install
 *   npm start
 * 
 * Environment variables:
 *   PORT - Server port (default: 9000)
 */

import express from 'express';
import cors from 'cors';
import { ExpressPeerServer } from 'peer';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 9000;

// Enable CORS for all origins (adjust in production if needed)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
}));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'HyperDrop Signaling Server',
        version: '1.0.0',
        peers: peerServer?.getPeers?.()?.length || 0,
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Create HTTP server
const server = createServer(app);

// Create PeerJS server
const peerServer = ExpressPeerServer(server, {
    path: '/',
    allow_discovery: true,
    proxied: true, // Important for Railway/Render behind a proxy
});

// Mount PeerJS at /peerjs
app.use('/peerjs', peerServer);

// Log peer connections
peerServer.on('connection', (client) => {
    console.log(`[${new Date().toISOString()}] Peer connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`[${new Date().toISOString()}] Peer disconnected: ${client.getId()}`);
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           HyperDrop Signaling Server v1.0.0                ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                               ║
║  PeerJS endpoint: /peerjs                                  ║
║  Health check: /health                                     ║
╚════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
