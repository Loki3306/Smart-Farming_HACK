import React from "react";
import { useTranslation } from "react-i18next";

interface Prediction { class: string; confidence: number }

import { SUPPORTED_DISPLAY_CROPS, MODEL_CROP_MAP } from "@/services/diseaseModelConfig";

interface Prediction { class: string; confidence: number }

interface Props {
  result: any;
  onReset: () => void;
  diseaseInfo?: any;
  diseaseInfoLoading?: boolean;
  diseaseInfoError?: string | null;
}

export default function ResultCard({ result, onReset, diseaseInfo, diseaseInfoLoading, diseaseInfoError }: Props) {
  const { t } = useTranslation("disease");
  if (!result) return null;

  if (result.status === 'unsupported_crop') {
    // Map model crop back to a user-friendly display name if possible
    const modelCrop = result.crop;
    const displayCrop = Object.keys(MODEL_CROP_MAP).find(k => MODEL_CROP_MAP[k] === modelCrop) || modelCrop;

    return (
      <section aria-live="polite" className="rounded border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground">{t("result.unsupportedCrop")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("result.unsupportedDesc")} <strong>{displayCrop}</strong></p>
            <p className="mt-2 text-sm text-muted-foreground">{t("result.supportedCrops")} {SUPPORTED_DISPLAY_CROPS.slice(0, 6).join(', ')}{SUPPORTED_DISPLAY_CROPS.length > 6 ? ', ...' : ''}.</p>
          </div>
          <div>
            <button className="inline-flex items-center rounded bg-gray-200 px-3 py-1 text-sm" onClick={onReset}>{t("result.tryAnotherImage")}</button>
          </div>
        </div>
      </section>
    );
  }

  // Determine top prediction and confidence
  const top = result.top_prediction || (result.predictions && result.predictions[0]) || null;
  const confidence = result.confidence ?? (top?.confidence ?? 0);
  const rawDisease = result.disease ?? (top?.class ? (typeof top.class === 'string' ? top.class.split('___')[1] || top.class : top.class) : null);

  const formatDisease = (s: string) => {
    if (!s) return s;
    // replace underscores with spaces and tidy parentheses
    let out = s.replace(/_/g, " ");
    out = out.replace(/\s*\(\s*/g, " (").replace(/\s*\)\s*/g, ")");
    out = out.replace(/\s+/g, " ").trim();
    return out;
  };

  const diseaseName = rawDisease ? formatDisease(rawDisease) : null;

  // Confidence comes as percentage (0-100) from API, not decimal (0-1)
  const state = confidence >= 85 ? "confident" : (confidence >= 50 ? "uncertain" : "none");
  const percent = Math.round(confidence * 10) / 10; // Round to 1 decimal place
  const color = state === 'confident' ? '#16A34A' : state === 'uncertain' ? '#D97706' : '#DC2626';

  const radius = 36;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <section aria-live="polite" className="rounded-2xl bg-white p-6 shadow-lg">
      <div className="md:flex md:items-start md:gap-6">
        <div className="md:w-1/3 flex items-center gap-4">
          <div className="relative flex items-center">
            <svg height="88" width="88" className="transform -rotate-90">
              <circle
                stroke="#E6F4EA"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx="44"
                cy="44"
              />
              <circle
                stroke={color}
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx="44"
                cy="44"
              />
            </svg>
            <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-sm font-semibold ${state === 'confident' ? 'text-emerald-700' : state === 'uncertain' ? 'text-amber-700' : 'text-red-600'}`}> {percent}%</div>
                <div className="text-xs text-muted-foreground">{t("result.confidenceLabel")}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">{diseaseName || t("result.noDisease")}</h3>
            <div className="mt-2 text-sm text-muted-foreground">{state === 'confident' ? t("result.highConfidence") : state === 'uncertain' ? t("result.reviewSteps") : t("result.lowConfidence")}</div>
            <div className="mt-3">
              <button className="inline-flex items-center rounded bg-gray-100 px-3 py-1 text-sm" onClick={onReset}>{t("result.checkAnotherLeaf")}</button>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 md:flex-1">
          <div className="flex flex-col gap-4">
            {/* Other candidates */}
            {result.predictions && result.predictions.length > 1 && (
              <div className="rounded-lg bg-emerald-50 p-3">
                <div className="text-sm font-medium">{t("result.otherCandidates")}</div>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {result.predictions.map((p: any, i: number) => {
                    const raw = p.class?.includes('___') ? p.class.split('___')[1] : p.class;
                    return <li key={i}>{formatDisease(raw)} — {Math.round((p.confidence * 100) * 10) / 10}%</li>
                  })}
                </ul>
              </div>
            )}

            {/* Disease info */}
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t("result.whatToDo")}</div>
                <div className="text-xs text-muted-foreground">{t("result.source")} {diseaseInfo?.source || 'chatbot'}</div>
              </div>

              {diseaseInfoLoading && <p className="mt-2 text-sm text-muted-foreground">{t("result.fetchingGuidance")}</p>}
              {diseaseInfoError && <p className="mt-2 text-sm text-red-600">{diseaseInfoError}</p>}

              {diseaseInfo && diseaseInfo.parsed && (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {diseaseInfo.data.treatments?.map((t: any, i: number) => (
                    <div key={i} className="rounded-lg border p-3 hover:shadow-md transition-shadow">
                      <div className="font-medium">{t.step}</div>
                      {t.details && <div className="mt-1 text-sm text-muted-foreground">{t.details}</div>}
                    </div>
                  ))}
                </div>
              )}

              {diseaseInfo && diseaseInfo.parsed && (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-muted-foreground">
                  {diseaseInfo.data.symptoms && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="font-medium">{t("result.symptoms")}</div>
                      <ul className="mt-2 list-disc list-inside">
                        {diseaseInfo.data.symptoms.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {diseaseInfo.data.causes && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="font-medium">{t("result.causes")}</div>
                      <ul className="mt-2 list-disc list-inside">
                        {diseaseInfo.data.causes.map((c: string, i: number) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {diseaseInfo.data.precautions && (
                    <div className="rounded-lg bg-gray-50 p-3 md:col-span-2">
                      <div className="font-medium">{t("result.precautions")}</div>
                      <ul className="mt-2 list-disc list-inside">
                        {diseaseInfo.data.precautions.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {diseaseInfo && !diseaseInfo.parsed && diseaseInfo.raw && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-medium text-amber-900 mb-2">{t("result.rawGuidance")}</div>
                      <div className="text-sm text-amber-800 whitespace-pre-wrap break-words leading-relaxed">
                        {diseaseInfo.raw
                          .replace(/^\{|\}$/g, '') // Remove outer braces
                          .replace(/"([^"]+)":/g, '\n$1: ') // Format keys
                          .replace(/","/g, '"\n"') // Add line breaks between items
                          .replace(/\\"/g, '"') // Unescape quotes
                          .replace(/\["/g, '\n  • ') // Format arrays
                          .replace(/","/g, '\n  • ') // Format array items
                          .replace(/"\]/g, '') // Remove array closing
                          .trim()
                        }
                      </div>
                      <div className="mt-2 text-xs text-amber-700">
                        💡 Note: AI model returned unstructured response. Consider using a more advanced model for better results.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!diseaseInfo && !diseaseInfoLoading && !diseaseInfoError && (
                <p className="mt-2 text-sm text-muted-foreground">{t("result.noGuidance")}</p>
              )}

              <div className="mt-4 text-xs text-muted-foreground">{t("result.disclaimer")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
