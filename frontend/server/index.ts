import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { handleDemo } from "./routes/demo";
import { sendOtp, verifyOtp } from "./routes/otp";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Proxy /api/fertilizer requests to Python FastAPI backend
  app.use('/api/fertilizer', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/fertilizer': '/api/fertilizer'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying fertilizer API request:', req.method, req.path);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Backend API unavailable' });
    }
  }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // OTP routes
  app.post("/api/otp/send", sendOtp);
  app.post("/api/otp/verify", verifyOtp);

  return app;
}
