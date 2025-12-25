import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  ListChecks,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Article structure matching our lesson content
export interface ArticleContent {
  introduction: string;
  sections: {
    title: string;
    content: string;
    tips?: string[];
  }[];
  commonMistakes?: string[];
  actionItems?: string[];
  summary?: string;
}

interface RichArticleViewerProps {
  title: string;
  description?: string;
  article: ArticleContent;
  onComplete?: () => void;
}

export const RichArticleViewer: React.FC<RichArticleViewerProps> = ({
  title,
  description,
  article,
  onComplete,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])); // First section expanded by default
  const [showMistakes, setShowMistakes] = useState(false);
  const [showActionItems, setShowActionItems] = useState(false);
  const [readSections, setReadSections] = useState<Set<number>>(new Set());

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
      // Mark as read when expanded
      setReadSections(prev => new Set(prev).add(index));
    }
    setExpandedSections(newExpanded);
  };

  const readProgress = Math.round((readSections.size / article.sections.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-green-900 mb-2">{title}</h1>
            {description && (
              <p className="text-green-700">{description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <div className="w-32 h-2 bg-green-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${readProgress}%` }}
                />
              </div>
              <span>{readProgress}% read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">Introduction</h3>
            <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">
              {article.introduction}
            </p>
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      <div className="space-y-4">
        {article.sections.map((section, index) => {
          const isExpanded = expandedSections.has(index);
          const isRead = readSections.has(index);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`overflow-hidden transition-colors ${isRead ? 'border-green-200 bg-green-50/30' : ''}`}>
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isRead ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isRead ? '✓' : index + 1}
                    </div>
                    <h3 className="font-semibold text-lg">{section.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="pl-11">
                          <p className="text-foreground leading-relaxed whitespace-pre-wrap mb-4">
                            {section.content}
                          </p>
                          
                          {/* Tips */}
                          {section.tips && section.tips.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                              <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">Pro Tips</span>
                              </div>
                              <ul className="space-y-2">
                                {section.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start gap-2 text-blue-800">
                                    <span className="text-blue-500 mt-1">💡</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Common Mistakes */}
      {article.commonMistakes && article.commonMistakes.length > 0 && (
        <Card className="overflow-hidden border-red-200">
          <button
            onClick={() => setShowMistakes(!showMistakes)}
            className="w-full p-4 flex items-center justify-between text-left bg-red-50 hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900">Common Mistakes to Avoid</h3>
                <p className="text-sm text-red-700">Learn from others' errors</p>
              </div>
            </div>
            {showMistakes ? (
              <ChevronUp className="w-5 h-5 text-red-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-500" />
            )}
          </button>
          
          <AnimatePresence>
            {showMistakes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-card">
                  <ul className="space-y-3">
                    {article.commonMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-red-600">
                          ✗
                        </span>
                        <span className="text-foreground">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Action Items */}
      {article.actionItems && article.actionItems.length > 0 && (
        <Card className="overflow-hidden border-purple-200">
          <button
            onClick={() => setShowActionItems(!showActionItems)}
            className="w-full p-4 flex items-center justify-between text-left bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="font-semibold text-purple-900">Action Items - Do This Week!</h3>
                <p className="text-sm text-purple-700">Practical steps to apply your learning</p>
              </div>
            </div>
            {showActionItems ? (
              <ChevronUp className="w-5 h-5 text-purple-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-500" />
            )}
          </button>
          
          <AnimatePresence>
            {showActionItems && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-card">
                  <ul className="space-y-3">
                    {article.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckSquare className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Summary */}
      {article.summary && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <div className="flex items-start gap-3">
            <ListChecks className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">📝 Key Takeaways</h3>
              <p className="text-green-800 leading-relaxed">
                {article.summary}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Mark Complete Prompt */}
      {readProgress === 100 && onComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-green-600 font-medium mb-3">
            🎉 You've read all sections! Ready to mark this lesson complete?
          </p>
          <Button onClick={onComplete} size="lg" className="bg-green-500 hover:bg-green-600">
            ✅ Mark as Complete
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default RichArticleViewer;
