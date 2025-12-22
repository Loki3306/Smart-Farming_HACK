import React, { useState } from "react";
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

interface Recommendation {
  id: string;
  type: "irrigation" | "fertilizer" | "pest" | "crop" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  confidence: number;
  timestamp: Date;
  applied: boolean;
}

export const Recommendations: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "1",
      type: "irrigation",
      priority: "high",
      title: "Reduce Irrigation Frequency",
      description: "Based on current soil moisture levels (45%) and weather forecast showing rain in 3 days, reducing irrigation will prevent waterlogging and save water.",
      action: "Reduce irrigation by 30% for the next 3 days",
      confidence: 92,
      timestamp: new Date(),
      applied: false,
    },
    {
      id: "2",
      type: "fertilizer",
      priority: "medium",
      title: "Apply Nitrogen Fertilizer",
      description: "Soil nitrogen levels are below optimal (42 kg/ha). Current crop stage requires higher nitrogen for healthy leaf development.",
      action: "Apply 25 kg/ha of Urea within this week",
      confidence: 87,
      timestamp: new Date(Date.now() - 3600000),
      applied: false,
    },
    {
      id: "3",
      type: "pest",
      priority: "high",
      title: "Pest Alert: Aphid Risk",
      description: "Weather conditions (warm, humid) are favorable for aphid infestation. Early intervention recommended to prevent crop damage.",
      action: "Apply neem-based pesticide as preventive measure",
      confidence: 78,
      timestamp: new Date(Date.now() - 7200000),
      applied: true,
    },
    {
      id: "4",
      type: "crop",
      priority: "low",
      title: "Consider Crop Rotation",
      description: "Continuous cultivation of the same crop may deplete specific soil nutrients. Consider rotating with legumes next season.",
      action: "Plan for pulses or legumes in Rabi season",
      confidence: 85,
      timestamp: new Date(Date.now() - 86400000),
      applied: false,
    },
    {
      id: "5",
      type: "general",
      priority: "medium",
      title: "Optimal Harvesting Window",
      description: "Based on crop maturity indicators and weather forecast, the optimal harvesting window is approaching.",
      action: "Prepare for harvest in 2-3 weeks",
      confidence: 90,
      timestamp: new Date(Date.now() - 172800000),
      applied: false,
    },
  ]);

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

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleApply = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, applied: true } : rec
      )
    );
  };

  const pendingCount = recommendations.filter((r) => !r.applied).length;
  const appliedCount = recommendations.filter((r) => r.applied).length;

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
              <p className="text-2xl font-bold">87%</p>
              <p className="text-sm text-muted-foreground">Avg. Confidence</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integration Notice */}
      <Card className="p-6 border-l-4 border-l-purple-500 bg-purple-50">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-purple-900">AI Model Integration Ready</h3>
            <p className="text-sm text-purple-700 mt-1">
              This page is prepared for your custom ML model integration. The recommendation engine 
              can accept predictions from your trained model via API endpoint. Current recommendations 
              are rule-based placeholders that will be replaced with your model's outputs.
            </p>
            <div className="mt-3 flex gap-2">
              <code className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                POST /api/recommendations/predict
              </code>
              <code className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                GET /api/recommendations/latest
              </code>
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Active Recommendations</h2>
        
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
        })}
      </div>
    </div>
  );
};
