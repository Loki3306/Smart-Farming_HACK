import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CropSelector } from "@/components/ui/CropSelector";
import { SUPPORTED_DISPLAY_CROPS } from "@/services/diseaseModelConfig";
import { Card } from "@/components/ui/card";
import ImageUploader from "@/components/disease/ImageUploader";
import { analyzeStress, type StressAnalysisResult } from "@/services/StressService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Droplets,
  Leaf,
  Bug,
  Activity,
  Sparkles,
  Zap,
  TrendingUp,
  Eye,
  Satellite,
  Clock,
  MapPin,
  AlertCircle,
  Camera
} from "lucide-react";

export const StressDetection: React.FC = () => {
  const [crop, setCrop] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "result">("idle");
  const [result, setResult] = useState<StressAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!crop) return setError("Please select a crop");
    if (!file) return setError("Please upload an image");

    setError(null);
    setStatus("analyzing");

    try {
      const form = new FormData();
      form.append("crop", crop);
      form.append("image", file);
      form.append("latitude", "0");
      form.append("longitude", "0");

      const res = await analyzeStress(form);
      setResult(res);
      setStatus("result");

      toast({
        title: "✨ Analysis Complete",
        description: `Detected ${res.stressTypes.length} stress indicators`,
      });
    } catch (err: any) {
      toast({
        title: "Analysis Failed",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
      setStatus("idle");
      setError(err?.message);
    }
  };

  const handleReset = () => {
    setCrop("");
    setFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setResult(null);
    setError(null);
  };

  const getSeverityConfig = (severity: string) => {
    const configs = {
      healthy: {
        color: "emerald",
        gradient: "from-emerald-500 to-green-600",
        icon: CheckCircle,
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        glow: "shadow-emerald-500/20"
      },
      moderate: {
        color: "yellow",
        gradient: "from-yellow-500 to-amber-600",
        icon: AlertCircle,
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        glow: "shadow-yellow-500/20"
      },
      stressed: {
        color: "orange",
        gradient: "from-orange-500 to-red-600",
        icon: AlertTriangle,
        badge: "bg-orange-100 text-orange-700 border-orange-200",
        glow: "shadow-orange-500/20"
      },
      critical: {
        color: "red",
        gradient: "from-red-500 to-rose-700",
        icon: AlertTriangle,
        badge: "bg-red-100 text-red-700 border-red-200",
        glow: "shadow-red-500/20"
      },
      unknown: {
        color: "gray",
        gradient: "from-gray-500 to-slate-600",
        icon: Activity,
        badge: "bg-gray-100 text-gray-700 border-gray-200",
        glow: "shadow-gray-500/20"
      }
    };
    return configs[severity as keyof typeof configs] || configs.unknown;
  };

  const getStressIcon = (stressType: string) => {
    const lower = stressType.toLowerCase();
    if (lower.includes("water") || lower.includes("moisture")) return Droplets;
    if (lower.includes("nutrient") || lower.includes("nitrogen") || lower.includes("deficiency")) return Leaf;
    if (lower.includes("pest") || lower.includes("insect")) return Bug;
    if (lower.includes("satellite")) return Satellite;
    return AlertTriangle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50 pb-20">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                AI Crop Stress Detection
              </h1>
              <p className="text-emerald-100 text-sm sm:text-lg mt-1 sm:mt-2">
                Powered by Satellite Imaging & Deep Learning
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <Satellite className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>NDVI Analysis</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>90%+ Accuracy</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Real-time Results</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 -mt-4 sm:-mt-8">
        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 sm:p-6 md:p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Left: Form */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block flex items-center gap-2">
                    <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Select Your Crop
                  </label>
                  <CropSelector
                    value={crop}
                    onChange={setCrop}
                    disabled={status === "analyzing"}
                    options={SUPPORTED_DISPLAY_CROPS}
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 block flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                    Upload Plant Image
                  </label>
                  <ImageUploader
                    file={file}
                    onFileSelected={handleFileChange}
                    disabled={status === "analyzing"}
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2 flex items-center gap-1">
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Clear image of leaves works best • Max 10MB
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  {status !== "idle" && (
                    <button
                      onClick={handleReset}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 border-2 border-gray-300 hover:border-gray-400 transition-all"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={!crop || !file || status === "analyzing"}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:scale-100"
                  >
                    {status === "analyzing" ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm sm:text-base">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Detect Stress</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="flex items-center justify-center order-first lg:order-last">
                {previewUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full max-w-xs sm:max-w-sm lg:max-w-none aspect-square rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white"
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {status === "analyzing" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-green-600/90 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center text-white px-4">
                          <div className="w-10 h-10 sm:w-16 sm:h-16 border-3 sm:border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-4" />
                          <p className="text-sm sm:text-lg font-semibold">Analyzing Plant Health...</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full max-w-xs sm:max-w-sm lg:max-w-none aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-400 px-4">
                      <Eye className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm font-medium">Image preview will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Analyzing Animation */}
        <AnimatePresence>
          {status === "analyzing" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-green-600">
                  <motion.div
                    className="h-full bg-white/50"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>

                <div className="flex items-start sm:items-center gap-3 sm:gap-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="flex-shrink-0"
                  >
                    <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-600" />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-emerald-900 mb-1.5 sm:mb-2">AI Analysis in Progress</h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      {["Processing image data", "Checking satellite NDVI", "Detecting stress indicators", "Generating recommendations"].map((step, i) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.3 }}
                          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-emerald-700"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {status === "result" && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Overall Status */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                {(() => {
                  const config = getSeverityConfig(result.severity);
                  const Icon = config.icon;
                  return (
                    <Card className={`relative overflow-hidden border-0 shadow-2xl ${config.glow}`}>
                      <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-10`}></div>
                      <div className="relative p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-6">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${config.gradient} flex-shrink-0`}
                            >
                              <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                            </motion.div>
                            <div>
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold capitalize mb-1 sm:mb-2">{result.severity} Status</h3>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <span className="flex items-center gap-1 sm:gap-2">
                                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Confidence: {result.analysis.image.confidence}%
                                </span>
                                <span className="flex items-center gap-1 sm:gap-2">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                  {new Date(result.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={`px-3 sm:px-6 py-1.5 sm:py-3 rounded-full ${config.badge} border-2 font-semibold text-xs sm:text-base`}>
                            {result.analysis.image.isHealthy ? "✓ Healthy" : "⚠ Attention Needed"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </motion.div>

              {/* Stress Types Grid */}
              {result.stressTypes.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-4 sm:p-6 border-0 shadow-xl">
                    <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      Detected Stress Factors
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      {result.stressTypes.map((stressType, index) => {
                        const Icon = getStressIcon(stressType);
                        return (
                          <motion.div
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 hover:shadow-lg transition-all"
                          >
                            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg sm:rounded-xl flex-shrink-0">
                              <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                            </div>
                            <span className="font-semibold text-orange-900 text-sm sm:text-base">{stressType}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Detailed Analysis */}
              {result.analysis.image.diseases.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-4 sm:p-6 border-0 shadow-xl">
                    <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      Detailed AI Analysis
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {result.analysis.image.diseases.map((disease, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-lg transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-lg font-bold text-gray-900 break-words">{disease.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 capitalize mt-0.5 sm:mt-1">
                                Type: {disease.type.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <div className="px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-blue-100 border-2 border-blue-300 self-start flex-shrink-0">
                              <span className="text-xs sm:text-sm font-bold text-blue-700">{disease.probability}%</span>
                            </div>
                          </div>

                          {disease.treatment.length > 0 && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/50 rounded-lg">
                              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                                Recommended Treatment:
                              </p>
                              <ul className="space-y-1.5 sm:space-y-2">
                                {disease.treatment.map((treatment, i) => (
                                  <li key={i} className="text-xs sm:text-sm text-gray-600 flex items-start gap-1.5 sm:gap-2">
                                    <span className="text-green-600 font-bold">•</span>
                                    <span>{treatment}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Satellite Data */}
              {result.analysis.satellite && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-0 shadow-xl">
                    <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                      <Satellite className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      Satellite Vegetation Analysis
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                      <div className="text-center p-2 sm:p-4 md:p-6 bg-white/60 rounded-lg sm:rounded-xl border-2 border-purple-200">
                        <p className="text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">NDVI Index</p>
                        <p className="text-lg sm:text-2xl md:text-4xl font-bold text-purple-600">{result.analysis.satellite.ndvi}</p>
                        <p className="text-[9px] sm:text-xs text-gray-500 mt-1 sm:mt-2 truncate">{result.analysis.satellite.health}</p>
                      </div>
                      <div className="text-center p-2 sm:p-4 md:p-6 bg-white/60 rounded-lg sm:rounded-xl border-2 border-purple-200">
                        <p className="text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">Health Status</p>
                        <p className="text-sm sm:text-xl md:text-2xl font-bold text-purple-600 capitalize">{result.analysis.satellite.severity}</p>
                      </div>
                      <div className="text-center p-2 sm:p-4 md:p-6 bg-white/60 rounded-lg sm:rounded-xl border-2 border-purple-200">
                        <p className="text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">Last Updated</p>
                        <p className="text-xs sm:text-base md:text-lg font-bold text-purple-600">
                          {new Date(result.analysis.satellite.lastUpdated).toLocaleDateString()}
                        </p>
                        <p className="text-[9px] sm:text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">Sentinel-2 Satellite</p>
                      </div>
                    </div>

                    {result.analysis.satellite.stress.length > 0 && (
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/60 rounded-lg sm:rounded-xl border-2 border-purple-200">
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                          Satellite Observations:
                        </p>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {result.analysis.satellite.stress.map((stress, i) => (
                            <li key={i} className="text-xs sm:text-sm text-gray-600 flex items-start gap-1.5 sm:gap-2">
                              <span className="text-purple-600">•</span>
                              <span>{stress}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-0 shadow-xl">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg sm:rounded-xl">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <span>Action Plan & Recommendations</span>
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border-2 border-green-200 hover:shadow-md transition-all"
                        >
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-xs sm:text-base">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 flex-1 pt-0.5 sm:pt-1 text-sm sm:text-base">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Analyze Another */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleReset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 sm:py-4 text-center rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 font-medium transition-all text-sm sm:text-base"
              >
                🔄 Analyze Another Image
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StressDetection;
