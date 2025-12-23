-- Course Lessons Seed Data
-- Run this in Supabase SQL Editor after running courses_seed.sql

-- Get course IDs for reference (these should match from courses_seed.sql)
-- We'll use a WITH clause to insert with proper foreign key references

-- First, let's create lessons for each course
-- Note: course_id will need to match actual UUIDs from courses table

-- Insert lessons for Organic Farming Basics course
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
    ('Introduction to Organic Farming', 'Learn the fundamental principles of organic farming and why it matters for sustainable agriculture.', 1, 'video', 'https://www.youtube.com/watch?v=oiyOfJJjkVc', '10 min', true),
    ('Soil Health & Composting', 'Understanding soil ecosystems and creating nutrient-rich compost for your farm.', 2, 'video', 'https://www.youtube.com/watch?v=nkn7TqAhJZE', '15 min', false),
    ('Natural Pest Management', 'Organic methods to control pests without harmful chemicals.', 3, 'text', NULL, '12 min', false),
    ('Water Conservation Techniques', 'Efficient irrigation and water management for organic farms.', 4, 'video', 'https://www.youtube.com/watch?v=pnvNkrLvGDg', '8 min', false),
    ('Quiz: Organic Basics', 'Test your understanding of organic farming fundamentals.', 5, 'quiz', NULL, '10 min', false),
    ('Crop Rotation Strategies', 'Planning seasonal rotations for soil health and yield optimization.', 6, 'text', NULL, '15 min', false),
    ('Final Assignment: Create Your Plan', 'Design an organic transition plan for a sample farm.', 7, 'assignment', NULL, '30 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title = 'Organic Farming Basics' OR c.title LIKE '%जैविक खेती%' OR c.title LIKE '%सेंद्रिय शेती%';

-- Insert lessons for Smart Irrigation course
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
    ('Introduction to Smart Irrigation', 'Understanding modern irrigation technology and IoT sensors.', 1, 'video', 'https://www.youtube.com/watch?v=DnIWdxGqpGQ', '12 min', true),
    ('Drip Irrigation Systems', 'Installing and maintaining drip irrigation for maximum efficiency.', 2, 'video', 'https://www.youtube.com/watch?v=QD6YkWqaXJw', '20 min', false),
    ('Soil Moisture Sensors', 'Using sensors to automate irrigation decisions.', 3, 'text', NULL, '15 min', false),
    ('Weather-Based Scheduling', 'Integrating weather data for smart water management.', 4, 'video', NULL, '10 min', false),
    ('Quiz: Irrigation Technologies', 'Test your knowledge of smart irrigation concepts.', 5, 'quiz', NULL, '10 min', false),
    ('System Maintenance', 'Keeping your irrigation system running optimally.', 6, 'text', NULL, '12 min', false),
    ('Hands-on: Setup Guide', 'Step-by-step setup of a basic smart irrigation system.', 7, 'assignment', NULL, '45 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title LIKE '%Smart Irrigation%' OR c.title LIKE '%स्मार्ट सिंचाई%' OR c.title LIKE '%स्मार्ट सिंचन%';

-- Insert lessons for Crop Disease Detection course  
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
    ('Introduction to Plant Diseases', 'Common crop diseases in India and their causes.', 1, 'video', 'https://www.youtube.com/watch?v=J3aX5c5n8ro', '15 min', true),
    ('Visual Disease Identification', 'Learning to identify diseases from leaf symptoms.', 2, 'video', NULL, '20 min', false),
    ('Using Mobile Apps for Detection', 'AI-powered apps to diagnose crop diseases.', 3, 'text', NULL, '10 min', false),
    ('Prevention Strategies', 'Best practices to prevent disease outbreaks.', 4, 'video', NULL, '15 min', false),
    ('Quiz: Disease Recognition', 'Identify diseases from sample images.', 5, 'quiz', NULL, '15 min', false),
    ('Organic Disease Control', 'Natural remedies and treatments for common diseases.', 6, 'text', NULL, '18 min', false),
    ('Case Study Analysis', 'Analyze real farm disease outbreak scenarios.', 7, 'assignment', NULL, '30 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title LIKE '%Disease Detection%' OR c.title LIKE '%रोग पहचान%' OR c.title LIKE '%रोग ओळख%';

-- Insert lessons for Weather Forecasting course
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
    ('Weather Basics for Farmers', 'Understanding weather patterns and their impact on farming.', 1, 'video', NULL, '12 min', true),
    ('Reading Weather Apps', 'How to interpret weather forecasts for farm decisions.', 2, 'video', NULL, '15 min', false),
    ('Monsoon Planning', 'Preparing your farm for the monsoon season.', 3, 'text', NULL, '18 min', false),
    ('Frost & Heat Protection', 'Protecting crops from extreme weather conditions.', 4, 'video', NULL, '14 min', false),
    ('Quiz: Weather Decisions', 'Make farming decisions based on weather scenarios.', 5, 'quiz', NULL, '12 min', false),
    ('Long-term Climate Trends', 'Understanding climate change effects on agriculture.', 6, 'text', NULL, '20 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title LIKE '%Weather%' OR c.title LIKE '%मौसम%' OR c.title LIKE '%हवामान%';

-- Insert lessons for Government Schemes course
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
    ('Overview of PM-KISAN', 'Understanding the Pradhan Mantri Kisan Samman Nidhi scheme.', 1, 'video', NULL, '10 min', true),
    ('Crop Insurance Schemes', 'Pradhan Mantri Fasal Bima Yojana explained.', 2, 'video', NULL, '15 min', false),
    ('Kisan Credit Card', 'How to apply and use KCC for farm financing.', 3, 'text', NULL, '12 min', false),
    ('State-Level Schemes', 'Important agricultural schemes by state governments.', 4, 'text', NULL, '20 min', false),
    ('Quiz: Scheme Eligibility', 'Check your understanding of scheme requirements.', 5, 'quiz', NULL, '10 min', false),
    ('Application Process', 'Step-by-step guide to applying for various schemes.', 6, 'assignment', NULL, '25 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title LIKE '%Government%' OR c.title LIKE '%सरकारी%' OR c.title LIKE '%सरकारी योजना%';

-- Insert lessons for Market Linkage course
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
    ('Understanding Agricultural Markets', 'Introduction to APMC mandis and direct marketing.', 1, 'video', NULL, '12 min', true),
    ('E-NAM Platform', 'Using the National Agriculture Market for better prices.', 2, 'video', NULL, '18 min', false),
    ('Grading & Quality Standards', 'Meeting quality requirements for premium prices.', 3, 'text', NULL, '15 min', false),
    ('Direct to Consumer Sales', 'Building your own customer base.', 4, 'text', NULL, '14 min', false),
    ('Quiz: Marketing Strategies', 'Test your market knowledge.', 5, 'quiz', NULL, '10 min', false),
    ('Negotiation Skills', 'Getting the best price for your produce.', 6, 'video', NULL, '16 min', false),
    ('Create Your Marketing Plan', 'Develop a sales strategy for your farm.', 7, 'assignment', NULL, '35 min', false)
) AS lesson(title, description, order_index, content_type, content_url, duration, is_preview)
WHERE c.title LIKE '%Market%' OR c.title LIKE '%बाजार%' OR c.title LIKE '%बाजारपेठ%';

-- Update lesson counts in courses table
UPDATE courses SET lessons = (
  SELECT COUNT(*) FROM course_lessons WHERE course_lessons.course_id = courses.id
);
