import { db } from '../db/supabase';
import { autonomousStateStore, type FarmAutomationState } from './autonomousState';
import { writeSensorCommand } from '../services/commandFile';
import { getDynamicCropProfile } from './dynamicCropProfiles';

type CropProfile = {
  moistureOptimal: [number, number];
  npkOptimal: {
    nitrogen: [number, number];
    phosphorus: [number, number];
    potassium: [number, number];
  };
};

const CROP_PROFILES: Record<string, CropProfile> = {
  rice: { moistureOptimal: [70, 90], npkOptimal: { nitrogen: [90, 140], phosphorus: [30, 55], potassium: [70, 110] } },
  wheat: { moistureOptimal: [40, 60], npkOptimal: { nitrogen: [80, 130], phosphorus: [35, 60], potassium: [60, 95] } },
  cotton: { moistureOptimal: [50, 70], npkOptimal: { nitrogen: [70, 120], phosphorus: [25, 45], potassium: [70, 115] } },
  sugarcane: { moistureOptimal: [60, 80], npkOptimal: { nitrogen: [120, 180], phosphorus: [45, 80], potassium: [120, 180] } },
  maize: { moistureOptimal: [50, 75], npkOptimal: { nitrogen: [90, 150], phosphorus: [35, 70], potassium: [90, 140] } },
  soybean: { moistureOptimal: [50, 65], npkOptimal: { nitrogen: [30, 70], phosphorus: [45, 85], potassium: [55, 95] } },
  groundnut: { moistureOptimal: [40, 60], npkOptimal: { nitrogen: [25, 60], phosphorus: [25, 50], potassium: [45, 80] } },
  tomato: { moistureOptimal: [60, 80], npkOptimal: { nitrogen: [90, 150], phosphorus: [55, 95], potassium: [90, 150] } },
  onion: { moistureOptimal: [60, 70], npkOptimal: { nitrogen: [70, 120], phosphorus: [40, 75], potassium: [90, 150] } },
  potato: { moistureOptimal: [60, 80], npkOptimal: { nitrogen: [100, 160], phosphorus: [70, 120], potassium: [120, 190] } },
  default: { moistureOptimal: [50, 70], npkOptimal: { nitrogen: [70, 130], phosphorus: [35, 65], potassium: [70, 120] } },
};

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

function hoursBetween(aIso?: string, bIso?: string) {
  if (!aIso || !bIso) return Infinity;
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.abs(b - a) / 3600000;
}

async function getRainSignal(lat?: number, lon?: number): Promise<{ rainLikelyNext6h: boolean; maxPop: number; rainMm: number } | null> {
  if (!OPENWEATHER_API_KEY) return null;
  if (!lat || !lon) return null;

  const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data: any = await response.json();
  const now = Date.now();
  const cutoff = now + 6 * 3600 * 1000;

  let maxPop = 0;
  let rainMm = 0;

  for (const item of data.list || []) {
    const t = (item.dt ?? 0) * 1000;
    if (t < now || t > cutoff) continue;

    const pop = typeof item.pop === 'number' ? item.pop : 0;
    maxPop = Math.max(maxPop, pop);

    const r3 = item.rain?.['3h'];
    if (typeof r3 === 'number') rainMm += r3;
  }

  const rainLikelyNext6h = rainMm >= 1.0 || maxPop >= 0.6;
  return { rainLikelyNext6h, maxPop, rainMm };
}

export class AutonomousEngine {
  private readonly registeredFarms = new Set<string>();
  private timer: NodeJS.Timeout | null = null;

  private readonly intervalMs: number;
  private readonly irrigationCooldownHours: number;
  private readonly fertilizerCooldownHours: number;

  constructor() {
    const intervalSeconds = parseInt(process.env.AUTONOMOUS_INTERVAL_SECONDS || '600', 10);
    this.intervalMs = Math.max(60_000, (Number.isFinite(intervalSeconds) ? intervalSeconds : 600) * 1000);

    this.irrigationCooldownHours = parseFloat(process.env.AUTONOMOUS_IRRIGATION_COOLDOWN_HOURS || '2');
    this.fertilizerCooldownHours = parseFloat(process.env.AUTONOMOUS_FERTILIZER_COOLDOWN_HOURS || '168'); // 7 days
  }

