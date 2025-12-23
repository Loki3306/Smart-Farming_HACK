-- Quiz Seed Data
-- Run this in Supabase SQL Editor after running quizzes_schema.sql and courses_seed.sql

-- ============================================
-- ORGANIC FARMING BASICS QUIZ
-- ============================================
DO $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
  v_quiz_id UUID;
  v_question_id UUID;
BEGIN
  -- Get the course and lesson IDs for Organic Farming Quiz lesson
  SELECT c.id, l.id INTO v_course_id, v_lesson_id
  FROM courses c
  JOIN course_lessons l ON l.course_id = c.id
  WHERE c.title = 'Organic Farming Basics' 
    AND l.content_type = 'quiz'
  LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    -- Create the quiz
    INSERT INTO quizzes (course_id, lesson_id, title, description, passing_score, time_limit_minutes, shuffle_questions, show_correct_answer, max_attempts)
    VALUES (v_course_id, v_lesson_id, 'Organic Farming Fundamentals Quiz', 'Test your understanding of organic farming principles, soil health, and natural pest management.', 70, 15, true, true, 3)
    RETURNING id INTO v_quiz_id;
    
    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is the primary benefit of composting for organic farming?', 1, 1, 'Composting creates nutrient-rich organic matter that improves soil structure and provides essential nutrients for plants.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'It kills all soil organisms', false, 1),
    (v_question_id, 'It adds chemical fertilizers to soil', false, 2),
    (v_question_id, 'It creates nutrient-rich organic matter', true, 3),
    (v_question_id, 'It makes the soil more acidic', false, 4);
    
    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Which of these is a natural pest control method in organic farming?', 1, 2, 'Companion planting uses beneficial plants to deter pests naturally, like marigolds to repel aphids.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Using chemical pesticides', false, 1),
    (v_question_id, 'Companion planting', true, 2),
    (v_question_id, 'Burning crop residues', false, 3),
    (v_question_id, 'Using synthetic hormones', false, 4);
    
    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'true_false', 'Crop rotation helps in maintaining soil fertility and reducing pest buildup.', 1, 3, 'True! Rotating crops prevents nutrient depletion and breaks pest and disease cycles.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'True', true, 1),
    (v_question_id, 'False', false, 2);
    
    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is vermicomposting?', 1, 4, 'Vermicomposting uses earthworms to break down organic waste into nutrient-rich fertilizer called vermicompost.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Composting using plastic bins', false, 1),
    (v_question_id, 'Composting using earthworms', true, 2),
    (v_question_id, 'Composting using chemicals', false, 3),
    (v_question_id, 'Composting using machines', false, 4);
    
    -- Question 5
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Which beneficial insect helps in natural pollination and pest control?', 1, 5, 'Ladybugs (ladybird beetles) are beneficial insects that eat aphids and other pests while helping with pollination.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Mosquitoes', false, 1),
    (v_question_id, 'Ladybugs', true, 2),
    (v_question_id, 'Houseflies', false, 3),
    (v_question_id, 'Locusts', false, 4);
    
  END IF;
END $$;

-- ============================================
-- SMART IRRIGATION QUIZ
-- ============================================
DO $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
  v_quiz_id UUID;
  v_question_id UUID;
