
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });

// POST /predict: expects form-data with 'crop' (string) and 'image' (file)
router.post("/predict", upload.single("image"), async (req: Request, res: Response) => {
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
		fs.unlink(file.path, () => {});

		// Return prediction result
		return res.json(response.data);
	} catch (error: any) {
		// Clean up uploaded file if exists
		if (req.file) fs.unlink(req.file.path, () => {});
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

/**
 * POST /api/disease/info
 * Request: { crop: string, disease: string, confidence?: number }
 * Response: { parsed: boolean, data?: object, raw?: string, source?: string }
 */
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { crop, disease, confidence } = req.body;

    if (!crop || !disease) {
      return res.status(400).json({ error: 'Missing crop or disease in request body' });
    }

    // Basic sanitization / limits
    if (typeof crop !== 'string' || typeof disease !== 'string') {
      return res.status(400).json({ error: 'Invalid types for crop/disease' });
    }

    const key = `${crop}::${disease}`;

    // Check cache
    const cached = DISEASE_INFO_CACHE.get(key);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return res.json({ parsed: true, data: cached.value, source: 'cache' });
    }

    // Build a focused user message asking for JSON output
    const userMessage = `Provide a concise JSON object (no additional text) with the following keys: symptoms (array of up to 4 short phrases), causes (array of up to 4 short phrases), treatments (array of up to 4 objects with \"step\" and optional \"details\"), precautions (array of short phrases). Use plain language, practical low-cost actions for farmers. Crop: ${crop}. Disease: ${disease}. If uncertain, set a top-level field \"uncertain\": true. Return only valid JSON.`;

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
    const raw = chatbotJson.message || '';

    // Try to parse JSON directly
    let parsed: any = null;
    let parsedSuccess = false;

    try {
      parsed = JSON.parse(raw);
      parsedSuccess = true;
    } catch (e) {
      // Attempt to extract first JSON object substring
      const m = raw.match(/\{[\s\S]*\}/m);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
          parsedSuccess = true;
        } catch (e2) {
          parsedSuccess = false;
        }
      }
    }

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
