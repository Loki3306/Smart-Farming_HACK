# Learn Page Backend Implementation Guide

## Phase 1: Database Setup ✅

### Step 1: Create Tables in Supabase
```bash
# Login to Supabase SQL Editor and run:
# File: server/migrations/learn_schema.sql
```

The schema includes:
- 17 tables covering all aspects of learning platform
- Proper indexes for performance
- Full-text search support
- Automatic timestamp triggers
- Foreign key relationships with cascading

---

## Phase 2: Create Backend Routes & Controllers

### Step 2: Create Learn Routes File

Create `server/routes/learn.ts` with endpoints for:

**Courses:**
- `GET /api/learn/courses` - List courses with filters/pagination
- `GET /api/learn/courses/:id` - Get single course with lessons
- `POST /api/learn/courses` - Create course (admin)
- `PUT /api/learn/courses/:id` - Update course (admin)
- `DELETE /api/learn/courses/:id` - Archive course (admin)

**Articles:**
- `GET /api/learn/articles` - List articles
- `GET /api/learn/articles/:id` - Get single article
- `POST /api/learn/articles` - Create article (admin)
- `PUT /api/learn/articles/:id` - Update article (admin)
- `DELETE /api/learn/articles/:id` - Delete article (admin)

**Videos:**
- `GET /api/learn/videos` - List videos
- `GET /api/learn/videos/:id` - Get single video
- `POST /api/learn/videos` - Create video (admin)
- `PUT /api/learn/videos/:id` - Update video (admin)
- `DELETE /api/learn/videos/:id` - Delete video (admin)

**Quizzes & Assessment:**
- `GET /api/learn/quizzes/:courseId` - Get course quizzes
- `GET /api/learn/quizzes/:id` - Get quiz with questions
- `POST /api/learn/quizzes` - Create quiz (admin)
- `POST /api/learn/quizzes/:id/submit` - Submit quiz answers
- `GET /api/learn/quizzes/:id/attempts` - Get user's quiz attempts

**Enrollments & Progress:**
- `POST /api/learn/enrollments` - Enroll in course
- `GET /api/learn/enrollments` - Get user's enrollments
- `GET /api/learn/progress/:courseId` - Get course progress
- `POST /api/learn/progress` - Update lesson progress

**Roadmaps:**
- `GET /api/learn/roadmaps` - List roadmaps
- `GET /api/learn/roadmaps/:id` - Get roadmap with milestones
- `POST /api/learn/roadmaps/:id/start` - Start following roadmap
- `GET /api/learn/roadmaps/:id/progress` - Get user's progress

**Badges & Rewards:**
- `GET /api/learn/badges` - List all badges
- `GET /api/learn/badges/user` - Get user's earned badges

**Statistics & Search:**
- `GET /api/learn/stats` - Get user learning stats
- `GET /api/learn/search` - Unified search across content

**Purchases (optional for Phase 1):**
- `POST /api/learn/purchases/initiate` - Start purchase
- `POST /api/learn/purchases/verify` - Verify payment
- `GET /api/learn/purchases` - Get purchase history

---

### Step 3: Database Access Layer (db/learn.ts)

Create query builders for each table:

```typescript
// server/db/learn.ts structure:

export const learnQueries = {
  // Courses
  getAllCourses(filters: {}) => Promise<Course[]>,
  getCourseById(id: string) => Promise<Course>,
  createCourse(data: CreateCourseRequest) => Promise<Course>,
  updateCourse(id: string, data: Partial<Course>) => Promise<Course>,
  
  // Enrollments
  enrollCourse(userId: string, courseId: string, type: string) => Promise<CourseEnrollment>,
  getEnrollments(userId: string) => Promise<CourseEnrollment[]>,
  updateProgress(userId: string, courseId: string, percent: number) => Promise<CourseEnrollment>,
  
  // Progress
  updateLessonProgress(userId: string, lessonId: string, status: string) => Promise<LessonProgress>,
  getLessonProgress(userId: string, courseId: string) => Promise<LessonProgress[]>,
  
  // Quizzes
  getQuiz(quizId: string) => Promise<Quiz & { questions: QuizQuestion[] }>,
  submitQuiz(userId: string, quizId: string, answers: QuizAnswer[]) => Promise<QuizAttempt>,
  
  // Articles, Videos, Badges, Roadmaps...
  // Similar pattern for each table
};
```

