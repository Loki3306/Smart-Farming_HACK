import fs from 'node:fs';
import path from 'node:path';

export type CropProfile = {
  moistureOptimal: [number, number];
  npkOptimal: {
    nitrogen: [number, number];
    phosphorus: [number, number];
    potassium: [number, number];
  };
};

type DatasetProfile = {
  moistureOptimal?: [number, number] | number[];
  tempOptimal?: [number, number] | number[];
  phOptimal?: [number, number] | number[];
  npkOptimal?: {
    nitrogen?: [number, number] | number[];
    phosphorus?: [number, number] | number[];
    potassium?: [number, number] | number[];
  };
};

type DatasetEntry = {
  displayName?: string;
  overall?: DatasetProfile;
  soils?: Record<string, DatasetProfile>;
};

let cachedCrops: Record<string, DatasetEntry> | null = null;

function canonicalKey(value: string): string {
  const v = (value || '').trim().toLowerCase();
  let out = '';
  let prevUs = false;
  for (const ch of v) {
    const isAlnum = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
    if (isAlnum) {
      out += ch;
      prevUs = false;
      continue;
    }
    if (!prevUs) {
      out += '_';
      prevUs = true;
    }
  }
  out = out.replace(/^_+|_+$/g, '');
  while (out.includes('__')) out = out.replace(/__+/g, '_');
  return out;
}

function loadCrops(): Record<string, DatasetEntry> {
  if (cachedCrops) return cachedCrops;

  try {
    const filePath = path.join(process.cwd(), 'shared', 'crop_profiles.json');
    if (!fs.existsSync(filePath)) {
      cachedCrops = {};
      return cachedCrops;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const crops = parsed?.crops;
    cachedCrops = crops && typeof crops === 'object' ? crops : {};
  } catch {
    cachedCrops = {};
  }

  return cachedCrops;
}

function toBand(v: unknown, fallback: [number, number]): [number, number] {
  if (Array.isArray(v) && v.length >= 2) {
    const a = Number(v[0]);
    const b = Number(v[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) return a <= b ? [a, b] : [b, a];
  }
  return fallback;
}

export function getDynamicCropProfile(cropName?: string, soilType?: string): CropProfile | null {
  const crops = loadCrops();
  const ckey = canonicalKey(cropName || '');
  if (!ckey) return null;

  const entry = crops[ckey];
  if (!entry) return null;

  const skey = canonicalKey(soilType || '');
  const soilProfile = skey && entry.soils ? entry.soils[skey] : undefined;
  const chosen = soilProfile || entry.overall;
  if (!chosen) return null;

  const npk = chosen.npkOptimal || {};

  return {
    moistureOptimal: toBand(chosen.moistureOptimal, [50, 70]),
    npkOptimal: {
      nitrogen: toBand(npk.nitrogen, [70, 130]),
      phosphorus: toBand(npk.phosphorus, [35, 65]),
      potassium: toBand(npk.potassium, [70, 120]),
    },
  };
}
