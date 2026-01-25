import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createFarmPolygon,
  getVegetationHealth,
  getSoilMoisture,
  listPolygons,
  deletePolygon
} from '../services/agromonitoring';
import { detectPlantStress, quickStressCheck } from '../services/plantid';

const router: Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/stress'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

/**
 * POST /api/stress/analyze
 * Combined stress analysis using image + satellite data
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { crop, latitude, longitude, polygonId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Read image buffer
    const imageBuffer = fs.readFileSync(imageFile.path);

    // Run both analyses in parallel
    const [imageAnalysis, satelliteData] = await Promise.all([
      detectPlantStress(imageBuffer, parseFloat(latitude) || 0, parseFloat(longitude) || 0),
      polygonId ? getVegetationHealth(polygonId).catch(() => null) : Promise.resolve(null)
    ]);

    // Clean up uploaded file
    fs.unlinkSync(imageFile.path);

    // Combine results
    const combinedStress: string[] = [...imageAnalysis.stressTypes];
    let overallSeverity = 'moderate';
    const recommendations: string[] = [];

    // Add satellite-based stress if available
    if (satelliteData) {
      if (satelliteData.severity === 'critical' || satelliteData.severity === 'stressed') {
        combinedStress.push('Low Vegetation Health (Satellite)');
        recommendations.push(...satelliteData.stress);
      }
      overallSeverity = satelliteData.severity;
    }

    // Add image-based recommendations
    imageAnalysis.diseases.forEach(disease => {
      if (disease.probability > 0.5) {
        recommendations.push(`${disease.name}: ${disease.treatment[0] || 'Monitor closely'}`);
      }
    });

    const response = {
      success: true,
      crop: crop || 'Unknown',
      analysis: {
        image: {
          isHealthy: imageAnalysis.isHealthy,
          confidence: Math.round(imageAnalysis.confidence * 100),
          diseases: imageAnalysis.diseases.map(d => ({
            name: d.name,
            type: d.type,
            probability: Math.round(d.probability * 100),
            treatment: d.treatment,
            prevention: d.prevention
          }))
        },
        satellite: satelliteData ? {
          ndvi: satelliteData.ndvi.toFixed(3),
          health: satelliteData.health,
          severity: satelliteData.severity,
          stress: satelliteData.stress,
          lastUpdated: new Date(satelliteData.lastUpdated).toISOString(),
          satelliteImage: satelliteData.satelliteImage
        } : null
      },
      stressTypes: [...new Set(combinedStress)],
      severity: overallSeverity,
      recommendations: recommendations.slice(0, 5),
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Stress analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze stress',
      message: error.message
    });
  }
});

/**
 * POST /api/stress/quick-check
 * Quick stress check using only image
 */
router.post('/quick-check', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBuffer = fs.readFileSync(imageFile.path);
    const result = await quickStressCheck(imageBuffer);

    // Clean up
    fs.unlinkSync(imageFile.path);

    return res.json({
      success: true,
      stressed: result.stressed,
      stressLevel: result.stressLevel,
      primaryIssue: result.primaryIssue,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Quick stress check error:', error);
    return res.status(500).json({
      error: 'Failed to check stress',
      message: error.message
    });
  }
});

/**
 * POST /api/stress/polygon
 * Create farm polygon for satellite monitoring
 */
router.post('/polygon', async (req: Request, res: Response) => {
  try {
    const { farmId, latitude, longitude, areaAcres } = req.body;

    if (!farmId || !latitude || !longitude || !areaAcres) {
      return res.status(400).json({
        error: 'Missing required fields: farmId, latitude, longitude, areaAcres'
      });
    }

    const polygon = await createFarmPolygon(
      farmId,
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(areaAcres)
    );

    return res.json({
      success: true,
      polygon: {
        id: polygon.id,
        name: polygon.name,
        area: polygon.area,
        center: polygon.center,
        createdAt: new Date(polygon.created_at * 1000).toISOString()
      }
    });
  } catch (error: any) {
    console.error('Polygon creation error:', error);
    return res.status(500).json({
      error: 'Failed to create polygon',
      message: error.message
    });
  }
});

/**
 * GET /api/stress/satellite/:polygonId
 * Get satellite-based vegetation health
 */
router.get('/satellite/:polygonId', async (req: Request, res: Response) => {
  try {
    const { polygonId } = req.params;

    const [vegetationHealth, soilMoisture] = await Promise.all([
      getVegetationHealth(polygonId),
      getSoilMoisture(polygonId).catch(() => null)
    ]);

    return res.json({
      success: true,
      vegetation: {
        ndvi: vegetationHealth.ndvi.toFixed(3),
        health: vegetationHealth.health,
        severity: vegetationHealth.severity,
        stress: vegetationHealth.stress,
        satelliteImage: vegetationHealth.satelliteImage,
        lastUpdated: new Date(vegetationHealth.lastUpdated).toISOString()
      },
      soil: soilMoisture ? {
        moisture: soilMoisture.moisture.toFixed(3),
        temperature: soilMoisture.temperature.toFixed(1),
        waterStress: soilMoisture.waterStress,
        timestamp: new Date(soilMoisture.timestamp).toISOString()
      } : null
    });
  } catch (error: any) {
    console.error('Satellite data error:', error);
    return res.status(500).json({
      error: 'Failed to fetch satellite data',
      message: error.message
    });
  }
});

/**
 * GET /api/stress/polygons
 * List all registered polygons
 */
router.get('/polygons', async (req: Request, res: Response) => {
  try {
    const polygons = await listPolygons();

    return res.json({
      success: true,
      polygons: polygons.map(p => ({
        id: p.id,
        name: p.name,
        area: p.area,
        center: p.center,
        createdAt: new Date(p.created_at * 1000).toISOString()
      }))
    });
  } catch (error: any) {
    console.error('List polygons error:', error);
    return res.status(500).json({
      error: 'Failed to list polygons',
      message: error.message
    });
  }
});

/**
 * DELETE /api/stress/polygon/:polygonId
 * Delete a farm polygon
 */
router.delete('/polygon/:polygonId', async (req: Request, res: Response) => {
  try {
    const { polygonId } = req.params;
    await deletePolygon(polygonId);

    return res.json({
      success: true,
      message: 'Polygon deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete polygon error:', error);
    return res.status(500).json({
      error: 'Failed to delete polygon',
      message: error.message
    });
  }
});

export default router;
