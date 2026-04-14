import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import { handleDemo } from "./routes/demo.js";
import { sendOtp, verifyOtp } from "./routes/otp.js";
import { getFarms, getFarmById, createFarm, updateFarm } from "./routes/farms.js";
import {
  getLatestSensorData,
  saveSensorData,
  getSensorHistory,
  getActionLogs,
  getSystemStatus,
  triggerWaterPump,
  triggerFertilizer,
  setAutonomous,
  getAutonomous,
} from "./routes/sensors.js";
import {
  getCurrentWeather,
  getForecast,
  getHistoricalWeather,
} from "./routes/weather.js";
import learnRouter from "./routes/learn.js";
import communityRouter from "./routes/community.js";
import chatRouter from "./routes/chat.js";
import presenceRouter from "./routes/presence.js";
import notificationsRouter from "./routes/notifications.js";
import chatbotRouter from "./routes/chatbot.js";
import diseaseRouter from "./routes/disease.js";
import stressRouter from "./routes/stress.js";
import settingsRoutes from "./routes/settings.js";
import { autonomousEngine } from "./autonomous/autonomousEngine.js";
import * as yieldRoutes from "./routes/yield.js";

// Socket.IO handlers
import { registerChatSocket } from "./socket/chatSocket.js";
import { registerPresenceSocket } from "./socket/presenceSocket.js";
import { registerNotificationSocket } from "./socket/notificationSocket.js";
import { registerCommunitySocket } from "./socket/communitySocket.js";

// Python AI Backend Configuration
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

export function createServer() {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── HTTP Server ───────────────────────────────────────────────────────────
  const httpServer = http.createServer(app);

  // ── Socket.IO ────────────────────────────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Attach io to app so routes can access it
  (app as any).io = io;

  // Register all socket handlers
  registerChatSocket(io);
  registerPresenceSocket(io);
  registerNotificationSocket(io);
  registerCommunitySocket(io);
  console.log("🔌 Socket.IO handlers registered");

  // ── REST Routes ───────────────────────────────────────────────────────────

  app.get("/api/ping", (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE ?? "ping" });
  });

  app.get("/api/blockchain/audit-trail", (_req, res) => {
    return res.json([]);
  });

  app.get("/api/auth/me", (_req, res) => {
    return res.json({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Demo Farmer",
      hasCompletedOnboarding: true,
    });
  });

  app.get("/api/demo", handleDemo);

  // OTP
  app.post("/api/otp/send", sendOtp);
  app.post("/api/otp/verify", verifyOtp);

  // Farm Management
  app.get("/api/farms", getFarms);
  app.get("/api/farms/:id", getFarmById);
  app.post("/api/farms", createFarm);
  app.put("/api/farms/:id", updateFarm);

  // Sensors
  app.get("/api/sensors/latest", getLatestSensorData);
  app.get("/api/sensors/history", getSensorHistory);
  app.get("/api/sensors/action-logs", getActionLogs);
  app.post("/api/sensors", saveSensorData);
  app.get("/api/sensors/system-status", getSystemStatus);
  app.post("/api/sensors/actions/water-pump", triggerWaterPump);
  app.post("/api/sensors/actions/fertilizer", triggerFertilizer);

  // System Control
  app.post("/api/system/autonomous", setAutonomous);
  app.get("/api/system/autonomous", getAutonomous);

  // Weather
  app.get("/api/weather/current", getCurrentWeather);
  app.get("/api/weather/forecast", getForecast);
  app.get("/api/weather/historical", getHistoricalWeather);

  // Autonomous Engine
  const isTestRun =
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    typeof process.env.VITEST === "string";

  const enableEngine = process.env.ENABLE_ENGINE === "true";

  if (!isTestRun && enableEngine) {
    setTimeout(() => {
      autonomousEngine.start();
    }, 2000);
  }

  // Learn Platform
  console.log("📚 Registering Learn routes...");
  app.use("/api/learn", learnRouter);
  console.log("✅ Learn routes registered at /api/learn");

  // Community
  console.log("👥 Registering Community routes...");
  app.use("/api/community", communityRouter);
  console.log("✅ Community routes registered at /api/community");

  // Chat
  console.log("💬 Registering Chat routes...");
  app.use("/api/chat", chatRouter);
  console.log("✅ Chat routes registered at /api/chat");

  // Presence
  console.log("👤 Registering Presence routes...");
  app.use("/api/presence", presenceRouter);
  app.put("/api/presence", (_req, res) => {
    return res.json({ success: true });
  });
  console.log("✅ Presence routes registered at /api/presence");

  // Notifications
  console.log("🔔 Registering Notifications routes...");
  app.use("/api/notifications", notificationsRouter);
  console.log("✅ Notifications routes registered at /api/notifications");

  // Chatbot
  console.log("🤖 Registering Chatbot routes...");
  app.use("/api/chatbot", chatbotRouter);
  console.log("✅ Chatbot routes registered at /api/chatbot");

  // Disease Detection
  console.log("🌿 Registering Disease Detection routes...");
  app.use("/api/disease", diseaseRouter);
  console.log("✅ Disease routes registered at /api/disease");

  // Stress Detection
  console.log("🌱 Registering Stress Detection routes...");
  app.use("/api/stress", stressRouter);
  console.log("✅ Stress routes registered at /api/stress");

  // Settings
  console.log("⚙️ Registering Settings routes...");
  app.use("/api/settings", settingsRoutes);
  console.log("✅ Settings routes registered at /api/settings");

  // Yield Prediction & Tracking
  console.log("🌾 Registering Yield routes...");
  app.post("/api/yields/predict", yieldRoutes.predictYield);
  app.get("/api/yields/optimize/:cropType", yieldRoutes.getOptimizationTips);
  app.get("/api/yields/benchmark/:cropType", yieldRoutes.getYieldBenchmark);
  app.get("/api/yields/farmer/:farmerId", yieldRoutes.getYieldsByFarmer);
  app.get("/api/yields/compare/:farmerId", yieldRoutes.getYieldComparison);
  app.get("/api/yields/history/:farmerId", yieldRoutes.getYieldHistory);
  app.get("/api/yields/:id", yieldRoutes.getYieldById);
  app.post("/api/yields", yieldRoutes.createYieldRecord);
  app.put("/api/yields/:id/harvest", yieldRoutes.logHarvest);
  console.log("✅ Yield routes registered at /api/yields");

  // AI Recommendations proxy
  app.post("/api/recommendations/predict", async (req, res) => {
    try {
      const response = await fetch(`${PYTHON_AI_URL}/api/recommendations/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: "AI recommendation service error", details: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(503).json({
        error: "AI recommendation service unavailable",
        message: "Please ensure Python backend is running on port 8000",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/recommendations/health", async (_req, res) => {
    try {
      const response = await fetch(`${PYTHON_AI_URL}/health`);
      const data = await response.json();
      res.json({ express_status: "healthy", python_ai_status: response.ok ? "healthy" : "unhealthy", python_ai_details: data });
    } catch (error) {
      res.status(503).json({
        express_status: "healthy",
        python_ai_status: "unreachable",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Return both app and httpServer so the entry point can listen on httpServer
  return { app, httpServer, io };
}


