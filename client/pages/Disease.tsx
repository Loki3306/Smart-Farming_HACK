import React, { useState } from "react";
import { CropSelector } from "@/components/ui/CropSelector";
import { MODEL_CROP_MAP, SUPPORTED_DISPLAY_CROPS } from "@/services/diseaseModelConfig";
import { Card } from "@/components/ui/card";
import ImageUploader from "@/components/disease/ImageUploader";
import AnalysisPanel from "@/components/disease/AnalysisPanel";
import ResultCard from "@/components/disease/ResultCard";
import { predictDisease, getDiseaseInfo } from "@/services/DiseaseService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const Disease: React.FC = () => {
  const { t, i18n } = useTranslation("disease");
  const [crop, setCrop] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "result">("idle");
  const [result, setResult] = useState<any>(null);
  const [diseaseInfo, setDiseaseInfo] = useState<any>(null);
  const [diseaseInfoLoading, setDiseaseInfoLoading] = useState(false);
  const [diseaseInfoError, setDiseaseInfoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isCropSupported = React.useMemo(() => {
    if (!crop) return false;
    return SUPPORTED_DISPLAY_CROPS.some(
      (c) => c.toLowerCase() === crop.toLowerCase()
    );
  }, [crop]);

  const handleAnalyze = async () => {
    if (!crop) return setError(t("errorSelectCrop"));
    if (!file) return setError(t("errorUploadImage"));

    setError(null);
    setStatus("analyzing");

    try {
      const form = new FormData();
      const modelCrop = MODEL_CROP_MAP[crop] ?? crop;
      form.append("crop", modelCrop);
      form.append("image", file);

      const res = await predictDisease(form);
      setResult(res);
      setStatus("result");

      try {
        setDiseaseInfoLoading(true);
        const diseaseName =
          res.disease ||
          res.top_prediction?.class?.split("___")[1] ||
          res.top_prediction?.class;

        const info = await getDiseaseInfo(
          crop,
          diseaseName,
          res.confidence ?? res.top_prediction?.confidence,
          i18n.language || 'en'
        );
        setDiseaseInfo(info);
      } catch (e: any) {
        setDiseaseInfoError(e?.message || "Failed to load disease details");
      } finally {
        setDiseaseInfoLoading(false);
      }
    } catch (err: any) {
      toast({
        title: t("result.analysisFailed", "Analysis failed"),
        description: err?.message || t("result.somethingWrong", "Something went wrong"),
      });
      setStatus("idle");
    }
  };

  const handleReset = () => {
    setCrop("");
    setFile(null);
    setStatus("idle");
    setResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">

      {/* HERO */}
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* WORKSPACE */}
      <Card className="p-8 space-y-8">

        {/* INPUT ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Crop */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("cropLabel")}</label>
            <CropSelector
              value={crop}
              onChange={setCrop}
              disabled={status === "analyzing"}
              options={SUPPORTED_DISPLAY_CROPS}
            />
            {!isCropSupported && crop && (
              <p className="text-xs text-amber-600">
                {t("cropNotSupported")}
              </p>
            )}
          </div>

          {/* Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("leafImageLabel")}</label>
            <ImageUploader
              file={file}
              onFileSelected={setFile}
              disabled={status === "analyzing"}
            />
          </div>
        </div>

        {/* ACTION */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {error || t("helperText")}
          </div>

          <div className="flex items-center gap-4">
            {status !== "idle" && (
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("resetBtn")}
              </button>
            )}

            <button
              onClick={handleAnalyze}
              disabled={
                !crop || !file || !isCropSupported || status === "analyzing"
              }
              className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {status === "analyzing" ? t("analyzingBtn") : t("analyzeBtn")}
            </button>
          </div>
        </div>
      </Card>

      {/* AI PROCESSING */}
      <AnalysisPanel status={status} />

      {/* RESULT */}
      {status === "result" && (
        <ResultCard
          result={result}
          onReset={handleReset}
          diseaseInfo={diseaseInfo}
          diseaseInfoLoading={diseaseInfoLoading}
          diseaseInfoError={diseaseInfoError}
        />
      )}
    </div>
  );
};

export default Disease;
