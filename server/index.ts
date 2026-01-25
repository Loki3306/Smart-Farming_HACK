import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { sendOtp, verifyOtp } from "./routes/otp";
import { getFarms, getFarmById, createFarm, updateFarm } from "./routes/farms";
import {
  getLatestSensorData,
  saveSensorData,
  getSensorHistory,
  getActionLogs,
  getSystemStatus,
  triggerWaterPump,
  triggerFertilizer,
  setAutonomous,
  getAutonomous
} from "./routes/sensors";
import {
  getCurrentWeather,
  getForecast,
  getHistoricalWeather
} from "./routes/weather";
import learnRouter from "./routes/learn";
import communityRouter from "./routes/community";
import chatRouter from "./routes/chat";
import presenceRouter from "./routes/presence";
import notificationsRouter from "./routes/notifications";
import chatbotRouter from "./routes/chatbot";
import diseaseRouter from "./routes/disease";
import { autonomousEngine } from "./autonomous/autonomousEngine";

// Python AI Backend Configuration
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // OTP Routes
  app.post("/api/otp/send", sendOtp);
  app.post("/api/otp/verify", verifyOtp);

  // ============================================================================
  // FARM MANAGEMENT - Database CRUD operations
  // ============================================================================
  app.get("/api/farms", getFarms);
  app.get("/api/farms/:id", getFarmById);
  app.post("/api/farms", createFarm);
  app.put("/api/farms/:id", updateFarm);

  // ============================================================================
  // SENSOR DATA - IoT sensor readings and system status
  // ============================================================================
  app.get("/api/sensors/latest", getLatestSensorData);
  app.get("/api/sensors/history", getSensorHistory);
  app.get("/api/sensors/action-logs", getActionLogs);
  app.post("/api/sensors", saveSensorData);
  app.get("/api/sensors/system-status", getSystemStatus);

  // Sensor Actions
  app.post("/api/sensors/actions/water-pump", triggerWaterPump);
  app.post("/api/sensors/actions/fertilizer", triggerFertilizer);

  // ============================================================================
  // SYSTEM CONTROL - Autonomous mode toggle
  // ============================================================================
  app.post("/api/system/autonomous", setAutonomous);
  app.get("/api/system/autonomous", getAutonomous);

  // ============================================================================
  // WEATHER DATA - Real-time weather based on farm GPS location
  // ============================================================================
  app.get("/api/weather/current", getCurrentWeather);
  app.get("/api/weather/forecast", getForecast);
  app.get("/api/weather/historical", getHistoricalWeather);

  // =========================================================================
  // AUTONOMOUS ENGINE - background decisions (irrigation/fertilizer)
  // =========================================================================
  const isTestRun =
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    typeof process.env.VITEST === "string";

  if (!isTestRun) {
    // Add a small delay before starting autonomous engine to allow server to fully initialize
    setTimeout(() => {
      autonomousEngine.start();
    }, 2000);
  }

  // ============================================================================
  // LEARN PLATFORM - Courses, articles, videos, progress tracking
  // ============================================================================
  console.log("📚 Registering Learn routes...");
  app.use("/api/learn", learnRouter);
  console.log("✅ Learn routes registered at /api/learn");

  // ============================================================================
  // COMMUNITY PLATFORM - Real-time posts, reactions, comments, experts
  // ============================================================================
  console.log("👥 Registering Community routes...");
  app.use("/api/community", communityRouter);
  console.log("✅ Community routes registered at /api/community");

  // ============================================================================
  // CHAT SYSTEM - Real-time messaging between farmers and experts
  // ============================================================================
  console.log("💬 Registering Chat routes...");
  app.use("/api/chat", chatRouter);
  console.log("✅ Chat routes registered at /api/chat");

  // ============================================================================
  // USER PRESENCE - Online/offline status tracking
  // ============================================================================
  console.log("👤 Registering Presence routes...");
  app.use("/api/presence", presenceRouter);
  console.log("✅ Presence routes registered at /api/presence");

  // ============================================================================
  // NOTIFICATIONS - User notifications for interactions
  // ============================================================================
  console.log("🔔 Registering Notifications routes...");
  app.use("/api/notifications", notificationsRouter);
  console.log("✅ Notifications routes registered at /api/notifications");

  // ============================================================================
  // CHATBOT - AI Support for Farmers (using configured provider - default: Groq)
  // ============================================================================
  console.log("🤖 Registering Chatbot routes...");
  app.use("/api/chatbot", chatbotRouter);
  console.log("✅ Chatbot routes registered at /api/chatbot");

  //disease detection route
  console.log("🌿 Registering Disease Detection routes...");
  app.use("/api/disease", diseaseRouter);
  console.log("✅ Disease routes registered at /api/disease");

  // ============================================================================
  // YIELD PREDICTION & TRACKING - ML-based yield prediction and harvest tracking
  // ============================================================================
  console.log("🌾 Registering Yield routes...");
  const yieldRoutes = require("./routes/yield");
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

  // ============================================================================
  // AI RECOMMENDATIONS PROXY - Forward requests to Python FastAPI backend
  // ============================================================================

  app.post("/api/recommendations/predict", async (req, res) => {
    try {
      console.log("📤 Forwarding recommendation request to Python AI backend...");

      // Forward request to Python FastAPI
      const response = await fetch(`${PYTHON_AI_URL}/api/recommendations/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Python AI backend error:", response.status, errorText);
        return res.status(response.status).json({
          error: "AI recommendation service error",
          details: errorText,
        });
      }

      const data = await response.json();
      console.log(`✅ Received ${data.recommendations?.length || 0} recommendations from AI`);

      res.json(data);
    } catch (error) {
      console.error("❌ Failed to connect to Python AI backend:", error);
      res.status(503).json({
        error: "AI recommendation service unavailable",
        message: "Please ensure Python backend is running on port 8000",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Health check for Python AI backend
  app.get("/api/recommendations/health", async (_req, res) => {
    try {
      const response = await fetch(`${PYTHON_AI_URL}/health`);
      const data = await response.json();
      res.json({
        express_status: "healthy",
        python_ai_status: response.ok ? "healthy" : "unhealthy",
        python_ai_details: data,
      });
    } catch (error) {
      res.status(503).json({
        express_status: "healthy",
        python_ai_status: "unreachable",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return app;
}
