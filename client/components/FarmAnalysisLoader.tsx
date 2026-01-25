import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";


/**
 * Farmer-friendly analysis stages
 */
// FARMING_STAGES moved to component to use t() function


const MINIMUM_DISPLAY_TIME = 3000; // 3 seconds
const STAGE_INTERVAL = 600; // Change text every 0.6 seconds

interface FarmAnalysisLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
  analysisComplete: boolean;
}

export const FarmAnalysisLoader: React.FC<FarmAnalysisLoaderProps> = ({
  isVisible,
  onComplete,
  analysisComplete,
}) => {
  const { t } = useTranslation("recommendations");

  const FARMING_STAGES = [
    { text: t("loader.stage1"), emoji: "🌾" },
    { text: t("loader.stage2"), emoji: "🌱" },
    { text: t("loader.stage3"), emoji: "🌦️" },
    { text: t("loader.stage4"), emoji: "📊" },
    { text: t("loader.stage5"), emoji: "🤝" },
    { text: t("loader.stage6"), emoji: "✅" },
  ];

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [canExit, setCanExit] = useState(false);

  const stageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minimumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset and start progression when loader becomes visible
  useEffect(() => {
    if (isVisible) {
      setCurrentStageIndex(0);
      setCanExit(false);

      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      if (minimumTimerRef.current) clearTimeout(minimumTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      stageIntervalRef.current = setInterval(() => {
        setCurrentStageIndex((prev) => {
          const next = prev + 1;
          return next % FARMING_STAGES.length;
        });
      }, STAGE_INTERVAL);

      minimumTimerRef.current = setTimeout(() => {
        setCanExit(true);
      }, MINIMUM_DISPLAY_TIME);
    }

    return () => {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      if (minimumTimerRef.current) clearTimeout(minimumTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [isVisible]);

  // Handle exit when both analysis is complete AND minimum time has passed
  useEffect(() => {
    if (analysisComplete && canExit && isVisible && onComplete) {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }

      exitTimerRef.current = setTimeout(() => {
        onComplete();
      }, 600);
    }
  }, [analysisComplete, canExit, isVisible, onComplete]);

  if (!isVisible) return null;

  const currentStage = FARMING_STAGES[currentStageIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-xl p-8 max-w-2xl mx-auto shadow-lg border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("loader.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("loader.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-4">
              {FARMING_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-6 flex justify-center">
                      {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {isCurrent && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                      {!isCompleted && !isCurrent && (
                        <div className="w-2 h-2 rounded-full bg-muted" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{stage.emoji}</span>
                      <span
                        className={`${isCurrent
                          ? "text-primary font-medium"
                          : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                          }`}
                      >
                        {stage.text}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FarmAnalysisLoader;
