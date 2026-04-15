import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const router = Router();
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load disease information database
interface DiseaseInfo {
  symptoms: string[];
  causes: string[];
  treatments: Array<{ step: string; details?: string }>;
  precautions: string[];
}

interface DiseaseDatabase {
  [diseaseKey: string]: {
    [language: string]: DiseaseInfo;
  };
}

let diseaseDatabase: DiseaseDatabase | null = null;
let diseaseDatabaseMissing = false;

async function getDiseaseDatabase(): Promise<DiseaseDatabase> {
  if (diseaseDatabase) return diseaseDatabase;
  if (diseaseDatabaseMissing) return {};

  try {
    const dbPath = path.join(__dirname, "../data/disease-info.json");
    const fileContent = await fs.promises.readFile(dbPath, "utf-8");
    diseaseDatabase = JSON.parse(fileContent) as DiseaseDatabase;
    console.log("✅ Disease database loaded successfully");
  } catch (error) {
    diseaseDatabaseMissing = true;
    diseaseDatabase = {};
    console.warn(
      "⚠️ Disease info database not found, will rely on chatbot only",
    );
  }

  return diseaseDatabase;
}

// POST /predict: expects form-data with 'crop' (string) and 'image' (file)
router.post(
  "/predict",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const crop = req.body.crop;
      const file = req.file;
      if (!crop || !file) {
        return res.status(400).json({ error: "Missing crop or image file" });
      }

      // Prepare form-data for disease_model API
      const form = new FormData();
      form.append("crop", crop);
      form.append("image", fs.createReadStream(file.path), file.originalname);

      // Forward to disease_model API
      const response = await axios.post("http://127.0.0.1:8001/predict", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      // Clean up uploaded file
      fs.unlink(file.path, () => {});

      // Return prediction result
      return res.json(response.data);
    } catch (error: any) {
      // Clean up uploaded file if exists
      if (req.file) fs.unlink(req.file.path, () => {});
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      return res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },
);

// Simple in-memory cache for disease info (ttl in ms)
const DISEASE_INFO_CACHE: Map<string, { value: any; expiresAt: number }> =
  new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";

function buildFallbackDiseaseInfo(crop: string, disease: string): DiseaseInfo {
  return {
    symptoms: [
      `Possible ${disease} symptoms observed in ${crop}`,
      "Leaf discoloration, spots, or wilting",
      "Reduced plant vigor",
    ],
    causes: [
      "High humidity or poor airflow",
      "Pathogen spread from infected plant parts",
      "Stress due to irrigation or nutrient imbalance",
    ],
    treatments: [
      { step: "Remove and isolate visibly affected leaves/plants" },
      { step: "Apply crop-safe treatment recommended by local agronomist" },
      { step: "Avoid overwatering and improve field ventilation" },
    ],
    precautions: [
      "Sanitize tools after field work",
      "Scout fields regularly for early signs",
      "Use disease-free planting material",
    ],
  };
}

// Helper function to normalize disease names for database lookup
function normalizeDiseaseKey(disease: string): string {
  return disease
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/__+/g, "_");
}

/**
 * POST /api/disease/info
 * Request: { crop: string, disease: string, confidence?: number, language?: string }
 * Response: { parsed: boolean, data?: object, raw?: string, source?: string }
 */
router.post("/info", async (req: Request, res: Response) => {
  try {
    const { crop, disease, confidence, language = "en" } = req.body;

    if (!crop || !disease) {
      return res
        .status(400)
        .json({ error: "Missing crop or disease in request body" });
    }

    // Basic sanitization / limits
    if (typeof crop !== "string" || typeof disease !== "string") {
      return res.status(400).json({ error: "Invalid types for crop/disease" });
    }

    const key = `${crop}::${disease}::${language}`;

    // Check cache
    const cached = DISEASE_INFO_CACHE.get(key);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return res.json({ parsed: true, data: cached.value, source: "cache" });
    }

    // Try to get from disease database first (FALLBACK)
    const database = await getDiseaseDatabase();
    const diseaseKey = normalizeDiseaseKey(disease);
    if (database[diseaseKey] && database[diseaseKey][language]) {
      const dbData = database[diseaseKey][language];
      console.log(`✅ Using disease database for ${disease} in ${language}`);

      // Cache the database result
      DISEASE_INFO_CACHE.set(key, {
        value: dbData,
        expiresAt: Date.now() + CACHE_TTL,
      });

      return res.json({
        parsed: true,
        data: dbData,
        source: "disease-database",
      });
    }

    // Call FastAPI disease info endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const targetUrl = `${PYTHON_AI_URL}/api/disease/info`;

    console.log(
      `[disease/info] Forwarding request to ${targetUrl} (crop=${crop}, disease=${disease})`,
    );

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ crop, disease, confidence, language }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `[disease/info] FastAPI returned ${response.status}: ${text}`,
      );
      return res.json({
        parsed: true,
        data: buildFallbackDiseaseInfo(crop, disease),
        source: "fallback",
      });
    }

    const fastApiResult = await response.json();

    // Cache parsed results only
    if (fastApiResult?.parsed && fastApiResult?.data) {
      DISEASE_INFO_CACHE.set(key, {
        value: fastApiResult.data,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }

    return res.json(fastApiResult);
  } catch (error: any) {
    if (error.name === "AbortError") {
      return res.json({
        parsed: true,
        data: buildFallbackDiseaseInfo(
          String(req.body?.crop || "crop"),
          String(req.body?.disease || "disease"),
        ),
        source: "fallback-timeout",
      });
    }
    console.error("❌ /api/disease/info error:", error);
    return res.json({
      parsed: true,
      data: buildFallbackDiseaseInfo(
        String(req.body?.crop || "crop"),
        String(req.body?.disease || "disease"),
      ),
      source: "fallback-error",
    });
  }
});

// Test helper to clear cache (for unit tests)
export function _clearDiseaseInfoCache() {
  DISEASE_INFO_CACHE.clear();
}

export default router;
