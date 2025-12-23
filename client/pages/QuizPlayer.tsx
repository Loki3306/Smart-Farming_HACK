import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Timer,
  Trophy,
  Target,
  Loader2,
  Award,
  Sparkles,
  HelpCircle,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getQuizById,
  startQuizAttempt,
  submitQuizAnswers,
  getQuizAttempts,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  QuizSubmitResponse,
  QuizAttempt,
} from '@/services/LearnService';

export default function QuizPlayer() {
  const { quizId, lessonId } = useParams<{ quizId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [results, setResults] = useState<QuizSubmitResponse | null>(null);
  const [startTime] = useState(Date.now());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Get course info from location state
  const courseId = location.state?.courseId;
  const courseTitle = location.state?.courseTitle;

  // Load quiz data
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch quiz
        const quizResponse = await getQuizById(quizId);
        if (!quizResponse.success || !quizResponse.data) {
          throw new Error('Failed to load quiz');
        }

        setQuiz(quizResponse.data);
        setQuestions(quizResponse.data.questions || []);

        // Check for previous attempts
        const attemptsResponse = await getQuizAttempts(quizId);
        if (attemptsResponse.data?.attempts_remaining === 0) {
          setError('You have reached the maximum number of attempts for this quiz.');
          return;
        }

        // Start new attempt
        const startResponse = await startQuizAttempt(quizId);
        if (!startResponse.success || !startResponse.data) {
          throw new Error('Failed to start quiz attempt');
        }

        setAttempt(startResponse.data.attempt);

        // Set timer if there's a time limit
        if (startResponse.data.time_limit_minutes) {
          setTimeRemaining(startResponse.data.time_limit_minutes * 60);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || results) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        const newTime = prev - 1;

        // Show warning at 2 minutes
        if (newTime === 120 && !showTimeWarning) {
          setShowTimeWarning(true);
        }

        // Auto-submit at 0
        if (newTime <= 0) {
          handleSubmit(true);
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, results]);

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Answer handling
  const handleAnswer = useCallback((questionId: string, answer: QuizAnswer) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }, []);

  // Flag question
  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Submit quiz
  const handleSubmit = async (autoSubmit: boolean = false) => {
    if (!quiz || !attempt) return;

    if (!autoSubmit) {
      // Check if all questions answered
      const unanswered = questions.filter((q) => !answers.has(q.id));
      if (unanswered.length > 0) {
        setShowConfirmSubmit(true);
        return;
      }
    }

    setShowConfirmSubmit(false);
    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const answerArray: QuizAnswer[] = Array.from(answers.values());

      const response = await submitQuizAnswers(quiz.id, attempt.id, answerArray, timeSpent);

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        throw new Error('Failed to submit quiz');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const answeredCount = answers.size;
  const progress = (answeredCount / questions.length) * 100;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load Quiz</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <div className="max-w-3xl mx-auto py-8">
          {/* Results Header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            {results.passed ? (
              <>
                <div className="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-green-700 mb-2">
                  🎉 Congratulations!
                </h1>
                <p className="text-gray-600">You passed the quiz!</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-12 h-12 text-orange-600" />
                </div>
                <h1 className="text-3xl font-bold text-orange-700 mb-2">
                  Keep Learning!
                </h1>
                <p className="text-gray-600">You need {results.passing_score}% to pass. Try again!</p>
              </>
            )}
          </motion.div>

          {/* Score Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{results.percentage}%</div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {results.results.filter((r) => r.is_correct).length}
                  </div>
                  <div className="text-sm text-gray-500">Correct</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">
                    {results.results.filter((r) => !r.is_correct).length}
                  </div>
                  <div className="text-sm text-gray-500">Wrong</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {results.score}/{results.max_score}
                  </div>
                  <div className="text-sm text-gray-500">Points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Earned */}
          {results.badges_earned.length > 0 && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">Badges Earned!</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.badges_earned.map((badge) => (
                    <Badge key={badge} variant="secondary" className="bg-yellow-100">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {badge.replace(/-/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Review */}
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.results.map((result, idx) => (
                <div
                  key={result.question_id}
                  className={`p-4 rounded-lg border ${
                    result.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        Q{idx + 1}: {result.question_text}
                      </p>
                      {result.correct_option && !result.is_correct && (
                        <p className="text-sm text-green-700">
                          ✓ Correct answer: {result.correct_option.option_text}
                        </p>
                      )}
                      {result.explanation && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          💡 {result.explanation}
                        </p>
                      )}
                    </div>
                    <Badge variant={result.is_correct ? 'default' : 'destructive'}>
                      {result.points_earned}/{result.max_points}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/learn/courses/${courseId}`)}
            >
              Back to Course
            </Button>
            {!results.passed && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Player View
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-gray-900 truncate max-w-[200px] md:max-w-none">
                  {quiz?.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            {/* Timer */}
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  timeRemaining <= 120
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="mb-6">
                <CardContent className="pt-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {currentQuestion.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {currentQuestion.question_text}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={flaggedQuestions.has(currentQuestion.id) ? 'text-orange-500' : ''}
                    >
                      <Flag className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Question Image */}
                  {currentQuestion.question_image_url && (
                    <img
                      src={currentQuestion.question_image_url}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg mb-6"
                    />
                  )}

                  {/* Options */}
                  {(currentQuestion.question_type === 'multiple_choice' ||
                    currentQuestion.question_type === 'true_false') && (
                    <RadioGroup
                      value={answers.get(currentQuestion.id)?.selected_option_id || ''}
                      onValueChange={(value) =>
                        handleAnswer(currentQuestion.id, {
                          question_id: currentQuestion.id,
                          selected_option_id: value,
                        })
                      }
                      className="space-y-3"
                    >
                      {currentQuestion.options?.map((option, idx) => (
                        <Label
                          key={option.id}
                          htmlFor={option.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                            answers.get(currentQuestion.id)?.selected_option_id === option.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <span className="flex-1">{option.option_text}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}

                  {/* Short Answer */}
                  {currentQuestion.question_type === 'short_answer' && (
                    <Input
                      placeholder="Type your answer here..."
                      value={answers.get(currentQuestion.id)?.user_answer || ''}
                      onChange={(e) =>
                        handleAnswer(currentQuestion.id, {
                          question_id: currentQuestion.id,
                          user_answer: e.target.value,
                        })
                      }
                      className="text-lg p-4"
                    />
                  )}

                  {/* Hint */}
                  {currentQuestion.hint && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">{currentQuestion.hint}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              className="bg-green-600 hover:bg-green-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Question Navigator */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers.has(q.id);
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all relative ${
                      isCurrent
                        ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded" />
                Answered
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded" />
                Not Answered
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                Flagged
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Submit Dialog */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {questions.length - answeredCount} unanswered question(s). 
              Are you sure you want to submit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(true)}>
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Warning Dialog */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <Timer className="w-5 h-5" />
              Time Running Out!
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have less than 2 minutes remaining. The quiz will be automatically 
              submitted when time runs out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTimeWarning(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
