import React, { useState, useEffect } from "react";
import {
  Tractor,
  MapPin,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  Edit,
  Save,
  X,
  Leaf,
  Mountain,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { INDIAN_STATES, SOIL_TYPES_INDIA } from "../lib/india-data";
import { motion } from "framer-motion";
import { CropSelector } from "@/components/ui/CropSelector";

interface FarmData {
  farmName: string;
  state: string;
  city: string;
  district: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  areaAcres: number;
  soilType: string;
  crop: string;
  season: string;
  waterSource: string;
  irrigationType: string;
}

export const Farm: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [farmData, setFarmData] = useState<FarmData>({
    farmName: "My Farm",
    state: "Maharashtra",
    city: "Nashik",
    district: "Nashik",
    village: "",
    latitude: null,
    longitude: null,
    areaAcres: 5,
    soilType: "black",
    crop: "",
    season: "kharif",
    waterSource: "well",
    irrigationType: "drip",
  });

  const [soilStats, setSoilStats] = useState({
    moisture: 0,
    temperature: 0,
    ph: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
  });

  const [usesDemoSensorData, setUsesDemoSensorData] = useState(false);

  // Fetch farm data on mount
  useEffect(() => {
    const fetchFarmData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const farmId = localStorage.getItem('current_farm_id');

        if (farmId) {
          // Fetch farm details
          const farmResponse = await fetch(`/api/farms/${farmId}`);
          if (farmResponse.ok) {
            const farmResult = await farmResponse.json();
            const farm = farmResult.farm;

            console.log('[Farm] Loaded farm data:', farm);

            setFarmData({
              farmName: farm.farm_name || 'My Farm',
              state: farm.state || 'Maharashtra',
              city: farm.city || 'Nashik',
              district: farm.district || 'Nashik',
              village: farm.village || '',
              latitude: farm.latitude || null,
              longitude: farm.longitude || null,
              areaAcres: farm.area_acres || 5,
              soilType: farm.soil_type || 'black',
              crop: farm.crop_type || '',
              season: farm.season || 'kharif',
              waterSource: farm.water_source || 'well',
              irrigationType: farm.irrigation_type || 'drip',
            });
          }

          // Fetch latest sensor data for soil stats
          const sensorResponse = await fetch(`/api/sensors/latest?farmId=${farmId}`);
          if (sensorResponse.ok) {
            const sensorResult = await sensorResponse.json();
            const sensor = sensorResult.sensorData;

            if (sensor && sensor.soil_moisture !== null && sensor.soil_moisture !== undefined) {
              console.log('[Farm] ✅ Loaded real sensor data:', sensor);
              setSoilStats({
                moisture: Math.round(sensor.soil_moisture || 0),
                temperature: Math.round(sensor.temperature || 0),
                ph: parseFloat((sensor.ph || 0).toFixed(1)),
                nitrogen: Math.round(sensor.nitrogen || 0),
                phosphorus: Math.round(sensor.phosphorus || 0),
                potassium: Math.round(sensor.potassium || 0),
              });
              setUsesDemoSensorData(false);
            } else {
              console.log('[Farm] ⚠️ No sensor data found, using demo values');
              // Use realistic demo values based on soil type
              setSoilStats({
                moisture: 45,
                temperature: 28,
                ph: 6.8,
                nitrogen: 42,
                phosphorus: 35,
                potassium: 38,
              });
              setUsesDemoSensorData(true);
            }
          } else {
            console.log('[Farm] ⚠️ Sensor API failed, using demo values');
            setSoilStats({
              moisture: 45,
              temperature: 28,
              ph: 6.8,
              nitrogen: 42,
              phosphorus: 35,
              potassium: 38,
            });
            setUsesDemoSensorData(true);
          }
        }
      } catch (error) {
        console.error('[Farm] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFarmData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const farmId = localStorage.getItem('current_farm_id');
    if (!farmId) {
      console.error('[Farm] No farm ID found');
      return;
    }

    try {
      const response = await fetch(`/api/farms/${farmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_name: farmData.farmName,
          state: farmData.state,
          city: farmData.city,
          district: farmData.district,
          village: farmData.village,
          latitude: farmData.latitude,
          longitude: farmData.longitude,
          area_acres: farmData.areaAcres,
          soil_type: farmData.soilType,
          crop_type: farmData.crop,
          season: farmData.season,
          water_source: farmData.waterSource,
          irrigation_type: farmData.irrigationType,
        }),
      });

      if (response.ok) {
        console.log('[Farm] ✅ Farm data saved successfully');
        setIsEditing(false);
      } else {
        console.error('[Farm] ❌ Failed to save farm data');
      }
    } catch (error) {
      console.error('[Farm] Error saving farm data:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between" data-tour-id="farm-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Farm</h1>
          <p className="text-muted-foreground mt-1">
            Manage your farm details and view soil analytics
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Details
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Farm Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6" data-tour-id="farm-overview">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Tractor className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  name="farmName"
                  id="farmName"
                  value={farmData.farmName}
                  onChange={handleChange}
                  className="text-2xl font-bold w-full px-2 py-1 border border-border rounded-lg"
                  aria-label="Farm Name"
                />
              ) : (
                <h2 className="text-2xl font-bold text-foreground">{farmData.farmName}</h2>
              )}
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {farmData.village && `${farmData.village}, `}
                  {farmData.city}, {farmData.district}, {farmData.state}
                </span>
              </div>
            </div>
          </div>

          {/* Farm Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Location */}
            <div className="space-y-4" data-tour-id="farm-location">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="state" className="text-sm text-muted-foreground">State</label>
                  {isEditing ? (
                    <select
                      name="state"
                      id="state"
                      value={farmData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium">{farmData.state}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="district" className="text-sm text-muted-foreground">District</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="district"
                      id="district"
                      value={farmData.district}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{farmData.district || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="city" className="text-sm text-muted-foreground">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={farmData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{farmData.city || "Not specified"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Farm Specs */}
            <div className="space-y-4" data-tour-id="farm-specs">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Mountain className="w-4 h-4 text-primary" />
                Farm Specifications
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="areaAcres" className="text-sm text-muted-foreground">Total Area</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="areaAcres"
                        id="areaAcres"
                        value={farmData.areaAcres}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-border rounded-lg"
                      />
                      <span className="px-3 py-2 bg-muted rounded-lg">acres</span>
                    </div>
                  ) : (
                    <p className="font-medium">{farmData.areaAcres} acres</p>
                  )}
                </div>
                <div>
                  <label htmlFor="soilType" className="text-sm text-muted-foreground">Soil Type</label>
                  {isEditing ? (
                    <select
                      name="soilType"
                      id="soilType"
                      value={farmData.soilType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      {SOIL_TYPES_INDIA.map((soil) => (
                        <option key={soil.value} value={soil.value}>{soil.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{farmData.soilType} Soil</p>
                  )}
                </div>
                <div>
                  <label htmlFor="crop" className="text-sm text-muted-foreground">Current Crop</label>
                  {isEditing ? (
                    <CropSelector
                      value={farmData.crop}
                      onChange={(value) => setFarmData(prev => ({ ...prev, crop: value }))}
                      disabled={false}
                    />
                  ) : (
                    <p className="font-medium">{farmData.crop || "Not specified"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Irrigation */}
            <div className="space-y-4" data-tour-id="farm-irrigation">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                Irrigation Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="waterSource" className="text-sm text-muted-foreground">Water Source</label>
                  {isEditing ? (
                    <select
                      name="waterSource"
                      id="waterSource"
                      value={farmData.waterSource}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="well">Well</option>
                      <option value="borewell">Borewell</option>
                      <option value="canal">Canal</option>
                      <option value="river">River</option>
                      <option value="rainwater">Rainwater Harvesting</option>
                      <option value="pond">Pond</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{farmData.waterSource}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="irrigationType" className="text-sm text-muted-foreground">Irrigation Type</label>
                  {isEditing ? (
                    <select
                      name="irrigationType"
                      id="irrigationType"
                      value={farmData.irrigationType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="drip">Drip Irrigation</option>
                      <option value="sprinkler">Sprinkler</option>
                      <option value="flood">Flood Irrigation</option>
                      <option value="furrow">Furrow Irrigation</option>
                      <option value="manual">Manual</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{farmData.irrigationType.replace("-", " ")}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="season" className="text-sm text-muted-foreground">Season</label>
                  {isEditing ? (
                    <select
                      name="season"
                      id="season"
                      value={farmData.season}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="kharif">Kharif (Monsoon)</option>
                      <option value="rabi">Rabi (Winter)</option>
                      <option value="zaid">Zaid (Summer)</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{farmData.season}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Soil Stats Section */}
      <div data-tour-id="farm-soil-analytics">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Soil Analytics</h2>
          {usesDemoSensorData && (
            <Badge variant="secondary" className="text-xs">
              <Info className="w-3 h-3 mr-1" />
              Demo Data - Connect sensors for real-time values
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{soilStats.moisture}%</p>
            <p className="text-sm text-muted-foreground">Moisture</p>
          </Card>

          <Card className="p-4 text-center">
            <Thermometer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{soilStats.temperature}°C</p>
            <p className="text-sm text-muted-foreground">Temperature</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 font-bold text-sm">pH</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.ph}</p>
            <p className="text-sm text-muted-foreground">pH Level</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold text-sm">N</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.nitrogen}</p>
            <p className="text-sm text-muted-foreground">Nitrogen (kg/ha)</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-bold text-sm">P</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.phosphorus}</p>
            <p className="text-sm text-muted-foreground">Phosphorus (kg/ha)</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 font-bold text-sm">K</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.potassium}</p>
            <p className="text-sm text-muted-foreground">Potassium (kg/ha)</p>
          </Card>
        </div>
      </div>

      {/* Soil Health Indicator */}
      <Card className="p-6" data-tour-id="farm-soil-health">
        <h3 className="font-semibold text-foreground mb-4">Overall Soil Health</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: "78%" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <span className="text-xl font-bold text-green-600">78%</span>
            <span className="text-muted-foreground">Good</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Your soil health is good! Consider adding organic matter to improve nitrogen levels.
        </p>
      </Card>
    </div>
  );
};
