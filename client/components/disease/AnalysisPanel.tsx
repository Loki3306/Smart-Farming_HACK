import React from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";

interface Props {
  status: "idle" | "analyzing" | "result";
}

export default function AnalysisPanel({ status }: Props) {
  const { t } = useTranslation("disease");

  const steps = [
    { key: 'texture', label: t("analysisPanel.step1") },
    { key: 'patterns', label: t("analysisPanel.step2") },
    { key: 'confidence', label: t("analysisPanel.step3") },
  ];
  return (
    <div className="mt-6">
      <AnimatePresence>
        {status === 'analyzing' ? (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            aria-live="polite"
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">🩺</div>
              <div className="flex-1">
                <div className="font-semibold text-emerald-700">{t("analysisPanel.title")}</div>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {steps.map((s, i) => (
                    <motion.div key={s.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.18 }} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                      <div>{s.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{status === 'idle' ? t("analysisPanel.readyToAnalyze") : t("analysisPanel.analysisComplete")}</div>
              {status === 'result' && <div className="text-xs text-muted-foreground">{t("analysisPanel.aiConfidenceResult")}</div>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
