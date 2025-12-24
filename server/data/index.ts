// All Course Content - Central Index
// Export all course content from a single file

export * from './lesson-content';
export * from './irrigation-content';
export * from './pest-soil-content';
export * from './equipment-content';

// Content map for easy lookup by course slug/type
import { ORGANIC_FARMING_CONTENT, LessonContent } from './lesson-content';
import { IRRIGATION_CONTENT } from './irrigation-content';
import { PEST_CONTROL_CONTENT, SOIL_HEALTH_CONTENT } from './pest-soil-content';
import { EQUIPMENT_CONTENT, SMART_FARMING_CONTENT } from './equipment-content';

export const COURSE_CONTENT_MAP: Record<string, LessonContent[]> = {
  'organic-farming': ORGANIC_FARMING_CONTENT,
  'organic': ORGANIC_FARMING_CONTENT,
  'irrigation': IRRIGATION_CONTENT,
  'water-management': IRRIGATION_CONTENT,
  'irrigation-water': IRRIGATION_CONTENT,
  'pest-control': PEST_CONTROL_CONTENT,
  'pest-management': PEST_CONTROL_CONTENT,
  'soil-health': SOIL_HEALTH_CONTENT,
  'soil-management': SOIL_HEALTH_CONTENT,
  'equipment': EQUIPMENT_CONTENT,
  'farm-equipment': EQUIPMENT_CONTENT,
  'smart-farming': SMART_FARMING_CONTENT,
  'technology': SMART_FARMING_CONTENT,
};

// Helper to find content by course name (fuzzy match)
export function findContentForCourse(courseName: string): LessonContent[] | null {
  const normalizedName = courseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Direct match
  if (COURSE_CONTENT_MAP[normalizedName]) {
    return COURSE_CONTENT_MAP[normalizedName];
  }
  
  // Partial match
  for (const [key, content] of Object.entries(COURSE_CONTENT_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return content;
    }
  }
  
  // Keyword match
  const keywords: Record<string, string[]> = {
    'organic-farming': ['organic', 'natural', 'chemical-free', 'vermicompost'],
    'irrigation': ['water', 'drip', 'sprinkler', 'irrigation'],
    'pest-control': ['pest', 'insect', 'disease', 'neem', 'spray'],
    'soil-health': ['soil', 'ph', 'npk', 'nutrient', 'fertilizer'],
    'equipment': ['tractor', 'equipment', 'machine', 'harvester'],
    'smart-farming': ['smart', 'technology', 'sensor', 'app', 'iot'],
  };
  
  for (const [key, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (normalizedName.includes(keyword)) {
        return COURSE_CONTENT_MAP[key];
      }
    }
  }
  
  return null;
}

// Course definitions with rich content
export const FULL_COURSE_DEFINITIONS = [
  {
    title: 'Organic Farming Fundamentals',
    slug: 'organic-farming',
    description: 'Learn to grow crops without harmful chemicals using traditional Indian methods combined with modern organic practices.',
    difficulty_level: 'beginner',
    estimated_hours: 3,
    image_url: '/images/courses/organic-farming.jpg',
    tags: ['organic', 'beginner', 'sustainable'],
    content: ORGANIC_FARMING_CONTENT,
  },
  {
    title: 'Irrigation & Water Management',
    slug: 'irrigation-water',
    description: 'Master water management with drip irrigation, scheduling, and conservation techniques for better yields with less water.',
    difficulty_level: 'intermediate',
    estimated_hours: 4,
    image_url: '/images/courses/irrigation.jpg',
    tags: ['irrigation', 'water', 'drip'],
    content: IRRIGATION_CONTENT,
  },
  {
    title: 'Pest Management',
    slug: 'pest-control',
    description: 'Identify and control pests using biological methods, neem-based sprays, and integrated pest management.',
    difficulty_level: 'intermediate',
    estimated_hours: 3,
    image_url: '/images/courses/pest-control.jpg',
    tags: ['pest', 'organic', 'ipm'],
    content: PEST_CONTROL_CONTENT,
  },
  {
    title: 'Soil Health & Nutrients',
    slug: 'soil-health',
    description: 'Understand soil testing, pH management, NPK balance, and green manuring for healthier, more productive land.',
    difficulty_level: 'intermediate',
    estimated_hours: 3,
    image_url: '/images/courses/soil-health.jpg',
    tags: ['soil', 'nutrients', 'testing'],
    content: SOIL_HEALTH_CONTENT,
  },
  {
    title: 'Farm Equipment Essentials',
    slug: 'farm-equipment',
    description: 'Learn tractor maintenance, harvester operation, government subsidies, and when to rent vs buy equipment.',
    difficulty_level: 'beginner',
    estimated_hours: 3,
    image_url: '/images/courses/equipment.jpg',
    tags: ['equipment', 'tractor', 'subsidy'],
    content: EQUIPMENT_CONTENT,
  },
  {
    title: 'Smart Farming Technology',
    slug: 'smart-farming',
    description: 'Use smartphone apps, weather forecasting, and basic sensors to make better farming decisions.',
    difficulty_level: 'beginner',
    estimated_hours: 2,
    image_url: '/images/courses/smart-farming.jpg',
    tags: ['technology', 'apps', 'weather'],
    content: SMART_FARMING_CONTENT,
  },
];
