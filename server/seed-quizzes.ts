import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { FULL_COURSE_DEFINITIONS } from './data/index.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedQuizzes() {
  console.log('🎯 Adding Quizzes to Existing Lessons...\n');
  
  let quizzesCreated = 0;
  let questionsCreated = 0;

  for (const courseDef of FULL_COURSE_DEFINITIONS) {
    console.log(`📚 Processing: ${courseDef.title}`);
    
    // Get the course
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('title', courseDef.title)
      .single();
    
    if (!course) {
      console.log(`  ⚠️  Course not found`);
      continue;
    }
    
    // Get all lessons for this course
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('id, title, content_type')
      .eq('course_id', course.id)
      .eq('content_type', 'quiz');
    
    if (!lessons || lessons.length === 0) {
      console.log(`  ⏭️  No quiz lessons found`);
      continue;
    }
    
    // Find quiz lessons in our content
    for (const lesson of lessons) {
      const contentLesson = courseDef.content.find(
        l => l.title === lesson.title && l.content_type === 'quiz' && l.quiz
      );
      
      if (!contentLesson || !contentLesson.quiz) {
        console.log(`  ⏭️  No quiz data for "${lesson.title}"`);
        continue;
      }
      
      // Check if quiz already exists
      const { data: existingQuiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('lesson_id', lesson.id)
        .single();
      
      if (existingQuiz) {
        console.log(`  ⏭️  Quiz already exists for "${lesson.title}"`);
        continue;
      }
      
      // Create the quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          lesson_id: lesson.id,
          course_id: course.id,
          title: contentLesson.title,
          description: contentLesson.description,
          passing_score: 60,
          time_limit_minutes: parseInt(contentLesson.duration) || 10,
          is_published: true,
          is_required: true,
        })
        .select('id')
        .single();
      
      if (quizError) {
        console.error(`  ❌ Failed to create quiz for "${lesson.title}": ${quizError.message}`);
        continue;
      }
      
      quizzesCreated++;
      console.log(`  🎯 Created quiz: ${contentLesson.title}`);
      
      // Add quiz questions
      for (let q = 0; q < contentLesson.quiz.questions.length; q++) {
        const question = contentLesson.quiz.questions[q];
        
        // Format options as JSONB with is_correct flags
        const formattedOptions = question.options.map((opt, idx) => ({
          text: opt,
          is_correct: idx === question.correctIndex
        }));
        
        const { error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: newQuiz.id,
            question_text: question.question,
            question_type: 'multiple_choice',
            options: formattedOptions,
            explanation: question.explanation || null,
            order_index: q + 1,
            points: 10,
          });
        
        if (questionError) {
          console.error(`    ❌ Failed to add question: ${questionError.message}`);
        } else {
          questionsCreated++;
        }
      }
      console.log(`    📋 Added ${contentLesson.quiz.questions.length} questions`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Quiz Seeding Complete!\n');
  console.log(`  🎯 Quizzes created: ${quizzesCreated}`);
  console.log(`  📋 Questions created: ${questionsCreated}`);
  console.log('='.repeat(50));
}

seedQuizzes().catch(console.error);