BEGIN
  SELECT c.id, l.id INTO v_course_id, v_lesson_id
  FROM courses c
  JOIN course_lessons l ON l.course_id = c.id
  WHERE c.title LIKE '%Smart Irrigation%' 
    AND l.content_type = 'quiz'
    AND c.language = 'en'
  LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    INSERT INTO quizzes (course_id, lesson_id, title, description, passing_score, time_limit_minutes, shuffle_questions, show_correct_answer, max_attempts)
    VALUES (v_course_id, v_lesson_id, 'Smart Irrigation Technologies Quiz', 'Test your knowledge of modern irrigation systems, sensors, and water management techniques.', 70, 12, true, true, 3)
    RETURNING id INTO v_quiz_id;
    
    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is the main advantage of drip irrigation over flood irrigation?', 1, 1, 'Drip irrigation delivers water directly to plant roots, reducing water waste by up to 60% compared to flood irrigation.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'It requires more water', false, 1),
    (v_question_id, 'It reduces water usage significantly', true, 2),
    (v_question_id, 'It is cheaper to install', false, 3),
    (v_question_id, 'It works without electricity', false, 4);
    
    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What does a soil moisture sensor measure?', 1, 2, 'Soil moisture sensors measure the volumetric water content in soil, helping farmers know when to irrigate.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Air temperature', false, 1),
    (v_question_id, 'Soil pH level', false, 2),
    (v_question_id, 'Water content in soil', true, 3),
    (v_question_id, 'Crop height', false, 4);
    
    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'true_false', 'IoT sensors can automatically turn irrigation on/off based on soil moisture levels.', 1, 3, 'True! Smart IoT systems can automate irrigation based on real-time sensor data.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'True', true, 1),
    (v_question_id, 'False', false, 2);
    
    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is evapotranspiration?', 1, 4, 'Evapotranspiration is the combined water loss from soil evaporation and plant transpiration, used to calculate irrigation needs.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Water absorbed by plant roots', false, 1),
    (v_question_id, 'Water lost through evaporation and plant transpiration', true, 2),
    (v_question_id, 'Water stored in reservoirs', false, 3),
    (v_question_id, 'Water flowing through pipes', false, 4);
    
    -- Question 5
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Which weather factor most affects irrigation scheduling?', 1, 5, 'Rainfall directly affects how much additional irrigation is needed. Smart systems integrate weather data for optimal scheduling.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Wind direction', false, 1),
    (v_question_id, 'Rainfall', true, 2),
    (v_question_id, 'Cloud color', false, 3),
    (v_question_id, 'Moon phase', false, 4);
    
  END IF;
END $$;

-- ============================================
-- CROP DISEASE DETECTION QUIZ
-- ============================================
DO $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
  v_quiz_id UUID;
  v_question_id UUID;
BEGIN
  SELECT c.id, l.id INTO v_course_id, v_lesson_id
  FROM courses c
  JOIN course_lessons l ON l.course_id = c.id
  WHERE c.title LIKE '%Disease Detection%' 
    AND l.content_type = 'quiz'
    AND c.language = 'en'
  LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    INSERT INTO quizzes (course_id, lesson_id, title, description, passing_score, time_limit_minutes, shuffle_questions, show_correct_answer, max_attempts)
    VALUES (v_course_id, v_lesson_id, 'Crop Disease Recognition Quiz', 'Identify common crop diseases and learn prevention strategies.', 70, 15, true, true, 3)
    RETURNING id INTO v_quiz_id;
    
    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Yellow spots on leaves with powdery substance underneath typically indicate:', 1, 1, 'Fungal infections like powdery mildew or rust often appear as yellow/brown spots with powdery spores.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Nutrient deficiency', false, 1),
    (v_question_id, 'Fungal infection', true, 2),
    (v_question_id, 'Over-watering', false, 3),
    (v_question_id, 'Insect damage', false, 4);
    
    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is the best time to spray organic fungicides?', 1, 2, 'Early morning spraying allows the treatment to dry before intense sun, preventing leaf burn while maximizing effectiveness.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'During heavy rain', false, 1),
    (v_question_id, 'In mid-day sun', false, 2),
    (v_question_id, 'Early morning', true, 3),
    (v_question_id, 'Late night', false, 4);
    
    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'true_false', 'Removing infected plant parts immediately can help prevent disease spread.', 1, 3, 'True! Quick removal and proper disposal of infected plants prevents pathogens from spreading to healthy plants.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'True', true, 1),
    (v_question_id, 'False', false, 2);
    
    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Neem oil is effective against which type of crop problems?', 1, 4, 'Neem oil is a versatile organic solution that works against both insects and fungal diseases.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Only bacterial diseases', false, 1),
    (v_question_id, 'Only insects', false, 2),
    (v_question_id, 'Both insects and fungal diseases', true, 3),
    (v_question_id, 'Only viral diseases', false, 4);
    
    -- Question 5
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What causes late blight in potatoes and tomatoes?', 1, 5, 'Phytophthora infestans is an oomycete (water mold) that causes late blight, especially in humid conditions.', 'hard')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Bacteria', false, 1),
    (v_question_id, 'Virus', false, 2),
    (v_question_id, 'Oomycete (water mold)', true, 3),
    (v_question_id, 'Insects', false, 4);
    
  END IF;
END $$;

