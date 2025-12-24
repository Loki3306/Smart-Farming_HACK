import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Target,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

interface QuizPlayerProps {
  title: string;
  description?: string;
  quiz: QuizData;
  passingScore?: number; // Percentage
  onComplete?: (score: number, passed: boolean) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  title,
  description,
  quiz,
  passingScore = 60,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Timer
  useEffect(() => {
    if (showResults) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setHasAnswered(true);
    
    // Save answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      // Show results
      calculateResults();
    }
  };

  const calculateResults = () => {
    const correctCount = answers.reduce((count, answer, index) => {
      return count + (answer === quiz.questions[index].correctIndex ? 1 : 0);
    }, 0);
    const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);
    
    setShowResults(true);
    
    // Celebrate if passed
    if (scorePercent >= passingScore) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b'],
      });
    }
    
    onComplete?.(scorePercent, scorePercent >= passingScore);
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setAnswers(Array(quiz.questions.length).fill(null));
    setShowResults(false);
  };

  const getScore = () => {
    const correctCount = answers.filter((answer, index) => 
      answer === quiz.questions[index].correctIndex
    ).length;
    return {
      correct: correctCount,
      total: quiz.questions.length,
      percent: Math.round((correctCount / quiz.questions.length) * 100),
    };
  };

  // Results Screen
  if (showResults) {
    const score = getScore();
    const passed = score.percent >= passingScore;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card className={`p-8 ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
          <div className="text-center">
            {/* Result Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-6"
            >
              {passed ? (
                <div className="w-24 h-24 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto rounded-full bg-orange-500 flex items-center justify-center">
                  <Target className="w-12 h-12 text-white" />
                </div>
              )}
            </motion.div>

            {/* Title */}
            <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-800' : 'text-orange-800'}`}>
              {passed ? '🎉 Excellent Work!' : '💪 Keep Learning!'}
            </h2>
            <p className={`mb-6 ${passed ? 'text-green-700' : 'text-orange-700'}`}>
              {passed 
                ? "You've demonstrated great understanding of the material!"
                : `You need ${passingScore}% to pass. Review the lesson and try again!`}
            </p>

            {/* Score Display */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <div className="text-5xl font-bold mb-2" style={{ color: passed ? '#22c55e' : '#f97316' }}>
                {score.percent}%
              </div>
              <p className="text-gray-600">
                {score.correct} out of {score.total} correct
              </p>
              <p className="text-sm text-gray-500 mt-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Time: {formatTime(elapsedTime)}
              </p>
            </div>

            {/* Question Review */}
            <div className="mb-6 text-left">
              <h3 className="font-semibold text-gray-700 mb-3">Question Review:</h3>
              <div className="space-y-2">
                {quiz.questions.map((q, index) => {
                  const wasCorrect = answers[index] === q.correctIndex;
                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        wasCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {wasCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">
                        Q{index + 1}: {q.question.substring(0, 50)}...
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!passed && (
                <Button onClick={handleRetry} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button 
                onClick={() => onComplete?.(score.percent, passed)}
                size="lg"
                className={passed ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                {passed ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Continue
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Review Lesson
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Question Screen
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-500 mt-1">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === currentQuestion.correctIndex;
                
                let optionStyle = 'border-gray-200 hover:border-primary hover:bg-primary/5';
                if (hasAnswered) {
                  if (isCorrectOption) {
                    optionStyle = 'border-green-500 bg-green-50';
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = 'border-red-500 bg-red-50';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-primary bg-primary/10';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={hasAnswered}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${optionStyle} ${
                      !hasAnswered ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        hasAnswered && isCorrectOption
                          ? 'bg-green-500 text-white'
                          : hasAnswered && isSelected && !isCorrectOption
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {hasAnswered && isCorrectOption ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : hasAnswered && isSelected && !isCorrectOption ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index) // A, B, C, D
                        )}
                      </div>
                      <span className="text-gray-700">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Explanation (shown after answering) */}
          <AnimatePresence>
            {hasAnswered && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className={`p-4 mb-6 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isCorrect ? 'text-green-600' : 'text-blue-600'}`} />
                    <div>
                      <h4 className={`font-semibold mb-1 ${isCorrect ? 'text-green-800' : 'text-blue-800'}`}>
                        {isCorrect ? '✓ Correct!' : 'Explanation'}
                      </h4>
                      <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-blue-700'}`}>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!hasAnswered}
          size="lg"
        >
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <>
              Next Question
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              See Results
              <Trophy className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuizPlayer;
