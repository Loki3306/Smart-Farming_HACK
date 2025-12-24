import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LESSON_TEMPLATES = {
  organic: [
    { title: 'Principles of Organic Farming', description: 'Core concepts of sustainable agriculture.', content_type: 'video', content_url: 'https://www.youtube.com/watch?v=oiyOfJJjkVc', duration: '15 min', is_preview: true },
    { title: 'Soil Preparation & Composting', description: 'Preparing your land naturally.', content_type: 'text', content_url: null, duration: '20 min', is_preview: false },
    { title: 'Organic Certification Process', description: 'How to get your farm certified.', content_type: 'video', content_url: 'https://www.youtube.com/watch?v=nkn7TqAhJZE', duration: '12 min', is_preview: false },
    { title: 'Market Opportunities', description: 'Selling organic produce for better prices.', content_type: 'text', content_url: null, duration: '10 min', is_preview: false },
    { title: 'Quiz: Organic Fundamentals', description: 'Test your knowledge.', content_type: 'quiz', content_url: null, duration: '15 min', is_preview: false }
  ],
  irrigation: [
    { title: 'Drip vs Sprinkler Systems', description: 'Choosing the right system for your crop.', content_type: 'video', content_url: 'https://www.youtube.com/watch?v=QD6YkWqaXJw', duration: '18 min', is_preview: true },
    { title: 'Water Scheduling Strategies', description: 'When and how much to water.', content_type: 'text', content_url: null, duration: '15 min', is_preview: false },
    { title: 'Maintenance & Troubleshooting', description: 'Keeping your system running efficiently.', content_type: 'video', content_url: 'https://www.youtube.com/watch?v=DnIWdxGqpGQ', duration: '20 min', is_preview: false },
    { title: 'Quiz: Irrigation Mastery', description: 'Check your understanding.', content_type: 'quiz', content_url: null, duration: '10 min', is_preview: false }
  ],
  pest: [
    { title: 'Identifying Common Pests', description: 'Visual guide to farm pests.', content_type: 'video', content_url: 'https://www.youtube.com/watch?v=J3aX5c5n8ro', duration: '12 min', is_preview: true },
    { title: 'Biological Control Methods', description: 'Using nature to fight pests.', content_type: 'text', content_url: null, duration: '25 min', is_preview: false },
    { title: 'Safe Chemical Usage', description: 'When and how to use pesticides safely.', content_type: 'video', content_url: null, duration: '15 min', is_preview: false },
    { title: 'Quiz: Pest Control', description: 'Test your skills.', content_type: 'quiz', content_url: null, duration: '10 min', is_preview: false }
  ],
  soil: [
    { title: 'Understanding Soil pH', description: 'Why pH matters for your crops.', content_type: 'video', content_url: null, duration: '10 min', is_preview: true },
    { title: 'Nutrient Management (NPK)', description: 'Balancing Nitrogen, Phosphorus, and Potassium.', content_type: 'text', content_url: null, duration: '30 min', is_preview: false },
    { title: 'Soil Testing Guide', description: 'How to take soil samples correctly.', content_type: 'video', content_url: null, duration: '15 min', is_preview: false },
    { title: 'Green Manuring', description: 'Improving soil structure naturally.', content_type: 'text', content_url: null, duration: '12 min', is_preview: false }
  ],
  equipment: [
    { title: 'Tractor Safety Basics', description: 'Essential safety protocols.', content_type: 'video', content_url: null, duration: '20 min', is_preview: true },
    { title: 'Routine Maintenance Checklist', description: 'Daily and weekly checks.', content_type: 'text', content_url: null, duration: '15 min', is_preview: false },
    { title: 'Implement Attachment Guide', description: 'Connecting plows and seeders correctly.', content_type: 'video', content_url: null, duration: '25 min', is_preview: false },
    { title: 'Troubleshooting Common Issues', description: 'Fixing minor problems on the field.', content_type: 'text', content_url: null, duration: '20 min', is_preview: false }
  ]
};

async function seedLessons() {
  console.log('🌱 Starting lesson seeding...');

  // 1. Fetch all courses
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title');

  if (error) {
    console.error('❌ Failed to fetch courses:', error);
    return;
  }

  console.log(`📚 Found ${courses.length} courses.`);

  for (const course of courses) {
    let lessonsToAdd = [];
    const title = course.title.toLowerCase();

    // Determine which lessons to add based on title
    if (title.includes('organic') || title.includes('जैविक') || title.includes('सेंद्रिय')) {
      lessonsToAdd = LESSON_TEMPLATES.organic;
    } else if (title.includes('irrigation') || title.includes('सिंचाई') || title.includes('सिंचन')) {
      lessonsToAdd = LESSON_TEMPLATES.irrigation;
    } else if (title.includes('pest') || title.includes('कीट')) {
      lessonsToAdd = LESSON_TEMPLATES.pest;
    } else if (title.includes('soil')) {
      lessonsToAdd = LESSON_TEMPLATES.soil;
    } else if (title.includes('equipment')) {
      lessonsToAdd = LESSON_TEMPLATES.equipment;
    }

    if (lessonsToAdd.length > 0) {
      // Check if lessons already exist
      const { count } = await supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);

      if (count === 0) {
        console.log(`📝 Adding ${lessonsToAdd.length} lessons to course: "${course.title}"`);
        
        const lessonsWithId = lessonsToAdd.map((lesson, index) => ({
          course_id: course.id,
          ...lesson,
          order_index: index + 1
        }));

        const { error: insertError } = await supabase
          .from('course_lessons')
          .insert(lessonsWithId);

        if (insertError) {
          console.error(`❌ Failed to insert lessons for "${course.title}":`, insertError);
        } else {
          console.log(`✅ Successfully added lessons to "${course.title}"`);
        }
      } else {
        console.log(`⏭️  Skipping "${course.title}" (already has ${count} lessons)`);
      }
    } else {
      console.log(`⚠️  No matching lesson template for "${course.title}"`);
    }
  }

  console.log('✨ Lesson seeding complete!');
}

seedLessons();