---

## Phase 3: Service Layer

### Step 4: Create Learning Service (services/LearnService.ts)

```typescript
// Handles business logic like:

export class LearnService {
  // Course Management
  static async getAllCourses(filters) {}
  static async getCourseDetails(courseId) {} // with lessons, instructor
  static async searchContent(query, type, filters) {} // search across courses/articles/videos
  
  // Enrollment & Progress
  static async enrollCourse(userId, courseId) {}
  static async updateCourseProgress(userId, courseId) {
    // Calculate progress from lesson_progress
    // Update course_enrollments.progress_percent
  }
  
  // Quiz Handling
  static async submitQuiz(userId, quizId, answers) {
    // Validate answers
    // Calculate score
    // Check if passed
    // Award badge if applicable
    // Update course progress if quiz required
  }
  
  // Badge Management
  static async checkAndAwardBadges(userId) {
    // Check all badge criteria
    // Award new badges
    // Trigger notifications
  }
  
  // Roadmap Progress
  static async startRoadmap(userId, roadmapId) {}
  static async updateMilestoneProgress(userId, milestoneId) {}
  
  // Statistics
  static async getUserLearningStats(userId) {
    // Calculate from enrollments, progress, badges
    // Update user_learning_stats cache
  }
}
```

---

## Phase 4: Frontend Service Integration

### Step 5: Create Frontend Learn Service

```typescript
// client/services/LearnService.ts

export class LearnServiceClient {
  // Fetch Content
  static async getCourses(filters) {}
  static async getArticles(filters) {}
  static async getVideos(filters) {}
  
  // Search
  static async search(query, type, filters) {}
  
  // Enrollment
  static async enrollCourse(courseId) {}
  static async getEnrollments() {}
  
  // Progress
  static async updateLessonProgress(lessonId, status) {}
  static async getCourseProgress(courseId) {}
  
  // Quizzes
  static async getQuiz(quizId) {}
  static async submitQuiz(quizId, answers, timeSpent) {}
  
  // Stats
  static async getLearningStats() {}
  static async getBadges() {}
}
```

---

## Phase 5: Seed Initial Data

### Step 6: Create Seed Script

```typescript
// server/seeds/learn-seed.ts

export async function seedLearnContent() {
  // Add 10-20 courses across categories
  // Add 20-30 articles
  // Add 10-15 videos (YouTube links)
  // Create 3-5 learning roadmaps
  // Create badges (completion, streak, achievement, etc.)
  // Create sample quizzes
}
```

**Sample Data:**

**Courses:**
- Modern Irrigation Techniques (Free)
- Organic Pest Management (₹199)
- Soil Testing & Analysis (Free)
- Smart Farming with IoT (₹499)
- Government Subsidies Guide (Free)

**Articles:**
- 5 Signs Your Crop Needs More Water
- Best Crops for Rabi Season 2024
- Government Subsidies for Farmers
- How to Increase Crop Yield by 30%

**Videos:**
- Setting Up Drip Irrigation (YouTube)
- Identifying Common Crop Diseases (YouTube)
- Using Soil Testing Kit at Home (YouTube)
- Tractor Maintenance Guide (YouTube)

**Roadmaps:**
1. "Master Smart Irrigation" (Beginner, 15 hours)
2. "Become an Organic Farming Expert" (Intermediate, 25 hours)
3. "Advanced IoT Farming" (Advanced, 40 hours)

**Badges:**
- "Course Completed" - Complete any course
- "Quiz Master" - Pass 5 quizzes
- "Weekly Learner" - Learn 5 days in a row
- "Irrigation Expert" - Complete all irrigation courses
- "Knowledge Hunter" - Read 10 articles

---

## Phase 6: Frontend Components

### Step 7: Update Learn Page Components

The existing Learn page needs minor updates:

```tsx
// client/pages/Learn.tsx modifications:

// 1. Replace hardcoded data with API calls
useEffect(() => {
  const fetchCourses = async () => {
    const courses = await LearnServiceClient.getCourses({ 
      category: selectedCategory,
      search: searchQuery,
      sort: 'created_at'
    });
    setCourses(courses);
  };
  
  fetchCourses();
}, [selectedCategory, searchQuery]);

// 2. Add loading states
// 3. Add error handling
// 4. Add pagination
// 5. Implement search filtering
```

