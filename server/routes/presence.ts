import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// =====================================================
// USER PRESENCE ENDPOINTS
// =====================================================

/**
 * GET /api/presence/:userId
 * Get user's presence status
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: presence, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }

    // If no presence record, user is offline
    if (!presence) {
      return res.json({
        user_id: userId,
        status: 'offline',
        last_seen: null,
      });
    }

    res.json(presence);
  } catch (error: any) {
    console.error('Error fetching user presence:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user presence' });
  }
});

/**
 * PUT /api/presence
 * Update current user's presence status
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const { user_id, status } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!status || !['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({ 
        error: 'status must be one of: online, offline, away' 
      });
    }

    // Upsert presence
    const { data: presence, error } = await supabase
      .from('user_presence')
      .upsert({
        user_id,
        status,
        last_seen: status === 'offline' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json(presence);
  } catch (error: any) {
    console.error('Error updating presence:', error);
    res.status(500).json({ error: error.message || 'Failed to update presence' });
  }
});

/**
 * POST /api/presence/heartbeat
 * Send heartbeat to keep user online
 */
router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Update last activity timestamp
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id,
        status: 'online',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending heartbeat:', error);
    res.status(500).json({ error: error.message || 'Failed to send heartbeat' });
  }
});

/**
 * GET /api/presence/bulk
 * Get presence status for multiple users
 */
router.get('/bulk', async (req: Request, res: Response) => {
  try {
    const { user_ids } = req.query;

    if (!user_ids) {
      return res.status(400).json({ error: 'user_ids is required' });
    }

    const userIdArray = (user_ids as string).split(',').filter(id => id.trim());

    if (userIdArray.length === 0) {
      return res.json({ presence: [] });
    }

    const { data: presenceList, error } = await supabase
      .from('user_presence')
      .select('*')
      .in('user_id', userIdArray);

    if (error) throw error;

    // Create map for quick lookup
    const presenceMap = new Map(
      (presenceList || []).map(p => [p.user_id, p])
    );

    // Fill in offline status for users without presence records
    const result = userIdArray.map(userId => {
      const presence = presenceMap.get(userId);
      return presence || {
        user_id: userId,
        status: 'offline',
        last_seen: null,
      };
    });

    res.json({ presence: result });
  } catch (error: any) {
    console.error('Error fetching bulk presence:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bulk presence' });
  }
});

/**
 * POST /api/presence/cleanup
 * Run maintenance tasks (cleanup old typing indicators, update away/offline status)
 * Should be called periodically by a cron job or similar
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    // Run cleanup functions
    const { data: typingCleanup } = await supabase
      .rpc('cleanup_old_typing_indicators');

    const { data: awayCount } = await supabase
      .rpc('auto_set_away_status');

    const { data: offlineCount } = await supabase
      .rpc('auto_set_offline_status');

    res.json({
      success: true,
      cleaned: {
        typing_indicators: typingCleanup || 0,
        set_away: awayCount || 0,
        set_offline: offlineCount || 0,
      }
    });
  } catch (error: any) {
    console.error('Error running presence cleanup:', error);
    res.status(500).json({ error: error.message || 'Failed to run cleanup' });
  }
});

export default router;
