import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
    },
    server: {
        host: true, // Allow access from other devices on network
        port: 5173,
    },
})
