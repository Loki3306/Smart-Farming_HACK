import { Request, Response } from 'express';
import { db } from '../db/supabase';

// GET /api/sensors/latest - Get latest sensor readings for a farm
export const getLatestSensorData = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.query;
    
    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    const sensorData = await db.getLatestSensorData(farmId as string);
    
    // Return null if no data exists (don't throw 404)
    res.json({ sensorData: sensorData || null });
  } catch (error) {
    console.error('[Sensors] Error fetching sensor data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sensor data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/sensors - Save new sensor reading
export const saveSensorData = async (req: Request, res: Response) => {
  try {
    const sensorData = req.body;
    
    // Validate required fields
    if (!sensorData.farm_id) {
      return res.status(400).json({ error: 'farm_id is required' });
    }

    // Add timestamp if not provided
    if (!sensorData.timestamp) {
      sensorData.timestamp = new Date().toISOString();
    }

    const saved = await db.saveSensorData(sensorData);
    res.status(201).json({ sensorData: saved });
  } catch (error) {
    console.error('[Sensors] Error saving sensor data:', error);
    res.status(500).json({ 
      error: 'Failed to save sensor data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/sensors/history - Get sensor reading history
export const getSensorHistory = async (req: Request, res: Response) => {
  try {
    const { farmId, limit } = req.query;
    
    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    const history = await db.getSensorHistory(
      farmId as string, 
      limit ? parseInt(limit as string) : 100
    );
    
    res.json({ history });
  } catch (error) {
    console.error('[Sensors] Error fetching sensor history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sensor history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/sensors/system-status - Get system status
export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.query;
    
    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    // Get latest sensor data to determine if system is online
    const latestData = await db.getLatestSensorData(farmId as string);
    
    const isOnline = latestData && 
      (new Date().getTime() - new Date(latestData.timestamp).getTime()) < 300000; // 5 minutes
    
    res.json({
      systemStatus: {
        isOnline,
        isAutonomous: true, // TODO: Get from farm settings
        location: 'Farm Location', // TODO: Get from farm details
        lastUpdate: latestData?.timestamp || null
      }
    });
  } catch (error) {
    console.error('[Sensors] Error fetching system status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/sensors/actions/water-pump - Trigger water pump
export const triggerWaterPump = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.body;
    
    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    // Log the action
    await db.createActionLog({
      farm_id: farmId,
      action_type: 'irrigation',
      description: 'Water pump triggered manually',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Water pump triggered' });
  } catch (error) {
    console.error('[Sensors] Error triggering water pump:', error);
    res.status(500).json({ 
      error: 'Failed to trigger water pump',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/sensors/actions/fertilizer - Trigger fertilizer
export const triggerFertilizer = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.body;
    
    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    // Log the action
    await db.createActionLog({
      farm_id: farmId,
      action_type: 'fertilization',
      description: 'Fertilizer application triggered manually',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Fertilizer triggered' });
  } catch (error) {
    console.error('[Sensors] Error triggering fertilizer:', error);
    res.status(500).json({ 
      error: 'Failed to trigger fertilizer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
