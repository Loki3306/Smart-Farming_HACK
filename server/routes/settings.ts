import { Router } from "express";
import { db } from "../db/supabase.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const farmerId =
      typeof req.query?.farmer_id === "string" ? req.query.farmer_id.trim() : "";

    if (!farmerId) {
      return res.status(400).json({ error: "farmer_id is required" });
    }

    const saved = await db.getFarmSettings(farmerId);
    const settings = {
      farmer_id: farmerId,
      irrigation_mode: "auto",
      crop: "wheat",
      ...(saved ?? {}),
    };

    return res.json({ settings });
  } catch (error) {
    console.error("[Settings] Failed to fetch settings:", error);
    return res.status(500).json({
      error: "Failed to fetch settings",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body ?? {};
    const farmerId =
      typeof data.farmer_id === "string" ? data.farmer_id.trim() : "";

    if (!farmerId) {
      return res.status(400).json({ error: "farmer_id is required" });
    }

    const saved = await db.saveFarmSettings({
      farmer_id: farmerId,
      crop:
        typeof data.crop === "string" && data.crop.trim()
          ? data.crop.trim()
          : "wheat",
    });

    return res.json({
      success: true,
      settings: saved,
    });
  } catch (error) {
    console.error("[Settings] Failed to save settings:", error);
    return res.status(500).json({
      error: "Failed to save settings",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
