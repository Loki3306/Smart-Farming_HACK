import { Request, Response } from 'express';
import { db } from '../db/supabase';
import { writeSensorCommand } from '../services/commandFile';
import { autonomousEngine } from '../autonomous/autonomousEngine';
import { applyOfflineDriftToLatestReading } from '../services/sensorDrift';
import { getRainSignal } from '../services/openWeather';

// GET /api/sensors/latest - Get latest sensor readings for a farm
export const getLatestSensorData = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.query;

    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    const sensorData = await db.getLatestSensorData(farmId as string);

    // Return null if no data exists (don't throw 404)
    if (!sensorData) {
      return res.json({ sensorData: null });
    }

    const farmIdStr = farmId as string;

    const [farm, settings, actionLogs] = await Promise.all([
      db.getFarmById(farmIdStr).catch(() => null),
      db.getFarmSettings(sensorData.farmer_id as string).catch(() => null),
      typeof sensorData.timestamp === 'string'
        ? db.getActionLogsSince(sensorData.farmer_id as string, sensorData.timestamp).catch(() => [])
        : Promise.resolve([]),
    ]);

    const rainSignal = await getRainSignal(farm?.latitude, farm?.longitude).catch(() => null);

    // Apply “offline drift” based on time since last timestamp.
    // Keeps original `timestamp` intact (still represents last actual reading time).
    const drift = applyOfflineDriftToLatestReading(sensorData, undefined, {
      soilType: farm?.soil_type,
      cropName: settings?.crop,
      rainLikelyNext6h: rainSignal?.rainLikelyNext6h,
      rainMmNext6h: rainSignal?.rainMm,
      actionLogsSinceLastReading: actionLogs,
    });

    res.json({
      sensorData: drift.sensorData,
      meta: {
        estimatedAt: drift.estimatedAt,
        hoursElapsed: drift.hoursElapsed,
        didAdjust: drift.didAdjust,
        rainLikelyNext6h: rainSignal?.rainLikelyNext6h ?? null,
        rainMmNext6h: rainSignal?.rainMm ?? null,
      },
    });
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

// GET /api/sensors/action-logs - Get recent action logs for a farm
export const getActionLogs = async (req: Request, res: Response) => {
  try {
    const { farmId, limit } = req.query;

    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    const farm = await db.getFarmById(farmId as string);
    const farmerId = farm?.farmer_id;
    if (!farmerId) {
      return res.json({ actionLogs: [] });
    }

    const logs = await db.getActionLogs(
      farmerId as string,
      limit ? parseInt(limit as string) : 50
    );

    // Keep response compatible with client/services/SensorService.ts
    const mapped = (logs || []).map((l: any) => ({
      id: l.id,
      farm_id: farmId as string,
      action_type: l.action,
      description: l.details,
      timestamp: l.timestamp,
    }));

    res.json({ actionLogs: mapped });
  } catch (error) {
    console.error('[Sensors] Error fetching action logs:', error);
    res.status(500).json({
      error: 'Failed to fetch action logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Autonomous mode is persisted by the autonomous engine state store.

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

    const farmKey = farmId as string;
    // Ensure farm is registered for background evaluation
    autonomousEngine.registerFarm(farmKey);

    const isAutonomous = autonomousEngine.getAutonomousEnabled(farmKey);

    res.json({
      systemStatus: {
        isOnline,
        isAutonomous,
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

// Command file path for Python simulator communication
// Command writing handled by server/services/commandFile

// POST /api/sensors/actions/water-pump - Trigger water pump
export const triggerWaterPump = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.body;

    if (!farmId) {
      return res.status(400).json({ error: 'farmId is required' });
    }

    // Write command for Python simulator
    writeSensorCommand('water_pump', farmId);

    const farm = await db.getFarmById(farmId);
    const farmerId = farm?.farmer_id;

    // Log the action
    if (farmerId) {
      await db.createActionLog({
        farmer_id: farmerId,
        action: 'irrigation',
        details: 'Water pump triggered manually - 15L dispensed',
        timestamp: new Date().toISOString(),
      });
    }

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

    // Write command for Python simulator
    writeSensorCommand('fertilizer', farmId);

    const farm = await db.getFarmById(farmId);
    const farmerId = farm?.farmer_id;

    // Log the action
    if (farmerId) {
      await db.createActionLog({
        farmer_id: farmerId,
        action: 'fertilization',
        details: 'Fertilizer application triggered - 2kg NPK blend',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, message: 'Fertilizer triggered' });
  } catch (error) {
    console.error('[Sensors] Error triggering fertilizer:', error);
    res.status(500).json({
      error: 'Failed to trigger fertilizer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/system/autonomous - Set autonomous mode
export const setAutonomous = async (req: Request, res: Response) => {
  try {
    const { enabled, farmId } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }

    const farmKey = farmId || 'default';
    autonomousEngine.setAutonomousEnabled(farmKey, enabled);

    // Log the action
    if (farmId) {
      const farm = await db.getFarmById(farmId);
      const farmerId = farm?.farmer_id;
      if (farmerId) {
        await db.createActionLog({
          farmer_id: farmerId,
          action: 'info',
          details: `System mode changed to ${enabled ? 'Autonomous' : 'Manual'}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`[System] Autonomous mode set to ${enabled} for farm ${farmKey}`);
    res.json({ success: true, enabled });
  } catch (error) {
    console.error('[System] Error setting autonomous mode:', error);
    res.status(500).json({
      error: 'Failed to set autonomous mode',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/system/autonomous - Get autonomous mode status
export const getAutonomous = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.query;
    const farmKey = (farmId as string) || 'default';
    autonomousEngine.registerFarm(farmKey);
    const enabled = autonomousEngine.getAutonomousEnabled(farmKey);

    res.json({ enabled });
  } catch (error) {
    console.error('[System] Error getting autonomous mode:', error);
    res.status(500).json({
      error: 'Failed to get autonomous mode',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