-- ============================================
-- WEATHER FORECASTING QUIZ
-- ============================================
DO $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
  v_quiz_id UUID;
  v_question_id UUID;
BEGIN
  SELECT c.id, l.id INTO v_course_id, v_lesson_id
  FROM courses c
  JOIN course_lessons l ON l.course_id = c.id
  WHERE c.title LIKE '%Weather%' 
    AND l.content_type = 'quiz'
    AND c.language = 'en'
  LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    INSERT INTO quizzes (course_id, lesson_id, title, description, passing_score, time_limit_minutes, shuffle_questions, show_correct_answer, max_attempts)
    VALUES (v_course_id, v_lesson_id, 'Weather-Based Farming Decisions Quiz', 'Test your ability to make smart farming decisions based on weather conditions.', 70, 12, true, true, 3)
    RETURNING id INTO v_quiz_id;
    
    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Before an expected frost, what should farmers do to protect crops?', 1, 1, 'Covering crops with mulch, plastic sheets, or row covers helps insulate plants and protect them from frost damage.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Water the crops heavily', false, 1),
    (v_question_id, 'Cover crops with protective materials', true, 2),
    (v_question_id, 'Harvest immediately regardless of ripeness', false, 3),
    (v_question_id, 'Apply extra fertilizer', false, 4);
    
    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'When is the best time to apply pesticides during monsoon season?', 1, 2, 'During rain gaps allows the pesticide to dry and be absorbed before the next rainfall washes it away.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Just before heavy rain', false, 1),
    (v_question_id, 'During rain gaps when 2-3 dry days are expected', true, 2),
    (v_question_id, 'During continuous rain', false, 3),
    (v_question_id, 'It doesn''t matter', false, 4);
    
    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'true_false', 'In India, the southwest monsoon brings most of the annual rainfall.', 1, 3, 'True! The southwest monsoon (June-September) brings about 70-90% of India''s annual rainfall.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'True', true, 1),
    (v_question_id, 'False', false, 2);
    
    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'High humidity combined with warm temperatures increases the risk of:', 1, 4, 'Warm, humid conditions create ideal environments for fungal pathogens to grow and spread rapidly.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Drought stress', false, 1),
    (v_question_id, 'Fungal diseases', true, 2),
    (v_question_id, 'Nutrient deficiency', false, 3),
    (v_question_id, 'Frost damage', false, 4);
    
  END IF;
END $$;

-- ============================================
-- GOVERNMENT SCHEMES QUIZ
-- ============================================
DO $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
  v_quiz_id UUID;
  v_question_id UUID;
BEGIN
  SELECT c.id, l.id INTO v_course_id, v_lesson_id
  FROM courses c
  JOIN course_lessons l ON l.course_id = c.id
  WHERE c.title LIKE '%Government%' 
    AND l.content_type = 'quiz'
    AND c.language = 'en'
  LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    INSERT INTO quizzes (course_id, lesson_id, title, description, passing_score, time_limit_minutes, shuffle_questions, show_correct_answer, max_attempts)
    VALUES (v_course_id, v_lesson_id, 'Government Schemes Eligibility Quiz', 'Test your knowledge of agricultural schemes and their requirements.', 70, 10, true, true, 3)
    RETURNING id INTO v_quiz_id;
    
    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'How much financial support does PM-KISAN provide to eligible farmers annually?', 1, 1, 'PM-KISAN provides ₹6,000 per year in three equal installments of ₹2,000 each to eligible farmer families.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, '₹2,000 per year', false, 1),
    (v_question_id, '₹6,000 per year', true, 2),
    (v_question_id, '₹10,000 per year', false, 3),
    (v_question_id, '₹15,000 per year', false, 4);
    
    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What does PMFBY (Pradhan Mantri Fasal Bima Yojana) cover?', 1, 2, 'PMFBY provides crop insurance coverage for crop losses due to natural calamities, pests, and diseases.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Equipment purchase', false, 1),
    (v_question_id, 'Crop insurance against natural calamities', true, 2),
    (v_question_id, 'Land purchase', false, 3),
    (v_question_id, 'Labor wages', false, 4);
    
    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'true_false', 'Kisan Credit Card (KCC) can be used only for purchasing seeds and fertilizers.', 1, 3, 'False! KCC can be used for crop production, post-harvest expenses, farm asset maintenance, and even consumption needs.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'True', false, 1),
    (v_question_id, 'False', true, 2);
    
    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'To apply for PM-KISAN, which document is mandatory?', 1, 4, 'Aadhaar Card is mandatory for PM-KISAN registration and benefit transfer.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Driving License', false, 1),
    (v_question_id, 'Aadhaar Card', true, 2),
    (v_question_id, 'Passport', false, 3),
    (v_question_id, 'Voter ID only', false, 4);
    
  END IF;
