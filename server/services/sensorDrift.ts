type SensorReadingRow = {
  timestamp?: string | null;
  soil_moisture?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  nitrogen?: number | null;
  phosphorus?: number | null;
  potassium?: number | null;
  [key: string]: unknown;
};

type ActionLogRow = {
  action_type?: string | null;
  action?: string | null;
  timestamp?: string | null;
  [key: string]: unknown;
};

export type DriftContext = {
  soilType?: string | null;
  cropName?: string | null;
  rainLikelyNext6h?: boolean;
  rainMmNext6h?: number;
  actionLogsSinceLastReading?: ActionLogRow[];
};

type DriftResult = {
  sensorData: SensorReadingRow;
  estimatedAt: string;
  hoursElapsed: number;
  didAdjust: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function expDecay(value: number, ratePerHour: number, hours: number): number {
  // value(t) = value0 * e^(-k * t)
  return value * Math.exp(-ratePerHour * hours);
}

/**
 * Applies realistic “offline drift” to sensor values (moisture + NPK) based on time elapsed
 * since the last stored timestamp.
 *
 * Important: This does NOT change `timestamp` (keeps the last measurement time).
 * It returns an estimate of the *current* field conditions in `sensorData`.
 */
export function applyOfflineDriftToLatestReading(
  latest: SensorReadingRow,
  nowIso: string = new Date().toISOString(),
  context: DriftContext = {},
): DriftResult {
  const lastIso = typeof latest?.timestamp === 'string' ? latest.timestamp : null;
  const lastMs = lastIso ? new Date(lastIso).getTime() : NaN;
  const nowMs = new Date(nowIso).getTime();

  if (!Number.isFinite(lastMs) || !Number.isFinite(nowMs) || nowMs <= lastMs) {
    return {
      sensorData: latest,
      estimatedAt: nowIso,
      hoursElapsed: 0,
      didAdjust: false,
    };
  }

  const maxHours = parseEnvNumber('SENSOR_DRIFT_MAX_HOURS', 7 * 24); // cap at 7 days
  const minMinutes = parseEnvNumber('SENSOR_DRIFT_MIN_MINUTES', 2); // ignore tiny deltas

  const hoursElapsedRaw = (nowMs - lastMs) / 3600000;
  const hoursElapsed = clamp(hoursElapsedRaw, 0, maxHours);
  if (hoursElapsed * 60 < minMinutes) {
    return {
      sensorData: latest,
      estimatedAt: nowIso,
      hoursElapsed,
      didAdjust: false,
    };
  }

  // Default rates tuned for “demo realism”:
  // - moisture drifts faster (evaporation)
  // - NPK drifts slower (uptake/leaching)
  let moistureRate = parseEnvNumber('SENSOR_MOISTURE_DECAY_PER_HOUR', 0.015);
  let nitrogenRate = parseEnvNumber('SENSOR_N_DECAY_PER_HOUR', 0.005);
  let phosphorusRate = parseEnvNumber('SENSOR_P_DECAY_PER_HOUR', 0.003);
  let potassiumRate = parseEnvNumber('SENSOR_K_DECAY_PER_HOUR', 0.004);

  // Dynamic modifiers
  const soilType = (context.soilType || '').toLowerCase();
  const cropName = (context.cropName || '').toLowerCase();
  const rainLikely = Boolean(context.rainLikelyNext6h);
  const rainMm = typeof context.rainMmNext6h === 'number' ? context.rainMmNext6h : 0;

  // Soil texture: sandy dries faster, clay retains more.
  let soilMoistureFactor = 1.0;
  if (soilType.includes('sandy')) soilMoistureFactor = 1.35;
  else if (soilType.includes('sand')) soilMoistureFactor = 1.25;
  else if (soilType.includes('clay')) soilMoistureFactor = 0.78;
  else if (soilType.includes('loam')) soilMoistureFactor = 0.92;

  // Crop canopy/water demand: very rough proxy
  let cropMoistureFactor = 1.0;
  if (cropName.includes('rice')) cropMoistureFactor = 0.85; // usually irrigated/puddled
  else if (cropName.includes('sugarcane')) cropMoistureFactor = 1.10;
  else if (cropName.includes('cotton')) cropMoistureFactor = 1.05;
  else if (cropName.includes('wheat')) cropMoistureFactor = 0.98;

  // Temperature: hotter => faster moisture loss
  const tempC = Number(latest.temperature);
  const tempFactor = Number.isFinite(tempC) ? clamp(1 + (tempC - 25) * 0.03, 0.6, 2.0) : 1.0;

  // If rain is likely soon, reduce moisture decay (or slightly increase if a lot of rain expected)
  const rainMoistureFactor = rainLikely ? clamp(1 - Math.min(0.7, 0.15 + rainMm * 0.05), 0.25, 1.0) : 1.0;

  moistureRate = moistureRate * soilMoistureFactor * cropMoistureFactor * tempFactor * rainMoistureFactor;

  // Leaching: rain increases nutrient loss; dry conditions reduce it slightly.
  const rainNutrientFactor = rainLikely ? clamp(1 + Math.min(0.6, 0.2 + rainMm * 0.08), 1.0, 1.6) : 1.0;
  const dryNutrientFactor = (!rainLikely && Number.isFinite(Number(latest.soil_moisture)) && Number(latest.soil_moisture) < 30) ? 0.9 : 1.0;

  nitrogenRate = nitrogenRate * rainNutrientFactor * dryNutrientFactor;
  phosphorusRate = phosphorusRate * (rainNutrientFactor * 0.8 + 0.2) * dryNutrientFactor;
  potassiumRate = potassiumRate * rainNutrientFactor * dryNutrientFactor;

  const adjusted: SensorReadingRow = { ...latest };

  const soilMoisture = Number(latest.soil_moisture);
  if (Number.isFinite(soilMoisture)) {
    adjusted.soil_moisture = clamp(expDecay(soilMoisture, moistureRate, hoursElapsed), 0, 100);
  }

  const nitrogen = Number(latest.nitrogen);
  if (Number.isFinite(nitrogen)) {
    adjusted.nitrogen = clamp(expDecay(nitrogen, nitrogenRate, hoursElapsed), 0, 500);
  }

  const phosphorus = Number(latest.phosphorus);
  if (Number.isFinite(phosphorus)) {
    adjusted.phosphorus = clamp(expDecay(phosphorus, phosphorusRate, hoursElapsed), 0, 500);
  }

  const potassium = Number(latest.potassium);
  if (Number.isFinite(potassium)) {
    adjusted.potassium = clamp(expDecay(potassium, potassiumRate, hoursElapsed), 0, 500);
  }

  // Apply bumps from actions that happened since the last sensor reading.
  // This makes “login catch-up” feel real: irrigation increases moisture, fertilization increases NPK.
  const logs = Array.isArray(context.actionLogsSinceLastReading) ? context.actionLogsSinceLastReading : [];
  const actionOf = (l: ActionLogRow) => (l.action_type || l.action || '').toLowerCase();
  const irrigationCount = logs.filter(l => actionOf(l) === 'irrigation').length;
  const fertilizationCount = logs.filter(l => actionOf(l) === 'fertilization').length;

  if (irrigationCount > 0) {
    const bump = parseEnvNumber('SENSOR_IRRIGATION_MOISTURE_BUMP', 8);
    const cur = Number(adjusted.soil_moisture);
    if (Number.isFinite(cur)) {
      adjusted.soil_moisture = clamp(cur + irrigationCount * bump, 0, 100);
    }
  }

  if (fertilizationCount > 0) {
    const nBump = parseEnvNumber('SENSOR_FERTILIZER_N_BUMP', 18);
    const pBump = parseEnvNumber('SENSOR_FERTILIZER_P_BUMP', 8);
    const kBump = parseEnvNumber('SENSOR_FERTILIZER_K_BUMP', 12);

    const curN = Number(adjusted.nitrogen);
    if (Number.isFinite(curN)) adjusted.nitrogen = clamp(curN + fertilizationCount * nBump, 0, 500);

    const curP = Number(adjusted.phosphorus);
    if (Number.isFinite(curP)) adjusted.phosphorus = clamp(curP + fertilizationCount * pBump, 0, 500);

    const curK = Number(adjusted.potassium);
    if (Number.isFinite(curK)) adjusted.potassium = clamp(curK + fertilizationCount * kBump, 0, 500);
  }

  const didAdjust =
    adjusted.soil_moisture !== latest.soil_moisture ||
    adjusted.nitrogen !== latest.nitrogen ||
    adjusted.phosphorus !== latest.phosphorus ||
    adjusted.potassium !== latest.potassium;

  return {
    sensorData: adjusted,
    estimatedAt: nowIso,
    hoursElapsed,
    didAdjust,
  };
}
