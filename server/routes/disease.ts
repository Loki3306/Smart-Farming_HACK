
import { Router, Request, Response } from "express";
import multer, { type Request as MulterRequest } from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const router = Router();
const upload = multer({ dest: "uploads/" });

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

let diseaseDatabase: DiseaseDatabase = {};
try {
  const dbPath = path.join(__dirname, '../data/disease-info.json');
  const fileContent = fs.readFileSync(dbPath, 'utf-8');
  diseaseDatabase = JSON.parse(fileContent) as DiseaseDatabase;
  console.log('✅ Disease database loaded successfully');
} catch (error) {
  console.warn('⚠️ Disease info database not found, will rely on chatbot only');
}

// POST /predict: expects form-data with 'crop' (string) and 'image' (file)
router.post("/predict", upload.single("image"), async (req: MulterRequest, res: Response) => {
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
    const response = await axios.post(
      "http://localhost:8001/predict",
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      }
    );

    // Clean up uploaded file
    fs.unlink(file.path, () => { });

    // Return prediction result
    return res.json(response.data);
  } catch (error: any) {
    // Clean up uploaded file if exists
    if (req.file) fs.unlink(req.file.path, () => { });
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Simple in-memory cache for disease info (ttl in ms)
const DISEASE_INFO_CACHE: Map<string, { value: any; expiresAt: number }> = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// Helper function to normalize disease names for database lookup
function normalizeDiseaseKey(disease: string): string {
  return disease
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '')
    .replace(/__+/g, '_');
}

/**
 * POST /api/disease/info
 * Request: { crop: string, disease: string, confidence?: number, language?: string }
 * Response: { parsed: boolean, data?: object, raw?: string, source?: string }
 */
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { crop, disease, confidence, language = 'en' } = req.body;

    if (!crop || !disease) {
      return res.status(400).json({ error: 'Missing crop or disease in request body' });
    }

    // Basic sanitization / limits
    if (typeof crop !== 'string' || typeof disease !== 'string') {
      return res.status(400).json({ error: 'Invalid types for crop/disease' });
    }

    const key = `${crop}::${disease}::${language}`;

    // Check cache
    const cached = DISEASE_INFO_CACHE.get(key);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return res.json({ parsed: true, data: cached.value, source: 'cache' });
    }

    // Try to get from disease database first (FALLBACK)
    const diseaseKey = normalizeDiseaseKey(disease);
    if (diseaseDatabase[diseaseKey] && diseaseDatabase[diseaseKey][language]) {
      const dbData = diseaseDatabase[diseaseKey][language];
      console.log(`✅ Using disease database for ${disease} in ${language}`);

      // Cache the database result
      DISEASE_INFO_CACHE.set(key, { value: dbData, expiresAt: Date.now() + CACHE_TTL });

      return res.json({
        parsed: true,
        data: dbData,
        source: 'disease-database'
      });
    }

    // Language-specific instructions
    const languageInstructions = {
      'hi': 'Respond in Hindi (हिंदी में जवाब दें). Use Devanagari script.',
      'mr': 'Respond in Marathi (मराठीत उत्तर द्या). Use Devanagari script.',
      'en': 'Respond in English.'
    };

    const langInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions['en'];

    // Build a focused user message asking for JSON output in the specified language
    const userMessage = `${langInstruction} Provide a concise JSON object (no additional text) with the following keys: symptoms (array of up to 4 short phrases), causes (array of up to 4 short phrases), treatments (array of up to 4 objects with "step" and optional "details"), precautions (array of short phrases). Use plain language, practical low-cost actions for farmers. Crop: ${crop}. Disease: ${disease}. If uncertain, set a top-level field "uncertain": true. Return only valid JSON.`;

    // Call local chatbot endpoint which will proxy to Groq/Ollama
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${SERVER_BASE_URL}/api/chatbot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ message: userMessage, crop }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Chatbot error', details: text });
    }

    const chatbotJson = await response.json();
    let raw = chatbotJson.message || '';

    // Try to parse JSON directly
    let parsed: any = null;
    let parsedSuccess = false;

    // Helper function to clean and extract JSON
    const extractAndParseJSON = (text: string): any | null => {
      // Try direct parse first
      try {
        return JSON.parse(text);
      } catch (e) {
        // Try to extract JSON object from text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Clean up common issues
            let jsonStr = jsonMatch[0];
            // Fix escaped quotes that might be causing issues
            jsonStr = jsonStr.replace(/\\"/g, '"');
            // Try to parse
            return JSON.parse(jsonStr);
          } catch (e2) {
            // Last attempt: try to fix common JSON formatting issues
            try {
              let jsonStr = jsonMatch[0];
              // Remove any text before first { and after last }
              jsonStr = jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1);
              // Fix unescaped quotes in values
              jsonStr = jsonStr.replace(/"([^"]*)":\s*"([^"]*)"/g, (match, key, value) => {
                const cleanValue = value.replace(/"/g, '\\"');
                return `"${key}":"${cleanValue}"`;
              });
              return JSON.parse(jsonStr);
            } catch (e3) {
              return null;
            }
          }
        }
      }
      return null;
    };

    parsed = extractAndParseJSON(raw);
    parsedSuccess = parsed !== null;

    const result = parsedSuccess
      ? { parsed: true, data: parsed, source: chatbotJson.model || chatbotJson.sources?.[0] || 'chatbot' }
      : { parsed: false, raw, source: chatbotJson.model || chatbotJson.sources?.[0] || 'chatbot' };

    // Cache parsed results only
    if (parsedSuccess) {
      DISEASE_INFO_CACHE.set(key, { value: parsed, expiresAt: Date.now() + CACHE_TTL });
    }

    return res.json(result);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Chatbot request timed out' });
    }
    console.error('❌ /api/disease/info error:', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

// Test helper to clear cache (for unit tests)
export function _clearDiseaseInfoCache() {
  DISEASE_INFO_CACHE.clear();
}

export default router;
