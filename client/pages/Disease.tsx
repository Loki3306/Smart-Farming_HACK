import React, { useState } from "react";
import { CropSelector } from "@/components/ui/CropSelector";
import { MODEL_CROP_MAP, SUPPORTED_DISPLAY_CROPS } from "@/services/diseaseModelConfig";
import { Card } from "@/components/ui/card";
import ImageUploader from "@/components/disease/ImageUploader";
import AnalysisPanel from "@/components/disease/AnalysisPanel";
import ResultCard from "@/components/disease/ResultCard";
import { predictDisease, getDiseaseInfo } from "@/services/DiseaseService";
import { useToast } from "@/hooks/use-toast";

export const Disease: React.FC = () => {
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
    if (!crop) return setError("Select a crop to continue.");
    if (!file) return setError("Upload a clear leaf image.");

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
          res.confidence ?? res.top_prediction?.confidence
        );
        setDiseaseInfo(info);
      } catch (e: any) {
        setDiseaseInfoError(e?.message || "Failed to load disease details");
      } finally {
        setDiseaseInfoLoading(false);
      }
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err?.message || "Something went wrong",
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
          AI Crop Disease Diagnosis
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Upload a leaf image and let our AI analyze visible disease symptoms.
          Results include confidence levels and actionable treatment guidance.
        </p>
      </div>

      {/* WORKSPACE */}
      <Card className="p-8 space-y-8">

        {/* INPUT ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Crop */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Crop</label>
            <CropSelector
              value={crop}
              onChange={setCrop}
              disabled={status === "analyzing"}
              options={SUPPORTED_DISPLAY_CROPS}
            />
            {!isCropSupported && crop && (
              <p className="text-xs text-amber-600">
                This crop is not supported by the current model.
              </p>
            )}
          </div>

          {/* Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Leaf image</label>
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
            {error || "Ensure the leaf is clearly visible and well-lit."}
          </div>

          <div className="flex items-center gap-4">
            {status !== "idle" && (
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}

            <button
              onClick={handleAnalyze}
              disabled={
                !crop || !file || !isCropSupported || status === "analyzing"
              }
              className="rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {status === "analyzing" ? "Analyzing…" : "Analyze leaf"}
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
