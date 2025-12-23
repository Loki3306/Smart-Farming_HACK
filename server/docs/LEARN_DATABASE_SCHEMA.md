# Learn Page Database Schema Documentation

## Overview
Complete, production-ready database schema for the Smart Farming Learn platform. Supports courses, articles, videos, quizzes, rewards, user progress tracking, and payment integration.

## Table of Contents
1. [Core Content Tables](#core-content-tables)
2. [Assessment & Quizzes](#assessment--quizzes)
3. [User Progress & Tracking](#user-progress--tracking)
4. [Rewards System](#rewards-system)
5. [Learning Paths](#learning-paths)
6. [Transactions](#transactions)
7. [Indexes & Performance](#indexes--performance)
8. [Relationships Diagram](#relationships-diagram)

---

## Core Content Tables

### 1. `courses` Table
Stores complete course information with pricing, instructor details, and metadata.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK, default | Unique course identifier |
| title | VARCHAR(255) | NOT NULL | Course title (searchable) |
| description | TEXT | NOT NULL | Detailed course description |
| category | VARCHAR(50) | NOT NULL | Category: crop-management, irrigation, pest-control, soil-health, equipment, weather |
| level | VARCHAR(20) | NOT NULL, CHECK | beginner \| intermediate \| advanced |
| duration | VARCHAR(50) | - | e.g., "4 hours", "2.5 hours" |
| lessons | INTEGER | - | Total number of lessons |
| thumbnail_emoji | VARCHAR(10) | - | Emoji representation for UI (💧, 🌱, etc.) |
| thumbnail_url | VARCHAR(500) | - | Optional: actual image URL |
| language | VARCHAR(100) | DEFAULT 'English' | Comma-separated: "Hindi, English, Marathi" |
| rating | DECIMAL(3,1) | DEFAULT 4.5 | Average rating (0-5) |
| enrolled_count | INTEGER | DEFAULT 0 | Total enrolled users |
| price | DECIMAL(10,2) | DEFAULT 0 | 0 = Free, >0 = Paid course |
| currency | VARCHAR(10) | DEFAULT 'INR' | Price currency |
| discount_percent | INTEGER | DEFAULT 0 | Discount percentage (0-100) |
| instructor_id | UUID | FK → users | Instructor user ID |
| instructor_name | VARCHAR(255) | - | Instructor name (denormalized) |
| instructor_bio | TEXT | - | Instructor biography |
| instructor_avatar | VARCHAR(500) | - | Instructor profile image |
| is_published | BOOLEAN | DEFAULT false | Published/Draft status |
| is_archived | BOOLEAN | DEFAULT false | Archived/Deleted flag |
| view_count | INTEGER | DEFAULT 0 | Total course views |
| completion_rate | DECIMAL(5,2) | DEFAULT 0 | % of users who completed |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| published_at | TIMESTAMP | - | When course was published |
| search_vector | TSVECTOR | GENERATED ALWAYS | Full-text search index |

**Indexes:**
- `idx_category` - Filter by category
- `idx_level` - Filter by difficulty level
- `idx_published` - Published courses only
- `idx_price` - Paid vs Free courses
- `idx_search` - Full-text search support

---

### 2. `course_lessons` Table
Individual lessons/modules within a course with content type and ordering.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique lesson ID |
| course_id | UUID | FK → courses | Parent course |
| title | VARCHAR(255) | NOT NULL | Lesson title |
| description | TEXT | - | Lesson description |
| order_index | INTEGER | NOT NULL | Display order in course |
| duration | VARCHAR(50) | - | e.g., "30 min", "1 hour" |
| content_type | VARCHAR(20) | CHECK | video \| text \| quiz \| assignment |
| content_url | VARCHAR(500) | - | URL to lesson content |
| is_preview | BOOLEAN | DEFAULT false | Free preview or paid only |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_course_id` - Get lessons for a course
- `idx_order` - Sort lessons in order

---

### 3. `articles` Table
Educational articles from internal, external, or scraped sources.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique article ID |
| title | VARCHAR(255) | NOT NULL | Article title |
| excerpt | TEXT | NOT NULL | Short summary |
| content | TEXT | NOT NULL | Full article content |
| category | VARCHAR(50) | NOT NULL | Article category |
| author_id | UUID | FK → users | Author user ID |
| author_name | VARCHAR(255) | - | Author name (denormalized) |
| author_avatar | VARCHAR(500) | - | Author profile image |
| read_time_minutes | INTEGER | - | Estimated read time |
| language | VARCHAR(100) | DEFAULT 'English' | Article language(s) |
| source_type | VARCHAR(20) | CHECK | internal \| external \| scraped |
| source_url | VARCHAR(500) | - | Original URL if external/scraped |
| source_title | VARCHAR(255) | - | Original title if external |
| thumbnail_url | VARCHAR(500) | - | Article image |
| thumbnail_emoji | VARCHAR(10) | - | Emoji icon |
| view_count | INTEGER | DEFAULT 0 | Total views |
| like_count | INTEGER | DEFAULT 0 | Total likes |
| is_published | BOOLEAN | DEFAULT true | Published status |
| is_featured | BOOLEAN | DEFAULT false | Featured on homepage |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| published_at | TIMESTAMP | - | Publication timestamp |
| search_vector | TSVECTOR | GENERATED ALWAYS | Full-text search index |

**Indexes:**
- `idx_category` - Filter by category
- `idx_published` - Published articles only
- `idx_featured` - Featured articles
- `idx_search` - Full-text search

---

### 4. `videos` Table
Video tutorials from YouTube, Vimeo, or self-hosted.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique video ID |
| title | VARCHAR(255) | NOT NULL | Video title |
| description | TEXT | - | Detailed description |
| category | VARCHAR(50) | NOT NULL | Video category |
| duration_seconds | INTEGER | - | Video length in seconds |
| video_type | VARCHAR(20) | CHECK | youtube \| vimeo \| self_hosted \| aws_s3 |
| video_url | VARCHAR(500) | NOT NULL | Video URL or embed link |
| video_id | VARCHAR(100) | - | YouTube/Vimeo ID for API calls |
| thumbnail_url | VARCHAR(500) | - | Video thumbnail image |
| thumbnail_emoji | VARCHAR(10) | - | Emoji icon |
| creator_id | UUID | FK → users | Content creator user ID |
| creator_name | VARCHAR(255) | - | Creator name (denormalized) |
| creator_avatar | VARCHAR(500) | - | Creator profile image |
| language | VARCHAR(100) | DEFAULT 'English' | Video language(s) |
| skill_level | VARCHAR(20) | - | Beginner \| Intermediate \| Advanced |
| transcript | TEXT | - | Video transcript for search/SEO |
| is_published | BOOLEAN | DEFAULT true | Published status |
| view_count | INTEGER | DEFAULT 0 | Total views |
| like_count | INTEGER | DEFAULT 0 | Total likes |
| is_featured | BOOLEAN | DEFAULT false | Featured on homepage |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| published_at | TIMESTAMP | - | Publication timestamp |
| search_vector | TSVECTOR | GENERATED ALWAYS | Full-text search index |

**Indexes:**
- `idx_category` - Filter by category
- `idx_video_type` - Filter by video platform
- `idx_published` - Published videos
- `idx_featured` - Featured videos
- `idx_search` - Full-text search

---

## Assessment & Quizzes

### 5. `quizzes` Table
Quiz assessments linked to courses or lessons.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique quiz ID |
| course_id | UUID | FK → courses | Parent course |
| lesson_id | UUID | FK → course_lessons | Optional: specific lesson |
| title | VARCHAR(255) | NOT NULL | Quiz title |
| description | TEXT | - | Quiz description |
| passing_score | INTEGER | DEFAULT 70 | Required percentage to pass |
| time_limit_minutes | INTEGER | - | Optional: time limit in minutes |
| shuffle_questions | BOOLEAN | DEFAULT false | Randomize question order |
| show_correct_answer | BOOLEAN | DEFAULT true | Show answers after submission |
| order_index | INTEGER | - | Display order |
| is_required | BOOLEAN | DEFAULT true | Must pass to progress in course |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_course_id` - Get quizzes for course
- `idx_lesson_id` - Get quiz for lesson

---

### 6. `quiz_questions` Table
Individual questions within a quiz.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique question ID |
| quiz_id | UUID | FK → quizzes | Parent quiz |
| question_type | VARCHAR(20) | CHECK | multiple_choice \| true_false \| short_answer \| essay |
| question_text | TEXT | NOT NULL | Question content |
| options | JSONB | - | Array of {text, is_correct} for MCQ |
| points | INTEGER | DEFAULT 1 | Points for correct answer |
| order_index | INTEGER | - | Question order in quiz |
| explanation | TEXT | - | Explanation shown after answer |
| difficulty | VARCHAR(20) | DEFAULT 'medium' | easy \| medium \| hard |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_quiz_id` - Get questions for quiz

---

### 7. `quiz_attempts` Table
User quiz attempts with scores and performance.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique attempt ID |
| user_id | UUID | FK → users | User who took quiz |
| quiz_id | UUID | FK → quizzes | Quiz taken |
| score | INTEGER | - | Points earned |
| percentage | DECIMAL(5,2) | - | Percentage score (0-100) |
| passed | BOOLEAN | - | Passed/Failed |
| time_spent_seconds | INTEGER | - | Time taken to complete |
| attempt_number | INTEGER | DEFAULT 1 | Attempt number (1st, 2nd, etc.) |
| created_at | TIMESTAMP | DEFAULT NOW() | Attempt timestamp |

**Indexes:**
- `idx_user_id` - Get user's quiz attempts
- `idx_quiz_id` - Get quiz attempts
- `idx_passed` - Filter by pass/fail status

---

### 8. `quiz_answers` Table
Individual answers provided by user to quiz questions.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique answer ID |
| attempt_id | UUID | FK → quiz_attempts | Parent quiz attempt |
| question_id | UUID | FK → quiz_questions | The question |
| user_answer | TEXT | NOT NULL | User's provided answer |
| is_correct | BOOLEAN | - | Whether answer is correct |
| points_earned | INTEGER | - | Points awarded for this answer |
| created_at | TIMESTAMP | DEFAULT NOW() | Timestamp |

**Indexes:**
- `idx_attempt_id` - Get answers for attempt
- `idx_question_id` - Get all answers to a question

---

## User Progress & Tracking

### 9. `course_enrollments` Table
Tracks user enrollment and progress in courses.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique enrollment ID |
| user_id | UUID | FK → users | Enrolled user |
| course_id | UUID | FK → courses | Course |
| status | VARCHAR(20) | CHECK | enrolled \| in_progress \| completed \| dropped |
| progress_percent | INTEGER | DEFAULT 0 | Course completion % (0-100) |
| lessons_completed | INTEGER | DEFAULT 0 | Number of lessons completed |
| completion_date | TIMESTAMP | - | When course was completed |
| certificate_url | VARCHAR(500) | - | Link to certificate |
| enrollment_type | VARCHAR(20) | CHECK | free \| paid \| promotional \| gifted |
| amount_paid | DECIMAL(10,2) | - | Price paid (if paid enrollment) |
| enrolled_at | TIMESTAMP | DEFAULT NOW() | Enrollment date |
| last_accessed_at | TIMESTAMP | - | Last time user accessed course |
| UNIQUE(user_id, course_id) | - | - | One enrollment per user per course |

**Indexes:**
- `idx_user_id` - Get all enrollments for user
- `idx_course_id` - Get all enrollments for course
- `idx_status` - Filter by enrollment status
- `idx_progress` - Filter by progress level

---

### 10. `lesson_progress` Table
Tracks progress on individual lessons.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique progress record |
| user_id | UUID | FK → users | User |
| lesson_id | UUID | FK → course_lessons | Lesson |
| status | VARCHAR(20) | CHECK | not_started \| in_progress \| completed |
| completion_date | TIMESTAMP | - | When lesson was completed |
| time_spent_seconds | INTEGER | DEFAULT 0 | Time spent on lesson |
| video_progress_percent | INTEGER | - | Video watched % (for video lessons) |
| last_watched_at | TIMESTAMP | - | Last activity timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| UNIQUE(user_id, lesson_id) | - | - | One progress per user per lesson |

**Indexes:**
- `idx_user_id` - Get user's lesson progress
- `idx_lesson_id` - Get all users' progress on a lesson

---

## Rewards System

### 11. `badges` Table
Available badges/achievements for users to earn.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique badge ID |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Badge name |
| description | TEXT | NOT NULL | What the badge represents |
| icon_emoji | VARCHAR(10) | - | Emoji icon (🏆, 🌟, etc.) |
| icon_url | VARCHAR(500) | - | Badge image URL |
| category | VARCHAR(50) | CHECK | completion \| achievement \| streak \| milestone \| special |
| requirement_type | VARCHAR(50) | NOT NULL | How to earn: courses_completed, quizzes_passed, consecutive_days, etc. |
| requirement_value | INTEGER | - | Value for requirement (e.g., 5 courses) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_category` - Filter badges by type
- `idx_requirement` - Find badges by requirement

---

### 12. `user_badges` Table
Tracks which badges users have earned.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique record |
| user_id | UUID | FK → users | User who earned badge |
| badge_id | UUID | FK → badges | Badge earned |
| earned_at | TIMESTAMP | DEFAULT NOW() | When badge was earned |
| UNIQUE(user_id, badge_id) | - | - | User can't earn same badge twice |

**Indexes:**
- `idx_user_id` - Get user's badges
- `idx_badge_id` - Get who earned this badge

---

## Learning Paths

### 13. `learning_roadmaps` Table
Structured learning paths for farmers (e.g., "Master Smart Irrigation").

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique roadmap ID |
| title | VARCHAR(255) | NOT NULL | Roadmap title |
| description | TEXT | NOT NULL | Detailed description |
| difficulty | VARCHAR(20) | CHECK | beginner \| intermediate \| advanced |
| goal | TEXT | NOT NULL | What farmer will learn |
| estimated_hours | INTEGER | - | Estimated completion time |
| icon_emoji | VARCHAR(10) | - | Roadmap icon |
| icon_url | VARCHAR(500) | - | Roadmap image |
| is_published | BOOLEAN | DEFAULT false | Published status |
| view_count | INTEGER | DEFAULT 0 | Total views |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_difficulty` - Filter by level
- `idx_published` - Published roadmaps only

---

### 14. `roadmap_milestones` Table
Steps/milestones within a learning roadmap.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique milestone ID |
| roadmap_id | UUID | FK → learning_roadmaps | Parent roadmap |
| order_index | INTEGER | NOT NULL | Step order |
| title | VARCHAR(255) | NOT NULL | Milestone title |
| description | TEXT | - | What will be learned |
| course_id | UUID | FK → courses | Linked course |
| is_completed | BOOLEAN | DEFAULT false | Used for templates |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_roadmap_id` - Get milestones for roadmap
- `idx_order` - Sort milestones correctly

---

### 15. `user_roadmap_progress` Table
Tracks user progress on learning roadmaps.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique progress record |
| user_id | UUID | FK → users | User following roadmap |
| roadmap_id | UUID | FK → learning_roadmaps | Roadmap |
| progress_percent | INTEGER | DEFAULT 0 | Completion % (0-100) |
| completed_milestones | INTEGER | DEFAULT 0 | Milestones completed |
| started_at | TIMESTAMP | DEFAULT NOW() | When user started |
| completed_at | TIMESTAMP | - | When user completed |
| UNIQUE(user_id, roadmap_id) | - | - | One progress per user per roadmap |

**Indexes:**
- `idx_user_id` - Get user's roadmaps
- `idx_roadmap_id` - Get users following roadmap

---

## Transactions

### 16. `course_purchases` Table
Records of paid course purchases.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique purchase ID |
| user_id | UUID | FK → users | Customer |
| course_id | UUID | FK → courses | Course purchased |
| amount | DECIMAL(10,2) | NOT NULL | Original price |
| currency | VARCHAR(10) | DEFAULT 'INR' | Currency |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | Discount applied |
| final_amount | DECIMAL(10,2) | NOT NULL | Final amount paid |
| payment_method | VARCHAR(50) | - | card \| upi \| netbanking \| wallet |
| payment_status | VARCHAR(20) | CHECK | pending \| success \| failed \| refunded |
| payment_id | VARCHAR(100) | - | Payment gateway transaction ID |
| purchased_at | TIMESTAMP | DEFAULT NOW() | Purchase timestamp |
| refunded_at | TIMESTAMP | - | Refund timestamp (if refunded) |

**Indexes:**
- `idx_user_id` - Get user's purchases
- `idx_course_id` - Get course sales
- `idx_payment_status` - Filter by payment status

---

## Statistics

### 17. `user_learning_stats` Table
Aggregated learning statistics per user (cache/summary).

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| id | UUID | PK | Unique record |
| user_id | UUID | FK → users | User (UNIQUE) |
| total_courses_enrolled | INTEGER | DEFAULT 0 | Total enrollments |
| total_courses_completed | INTEGER | DEFAULT 0 | Courses finished |
| total_learning_hours | DECIMAL(10,2) | DEFAULT 0 | Total hours spent |
| total_badges_earned | INTEGER | DEFAULT 0 | Badges won |
| current_streak_days | INTEGER | DEFAULT 0 | Current learning streak |
| longest_streak_days | INTEGER | DEFAULT 0 | Longest streak ever |
| total_points | INTEGER | DEFAULT 0 | Gamification points |
| last_activity_date | TIMESTAMP | - | Most recent activity |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_user_id` - Get user's stats (UNIQUE)

---

## Indexes & Performance

### Full-Text Search
- `courses.search_vector` (GIN) - Search by title + description
- `articles.search_vector` (GIN) - Search by title + excerpt + content
- `videos.search_vector` (GIN) - Search by title + description

### Common Query Patterns
```sql
-- Get published courses by category
SELECT * FROM courses 
WHERE is_published = true AND category = 'irrigation'
ORDER BY created_at DESC;

-- Get user's course progress
SELECT ce.*, c.title, c.lessons FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = $1 AND ce.status = 'in_progress';

-- Get quiz performance
SELECT qa.*, qq.question_text FROM quiz_answers qa
JOIN quiz_questions qq ON qq.id = qa.question_id
WHERE qa.attempt_id = $1;

-- Get user badges with metadata
SELECT ub.earned_at, b.* FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id = $1
ORDER BY ub.earned_at DESC;
```

---

## Relationships Diagram

```
users (from auth)
├── instructor_id → courses
├── author_id → articles
├── creator_id → videos
├── user_id → course_enrollments
├── user_id → lesson_progress
├── user_id → quiz_attempts
├── user_id → user_badges
├── user_id → user_roadmap_progress
├── user_id → course_purchases
└── user_id → user_learning_stats

courses
├── course_id → course_lessons
├── course_id → quizzes
├── course_id → course_enrollments
├── course_id → roadmap_milestones
└── course_id → course_purchases

course_lessons
├── lesson_id → lesson_progress
└── lesson_id → quizzes

quizzes
├── quiz_id → quiz_questions
├── quiz_id → quiz_attempts
└── quiz_id → quiz_answers

quiz_questions
└── question_id → quiz_answers

quiz_attempts
└── attempt_id → quiz_answers

learning_roadmaps
└── roadmap_id → roadmap_milestones
└── roadmap_id → user_roadmap_progress

badges
└── badge_id → user_badges
```

---

## Migration Notes

1. **Run the SQL Schema:** Execute `learn_schema.sql` on your Supabase database
2. **Enable Full-Text Search:** Already configured with TSVECTOR and GIN indexes
3. **Auto-Timestamp Updates:** Triggers automatically update `updated_at` fields
4. **Foreign Key Constraints:** All relationships are protected with CASCADE/SET NULL
5. **Unique Constraints:** Prevent duplicate enrollments, badges, and roadmap progress

---

## Future Enhancements

- [ ] Add course certificate generation
- [ ] Add discussion forums per course
- [ ] Add user reviews/ratings
- [ ] Add course prerequisites
- [ ] Add batch/cohort support
- [ ] Add instructor analytics dashboard
- [ ] Add user behavior analytics (heatmaps, drop-off points)
- [ ] Add content recommendation engine
- [ ] Add gamification leaderboards
- [ ] Add integration with external course platforms (Udemy, Coursera)

---

This schema is designed to be:
- **Scalable:** Supports thousands of users and content pieces
- **Flexible:** Supports multiple content types, pricing models, and learning paths
- **Performant:** Proper indexing and denormalization where needed
- **Maintainable:** Clear structure and comprehensive documentation
