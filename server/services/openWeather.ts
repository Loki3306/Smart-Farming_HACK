const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export type RainSignal = {
  rainLikelyNext6h: boolean;
  maxPop: number;
  rainMm: number;
};

export async function getRainSignal(lat?: number, lon?: number): Promise<RainSignal | null> {
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
