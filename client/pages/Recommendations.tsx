import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Leaf,
  Droplets,
  Bug,
  FlaskConical,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Brain,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useFarmContext } from "@/context/FarmContext";
import { useToast } from "@/hooks/use-toast";

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
  const { sensorData, refreshSensorData } = useFarmContext();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "irrigation":
        return Droplets;
      case "fertilizer":
        return FlaskConical;
      case "pest":
        return Bug;
      case "crop":
        return Leaf;
      default:
        return Lightbulb;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "irrigation":
        return "text-blue-500 bg-blue-100";
      case "fertilizer":
        return "text-green-500 bg-green-100";
      case "pest":
        return "text-red-500 bg-red-100";
      case "crop":
        return "text-amber-500 bg-amber-100";
      case "stress_management":
        return "text-orange-500 bg-orange-100";
      case "soil_treatment":
        return "text-teal-500 bg-teal-100";
      default:
        return "text-purple-500 bg-purple-100";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleAnalyze = async () => {
    if (!sensorData) {
      toast({
        title: "No Sensor Data",
        description: "Unable to fetch sensor data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/recommendations/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: "farm_001",
          crop_type: "Rice",
          soil_type: "Clay loam",
          sensor_data: {
            moisture: sensorData.soilMoisture,
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            nitrogen: sensorData.npk.nitrogen,
            phosphorus: sensorData.npk.phosphorus,
            potassium: sensorData.npk.potassium,
            ph: sensorData.pH,
            ec: sensorData.ec,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Map API response to component state
      const mappedRecommendations = data.recommendations.map((rec: any) => ({
        ...rec,
        applied: false,
      }));

      setRecommendations(mappedRecommendations);
      
      toast({
        title: "Analysis Complete",
        description: `Generated ${data.recommendations.length} AI-powered recommendations`,
      });
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to connect to AI recommendation service. Please ensure backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load sensor data on mount
  useEffect(() => {
    if (!sensorData) {
      refreshSensorData();
    }
  }, []);

  // Auto-analyze on component mount if sensor data is available
  useEffect(() => {
    if (sensorData && recommendations.length === 0) {
      handleAnalyze();
    }
  }, [sensorData]);

  const handleApply = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, applied: true } : rec
      )
    );
  };

  const pendingCount = recommendations.filter((r) => !r.applied).length;
  const appliedCount = recommendations.filter((r) => r.applied).length;
  const avgConfidence = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Recommendations
          </h1>
          <p className="text-muted-foreground mt-1">
            Smart suggestions based on your farm data and conditions
          </p>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Run AI Analysis
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Actions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{appliedCount}</p>
              <p className="text-sm text-muted-foreground">Applied</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgConfidence}%</p>
              <p className="text-sm text-muted-foreground">Avg. Confidence</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Status Notice */}
      <Card className="p-6 border-l-4 border-l-green-500 bg-green-50">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">✅ AI Model Active</h3>
            <p className="text-sm text-green-700 mt-1">
              Real-time recommendations powered by FastAPI ML engine. The system analyzes your sensor data 
              (NPK levels, moisture, pH, temperature) and generates intelligent farming recommendations with 
              confidence scores. Click "Run AI Analysis" to get fresh predictions based on current conditions.
            </p>
            <div className="mt-3 flex gap-2">
              <code className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                Python FastAPI Backend
              </code>
              <code className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                Express Proxy Active
              </code>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Active Recommendations</h2>
        
        {recommendations.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Run AI Analysis" to generate recommendations based on your current farm conditions.
            </p>
          </Card>
        ) : (
          recommendations.map((rec, index) => {
          const TypeIcon = getTypeIcon(rec.type);
          const typeColor = getTypeColor(rec.type);
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`p-6 ${rec.applied ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-foreground">{rec.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      {rec.applied && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Applied
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        <span className="font-medium">Action:</span>
                        <span className="text-muted-foreground">{rec.action}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-medium">Confidence:</span>
                        <span className="text-muted-foreground">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {!rec.applied && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApply(rec.id)}
                      className="flex-shrink-0"
                    >
                      Mark Applied
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })
        )}
      </div>
    </div>
  );
};