---

## Phase 7: Payment Integration (Optional for Phase 1)

### Step 8: Payment Gateway Setup

For future implementation, choose one:

**Option A: Razorpay (Indian)**
- Better for Indian market
- Simple API
- UPI support
- Monthly: ₹0 (per transaction fees apply)

**Option B: Stripe**
- International support
- Advanced features
- Monthly: $0 (per transaction fees apply)

Integration steps:
```typescript
// 1. Create purchase order
POST /api/learn/purchases/initiate
{ course_id: "xyz" }

// 2. Handle payment in UI (Razorpay modal)
// 3. Verify payment
POST /api/learn/purchases/verify
{ payment_id, signature, course_id }

// 4. Grant access to course
// 5. Create enrollment record
```

---

## Phase 8: Admin Dashboard (Optional)

### Step 9: Admin Controls

Add admin endpoints for:
- Course management (CRUD)
- Article management
- Video management
- Analytics dashboard
- Badge creation
- User management
- Payment reports

---

## Implementation Timeline

**Week 1:**
- [ ] Run migration SQL (1 hour)
- [ ] Create database layer (2 hours)
- [ ] Create routes (4 hours)

**Week 2:**
- [ ] Create services (4 hours)
- [ ] Seed initial data (2 hours)
- [ ] Create frontend service (2 hours)

**Week 3:**
- [ ] Update Learn page component (4 hours)
- [ ] Add loading/error states (2 hours)
- [ ] Test all features (2 hours)

**Week 4 (Optional):**
- [ ] Add payment integration (4 hours)
- [ ] Build admin dashboard (6 hours)

---

## Key Implementation Details

### 1. Pagination & Performance
```typescript
// Always paginate list endpoints
GET /api/learn/courses?page=1&limit=10

// Use indexes for filtering
- is_published = true
- category = "irrigation"
- level = "beginner"
```

### 2. User Progress Calculation
```typescript
// Progress = completed_lessons / total_lessons * 100
// Update on every lesson completion
// Trigger badge checks
```

### 3. Quiz Scoring Logic
```typescript
// Score = (correct_answers / total_questions) * 100
// Only count MCQ/true-false as auto-scored
// Manual review for short-answer/essay
// Pass if score >= passing_score
```

### 4. Full-Text Search
```typescript
// Uses TSVECTOR in database
// Search across title, description, content
// Case-insensitive
// Supports partial matches
```

### 5. Badge Earning Logic
```typescript
if (user.total_courses_completed === 1) {
  awardBadge(user_id, "first_course_badge");
}

if (user.current_streak_days === 7) {
  awardBadge(user_id, "weekly_learner_badge");
}

// Check after every action: course completion, quiz pass, etc.
```

---

## Security Considerations

1. **Authentication:**
   - All endpoints except public content require JWT
   - Admin endpoints require admin role

2. **Authorization:**
   - Users can only see their own enrollments/progress
   - Only content creators/admins can edit content
   - Payment verification with signature validation

3. **Data Validation:**
   - Sanitize search queries
   - Validate file uploads
   - Rate limit API endpoints

4. **SQL Injection Prevention:**
   - Use parameterized queries (Supabase client handles this)
   - Never concatenate SQL strings

---

## Testing Checklist

- [ ] Course listing filters work
- [ ] Search returns correct results
- [ ] Enrollment creates progress records
- [ ] Quiz submission calculates score correctly
- [ ] Badges awarded on completion
- [ ] Progress percent updates correctly
- [ ] Roadmap milestones track properly
- [ ] User stats reflect actual progress
- [ ] Payment flow works (for paid courses)
- [ ] Admin can manage all content

---

## Monitoring & Maintenance

1. **Monitor Slow Queries:**
   ```sql
   SELECT * FROM pg_stat_statements
   WHERE mean_exec_time > 100; -- queries taking >100ms
   ```

2. **Cache Popular Content:**
   - Cache frequently accessed courses
   - Cache user stats (update every hour)

3. **Regular Backups:**
   - Supabase handles daily backups
   - Export important data weekly

4. **Analytics Tracking:**
   - Track course completion rates
   - Track quiz pass rates
   - Track user engagement

---

This comprehensive schema and implementation guide ensures your Learn page is production-ready, scalable, and feature-complete!
