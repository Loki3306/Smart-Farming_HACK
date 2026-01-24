import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Leaf,
  Droplets,
  Bug,
  FlaskConical,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Brain,
  RefreshCw,
  Database,
  Activity,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useFarmContext } from "@/context/FarmContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiNotificationService } from "@/services/apiNotificationService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FarmAnalysisLoader } from "@/components/FarmAnalysisLoader";

import { useTranslation } from "react-i18next";

interface Recommendation {
  id: string;
  type: "irrigation" | "fertilizer" | "pest" | "crop" | "general" | "stress_management" | "soil_treatment";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  confidence: number;
  timestamp: string;
  applied?: boolean;
}

export const Recommendations: React.FC = () => {
  const { t, i18n } = useTranslation("recommendations");
  const { sensorData, refreshSensorData } = useFarmContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [farmData, setFarmData] = useState<any>(null);
  const [loadingFarm, setLoadingFarm] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "irrigation": return Droplets;
      case "fertilizer": return FlaskConical;
      case "pest": return Bug;
      case "crop": return Leaf;
      default: return Lightbulb;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "irrigation": return "text-blue-500 bg-blue-100";
      case "fertilizer": return "text-green-500 bg-green-100";
      case "pest": return "text-red-500 bg-red-100";
      case "crop": return "text-amber-500 bg-amber-100";
      case "stress_management": return "text-orange-500 bg-orange-100";
      case "soil_treatment": return "text-teal-500 bg-teal-100";
      default: return "text-purple-500 bg-purple-100";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-muted text-foreground";
    }
  };

  const handleAnalyze = async () => {
    // Get crop_type value and check all conditions
    const cropType = farmData?.crop_type;

    // STRICT CHECK: Block if no crop
    if (!farmData || cropType === null || cropType === undefined || cropType === "" || (typeof cropType === 'string' && cropType.trim() === "")) {
      toast({
        title: "No Crop Configured",
        description: "Please configure your crop type in the Farm settings before getting recommendations.",
        variant: "destructive",
      });
      return;
    }

    console.log('[Recommendations] Starting AI analysis for crop:', cropType);

    if (!sensorData) {
      toast({
        title: "No Sensor Data",
        description: "Unable to fetch sensor data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);

    try {

      // Actual API call
      const requestPayload = {
        farm_id: farmData?.farm_id || "farm_001",
        crop_type: farmData?.crop_type || "Unknown",
        soil_type: farmData?.soil_type || "Clay loam",
        sensor_data: {
          moisture: sensorData.soilMoisture,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          nitrogen: sensorData.npk.nitrogen,
          phosphorus: sensorData.npk.phosphorus,
          potassium: sensorData.npk.potassium,
          ph: sensorData.pH,
          ph: sensorData.pH,
          ec: sensorData.ec,
        },
        language: i18n.language || "en",
      };

      console.log('[Recommendations] 📤 Sending request to AI backend:', requestPayload);
      console.log('[Recommendations] 🌾 CROP TYPE BEING SENT:', requestPayload.crop_type);

      const response = await fetch('/api/recommendations/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Recommendations] ❌ API Error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Recommendations] ✅ Received response from AI backend:', data);
      console.log('[Recommendations] 📊 Number of recommendations:', data.recommendations?.length);

      // Map API response to component state
      const mappedRecommendations = data.recommendations.map((rec: any) => ({
        ...rec,
        id: rec.id || Math.random().toString(36).substr(2, 9), // Ensure ID exists
        timestamp: new Date().toISOString(),
        applied: false
      }));

      setRecommendations(mappedRecommendations);

      // Signal that analysis is complete for the loader
      setAnalysisComplete(true);

      // Send notification about new AI recommendations
      if (user?.id && mappedRecommendations.length > 0) {
        try {
          const highPriorityCount = mappedRecommendations.filter((r: any) => r.priority === 'high').length;
          const message = highPriorityCount > 0
            ? `🤖 ${mappedRecommendations.length} new recommendations (${highPriorityCount} high priority)`
            : `🤖 ${mappedRecommendations.length} new farming recommendations available`;

          const notification = await apiNotificationService.createNotification(
            user.id,
            user.id,
            'recommendation',
            message,
            null,
            null,
            { recommendations: mappedRecommendations }
          );

          console.log('[Recommendations] ✅ Notification created successfully', notification);

          // Force immediate badge update by triggering a custom event
          window.dispatchEvent(new CustomEvent('notification-created', { detail: notification }));
        } catch (error) {
          console.error('[Recommendations] ❌ Failed to create notification:', error);
        }
      }

      toast({
        title: "Analysis Complete",
        description: `Generated ${mappedRecommendations.length} AI-powered recommendations`,
        variant: "default",
      });

    } catch (error) {
      console.error('Failed to get recommendations:', error);
      setAnalysisComplete(true); // Allow loader to exit gracefully
      toast({
        title: "Analysis Failed",
        description: "Failed to connect to AI recommendation service. Please ensure backend is running.",
        variant: "destructive",
      });
    }
  };

  // Callback when loader animation completes its exit sequence
  const handleLoaderComplete = () => {
    setIsAnalyzing(false);
    setAnalysisComplete(false);
  };

  // Load farm data on mount
  useEffect(() => {
    const loadFarmData = async () => {
      const farmId = localStorage.getItem('current_farm_id');

      if (!farmId) {
        console.log('[Recommendations] ⚠️ No farm ID in localStorage');
        setLoadingFarm(false);
        return;
      }

      console.log('[Recommendations] 📡 Fetching farm data for farm ID:', farmId);
      try {
        const response = await fetch(`/api/farms/${farmId}`);
        if (response.ok) {
          const result = await response.json();
          const farm = result.farm;
          console.log('[Recommendations] ✅ Farm data loaded:', {
            crop_type: farm.crop_type,
            soil_type: farm.soil_type,
            farm_id: farm.id,
            full_response: farm
          });

          // Map to the expected structure
          setFarmData({
            farm_id: farm.id,
            crop_type: farm.crop_type,
            soil_type: farm.soil_type,
            farm_name: farm.farm_name
          });
        } else {
          console.error('[Recommendations] ❌ Failed to fetch farm data:', response.status);
        }
      } catch (error) {
        console.error('[Recommendations] ❌ Error loading farm data:', error);
      } finally {
        setLoadingFarm(false);
      }
    };

    loadFarmData();
  }, [user]);

  // Load sensor data on mount
  useEffect(() => {
    if (!sensorData) {
      refreshSensorData();
    }
  }, []);

  // Auto-analyze on component mount if sensor data is available
  useEffect(() => {
    if (sensorData && recommendations.length === 0) {
      // Optional: Uncomment to auto-run on load
      // handleAnalyze();
    }
  }, [sensorData]);

  const handleApply = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, applied: true } : rec
      )
    );
    toast({
      title: "Action Applied",
      description: "The recommendation has been marked as applied.",
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-texture-tech min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4" data-tour-id="reco-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
          {farmData?.crop_type && (
            <div className="mt-2 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Current Crop: {farmData.crop_type}
              </span>
            </div>
          )}
        </div>
        {recommendations.length > 0 && (
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || loadingFarm}
            variant="outline"
            className="gap-2"
            data-tour-id="reco-analyze-btn"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t("refresh")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* 1. Empty State (No Data & Not Analyzing) */}
      {recommendations.length === 0 && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[500px] space-y-6"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" data-tour-id="reco-ai-brain">
            <Brain className="w-16 h-16 text-primary" />
          </div>

          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-3xl font-bold text-foreground">{t("emptyState.title")}</h2>
            <p className="text-muted-foreground text-lg">
              {t("emptyState.description")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl justify-center" data-tour-id="reco-stats">
            <Card className="p-4 text-center flex-1">
              <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{t("emptyState.sensorAnalysis")}</p>
              <p className="text-xs text-muted-foreground">NPK, pH, Moisture</p>
            </Card>
            <Card className="p-4 text-center flex-1">
              <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{t("emptyState.mlProcessing")}</p>
              <p className="text-xs text-muted-foreground">6 AI Models</p>
            </Card>
            <Card className="p-4 text-center flex-1">
              <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{t("emptyState.smartActions")}</p>
              <p className="text-xs text-muted-foreground">High Confidence</p>
            </Card>
          </div>

          <Button
            onClick={handleAnalyze}
            size="lg"
            className="gap-2 px-8 mt-4"
            disabled={!sensorData || !farmData?.crop_type || loadingFarm}
            data-tour-id="reco-analyze-btn"
          >
            <Brain className="w-5 h-5" />
            {t("emptyState.analyzeBtn")}
          </Button>

          {loadingFarm ? (
            <p className="text-sm text-muted-foreground">
              Loading farm data...
            </p>
          ) : !farmData?.crop_type ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-amber-600 font-medium flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                No crop configured
              </p>
              <p className="text-xs text-muted-foreground">
                Please set your crop type in <a href="/farm" className="text-primary underline">Farm Settings</a> before getting recommendations.
              </p>
            </div>
          ) : !sensorData ? (
            <p className="text-sm text-amber-600">
              Waiting for sensor data...
            </p>
          ) : null}
        </motion.div>
      )}

      {/* 2. Farm Analysis Loader (Rive Animation) */}
      <FarmAnalysisLoader
        isVisible={isAnalyzing}
        analysisComplete={analysisComplete}
        onComplete={handleLoaderComplete}
      />

      {/* 3. Results List State */}
      {recommendations.length > 0 && !isAnalyzing && (
        <div className="space-y-4" data-tour-id="reco-list">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your Recommendations</h2>
            <span className="text-sm text-muted-foreground">{recommendations.length} insights found</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recommendations.map((rec, index) => {
              const TypeIcon = getTypeIcon(rec.type);
              const typeColor = getTypeColor(rec.type);

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className={`p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 ${rec.applied ? "opacity-60 border-l-green-500" : "border-l-primary"}`}
                    onClick={() => setSelectedRecommendation(rec)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-foreground">{rec.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(rec.priority)}`}>
                            {t(`priorities.${rec.priority}`, rec.priority.toUpperCase())}
                          </span>
                          {rec.applied && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t("list.applied")}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{rec.description}</p>

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="font-medium">{t("list.confidence")}:</span>
                            <span className="text-muted-foreground">{rec.confidence.toFixed(1)}%</span>
                          </div>

                          <div className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
                            {t("list.viewDetails")}
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Recommendation Detail Modal */}
      <Dialog open={!!selectedRecommendation} onOpenChange={(open) => !open && setSelectedRecommendation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecommendation && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeColor(selectedRecommendation.type)}`}>
                    {React.createElement(getTypeIcon(selectedRecommendation.type), { className: "w-7 h-7" })}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">{selectedRecommendation.title}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(selectedRecommendation.priority)}`}>
                        {t(`priorities.${selectedRecommendation.priority}`, selectedRecommendation.priority.toUpperCase())} {t("detail.priority")}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                        {t(`types.${selectedRecommendation.type}`, selectedRecommendation.type.replace('_', ' ').toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Confidence Score */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t("detail.confidenceScore")}</span>
                    <span className="text-2xl font-bold text-primary">{selectedRecommendation.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedRecommendation.confidence}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-primary h-2 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("detail.confidenceDesc")}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    {t("detail.problemAnalysis")}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">{selectedRecommendation.description}</p>
                </div>

                {/* Recommended Action */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    {t("detail.recommendedAction")}
                  </h4>
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <p className="text-foreground font-medium">{selectedRecommendation.action}</p>
                  </Card>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Generated</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedRecommendation.timestamp).toLocaleString()}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t("detail.model")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">FastAPI ML Engine v1.0</p>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {!selectedRecommendation.applied ? (
                    <Button
                      onClick={() => {
                        handleApply(selectedRecommendation.id);
                        setSelectedRecommendation(null);
                      }}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t("detail.markApplied")}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="flex-1 gap-2 bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-4 h-4" />
                      {t("detail.alreadyApplied")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRecommendation(null)}
                  >
                    {t("detail.close")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};