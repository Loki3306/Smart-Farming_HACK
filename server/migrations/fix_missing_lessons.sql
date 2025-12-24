-- Fix Missing Lessons for All Courses
-- This script adds lessons to courses that might have been missed due to title mismatches

-- 1. Introduction to Organic Farming (English, Hindi, Marathi)
INSERT INTO course_lessons (course_id, title, description, order_index, content_type, content_url, duration, is_preview) 
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.order_index,
  lesson.content_type::varchar,
  lesson.content_url,
  lesson.duration,
  lesson.is_preview
FROM courses c
CROSS JOIN (
  VALUES
    ('Principles of Organic Farming', 'Core concepts of sustainable agriculture.', 1, 'video', 'https://www.youtube.com/watch?v=oiyOfJJjkVc', '15 min', true),
    ('Soil Preparation & Composting', 'Preparing your land naturally.', 2, 'text', NULL, '20 min', false),
    ('Organic Certification Process', 'How to get your farm certified.', 3, 'video', 'https://www.youtube.com/watch?v=nkn7TqAhJZE', '12 min', false),
    ('Market Opportunities', 'Selling organic produce for better prices.', 4, 'text', NULL, '10 min', false),
    ('Quiz: Organic Fundamentals', 'Test your knowledge.', 5, 'quiz', NULL, '15 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE (c.title ILIKE '%Organic Farming%' OR c.title ILIKE '%जैविक खेती%' OR c.title ILIKE '%सेंद्रिय शेती%')
  AND NOT EXISTS (SELECT 1 FROM course_lessons cl WHERE cl.course_id = c.id);

-- 2. Modern Irrigation Techniques (English, Hindi, Marathi)
INSERT INTO course_lessons (course_id, title, description, order_index, content_type, content_url, duration, is_preview) 
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.order_index,
  lesson.content_type::varchar,
  lesson.content_url,
  lesson.duration,
  lesson.is_preview
FROM courses c
CROSS JOIN (
  VALUES
    ('Drip vs Sprinkler Systems', 'Choosing the right system for your crop.', 1, 'video', 'https://www.youtube.com/watch?v=QD6YkWqaXJw', '18 min', true),
    ('Water Scheduling Strategies', 'When and how much to water.', 2, 'text', NULL, '15 min', false),
    ('Maintenance & Troubleshooting', 'Keeping your system running efficiently.', 3, 'video', 'https://www.youtube.com/watch?v=DnIWdxGqpGQ', '20 min', false),
    ('Quiz: Irrigation Mastery', 'Check your understanding.', 4, 'quiz', NULL, '10 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE (c.title ILIKE '%Irrigation%' OR c.title ILIKE '%सिंचाई%' OR c.title ILIKE '%सिंचन%')
  AND NOT EXISTS (SELECT 1 FROM course_lessons cl WHERE cl.course_id = c.id);

-- 3. Integrated Pest Management (English, Hindi)
INSERT INTO course_lessons (course_id, title, description, order_index, content_type, content_url, duration, is_preview) 
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.order_index,
  lesson.content_type::varchar,
  lesson.content_url,
  lesson.duration,
  lesson.is_preview
FROM courses c
CROSS JOIN (
  VALUES
    ('Identifying Common Pests', 'Visual guide to farm pests.', 1, 'video', 'https://www.youtube.com/watch?v=J3aX5c5n8ro', '12 min', true),
    ('Biological Control Methods', 'Using nature to fight pests.', 2, 'text', NULL, '25 min', false),
    ('Safe Chemical Usage', 'When and how to use pesticides safely.', 3, 'video', NULL, '15 min', false),
    ('Quiz: Pest Control', 'Test your skills.', 4, 'quiz', NULL, '10 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE (c.title ILIKE '%Pest Management%' OR c.title ILIKE '%कीट प्रबंधन%')
  AND NOT EXISTS (SELECT 1 FROM course_lessons cl WHERE cl.course_id = c.id);

-- 4. Soil Health and Fertility Management
INSERT INTO course_lessons (course_id, title, description, order_index, content_type, content_url, duration, is_preview) 
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.order_index,
  lesson.content_type::varchar,
  lesson.content_url,
  lesson.duration,
  lesson.is_preview
FROM courses c
CROSS JOIN (
  VALUES
    ('Understanding Soil pH', 'Why pH matters for your crops.', 1, 'video', NULL, '10 min', true),
    ('Nutrient Management (NPK)', 'Balancing Nitrogen, Phosphorus, and Potassium.', 2, 'text', NULL, '30 min', false),
    ('Soil Testing Guide', 'How to take soil samples correctly.', 3, 'video', NULL, '15 min', false),
    ('Green Manuring', 'Improving soil structure naturally.', 4, 'text', NULL, '12 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title ILIKE '%Soil Health%'
  AND NOT EXISTS (SELECT 1 FROM course_lessons cl WHERE cl.course_id = c.id);

-- 5. Farm Equipment Operation
INSERT INTO course_lessons (course_id, title, description, order_index, content_type, content_url, duration, is_preview) 
SELECT 
  c.id,
  lesson.title,
  lesson.description,
  lesson.order_index,
  lesson.content_type::varchar,
  lesson.content_url,
  lesson.duration,
  lesson.is_preview
FROM courses c
CROSS JOIN (
  VALUES
    ('Tractor Safety Basics', 'Essential safety protocols.', 1, 'video', NULL, '20 min', true),
    ('Routine Maintenance Checklist', 'Daily and weekly checks.', 2, 'text', NULL, '15 min', false),
    ('Implement Attachment Guide', 'Connecting plows and seeders correctly.', 3, 'video', NULL, '25 min', false),
    ('Troubleshooting Common Issues', 'Fixing minor problems on the field.', 4, 'text', NULL, '20 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title ILIKE '%Equipment%'
  AND NOT EXISTS (SELECT 1 FROM course_lessons cl WHERE cl.course_id = c.id);
