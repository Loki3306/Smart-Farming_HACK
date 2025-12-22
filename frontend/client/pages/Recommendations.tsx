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
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useFarmContext } from "@/context/FarmContext";

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

interface FertilizerRecommendation {
  fertilizer_name: string;
  confidence: number;
  alternatives?: { name: string; confidence: number }[];
  npk_requirements: {
    nitrogen: number;
    phosphorous: number;
    potassium: number;
    total: number;
  };
  application_rate_kg_per_hectare: number;
  timing: any;
  conditions: {
    temperature: number;
    humidity: number;
    moisture: number;
    soil_type: string;
    crop_type: string;
  };
}

export const Recommendations: React.FC = () => {
  const { sensorData, weatherData } = useFarmContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFertilizerForm, setShowFertilizerForm] = useState(false);
  const [fertilizerLoading, setFertilizerLoading] = useState(false);
  const [fertilizerResult, setFertilizerResult] = useState<FertilizerRecommendation | null>(null);
  
  // Fertilizer form state
  const [fertilizerForm, setFertilizerForm] = useState({
    temperature: weatherData?.temperature || 25,
    humidity: weatherData?.humidity || 60,
    moisture: sensorData?.soilMoisture || 45,
    soil_type: "Loamy",
    crop_type: "Wheat",
    current_nitrogen: 15,
    current_phosphorous: 10,
    current_potassium: 120,
  });

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
  ]);

  const handleGetFertilizerRecommendation = async () => {
    setFertilizerLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/fertilizer/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fertilizerForm),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendation');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setFertilizerResult(result.data);
        
        // Add to recommendations list
        const newRec: Recommendation = {
          id: Date.now().toString(),
          type: "fertilizer",
          priority: "medium",
          title: `Apply ${result.data.fertilizer_name}`,
          description: `AI recommends ${result.data.fertilizer_name} for your ${fertilizerForm.crop_type} crop.`,
          action: `${result.data.application_rate_kg_per_hectare} kg/hectare - NPK: ${result.data.npk_requirements.nitrogen}-${result.data.npk_requirements.phosphorous}-${result.data.npk_requirements.potassium}`,
          confidence: Math.round(result.data.confidence * 100),
          timestamp: new Date(),
          applied: false,
        };
        
        setRecommendations(prev => [newRec, ...prev]);
      }
    } catch (error) {
      console.error('Error getting fertilizer recommendation:', error);
      alert('Failed to get recommendation. Make sure the backend is running on port 8000.');
    } finally {
      setFertilizerLoading(false);
    }
  };

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
      <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 text-purple-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-2">AI-Powered Fertilizer Recommendations</h3>
            <p className="text-sm text-purple-700 mb-4">
              Get intelligent fertilizer recommendations powered by machine learning. Our ML model analyzes 
              soil conditions, weather, and crop requirements to suggest optimal fertilizer types and quantities.
            </p>
            <Button 
              onClick={() => setShowFertilizerForm(!showFertilizerForm)}
              variant="outline"
              className="border-purple-300 hover:bg-purple-100"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              {showFertilizerForm ? 'Hide' : 'Get AI Recommendation'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Fertilizer ML Form */}
      {showFertilizerForm && (
        <Card className="p-6 border-2 border-primary">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Fertilizer Recommendation Form
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                value={fertilizerForm.temperature}
                onChange={(e) => setFertilizerForm({...fertilizerForm, temperature: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="humidity">Humidity (%)</Label>
              <Input
                id="humidity"
                type="number"
                value={fertilizerForm.humidity}
                onChange={(e) => setFertilizerForm({...fertilizerForm, humidity: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="moisture">Soil Moisture (%)</Label>
              <Input
                id="moisture"
                type="number"
                value={fertilizerForm.moisture}
                onChange={(e) => setFertilizerForm({...fertilizerForm, moisture: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="soil_type">Soil Type</Label>
              <Select 
                value={fertilizerForm.soil_type} 
                onValueChange={(value) => setFertilizerForm({...fertilizerForm, soil_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sandy">Sandy</SelectItem>
                  <SelectItem value="Loamy">Loamy</SelectItem>
                  <SelectItem value="Black">Black</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                  <SelectItem value="Clayey">Clayey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="crop_type">Crop Type</Label>
              <Select 
                value={fertilizerForm.crop_type} 
                onValueChange={(value) => setFertilizerForm({...fertilizerForm, crop_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wheat">Wheat</SelectItem>
                  <SelectItem value="Rice">Rice</SelectItem>
                  <SelectItem value="Maize">Maize</SelectItem>
                  <SelectItem value="Cotton">Cotton</SelectItem>
                  <SelectItem value="Sugarcane">Sugarcane</SelectItem>
                  <SelectItem value="Barley">Barley</SelectItem>
                  <SelectItem value="Millets">Millets</SelectItem>
                  <SelectItem value="Pulses">Pulses</SelectItem>
                  <SelectItem value="Oilseeds">Oilseeds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="nitrogen">Current Nitrogen (kg/ha)</Label>
              <Input
                id="nitrogen"
                type="number"
                value={fertilizerForm.current_nitrogen}
                onChange={(e) => setFertilizerForm({...fertilizerForm, current_nitrogen: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="phosphorous">Current Phosphorous (kg/ha)</Label>
              <Input
                id="phosphorous"
                type="number"
                value={fertilizerForm.current_phosphorous}
                onChange={(e) => setFertilizerForm({...fertilizerForm, current_phosphorous: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="potassium">Current Potassium (kg/ha)</Label>
              <Input
                id="potassium"
                type="number"
                value={fertilizerForm.current_potassium}
                onChange={(e) => setFertilizerForm({...fertilizerForm, current_potassium: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleGetFertilizerRecommendation}
            disabled={fertilizerLoading}
            className="w-full"
          >
            {fertilizerLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Get AI Recommendation
              </>
            )}
          </Button>
          
          {/* Fertilizer Result */}
          {fertilizerResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300"
            >
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-800">
                <Sparkles className="w-5 h-5" />
                Recommended: {fertilizerResult.fertilizer_name}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Nitrogen (N)</p>
                  <p className="text-xl font-bold text-blue-600">{fertilizerResult.npk_requirements.nitrogen} kg/ha</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Phosphorous (P)</p>
                  <p className="text-xl font-bold text-orange-600">{fertilizerResult.npk_requirements.phosphorous} kg/ha</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Potassium (K)</p>
                  <p className="text-xl font-bold text-purple-600">{fertilizerResult.npk_requirements.potassium} kg/ha</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-800">Application Rate:</p>
                  <p className="text-sm text-green-700">{fertilizerResult.application_rate_kg_per_hectare} kg/hectare</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-green-800">Confidence Score:</p>
                  <p className="text-sm text-green-700">{Math.round(fertilizerResult.confidence * 100)}%</p>
                </div>
                
                {fertilizerResult.alternatives && fertilizerResult.alternatives.length > 1 && (
                  <div>
                    <p className="text-sm font-medium text-green-800">Alternative Options:</p>
                    <ul className="text-sm text-green-700 list-disc list-inside">
                      {fertilizerResult.alternatives.slice(1).map((alt, idx) => (
                        <li key={idx}>{alt.name} ({Math.round(alt.confidence * 100)}%)</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Confidence Score: {Math.round(fertilizerResult.confidence * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </Card>
      )}

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