  start() {
    if (this.timer) return;
    console.log(`[Autonomous] Engine starting (interval=${Math.round(this.intervalMs / 1000)}s)`);
    this.timer = setInterval(() => {
      void this.tick('interval');
    }, this.intervalMs);

    // Immediate tick on startup = catch-up behavior
    void this.tick('startup');
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  registerFarm(farmId: string) {
    if (!farmId) return;
    this.registeredFarms.add(farmId);
  }

  setAutonomousEnabled(farmId: string, enabled: boolean) {
    autonomousStateStore.setFarmState(farmId, { isAutonomous: enabled });
    this.registerFarm(farmId);
  }

  getAutonomousEnabled(farmId: string): boolean {
    return autonomousStateStore.getFarmState(farmId).isAutonomous;
  }

  private async tick(reason: 'startup' | 'interval') {
    if (this.registeredFarms.size === 0) return;

    const farmIds = Array.from(this.registeredFarms);
    for (const farmId of farmIds) {
      try {
        await this.evaluateFarm(farmId, reason);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        // Only log warning for non-network errors to reduce console spam
        if (!errorMessage.includes('ECONNRESET') && !errorMessage.includes('fetch failed')) {
          console.warn(`[Autonomous] Evaluate failed for farm ${farmId}:`, e);
        }
      }
    }
  }

  private cropProfileFor(cropName?: string, soilType?: string): CropProfile {
    const dynamic = getDynamicCropProfile(cropName, soilType);
    if (dynamic) return dynamic;

    const key = (cropName || 'default').toLowerCase().trim();
    return CROP_PROFILES[key] || CROP_PROFILES.default;
  }

  private async evaluateFarm(farmId: string, reason: 'startup' | 'interval') {
    const state: FarmAutomationState = autonomousStateStore.getFarmState(farmId);
    if (!state.isAutonomous) return;

    const nowIso = new Date().toISOString();

    // Basic catch-up guard: if we already ran very recently, skip on startup
    if (reason === 'startup') {
      const hoursSinceLastRun = hoursBetween(state.lastRunAt, nowIso);
      if (hoursSinceLastRun < 0.1) return; // 6 minutes
    }

    let latest;
    try {
      latest = await db.getLatestSensorData(farmId);
    } catch (error) {
      console.error('[Sensors] Error fetching sensor data:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
        hint: 'Check if Supabase connection is available',
        code: (error as any)?.code || ''
      });
      // Update last run time to prevent repeated failures
      autonomousStateStore.setFarmState(farmId, { lastRunAt: nowIso });
      return;
    }

    if (!latest) {
      autonomousStateStore.setFarmState(farmId, { lastRunAt: nowIso });
      return;
    }

    // Farm details (soil type + coordinates for forecast checks)
    let farm: any = null;
    try {
      farm = await db.getFarmById(farmId);
    } catch {
      farm = null;
    }
    const soilType: string | undefined = farm?.soil_type || undefined;

    // Pull crop from farm settings (keyed by farmer_id)
    let cropName: string | undefined;
    try {
      const settings = await db.getFarmSettings(latest.farmer_id);
      cropName = settings?.crop || undefined;
    } catch {
      cropName = undefined;
    }

    const crop = this.cropProfileFor(cropName, soilType);

    const soilMoisture = Number(latest.soil_moisture);
    const nitrogen = Number(latest.nitrogen);
    const phosphorus = Number(latest.phosphorus);
    const potassium = Number(latest.potassium);

    const rainSignal = await getRainSignal(farm?.latitude, farm?.longitude);

    // Irrigation decision (pulse + cooldown)
    const [mMin] = crop.moistureOptimal;
    const needsWater = Number.isFinite(soilMoisture) && soilMoisture < (mMin - 2);

    const hoursSinceIrrigation = hoursBetween(state.lastIrrigationAt, nowIso);
    const irrigationCooldownOk = hoursSinceIrrigation >= this.irrigationCooldownHours;

    const rainLikely = rainSignal?.rainLikelyNext6h ?? false;

    // Realistic rule: if it's slightly low and rain is likely, wait.
    // If it's very low, irrigate even if rain is possible.
    const veryLow = Number.isFinite(soilMoisture) && soilMoisture < (mMin - 12);
    const shouldIrrigate = needsWater && irrigationCooldownOk && (!rainLikely || veryLow);

    if (shouldIrrigate) {
      writeSensorCommand('water_pump', farmId);
      if (farm?.farmer_id) {
        await db.createActionLog({
          farmer_id: farm.farmer_id,
          action: 'irrigation',
          details: `Autonomous irrigation pulse triggered (farm=${farmId}, moisture=${soilMoisture.toFixed(1)}%, crop=${cropName || 'default'}, rainNext6h=${rainLikely ? 'yes' : 'no'})`,
          timestamp: nowIso,
        });
      }
      autonomousStateStore.setFarmState(farmId, { lastIrrigationAt: nowIso });
      console.log(`[Autonomous] Irrigation pulse: farm=${farmId} moisture=${soilMoisture.toFixed(1)} rainLikely=${rainLikely} (mm=${rainSignal?.rainMm ?? 0}, pop=${rainSignal?.maxPop ?? 0})`);
    }

    // Fertilizer decision (rare + cooldown)
    const nMin = crop.npkOptimal.nitrogen[0];
    const pMin = crop.npkOptimal.phosphorus[0];
    const kMin = crop.npkOptimal.potassium[0];

    const nutrientsLow =
      (Number.isFinite(nitrogen) && nitrogen < nMin) ||
      (Number.isFinite(phosphorus) && phosphorus < pMin) ||
      (Number.isFinite(potassium) && potassium < kMin);

    const hoursSinceFertilizer = hoursBetween(state.lastFertilizerAt, nowIso);
    const fertilizerCooldownOk = hoursSinceFertilizer >= this.fertilizerCooldownHours;

    // Conservative: do not fertilize if soil is extremely dry
    const moistureOkForFertilizer = Number.isFinite(soilMoisture) ? soilMoisture >= 30 : true;

    const shouldFertilize = nutrientsLow && fertilizerCooldownOk && moistureOkForFertilizer;

    if (shouldFertilize) {
      writeSensorCommand('fertilizer', farmId);
      if (farm?.farmer_id) {
        await db.createActionLog({
          farmer_id: farm.farmer_id,
          action: 'fertilization',
          details: `Autonomous fertilization triggered (farm=${farmId}, N=${nitrogen},P=${phosphorus},K=${potassium}, crop=${cropName || 'default'})`,
          timestamp: nowIso,
        });
      }
      autonomousStateStore.setFarmState(farmId, { lastFertilizerAt: nowIso });
      console.log(`[Autonomous] Fertilizer: farm=${farmId} N=${nitrogen} P=${phosphorus} K=${potassium}`);
    }

    autonomousStateStore.setFarmState(farmId, { lastRunAt: nowIso });
  }
}

export const autonomousEngine = new AutonomousEngine();
