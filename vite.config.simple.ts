import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Simplified Vite config WITHOUT Express integration
export default defineConfig({
    server: {
        host: "0.0.0.0",
        port: 5173,  // Different port to avoid conflict
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'Smart Farming AI',
                short_name: 'SmartFarm',
                description: 'AI-driven smart farming solutions',
                theme_color: '#4CAF50',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./client"),
            "@shared": path.resolve(__dirname, "./shared"),
        },
    },
});
