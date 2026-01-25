/**
 * Irrigation Planning Service
 * Provides recommendations, cost estimates, and implementation guidance
 */

import { SectionData, WaterSource, calculateDistance, getFarmMapping } from '../utils/farmMappingStorage';

// Irrigation method types
export type IrrigationMethod = 'drip' | 'sprinkler' | 'surface' | 'pump-pipeline';

// Irrigation plan interface
export interface IrrigationPlan {
  id: string;
  sectionId: string;
  sectionName: string;
  waterSourceId: string;
  waterSourceName: string;
  waterSourceType: WaterSource['type'];
  method: IrrigationMethod;
  distance: number; // meters
  estimatedCost: {
    materials: number;
    labor: number;
    operational: number; // per year
    total: number;
  };
  components: IrrigationComponent[];
  recommendations: string[];
  warnings: string[];
  efficiency: number; // 0-100%
  suitabilityScore: number; // 0-100
  implementationTime: string;
  waterRequirement: number; // liters per day
  status: 'draft' | 'approved' | 'in-progress' | 'completed';
  createdAt: string;
}

export interface IrrigationComponent {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface IrrigationRecommendation {
  method: IrrigationMethod;
  suitabilityScore: number;
  pros: string[];
  cons: string[];
  estimatedCost: IrrigationPlan['estimatedCost'];
  components: IrrigationComponent[];
  efficiency: number;
  bestFor: string[];
}

/**
 * Base Pricing Database (Indian Rupees - 2026)
 * Base region: Maharashtra
 * Sources: Amazon India, Moglix, Flipkart, Local Agricultural Markets
 * Last Updated: January 2026
 */
const BASE_PRICING = {
  // Pipes (per meter)
  // Source: Finolex, Supreme, Astral brands on Amazon/Moglix
  pvcPipe2inch: 52,        // ₹52/m (50mm dia) - Standard quality
  pvcPipe3inch: 95,        // ₹95/m (75mm dia)
  pvcPipe4inch: 145,       // ₹145/m (110mm dia)
  hdpePipe: 42,            // ₹42/m (PE-80 grade)
  
  // Drip irrigation (Netafim/Jain equivalent)
  // Source: Jain Irrigation, Netafim India, AgroStar
  dripLateralPipe: 12,     // ₹12/m (16mm inline drip)
  dripEmitter: 4.5,        // ₹4.5 per emitter (2-4 LPH)
  dripFilter: 2800,        // ₹2800 (120 mesh screen filter)
  dripMainline: 35,        // ₹35/m (63mm HDPE)
  dripVenturi: 1200,       // ₹1200 (fertilizer injector)
  dripPressureRegulator: 850, // ₹850 (for uniform pressure)
  
  // Sprinkler system (Rain Gun / Impact type)
  // Source: Netafim, EPC Industries, Finolex
  sprinklerHead: 380,      // ₹380 (impact type, 12-15m radius)
  sprinklerRiser: 120,     // ₹120 (GI riser pipe 3/4")
  sprinklerPipe: 55,       // ₹55/m (63mm HDPE)
  rainGun: 8500,           // ₹8500 (30-40m radius)
  
  // Pumps (Crompton, Kirloskar, V-Guard brands)
  // Source: Moglix, Crompton official, Kirloskar dealers
  pump1hp: 9500,           // ₹9500 (monoblock, 1HP)
  pump2hp: 13500,          // ₹13500 (2HP submersible/monoblock)
  pump3hp: 19500,          // ₹19500 (3HP submersible)
  pump5hp: 32000,          // ₹32000 (5HP submersible)
  pump7hp: 45000,          // ₹45000 (7.5HP submersible)
  
  // Valves & Accessories
  // Source: Tata Tiscon, Supreme, local hardware
  footValve: 950,          // ₹950 (brass/PVC foot valve)
  nonReturnValve: 750,     // ₹750 (NRV check valve)
  gateValve: 480,          // ₹480 (2" gate valve)
  ballValve: 320,          // ₹320 (PVC ball valve)
  elbow: 32,               // ₹32 (90° elbow fitting)
  tee: 45,                 // ₹45 (T-junction)
  reducer: 58,             // ₹58 (size reducer)
  endCap: 18,              // ₹18 (end cap)
  
  // Storage tanks (Sintex, Supreme, Kaveri brands)
  // Source: Amazon India, Flipkart
  tank500L: 4200,          // ₹4200 (500L overhead tank)
  tank1000L: 7200,         // ₹7200 (1000L triple layer)
  tank2000L: 12500,        // ₹12500 (2000L)
  tank5000L: 28000,        // ₹28000 (5000L agricultural)
  
  // Labor (per day, 8-hour work)
  // Source: Local agricultural labor rates across Maharashtra
  laborDigging: 550,       // ₹550/day (unskilled, trench digging)
  laborPipeFitting: 700,   // ₹700/day (semi-skilled, pipe laying)
  laborElectrician: 950,   // ₹950/day (skilled, pump installation)
  laborPlumber: 850,       // ₹850/day (skilled, system assembly)
  
  // Installation materials
  // Source: Local hardware markets
  solventCement: 180,      // ₹180/500ml (PVC adhesive)
  teflonTape: 25,          // ₹25/roll (thread seal tape)
  clamps: 15,              // ₹15/unit (pipe clamps)
};

/**
 * Regional Price Multipliers
 * Based on: Transport costs, local competition, labor wages, market accessibility
 * Source: Agricultural department reports, local dealer surveys
 */
const REGIONAL_MULTIPLIERS: Record<string, { material: number; labor: number; name: string }> = {
  // North India
  'PB': { material: 1.15, labor: 1.25, name: 'Punjab' },           // Higher wages, good infrastructure
  'HR': { material: 1.10, labor: 1.20, name: 'Haryana' },          // NCR proximity, higher costs
  'UP': { material: 0.95, labor: 0.85, name: 'Uttar Pradesh' },    // Lower wages, competitive market
  'HP': { material: 1.25, labor: 1.15, name: 'Himachal Pradesh' }, // Hill transport costs
  'JK': { material: 1.30, labor: 1.10, name: 'Jammu & Kashmir' },  // Remote, higher transport
  
  // South India
  'KA': { material: 1.00, labor: 1.05, name: 'Karnataka' },        // Bangalore hub, baseline
  'TN': { material: 1.05, labor: 1.10, name: 'Tamil Nadu' },       // Urban centers nearby
  'KL': { material: 1.20, labor: 1.30, name: 'Kerala' },           // Highest wages, hilly terrain
  'AP': { material: 0.98, labor: 0.95, name: 'Andhra Pradesh' },   // Agricultural state, competitive
  'TS': { material: 1.02, labor: 1.00, name: 'Telangana' },        // Hyderabad market
  
  // West India
  'MH': { material: 1.00, labor: 1.00, name: 'Maharashtra' },      // BASELINE region
  'GJ': { material: 1.05, labor: 1.08, name: 'Gujarat' },          // Industrial state, good infra
  'RJ': { material: 1.08, labor: 0.90, name: 'Rajasthan' },        // Desert transport, lower wages
  'GA': { material: 1.15, labor: 1.25, name: 'Goa' },              // Small state, tourism economy
  
  // East India
  'WB': { material: 0.90, labor: 0.88, name: 'West Bengal' },      // Competitive market
  'BR': { material: 0.85, labor: 0.75, name: 'Bihar' },            // Lowest costs
  'JH': { material: 0.88, labor: 0.80, name: 'Jharkhand' },        // Developing state
  'OR': { material: 0.88, labor: 0.82, name: 'Odisha' },           // Coastal, moderate costs
  
  // Central India
  'MP': { material: 0.92, labor: 0.88, name: 'Madhya Pradesh' },   // Agricultural heartland
  'CG': { material: 0.90, labor: 0.85, name: 'Chhattisgarh' },     // Lower development
  
  // Northeast (higher due to transport)
  'AS': { material: 1.18, labor: 0.95, name: 'Assam' },            // Remote, transport costs
  'NE': { material: 1.25, labor: 1.00, name: 'Northeast States' }, // Generic for other NE states
};

// Default pricing (uses Maharashtra as baseline)
const PRICING = BASE_PRICING;

// Crop water requirements (liters per acre per day)
const CROP_WATER_REQUIREMENTS: Record<string, number> = {
  'Rice': 12000,
  'Wheat': 4000,
  'Maize': 5000,
  'Cotton': 4500,
  'Sugarcane': 8000,
  'Vegetables': 6000,
  'Fruits': 7000,
  'Pulses': 3000,
  'Oilseeds': 3500,
  'default': 5000,
};

// Current region setting (can be updated by UI)
let currentRegion: string = 'MH'; // Default to Maharashtra

/**
 * Set the current region for pricing calculations
 */
export const setRegion = (stateCode: string): void => {
  if (REGIONAL_MULTIPLIERS[stateCode]) {
    currentRegion = stateCode;
  } else {
    console.warn(`Unknown state code: ${stateCode}, defaulting to MH`);
    currentRegion = 'MH';
  }
};

/**
 * Get current region
 */
export const getCurrentRegion = (): { code: string; name: string; multipliers: { material: number; labor: number } } => {
  const region = REGIONAL_MULTIPLIERS[currentRegion] || REGIONAL_MULTIPLIERS['MH'];
  return {
    code: currentRegion,
    name: region.name,
    multipliers: {
      material: region.material,
      labor: region.labor,
    },
  };
};

/**
 * Get all available regions
 */
export const getAllRegions = (): Array<{ code: string; name: string; material: number; labor: number }> => {
  return Object.entries(REGIONAL_MULTIPLIERS).map(([code, data]) => ({
    code,
    name: data.name,
    material: data.material,
    labor: data.labor,
  }));
};

/**
 * Calculate regional price for a material item
 */
const getRegionalPrice = (basePrice: number, isLabor: boolean = false): number => {
  const multiplier = REGIONAL_MULTIPLIERS[currentRegion] || REGIONAL_MULTIPLIERS['MH'];
  return Math.round(basePrice * (isLabor ? multiplier.labor : multiplier.material));
};

/**
 * Get regional pricing object
 */
export const getRegionalPricing = (): typeof BASE_PRICING => {
  const regionalPricing: any = {};
  const multiplier = REGIONAL_MULTIPLIERS[currentRegion] || REGIONAL_MULTIPLIERS['MH'];
  
  for (const [key, value] of Object.entries(BASE_PRICING)) {
    const isLabor = key.startsWith('labor');
    regionalPricing[key] = Math.round(value * (isLabor ? multiplier.labor : multiplier.material));
  }
  
  return regionalPricing;
};

/**
 * Get irrigation method display name
 */
export const getMethodDisplayName = (method: IrrigationMethod): string => {
  const names: Record<IrrigationMethod, string> = {
    'drip': 'Drip Irrigation',
    'sprinkler': 'Sprinkler System',
    'surface': 'Surface/Flood Irrigation',
    'pump-pipeline': 'Pump & Pipeline',
  };
  return names[method];
};

/**
 * Calculate irrigation recommendations for a section
 */
export const getIrrigationRecommendations = (
  section: SectionData,
  waterSource: WaterSource,
  distance: number
): IrrigationRecommendation[] => {
  const recommendations: IrrigationRecommendation[] = [];
  const cropType = section.cropType || 'default';
  const areaAcres = section.area;
  
  // Calculate base water requirement
  const dailyWaterLiters = (CROP_WATER_REQUIREMENTS[cropType] || CROP_WATER_REQUIREMENTS.default) * areaAcres;
  
  // 1. Drip Irrigation
  const dripScore = calculateDripScore(distance, cropType, waterSource.type);
  if (dripScore > 30) {
    recommendations.push(createDripRecommendation(distance, areaAcres, dripScore, dailyWaterLiters));
  }
  
  // 2. Sprinkler System
  const sprinklerScore = calculateSprinklerScore(distance, cropType, waterSource.type);
  if (sprinklerScore > 30) {
    recommendations.push(createSprinklerRecommendation(distance, areaAcres, sprinklerScore, dailyWaterLiters));
  }
  
  // 3. Surface Irrigation (only for short distances and specific crops)
  const surfaceScore = calculateSurfaceScore(distance, cropType, waterSource.type);
  if (surfaceScore > 30) {
    recommendations.push(createSurfaceRecommendation(distance, areaAcres, surfaceScore, dailyWaterLiters));
  }
  
  // 4. Pump & Pipeline (for longer distances)
  if (distance > 200) {
    const pumpScore = calculatePumpScore(distance, waterSource.type);
    recommendations.push(createPumpRecommendation(distance, areaAcres, pumpScore, dailyWaterLiters));
  }
  
  // Sort by suitability score
  recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  
  return recommendations;
};

/**
 * Calculate suitability score for drip irrigation
 */
const calculateDripScore = (distance: number, cropType: string, sourceType: WaterSource['type']): number => {
  let score = 85; // Base score - drip is generally efficient
  
  // Distance penalty
  if (distance > 500) score -= 20;
  else if (distance > 300) score -= 10;
  else if (distance < 100) score += 5;
  
  // Crop suitability
  const dripCrops = ['Vegetables', 'Fruits', 'Cotton', 'Sugarcane'];
  const badForDrip = ['Rice'];
  
  if (dripCrops.includes(cropType)) score += 10;
  if (badForDrip.includes(cropType)) score -= 40;
  
  // Water source suitability
  if (sourceType === 'well' || sourceType === 'water_tower') score += 5;
  if (sourceType === 'river' || sourceType === 'canal') score -= 5; // needs more filtration
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate suitability score for sprinkler system
 */
const calculateSprinklerScore = (distance: number, cropType: string, sourceType: WaterSource['type']): number => {
  let score = 75;
  
  // Distance consideration
  if (distance > 800) score -= 25;
  else if (distance > 500) score -= 15;
  else if (distance > 300) score -= 5;
  
  // Crop suitability
  const sprinklerCrops = ['Wheat', 'Maize', 'Pulses', 'Oilseeds'];
  const badForSprinkler = ['Rice', 'Vegetables']; // Vegetables can get disease from wet leaves
  
  if (sprinklerCrops.includes(cropType)) score += 10;
  if (badForSprinkler.includes(cropType)) score -= 20;
  
  // Source pressure consideration
  if (sourceType === 'water_tower') score += 10;
  if (sourceType === 'pond') score -= 5;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate suitability score for surface irrigation
 */
const calculateSurfaceScore = (distance: number, cropType: string, sourceType: WaterSource['type']): number => {
  let score = 60;
  
  // Only viable for short distances
  if (distance > 300) return 0;
  if (distance > 200) score -= 30;
  else if (distance > 100) score -= 15;
  
  // Best for paddy/rice
  if (cropType === 'Rice') score += 35;
  if (cropType === 'Sugarcane') score += 15;
  
  // Water source - needs abundant supply
  if (sourceType === 'river' || sourceType === 'canal') score += 15;
  if (sourceType === 'well' || sourceType === 'water_tower') score -= 20;
  if (sourceType === 'pond') score += 5;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate suitability score for pump & pipeline
 */
const calculatePumpScore = (distance: number, sourceType: WaterSource['type']): number => {
  let score = 70;
  
  // Better for longer distances
  if (distance > 1000) score += 15;
  else if (distance > 500) score += 10;
  else if (distance < 200) score -= 20;
  
  // Source reliability
  if (sourceType === 'river' || sourceType === 'reservoir') score += 10;
  if (sourceType === 'pond') score -= 10;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Create drip irrigation recommendation
 */
const createDripRecommendation = (
  distance: number,
  areaAcres: number,
  score: number,
  dailyWaterLiters: number
): IrrigationRecommendation => {
  const P = getRegionalPricing(); // Get regional pricing
  
  const mainlineLength = distance + 50; // Extra for distribution
  const lateralLength = areaAcres * 1000; // Approximate lateral per acre
  const emitterCount = Math.ceil(areaAcres * 2000); // ~2000 emitters per acre
  
  // Determine pump size based on distance
  let pumpCost = P.pump1hp;
  let pumpName = '1 HP Pump';
  if (distance > 300) {
    pumpCost = P.pump2hp;
    pumpName = '2 HP Pump';
  }
  if (distance > 500) {
    pumpCost = P.pump3hp;
    pumpName = '3 HP Pump';
  }
  
  const components: IrrigationComponent[] = [
    { name: 'HDPE Main Pipe', quantity: Math.ceil(mainlineLength), unit: 'm', unitPrice: P.hdpePipe, totalPrice: Math.ceil(mainlineLength) * P.hdpePipe },
    { name: 'Drip Lateral Pipe', quantity: Math.ceil(lateralLength), unit: 'm', unitPrice: P.dripLateralPipe, totalPrice: Math.ceil(lateralLength) * P.dripLateralPipe },
    { name: 'Drip Emitters', quantity: emitterCount, unit: 'pcs', unitPrice: P.dripEmitter, totalPrice: emitterCount * P.dripEmitter },
    { name: 'Drip Filter System', quantity: 1, unit: 'set', unitPrice: P.dripFilter, totalPrice: P.dripFilter },
    { name: pumpName, quantity: 1, unit: 'unit', unitPrice: pumpCost, totalPrice: pumpCost },
    { name: 'Foot Valve', quantity: 1, unit: 'unit', unitPrice: P.footValve, totalPrice: P.footValve },
    { name: 'Gate Valves', quantity: Math.ceil(areaAcres * 2), unit: 'pcs', unitPrice: P.gateValve, totalPrice: Math.ceil(areaAcres * 2) * P.gateValve },
    { name: 'Fittings & Connectors', quantity: 1, unit: 'set', unitPrice: Math.ceil(areaAcres * 500), totalPrice: Math.ceil(areaAcres * 500) },
  ];
  
  const materialsCost = components.reduce((sum, c) => sum + c.totalPrice, 0);
  const laborDays = Math.ceil(areaAcres * 2) + Math.ceil(distance / 100);
  const laborCost = laborDays * P.laborPipeFitting;
  const operationalCost = Math.ceil(dailyWaterLiters * 0.01 * 365); // Electricity estimate
  
  return {
    method: 'drip',
    suitabilityScore: score,
    efficiency: 90,
    pros: [
      'Most water-efficient (90%+ efficiency)',
      'Reduces weed growth',
      'Can be automated easily',
      'Precise water delivery to roots',
      'Reduces disease from wet foliage',
    ],
    cons: [
      'Higher initial cost',
      'Requires clean water / filtration',
      'Emitters can clog',
      'Not suitable for paddy/rice',
    ],
    bestFor: ['Vegetables', 'Fruits', 'Cotton', 'Sugarcane'],
    estimatedCost: {
      materials: materialsCost,
      labor: laborCost,
      operational: operationalCost,
      total: materialsCost + laborCost,
    },
    components,
  };
};

/**
 * Create sprinkler system recommendation
 */
const createSprinklerRecommendation = (
  distance: number,
  areaAcres: number,
  score: number,
  dailyWaterLiters: number
): IrrigationRecommendation => {
  const P = getRegionalPricing(); // Get regional pricing
  
  const pipelineLength = distance + 100;
  const sprinklerCount = Math.ceil(areaAcres * 8); // ~8 sprinklers per acre
  
  let pumpCost = P.pump2hp;
  let pumpName = '2 HP Pump';
  if (distance > 400) {
    pumpCost = P.pump3hp;
    pumpName = '3 HP Pump';
  }
  if (distance > 700) {
    pumpCost = P.pump5hp;
    pumpName = '5 HP Pump';
  }
  
  const components: IrrigationComponent[] = [
    { name: 'PVC Main Pipe (3")', quantity: Math.ceil(pipelineLength), unit: 'm', unitPrice: P.pvcPipe3inch, totalPrice: Math.ceil(pipelineLength) * P.pvcPipe3inch },
    { name: 'Sprinkler Pipe (2")', quantity: Math.ceil(areaAcres * 200), unit: 'm', unitPrice: P.sprinklerPipe, totalPrice: Math.ceil(areaAcres * 200) * P.sprinklerPipe },
    { name: 'Sprinkler Heads', quantity: sprinklerCount, unit: 'pcs', unitPrice: P.sprinklerHead, totalPrice: sprinklerCount * P.sprinklerHead },
    { name: 'Sprinkler Risers', quantity: sprinklerCount, unit: 'pcs', unitPrice: P.sprinklerRiser, totalPrice: sprinklerCount * P.sprinklerRiser },
    { name: pumpName, quantity: 1, unit: 'unit', unitPrice: pumpCost, totalPrice: pumpCost },
    { name: 'Foot Valve', quantity: 1, unit: 'unit', unitPrice: P.footValve, totalPrice: P.footValve },
    { name: 'Non-Return Valve', quantity: 1, unit: 'unit', unitPrice: P.nonReturnValve, totalPrice: P.nonReturnValve },
    { name: 'Fittings & Connectors', quantity: 1, unit: 'set', unitPrice: Math.ceil(areaAcres * 800), totalPrice: Math.ceil(areaAcres * 800) },
  ];
  
  const materialsCost = components.reduce((sum, c) => sum + c.totalPrice, 0);
  const laborDays = Math.ceil(areaAcres * 1.5) + Math.ceil(distance / 150);
  const laborCost = laborDays * P.laborPipeFitting;
  const operationalCost = Math.ceil(dailyWaterLiters * 0.015 * 365);
  
  return {
    method: 'sprinkler',
    suitabilityScore: score,
    efficiency: 75,
    pros: [
      'Good coverage for large areas',
      'Simulates natural rainfall',
      'Lower labor for irrigation',
      'Can apply fertilizers (fertigation)',
    ],
    cons: [
      'Water lost to evaporation (25%)',
      'Wind affects distribution',
      'Higher pressure required',
      'Can spread plant diseases',
    ],
    bestFor: ['Wheat', 'Maize', 'Pulses', 'Oilseeds', 'Fodder'],
    estimatedCost: {
      materials: materialsCost,
      labor: laborCost,
      operational: operationalCost,
      total: materialsCost + laborCost,
    },
    components,
  };
};

/**
 * Create surface irrigation recommendation
 */
const createSurfaceRecommendation = (
  distance: number,
  areaAcres: number,
  score: number,
  dailyWaterLiters: number
): IrrigationRecommendation => {
  const P = getRegionalPricing(); // Get regional pricing
  
  const canalLength = distance + 50;
  
  const components: IrrigationComponent[] = [
    { name: 'Canal Excavation', quantity: Math.ceil(canalLength), unit: 'm', unitPrice: 150, totalPrice: Math.ceil(canalLength) * 150 },
    { name: 'Canal Lining (optional)', quantity: Math.ceil(canalLength * 0.5), unit: 'm', unitPrice: 200, totalPrice: Math.ceil(canalLength * 0.5) * 200 },
    { name: 'Field Leveling', quantity: Math.ceil(areaAcres), unit: 'acre', unitPrice: 3000, totalPrice: Math.ceil(areaAcres) * 3000 },
    { name: 'Bund Construction', quantity: Math.ceil(areaAcres * 100), unit: 'm', unitPrice: 50, totalPrice: Math.ceil(areaAcres * 100) * 50 },
    { name: 'Gate/Sluice', quantity: Math.ceil(areaAcres * 2), unit: 'pcs', unitPrice: 500, totalPrice: Math.ceil(areaAcres * 2) * 500 },
  ];
  
  const materialsCost = components.reduce((sum, c) => sum + c.totalPrice, 0);
  const laborDays = Math.ceil(areaAcres * 3) + Math.ceil(distance / 50);
  const laborCost = laborDays * P.laborDigging;
  const operationalCost = Math.ceil(dailyWaterLiters * 0.005 * 365); // Lower operational but more water waste
  
  return {
    method: 'surface',
    suitabilityScore: score,
    efficiency: 50,
    pros: [
      'Lowest initial cost',
      'No electricity required',
      'Simple to operate',
      'Best for paddy/rice cultivation',
    ],
    cons: [
      'Lowest efficiency (50%)',
      'Water wastage due to seepage',
      'Requires level fields',
      'Labor-intensive',
      'Can cause waterlogging',
    ],
    bestFor: ['Rice', 'Sugarcane'],
    estimatedCost: {
      materials: materialsCost,
      labor: laborCost,
      operational: operationalCost,
      total: materialsCost + laborCost,
    },
    components,
  };
};

/**
 * Create pump & pipeline recommendation
 */
const createPumpRecommendation = (
  distance: number,
  areaAcres: number,
  score: number,
  dailyWaterLiters: number
): IrrigationRecommendation => {
  const P = getRegionalPricing(); // Get regional pricing
  
  // Determine pipe size and pump based on distance
  let pipeCost = P.pvcPipe3inch;
  let pipeName = 'PVC Pipe (3")';
  let pumpCost = P.pump3hp;
  let pumpName = '3 HP Pump';
  
  if (distance > 800) {
    pipeCost = P.pvcPipe4inch;
    pipeName = 'PVC Pipe (4")';
    pumpCost = P.pump5hp;
    pumpName = '5 HP Pump';
  }
  if (distance > 1200) {
    pumpCost = P.pump7hp;
    pumpName = '7 HP Pump';
  }
  
  // Storage tank size
  let tankCost = P.tank2000L;
  let tankName = '2000L Storage Tank';
  if (areaAcres > 3) {
    tankCost = P.tank5000L;
    tankName = '5000L Storage Tank';
  }
  
  const components: IrrigationComponent[] = [
    { name: pipeName, quantity: Math.ceil(distance * 1.1), unit: 'm', unitPrice: pipeCost, totalPrice: Math.ceil(distance * 1.1) * pipeCost },
    { name: pumpName, quantity: 1, unit: 'unit', unitPrice: pumpCost, totalPrice: pumpCost },
    { name: tankName, quantity: 1, unit: 'unit', unitPrice: tankCost, totalPrice: tankCost },
    { name: 'Foot Valve', quantity: 1, unit: 'unit', unitPrice: P.footValve, totalPrice: P.footValve },
    { name: 'Non-Return Valve', quantity: 1, unit: 'unit', unitPrice: P.nonReturnValve, totalPrice: P.nonReturnValve },
    { name: 'Gate Valves', quantity: 3, unit: 'pcs', unitPrice: P.gateValve, totalPrice: 3 * P.gateValve },
    { name: 'Elbows & Tees', quantity: Math.ceil(distance / 50), unit: 'set', unitPrice: P.elbow + P.tee, totalPrice: Math.ceil(distance / 50) * (P.elbow + P.tee) },
    { name: 'Electrical Setup', quantity: 1, unit: 'set', unitPrice: 5000, totalPrice: 5000 },
  ];
  
  const materialsCost = components.reduce((sum, c) => sum + c.totalPrice, 0);
  const laborDays = Math.ceil(distance / 100) + 3;
  const laborCost = laborDays * (P.laborPipeFitting + P.laborDigging) / 2;
  const operationalCost = Math.ceil(dailyWaterLiters * 0.02 * 365);
  
  return {
    method: 'pump-pipeline',
    suitabilityScore: score,
    efficiency: 85,
    pros: [
      'Can cover long distances',
      'Reliable water delivery',
      'Can be combined with drip/sprinkler',
      'Storage provides backup',
    ],
    cons: [
      'Higher electricity cost',
      'Pump maintenance required',
      'Initial investment is high',
      'Needs electricity connection',
    ],
    bestFor: ['All crops (as water transport)', 'Distant water sources'],
    estimatedCost: {
      materials: materialsCost,
      labor: laborCost,
      operational: operationalCost,
      total: materialsCost + laborCost,
    },
    components,
  };
};

/**
 * Create a complete irrigation plan
 */
export const createIrrigationPlan = (
  section: SectionData,
  waterSource: WaterSource,
  selectedMethod: IrrigationMethod,
  recommendations: IrrigationRecommendation[]
): IrrigationPlan => {
  const recommendation = recommendations.find(r => r.method === selectedMethod);
  if (!recommendation) {
    throw new Error('Invalid irrigation method selected');
  }
  
  // Calculate section center for distance
  let totalLat = 0;
  let totalLng = 0;
  const coords = section.geometry.coordinates[0];
  coords.forEach(coord => {
    totalLng += coord[0];
    totalLat += coord[1];
  });
  const sectionLat = totalLat / coords.length;
  const sectionLng = totalLng / coords.length;
  
  const distance = calculateDistance(sectionLat, sectionLng, waterSource.coordinates[0], waterSource.coordinates[1]);
  
  // Daily water requirement
  const cropType = section.cropType || 'default';
  const dailyWater = (CROP_WATER_REQUIREMENTS[cropType] || CROP_WATER_REQUIREMENTS.default) * section.area;
  
  // Generate warnings
  const warnings: string[] = [];
  if (distance > 1000) warnings.push('Long distance may increase operational costs');
  if (waterSource.type === 'pond' && section.area > 5) warnings.push('Pond may not have sufficient capacity for large area');
  if (selectedMethod === 'surface' && cropType !== 'Rice') warnings.push('Surface irrigation is less efficient for this crop');
  if (recommendation.efficiency < 60) warnings.push('Consider a more efficient irrigation method');
  
  // Generate recommendations
  const implementationRecs: string[] = [
    'Get water quality tested before installation',
    'Ensure proper slope for drainage',
    'Plan installation during dry season',
  ];
  if (selectedMethod === 'drip') implementationRecs.push('Install sand/disc filter to prevent clogging');
  if (selectedMethod === 'sprinkler') implementationRecs.push('Check prevailing wind direction for sprinkler placement');
  if (distance > 500) implementationRecs.push('Consider installing booster pump for consistent pressure');
  
  // Calculate implementation time
  let implDays = Math.ceil(section.area * 2);
  if (distance > 500) implDays += Math.ceil(distance / 200);
  
  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sectionId: section.id,
    sectionName: section.name,
    waterSourceId: waterSource.id,
    waterSourceName: waterSource.name,
    waterSourceType: waterSource.type,
    method: selectedMethod,
    distance: Math.round(distance),
    estimatedCost: recommendation.estimatedCost,
    components: recommendation.components,
    recommendations: implementationRecs,
    warnings,
    efficiency: recommendation.efficiency,
    suitabilityScore: recommendation.suitabilityScore,
    implementationTime: `${implDays}-${implDays + 2} days`,
    waterRequirement: Math.round(dailyWater),
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get irrigation method icon name (for Lucide)
 */
export const getMethodIcon = (method: IrrigationMethod): string => {
  const icons: Record<IrrigationMethod, string> = {
    'drip': 'Droplets',
    'sprinkler': 'CloudRain',
    'surface': 'Waves',
    'pump-pipeline': 'Pipette',
  };
  return icons[method];
};

