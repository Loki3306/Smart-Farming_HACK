import { Request, Response } from 'express';
import { db } from '../db/supabase';

// GET /api/farms - Get all farms for authenticated user
export const getFarms = async (req: Request, res: Response) => {
  try {
    const { farmerId } = req.query;
    
    if (!farmerId) {
      return res.status(400).json({ error: 'farmerId is required' });
    }

    const farms = await db.getFarms(farmerId as string);
    res.json({ farms });
  } catch (error) {
    console.error('[Farms] Error fetching farms:', error);
    res.status(500).json({ 
      error: 'Failed to fetch farms',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/farms/:id - Get specific farm by ID
export const getFarmById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const farm = await db.getFarmById(id);
    
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    
    res.json({ farm });
  } catch (error) {
    console.error('[Farms] Error fetching farm:', error);
    res.status(500).json({ 
      error: 'Failed to fetch farm',
      details: error instanceof Error ? error.message : 'Unknown error'
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
        error: 'farmer_id and farm_name are required' 
      });
    }

    const farm = await db.createFarm(farmData);
    res.status(201).json({ farm });
  } catch (error) {
    console.error('[Farms] Error creating farm:', error);
    res.status(500).json({ 
      error: 'Failed to create farm',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// PUT /api/farms/:id - Update farm
export const updateFarm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const farm = await db.updateFarm(id, updates);
    res.json({ farm });
  } catch (error) {
    console.error('[Farms] Error updating farm:', error);
    res.status(500).json({ 
      error: 'Failed to update farm',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
