import { Request, Response } from "express";
import { db } from "../db/supabase.js";

const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_DEMO_FARMER_UUID =
  process.env.DEMO_FARMER_ID || "550e8400-e29b-41d4-a716-446655440000";

function normalizeFarmerId(rawFarmerId: string): string | null {
  const candidate = (rawFarmerId || "").trim();

  if (!candidate) return null;
  if (UUID_V4_OR_V1_REGEX.test(candidate)) return candidate;

  // Backward compatibility for legacy demo IDs from older client builds
  if (candidate === "demo-user-123" || candidate === "demo-user") {
    return DEFAULT_DEMO_FARMER_UUID;
  }

  return null;
}

// GET /api/farms - Get all farms for authenticated user
export const getFarms = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.query;

    if (!farmerId) {
      return res.status(400).json({ error: "farmerId is required" });
    }

    const normalizedFarmerId = normalizeFarmerId(farmerId as string);
    if (!normalizedFarmerId) {
      return res.status(400).json({
        error: "Invalid farmerId. Expected a UUID.",
      });
    }

    const farms = await db.getFarms(normalizedFarmerId);
    res.json({ farms });
  } catch (error) {
    console.error("[Farms] Error fetching farms:", error);
    res.status(500).json({
      error: "Failed to fetch farms",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// GET /api/farms/:id - Get specific farm by ID
export const getFarmById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Farm id is required" });
    }

    let farm;
    try {
      farm = await db.getFarmById(id);
    } catch (error: any) {
      if (error?.code === "PGRST116") {
        return res.status(404).json({ error: "Farm not found" });
      }
      throw error;
    }

    if (!farm) {
      return res.status(404).json({ error: "Farm not found" });
    }

    res.json({ farm });
  } catch (error) {
    console.error("[Farms] Error fetching farm by id", {
      farmId: req.params?.id,
      error,
    });
    res.status(500).json({
      error: "Failed to fetch farm",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// POST /api/farms - Create new farm
export const createFarm = async (req: Request, res: Response) => {
  try {
    const farmData = req.body;

    // Validate required fields
    if (!farmData.farmer_id || !farmData.farm_name) {
      return res.status(400).json({
        error: "farmer_id and farm_name are required",
      });
    }

    const normalizedFarmerId = normalizeFarmerId(String(farmData.farmer_id));
    if (!normalizedFarmerId) {
      return res.status(400).json({
        error: "Invalid farmer_id. Expected a UUID.",
      });
    }

    farmData.farmer_id = normalizedFarmerId;

    const farm = await db.createFarm(farmData);
    res.status(201).json({ farm });
  } catch (error) {
    console.error("[Farms] Error creating farm:", error);
    res.status(500).json({
      error: "Failed to create farm",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// PUT /api/farms/:id - Update farm
export const updateFarm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const farm = await db.updateFarm(id as string, updates);
    res.json({ farm });
  } catch (error) {
    console.error("[Farms] Error updating farm:", error);
    res.status(500).json({
      error: "Failed to update farm",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

