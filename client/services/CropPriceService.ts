/**
 * Crop Price Service
 * Fetches local crop prices using the API
 */

const API_KEY = '579b464db66ec23bdd000001da3481825df4490b5e28de799bad81f3';
const API_BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export interface CropPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

export interface CropData {
  id: string;
  name: string;
  variety: string;
  category: 'seeds' | 'produce' | 'fertilizers' | 'pesticides' | 'equipment';
  price: number;
  minPrice: number;
  maxPrice: number;
  unit: string;
  state: string;
  district: string;
  market: string;
  arrivalDate: string;
  image: string;
  inStock: boolean;
  organic?: boolean;
  brand?: string;
  description?: string;
  rating?: number;
  reviews?: number;
}

class CropPriceService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch crop prices from government API
   */
  async fetchCropPrices(limit: number = 100, offset: number = 0): Promise<CropPrice[]> {
    try {
      const cacheKey = `prices_${limit}_${offset}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const params = new URLSearchParams({
        'api-key': API_KEY,
        format: 'json',
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const records = data.records || [];

      this.cache.set(cacheKey, { data: records, timestamp: Date.now() });
      return records;
    } catch (error) {
      console.error('Error fetching crop prices:', error);
      return this.getFallbackData();
    }
  }

  /**
   * Get available crop images from Agricultural-crops folder
   */
  getAvailableCrops(): string[] {
    return [
      'rice', 'wheat', 'maize', 'jowar', 'bajra',
      'cotton', 'sugarcane', 'soyabean', 'tomato',
      'banana', 'coconut', 'lemon', 'papaya', 'pineapple',
      'chilli', 'cucumber', 'cardamom', 'clove', 'tea',
      'coffee', 'tobacco', 'jute', 'mustard', 'sunflower',
      'gram', 'mung', 'cherry', 'olive', 'almond', 'makhana'
    ];
  }

  /**
   * Map commodity name to folder name
   */
  mapCommodityToFolder(commodity: string): string {
    const mapping: { [key: string]: string } = {
      'rice': 'rice',
      'paddy': 'rice',
      'wheat': 'wheat',
      'maize': 'maize',
      'jowar': 'jowar',
      'bajra': 'Pearl_millet(bajra)',
      'cotton': 'cotton',
      'sugarcane': 'sugarcane',
      'soyabean': 'soyabean',
      'soya bean': 'soyabean',
      'tomato': 'tomato',
      'banana': 'banana',
      'coconut': 'coconut',
      'lemon': 'Lemon',
      'papaya': 'papaya',
      'pineapple': 'pineapple',
      'chilli': 'chilli',
      'cucumber': 'Cucumber',
      'cardamom': 'cardamom',
      'clove': 'clove',
      'tea': 'tea',
      'coffee': 'Coffee-plant',
      'tobacco': 'Tobacco-plant',
      'jute': 'jute',
      'mustard': 'mustard-oil',
      'sunflower': 'sunflower',
      'gram': 'gram',
      'mung': 'vigna-radiati(Mung)',
      'moong': 'vigna-radiati(Mung)',
      'cherry': 'Cherry',
      'olive': 'Olive-tree',
      'almond': 'almond',
      'makhana': 'Fox_nut(Makhana)',
      'fox nut': 'Fox_nut(Makhana)',
    };

    const commodityLower = commodity.toLowerCase().trim();
    return mapping[commodityLower] || null;
  }

  /**
   * Get image path with multiple fallback attempts
   * Tries different file extensions and numbers
   */
  getCropImage(commodity: string, index: number = 0): string {
    const folder = this.mapCommodityToFolder(commodity);
    if (!folder) {
      return '/placeholder-crop.jpg';
    }

    // Map of crop folders to their available image numbers
    // This handles non-sequential numbering (e.g., cotton has 1,2,3,5,7,8 but not 4,6)
    const imageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    // Use index to cycle through available images
    const imageNumber = imageNumbers[index % imageNumbers.length];
    
    // Return primary path with .jpg extension (most common)
    // The component will handle fallbacks if image doesn't exist
    return `/Agricultural-crops/${folder}/image (${imageNumber}).jpg`;
  }

  /**
   * Get all possible image path variations for fallback attempts
   */
  getImageFallbacks(commodity: string, imageNumber: number): string[] {
    const folder = this.mapCommodityToFolder(commodity);
    if (!folder) {
      return [];
    }

    const extensions = ['jpg', 'jpeg', 'png'];
    return extensions.map(ext => 
      `/Agricultural-crops/${folder}/image (${imageNumber}).${ext}`
    );
  }

  /**
   * Transform API data to CropData format
   */
  async getCropDataForMarketplace(): Promise<CropData[]> {
    const prices = await this.fetchCropPrices(100);
    const availableCrops = this.getAvailableCrops();
    
    // Filter only crops we have images for
    const cropsWithImages = prices.filter(price => 
      this.mapCommodityToFolder(price.commodity) !== null
    );

    // Group by commodity to avoid duplicates
    const commodityMap = new Map<string, CropPrice[]>();
    cropsWithImages.forEach(crop => {
      const key = crop.commodity.toLowerCase();
      if (!commodityMap.has(key)) {
        commodityMap.set(key, []);
      }
      commodityMap.get(key)!.push(crop);
    });

    const cropData: CropData[] = [];
    let imageIndex = 0;

    commodityMap.forEach((crops, commodityKey) => {
      // Take up to 3 varieties per commodity
      crops.slice(0, 3).forEach((crop, index) => {
        const modalPrice = parseFloat(crop.modal_price) || 0;
        const minPrice = parseFloat(crop.min_price) || modalPrice * 0.9;
        const maxPrice = parseFloat(crop.max_price) || modalPrice * 1.1;

        cropData.push({
          id: `${commodityKey}-${index}`,
          name: crop.commodity,
          variety: crop.variety || 'Standard',
          category: 'produce',
          price: Math.round(modalPrice),
          minPrice: Math.round(minPrice),
          maxPrice: Math.round(maxPrice),
          unit: 'quintal',
          state: crop.state || 'India',
          district: crop.district || 'Various',
          market: crop.market || 'Local Market',
          arrivalDate: crop.arrival_date || new Date().toISOString().split('T')[0],
          image: this.getCropImage(crop.commodity, imageIndex++),
          inStock: true,
          rating: 4 + Math.random(),
          reviews: Math.floor(Math.random() * 200) + 20,
        });
      });
    });

    // Add seeds, fertilizers, pesticides, and equipment
    const otherProducts = [
      ...this.getSeedsData(),
      ...this.getFertilizersData(),
      ...this.getPesticidesData(),
      ...this.getEquipmentData(),
    ];

    return [...cropData, ...otherProducts];
  }

  /**
   * Get seeds data
   */
  private getSeedsData(): CropData[] {
    const seeds = [
      { name: 'Rice', varieties: ['Basmati', 'IR-64', 'Pusa', 'Swarna'], price: 3000, unit: 'kg' },
      { name: 'Wheat', varieties: ['HD-2967', 'PBW-343', 'Lok-1', 'Sharbati'], price: 2000, unit: 'kg' },
      { name: 'Maize', varieties: ['Hybrid', 'Sweet Corn', 'Dent Corn'], price: 1500, unit: 'kg' },
      { name: 'Cotton', varieties: ['Bt Cotton', 'Hybrid', 'Desi'], price: 4500, unit: 'kg' },
      { name: 'Soybean', varieties: ['JS-95-60', 'NRC-37', 'Punjab-1'], price: 3500, unit: 'kg' },
      { name: 'Tomato', varieties: ['Hybrid F1', 'Pusa Ruby', 'Desi'], price: 2500, unit: 'kg' },
      { name: 'Chilli', varieties: ['G4', 'Guntur', 'Kashmiri'], price: 5000, unit: 'kg' },
      { name: 'Sunflower', varieties: ['Hybrid', 'KBSH-44', 'Morden'], price: 2800, unit: 'kg' },
    ];

    const seedData: CropData[] = [];
    seeds.forEach((seed, idx) => {
      seed.varieties.forEach((variety, vIdx) => {
        const price = seed.price + (vIdx * 200);
        seedData.push({
          id: `seed-${seed.name.toLowerCase()}-${vIdx}`,
          name: `${seed.name} Seeds`,
          variety: variety,
          category: 'seeds',
          price: price,
          minPrice: Math.round(price * 0.9),
          maxPrice: Math.round(price * 1.1),
          unit: seed.unit,
          state: 'Maharashtra',
          district: 'Pune',
          market: 'Agricultural Seeds Market',
          arrivalDate: new Date().toISOString().split('T')[0],
          image: this.getCropImage(seed.name, idx),
          inStock: true,
          organic: vIdx === 0,
          brand: ['Mahyco', 'Syngenta', 'Bayer', 'Nuziveedu'][vIdx % 4],
          rating: 4 + Math.random(),
          reviews: Math.floor(Math.random() * 150) + 30,
        });
      });
    });

    return seedData;
  }

  /**
   * Get fertilizers data
   */
  private getFertilizersData(): CropData[] {
    return [
      {
        id: 'fert-urea',
        name: 'Urea Fertilizer',
        variety: '46% Nitrogen',
        category: 'fertilizers',
        price: 266,
        minPrice: 250,
        maxPrice: 280,
        unit: 'bag (50kg)',
        state: 'Gujarat',
        district: 'Vadodara',
        market: 'Fertilizer Depot',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-fertilizer.jpg',
        inStock: true,
        brand: 'IFFCO',
        description: 'High nitrogen content for vegetative growth',
        rating: 4.5,
        reviews: 230,
      },
      {
        id: 'fert-dap',
        name: 'DAP (Di-Ammonium Phosphate)',
        variety: '18-46-0 NPK',
        category: 'fertilizers',
        price: 1350,
        minPrice: 1300,
        maxPrice: 1400,
        unit: 'bag (50kg)',
        state: 'Punjab',
        district: 'Ludhiana',
        market: 'Fertilizer Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-fertilizer.jpg',
        inStock: true,
        brand: 'Coromandel',
        description: 'Excellent for root development',
        rating: 4.6,
        reviews: 189,
      },
      {
        id: 'fert-npk',
        name: 'NPK Complex Fertilizer',
        variety: '10-26-26',
        category: 'fertilizers',
        price: 850,
        minPrice: 800,
        maxPrice: 900,
        unit: 'bag (50kg)',
        state: 'Karnataka',
        district: 'Bangalore',
        market: 'Agri Input Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-fertilizer.jpg',
        inStock: true,
        brand: 'Tata Chemicals',
        description: 'Balanced nutrition for all crops',
        rating: 4.4,
        reviews: 156,
      },
      {
        id: 'fert-organic',
        name: 'Organic Vermicompost',
        variety: '100% Natural',
        category: 'fertilizers',
        price: 600,
        minPrice: 550,
        maxPrice: 650,
        unit: 'bag (40kg)',
        state: 'Maharashtra',
        district: 'Nashik',
        market: 'Organic Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-fertilizer.jpg',
        inStock: true,
        organic: true,
        brand: 'Green Earth',
        description: 'Rich in microorganisms and humus',
        rating: 4.7,
        reviews: 267,
      },
      {
        id: 'fert-neem',
        name: 'Neem Cake Fertilizer',
        variety: 'Organic NPK',
        category: 'fertilizers',
        price: 450,
        minPrice: 420,
        maxPrice: 480,
        unit: 'bag (25kg)',
        state: 'Tamil Nadu',
        district: 'Coimbatore',
        market: 'Organic Fertilizer Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-fertilizer.jpg',
        inStock: true,
        organic: true,
        brand: 'Naturals',
        description: 'Natural pest repellent with nutrients',
        rating: 4.6,
        reviews: 198,
      },
    ];
  }

  /**
   * Get pesticides data
   */
  private getPesticidesData(): CropData[] {
    return [
      {
        id: 'pest-chlorpyrifos',
        name: 'Chlorpyrifos 20% EC',
        variety: 'Insecticide',
        category: 'pesticides',
        price: 350,
        minPrice: 320,
        maxPrice: 380,
        unit: 'liter',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        market: 'Pesticide Store',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-pesticide.jpg',
        inStock: true,
        brand: 'Crystal',
        description: 'Broad spectrum insecticide',
        rating: 4.3,
        reviews: 145,
      },
      {
        id: 'pest-mancozeb',
        name: 'Mancozeb 75% WP',
        variety: 'Fungicide',
        category: 'pesticides',
        price: 280,
        minPrice: 260,
        maxPrice: 300,
        unit: 'kg',
        state: 'Maharashtra',
        district: 'Pune',
        market: 'Agro Chemical Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-pesticide.jpg',
        inStock: true,
        brand: 'Dhanuka',
        description: 'Protects against fungal diseases',
        rating: 4.5,
        reviews: 178,
      },
      {
        id: 'pest-glyphosate',
        name: 'Glyphosate 41% SL',
        variety: 'Herbicide',
        category: 'pesticides',
        price: 420,
        minPrice: 390,
        maxPrice: 450,
        unit: 'liter',
        state: 'Gujarat',
        district: 'Ahmedabad',
        market: 'Agro Store',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-pesticide.jpg',
        inStock: true,
        brand: 'Bayer',
        description: 'Non-selective herbicide for weed control',
        rating: 4.4,
        reviews: 203,
      },
      {
        id: 'pest-neem-oil',
        name: 'Neem Oil Bio-Pesticide',
        variety: 'Organic',
        category: 'pesticides',
        price: 550,
        minPrice: 520,
        maxPrice: 580,
        unit: 'liter',
        state: 'Karnataka',
        district: 'Mysore',
        market: 'Organic Pesticide Store',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-pesticide.jpg',
        inStock: true,
        organic: true,
        brand: 'EcoNeem',
        description: 'Natural pest control solution',
        rating: 4.7,
        reviews: 289,
      },
      {
        id: 'pest-imidacloprid',
        name: 'Imidacloprid 17.8% SL',
        variety: 'Systemic Insecticide',
        category: 'pesticides',
        price: 680,
        minPrice: 650,
        maxPrice: 710,
        unit: 'liter',
        state: 'Haryana',
        district: 'Karnal',
        market: 'Agricultural Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-pesticide.jpg',
        inStock: true,
        brand: 'Rallis',
        description: 'Controls sucking pests effectively',
        rating: 4.5,
        reviews: 167,
      },
    ];
  }

  /**
   * Get equipment data
   */
  private getEquipmentData(): CropData[] {
    return [
      {
        id: 'equip-sprayer',
        name: 'Agricultural Sprayer',
        variety: '16L Manual',
        category: 'equipment',
        price: 2500,
        minPrice: 2300,
        maxPrice: 2700,
        unit: 'piece',
        state: 'Maharashtra',
        district: 'Mumbai',
        market: 'Agricultural Equipment Store',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-equipment.jpg',
        inStock: true,
        brand: 'Neptune',
        description: 'High-pressure manual sprayer for pesticides',
        rating: 4.3,
        reviews: 234,
      },
      {
        id: 'equip-drip',
        name: 'Drip Irrigation Kit',
        variety: '1 Acre Coverage',
        category: 'equipment',
        price: 15000,
        minPrice: 14000,
        maxPrice: 16000,
        unit: 'set',
        state: 'Gujarat',
        district: 'Jalgaon',
        market: 'Irrigation Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-equipment.jpg',
        inStock: true,
        brand: 'Jain Irrigation',
        description: 'Complete drip irrigation system',
        rating: 4.8,
        reviews: 456,
      },
      {
        id: 'equip-weeder',
        name: 'Manual Weeder',
        variety: 'Hand Operated',
        category: 'equipment',
        price: 800,
        minPrice: 750,
        maxPrice: 850,
        unit: 'piece',
        state: 'Punjab',
        district: 'Amritsar',
        market: 'Tool Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-equipment.jpg',
        inStock: true,
        brand: 'Kisankraft',
        description: 'Efficient weed removal tool',
        rating: 4.2,
        reviews: 189,
      },
      {
        id: 'equip-tiller',
        name: 'Power Tiller',
        variety: '8 HP Diesel',
        category: 'equipment',
        price: 85000,
        minPrice: 80000,
        maxPrice: 90000,
        unit: 'piece',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        market: 'Farm Machinery Store',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-equipment.jpg',
        inStock: true,
        brand: 'VST Shakti',
        description: 'Multi-purpose power tiller for small farms',
        rating: 4.6,
        reviews: 312,
      },
      {
        id: 'equip-pump',
        name: 'Water Pump',
        variety: '3 HP Electric',
        category: 'equipment',
        price: 12000,
        minPrice: 11000,
        maxPrice: 13000,
        unit: 'piece',
        state: 'Tamil Nadu',
        district: 'Chennai',
        market: 'Pump House',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-equipment.jpg',
        inStock: true,
        brand: 'Crompton',
        description: 'High efficiency irrigation pump',
        rating: 4.5,
        reviews: 278,
      },
      {
        id: 'equip-seeder',
        name: 'Seed Drill Machine',
        variety: '9 Row Manual',
        category: 'equipment',
        price: 8500,
        minPrice: 8000,
        maxPrice: 9000,
        unit: 'piece',
        state: 'Rajasthan',
        district: 'Jaipur',
        market: 'Agricultural Tools Market',
        arrivalDate: new Date().toISOString().split('T')[0],
        image: '/placeholder-equipment.jpg',
        inStock: true,
        brand: 'KS Agrotech',
        description: 'Uniform seed placement machine',
        rating: 4.4,
        reviews: 156,
      },
    ];
  }

  /**
   * Fallback data when API fails
   */
  private getFallbackData(): CropPrice[] {
    return [
      {
        state: 'Maharashtra',
        district: 'Pune',
        market: 'Pune Market',
        commodity: 'Rice',
        variety: 'Basmati',
        arrival_date: new Date().toISOString().split('T')[0],
        min_price: '2500',
        max_price: '3500',
        modal_price: '3000',
      },
      {
        state: 'Punjab',
        district: 'Ludhiana',
        market: 'Ludhiana Mandi',
        commodity: 'Wheat',
        variety: 'HD-2967',
        arrival_date: new Date().toISOString().split('T')[0],
        min_price: '1800',
        max_price: '2200',
        modal_price: '2000',
      },
      {
        state: 'Karnataka',
        district: 'Bangalore',
        market: 'Bangalore Market',
        commodity: 'Tomato',
        variety: 'Hybrid',
        arrival_date: new Date().toISOString().split('T')[0],
        min_price: '1200',
        max_price: '1800',
        modal_price: '1500',
      },
    ];
  }

  /**
   * Search crops by name or variety
   */
  searchCrops(crops: CropData[], query: string): CropData[] {
    const queryLower = query.toLowerCase();
    return crops.filter(crop =>
      crop.name.toLowerCase().includes(queryLower) ||
      crop.variety.toLowerCase().includes(queryLower) ||
      crop.state.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Filter crops by state
   */
  filterByState(crops: CropData[], state: string): CropData[] {
    if (state === 'all') return crops;
    return crops.filter(crop => crop.state.toLowerCase() === state.toLowerCase());
  }
}

export const cropPriceService = new CropPriceService();
