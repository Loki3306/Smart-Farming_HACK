import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sprout, AlertCircle, CheckCircle2, Calendar, Clock } from 'lucide-react';

interface FertilizerRecommendation {
  fertilizer_name: string;
  confidence: number;
  npk_requirements: {
    nitrogen: number;
    phosphorous: number;
    potassium: number;
    total: number;
  };
  application_rate_kg_per_hectare: number;
  timing: {
    urgency: string;
    recommended_time_of_day: string;
    days_to_apply: number;
    note: string;
  };
  alternatives: Array<{
    name: string;
    confidence: number;
  }>;
}

const soilTypes = ['Sandy', 'Loamy', 'Black', 'Red', 'Clayey'];
const cropTypes = [
  'Wheat', 'Paddy', 'Cotton', 'Maize', 'Sugarcane',
  'Barley', 'Millets', 'Pulses', 'Oil seeds', 'Ground Nuts', 'Tobacco'
];

export default function FertilizerRecommendation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<FertilizerRecommendation | null>(null);

  const [formData, setFormData] = useState({
    temperature: 28,
    humidity: 60,
    moisture: 50,
    soil_type: 'Loamy',
    crop_type: 'Wheat',
    current_nitrogen: 15,
    current_phosphorous: 10,
    current_potassium: 120
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      const response = await fetch('/api/fertilizer/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendation');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendation(data.data);
      } else {
        setError(data.error || 'Failed to get recommendation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sprout className="w-8 h-8 text-green-600" />
          Fertilizer Recommendation System
        </h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered fertilizer recommendations based on soil and environmental conditions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Field Conditions</CardTitle>
            <CardDescription>Enter current soil and environmental parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Environmental Conditions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  min="-10"
                  max="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  value={formData.humidity}
                  onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moisture">Soil Moisture (%)</Label>
                <Input
                  id="moisture"
                  type="number"
                  value={formData.moisture}
                  onChange={(e) => handleInputChange('moisture', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Soil and Crop Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="soil_type">Soil Type</Label>
                <Select
                  value={formData.soil_type}
                  onValueChange={(value) => handleInputChange('soil_type', value)}
                >
                  <SelectTrigger id="soil_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop_type">Crop Type</Label>
                <Select
                  value={formData.crop_type}
                  onValueChange={(value) => handleInputChange('crop_type', value)}
                >
                  <SelectTrigger id="crop_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cropTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current NPK Levels */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Soil Nutrient Levels</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nitrogen" className="text-xs">Nitrogen (N)</Label>
                  <Input
                    id="nitrogen"
                    type="number"
                    value={formData.current_nitrogen}
                    onChange={(e) => handleInputChange('current_nitrogen', parseFloat(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phosphorous" className="text-xs">Phosphorous (P)</Label>
                  <Input
                    id="phosphorous"
                    type="number"
                    value={formData.current_phosphorous}
                    onChange={(e) => handleInputChange('current_phosphorous', parseFloat(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="potassium" className="text-xs">Potassium (K)</Label>
                  <Input
                    id="potassium"
                    type="number"
                    value={formData.current_potassium}
                    onChange={(e) => handleInputChange('current_potassium', parseFloat(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={getRecommendation}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sprout className="mr-2 h-4 w-4" />
                  Get Recommendation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {recommendation && (
            <>
              {/* Main Recommendation */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Recommended Fertilizer
                    </CardTitle>
                    <Badge variant="secondary">
                      {(recommendation.confidence * 100).toFixed(1)}% Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-green-700">
                      {recommendation.fertilizer_name}
                    </h3>
                  </div>

                  {/* NPK Requirements */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground">Nitrogen</div>
                      <div className="text-lg font-bold text-blue-600">
                        {recommendation.npk_requirements.nitrogen.toFixed(1)}
                      </div>
                      <div className="text-xs">kg/ha</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground">Phosphorous</div>
                      <div className="text-lg font-bold text-purple-600">
                        {recommendation.npk_requirements.phosphorous.toFixed(1)}
                      </div>
                      <div className="text-xs">kg/ha</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground">Potassium</div>
                      <div className="text-lg font-bold text-orange-600">
                        {recommendation.npk_requirements.potassium.toFixed(1)}
                      </div>
                      <div className="text-xs">kg/ha</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground">Total NPK</div>
                      <div className="text-lg font-bold">
                        {recommendation.npk_requirements.total.toFixed(1)}
                      </div>
                      <div className="text-xs">kg/ha</div>
                    </div>
                  </div>

                  {/* Application Rate */}
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="text-sm text-muted-foreground">Application Rate</div>
                    <div className="text-3xl font-bold text-green-600">
                      {recommendation.application_rate_kg_per_hectare.toFixed(1)}
                      <span className="text-lg font-normal text-muted-foreground ml-2">kg/hectare</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Application Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Urgency</span>
                    <Badge variant={getUrgencyColor(recommendation.timing.urgency)}>
                      {recommendation.timing.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Best Time</span>
                    <span className="font-medium">
                      {recommendation.timing.recommended_time_of_day.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Apply Within</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {recommendation.timing.days_to_apply} day{recommendation.timing.days_to_apply !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {recommendation.timing.note}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Alternative Fertilizers */}
              {recommendation.alternatives && recommendation.alternatives.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alternative Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recommendation.alternatives.slice(1, 3).map((alt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="font-medium">{alt.name}</span>
                          <Badge variant="outline">
                            {(alt.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