END $$;

-- ============================================
-- MARKET LINKAGE QUIZ  
-- ============================================
DO $$
DECLARE
  v_course_id UUID;
  v_lesson_id UUID;
  v_quiz_id UUID;
  v_question_id UUID;
BEGIN
  SELECT c.id, l.id INTO v_course_id, v_lesson_id
  FROM courses c
  JOIN course_lessons l ON l.course_id = c.id
  WHERE c.title LIKE '%Market%' 
    AND l.content_type = 'quiz'
    AND c.language = 'en'
  LIMIT 1;
  
  IF v_course_id IS NOT NULL THEN
    INSERT INTO quizzes (course_id, lesson_id, title, description, passing_score, time_limit_minutes, shuffle_questions, show_correct_answer, max_attempts)
    VALUES (v_course_id, v_lesson_id, 'Agricultural Marketing Strategies Quiz', 'Test your understanding of market channels and pricing strategies.', 70, 12, true, true, 3)
    RETURNING id INTO v_quiz_id;
    
    -- Question 1
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is e-NAM?', 1, 1, 'e-NAM (Electronic National Agriculture Market) is an online trading platform for agricultural commodities in India.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'A farming mobile app', false, 1),
    (v_question_id, 'Electronic National Agriculture Market', true, 2),
    (v_question_id, 'A fertilizer brand', false, 3),
    (v_question_id, 'A weather service', false, 4);
    
    -- Question 2
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is the benefit of grading produce before selling?', 1, 2, 'Graded produce commands better prices as buyers pay premium for quality-assured products.', 'easy')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'It reduces the quantity', false, 1),
    (v_question_id, 'It helps get better prices', true, 2),
    (v_question_id, 'It increases storage time only', false, 3),
    (v_question_id, 'It is only required for export', false, 4);
    
    -- Question 3
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'true_false', 'Farmers can sell directly to consumers without going through APMC mandis.', 1, 3, 'True! Farmers can sell through various channels including farmer markets, online platforms, and direct sales.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'True', true, 1),
    (v_question_id, 'False', false, 2);
    
    -- Question 4
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'What is MSP in Indian agriculture?', 1, 4, 'Minimum Support Price (MSP) is the price at which the government purchases crops from farmers to protect them from price crashes.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'Maximum Selling Price', false, 1),
    (v_question_id, 'Minimum Support Price', true, 2),
    (v_question_id, 'Market Standard Price', false, 3),
    (v_question_id, 'Monthly Sale Projection', false, 4);
    
    -- Question 5
    INSERT INTO quiz_questions (quiz_id, question_type, question_text, points, order_index, explanation, difficulty)
    VALUES (v_quiz_id, 'multiple_choice', 'Which factor most affects vegetable prices in Indian markets?', 1, 5, 'Seasonal supply directly impacts prices - prices drop during peak harvest and rise during off-season.', 'medium')
    RETURNING id INTO v_question_id;
    
    INSERT INTO quiz_options (question_id, option_text, is_correct, order_index) VALUES
    (v_question_id, 'International currency rates', false, 1),
    (v_question_id, 'Seasonal supply and demand', true, 2),
    (v_question_id, 'Government holidays', false, 3),
    (v_question_id, 'Farmer education level', false, 4);
    
  END IF;
END $$;

-- ============================================
-- Update lesson content_url to point to quiz ID
-- ============================================
UPDATE course_lessons l
SET content_url = q.id::text
FROM quizzes q
WHERE l.id = q.lesson_id 
  AND l.content_type = 'quiz';

-- Log quiz creation summary
DO $$
DECLARE
  quiz_count INTEGER;
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO quiz_count FROM quizzes;
  SELECT COUNT(*) INTO question_count FROM quiz_questions;
  RAISE NOTICE 'Created % quizzes with % questions', quiz_count, question_count;
END $$;
