import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { FULL_COURSE_DEFINITIONS, findContentForCourse, LessonContent } from './data/index.js';

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

// ============================================
// SEED COURSES WITH RICH CONTENT
// ============================================
async function seedCoursesWithContent() {
  console.log('🌾 Starting Rich Content Seeding...\n');
  console.log('='.repeat(50));
  
  let coursesCreated = 0;
  let lessonsCreated = 0;
  let quizzesCreated = 0;
  let questionsCreated = 0;

  for (const courseDef of FULL_COURSE_DEFINITIONS) {
    console.log(`\n📚 Processing: ${courseDef.title}`);
    
    // 1. Check if course exists
    let { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('title', courseDef.title)
      .single();
    
    let courseId: string;
    
    if (!existingCourse) {
      // Create the course
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          title: courseDef.title,
          description: courseDef.description,
          category: courseDef.slug,
          level: courseDef.difficulty_level,
          duration: `${courseDef.estimated_hours} hours`,
          lessons: courseDef.content.length,
          thumbnail_url: courseDef.image_url,
          language: 'Hindi, English',
          is_published: true,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`  ❌ Failed to create course: ${error.message}`);
        continue;
      }
      
      courseId = newCourse.id;
      coursesCreated++;
      console.log(`  ✅ Created course (ID: ${courseId})`);
    } else {
      courseId = existingCourse.id;
      console.log(`  ℹ️  Course already exists (ID: ${courseId})`);
    }
    
    // 2. Add lessons from rich content
    const content = courseDef.content;
    if (!content || content.length === 0) {
      console.log(`  ⚠️  No content defined for this course`);
      continue;
    }
    
    // Check existing lessons count
    const { count: existingLessonCount } = await supabase
      .from('course_lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    
    if (existingLessonCount && existingLessonCount > 0) {
      console.log(`  ⏭️  Skipping lessons (${existingLessonCount} already exist)`);
      continue;
    }
    
    // Insert lessons
    for (let i = 0; i < content.length; i++) {
      const lesson = content[i];
      
      // Prepare lesson data
      const lessonData = {
        course_id: courseId,
        title: lesson.title,
        description: lesson.description,
        content_type: lesson.content_type,
        content_url: lesson.content_url || null,
        duration: lesson.duration,
        is_preview: lesson.is_preview || false,
        order_index: i + 1,
      };
      
      const { data: newLesson, error: lessonError } = await supabase
        .from('course_lessons')
        .insert(lessonData)
        .select('id')
        .single();
      
      if (lessonError) {
        console.error(`  ❌ Failed to create lesson "${lesson.title}": ${lessonError.message}`);
        continue;
      }
      
      lessonsCreated++;
      console.log(`  📝 Added lesson: ${lesson.title}`);
      
      // 3. If this lesson has a quiz, create it
      if (lesson.content_type === 'quiz' && lesson.quiz) {
        const { data: newQuiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            lesson_id: newLesson.id,
            course_id: courseId,
            title: lesson.title,
            description: lesson.description,
            passing_score: 60, // 60% to pass
            time_limit_minutes: parseInt(lesson.duration) || 10, // Convert to minutes
          })
          .select('id')
          .single();
        
        if (quizError) {
          console.error(`    ❌ Failed to create quiz: ${quizError.message}`);
          continue;
        }
        
        quizzesCreated++;
        console.log(`    🎯 Created quiz (ID: ${newQuiz.id})`);
        
        // 4. Add quiz questions
        for (let q = 0; q < lesson.quiz.questions.length; q++) {
          const question = lesson.quiz.questions[q];
          
          const { error: questionError } = await supabase
            .from('quiz_questions')
            .insert({
              quiz_id: newQuiz.id,
              question_text: question.question,
              question_type: 'multiple_choice',
              options: JSON.stringify(question.options),
              correct_answer: question.options[question.correctIndex],
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
        console.log(`    📋 Added ${lesson.quiz.questions.length} questions`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEEDING COMPLETE!\n');
  console.log(`  📚 Courses created: ${coursesCreated}`);
  console.log(`  📝 Lessons created: ${lessonsCreated}`);
  console.log(`  🎯 Quizzes created: ${quizzesCreated}`);
  console.log(`  📋 Questions created: ${questionsCreated}`);
  console.log('\n' + '='.repeat(50));
}

// ============================================
// RUN SEEDING
// ============================================
seedCoursesWithContent().catch(console.error);
