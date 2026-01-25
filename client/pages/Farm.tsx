import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { CropAdvisor } from "@/components/dashboard/CropAdvisor";
import { PrecisionAgriculture } from "@/components/dashboard/PrecisionAgriculture";
import { IoTService } from "@/services/IoTService";

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
  const { t } = useTranslation("farm");
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
    ec: 0,
    humidity: 0,
  });

  const [usesDemoSensorData, setUsesDemoSensorData] = useState(false);

  // Fetch farm data on mount and Connect WebSocket
  useEffect(() => {
    let unsubscribeIoT: (() => void) | undefined;
    const farmId = localStorage.getItem('current_farm_id') || "farm_001";

    const fetchFarmData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        if (farmId) {
          // Fetch farm details
          const farmResponse = await fetch(`/api/farms/${farmId}`);
          if (farmResponse.ok) {
            const farmResult = await farmResponse.json();
            const farm = farmResult.farm;
            // ... (keep existing farm data set logic)
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

          // Fetch INITIAL sensor data
          const sensorResponse = await fetch(`/api/sensors/latest?farmId=${farmId}`);
          if (sensorResponse.ok) {
            const sensorResult = await sensorResponse.json();
            const sensor = sensorResult.sensorData;
            if (sensor) {
              updateSoilStatsFromSensor(sensor);
            }
          }
        }
      } catch (error) {
        console.error('[Farm] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Helper to update state from sensor object (shared by Fetch and WS)
    const updateSoilStatsFromSensor = (sensor: any) => {
      // Handle different field names from WS vs API
      const moist = sensor.soil_moisture ?? sensor.moisture ?? 0;
      const temp = sensor.temperature ?? sensor.temp ?? 0;
      // WS sends npk: number (raw), API sends nitrogen/phosphorus/potassium
      let n = sensor.nitrogen || 0;
      let p = sensor.phosphorus || 0;
      let k = sensor.potassium || 0;

      if (typeof sensor.npk === 'number') {
        // Decode RAW NPK if needed (simple fallback)
        n = Math.round(sensor.npk * 0.14);
        p = Math.round(sensor.npk * 0.045);
        k = Math.round(sensor.npk * 0.05);
      } else if (sensor.npk && typeof sensor.npk === 'object') {
        n = sensor.npk.nitrogen;
        p = sensor.npk.phosphorus;
        k = sensor.npk.potassium;
      }

      setSoilStats({
        moisture: Math.round(moist),
        temperature: Math.round(temp),
        ph: parseFloat((sensor.ph || sensor.soil_ph || 6.5).toFixed(1)),
        nitrogen: Math.round(n),
        phosphorus: Math.round(p),
        potassium: Math.round(k),
        ec: parseFloat((sensor.ec || sensor.ec_salinity || 1.2).toFixed(2)),
        humidity: Math.round(sensor.humidity || 50),
      });
      setUsesDemoSensorData(false);
    };

    fetchFarmData();

    // CONNECT TO WEBSOCKET
    IoTService.connect(farmId);
    unsubscribeIoT = IoTService.onMessage((data) => {
      console.log("⚡ [Farm] Real-time update:", data);
      updateSoilStatsFromSensor(data);
    });

    return () => {
      if (unsubscribeIoT) unsubscribeIoT();
      IoTService.disconnect();
    };
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

  // Construct sensor object for PrecisionAgriculture
  const precisionData = {
    npk: {
      nitrogen: soilStats.nitrogen,
      phosphorus: soilStats.phosphorus,
      potassium: soilStats.potassium
    },
    pH: soilStats.ph,
    ec: soilStats.ec,
    soilMoisture: soilStats.moisture,
    temperature: soilStats.temperature,
    humidity: soilStats.humidity,
    timestamp: new Date()
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-texture-farm min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between" data-tour-id="farm-header">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="w-4 h-4" />
            {t("actions.edit")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t("actions.save")}
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
                {t("sections.location.title")}
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="state" className="text-sm text-muted-foreground">{t("sections.location.state")}</label>
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
                  <label htmlFor="district" className="text-sm text-muted-foreground">{t("sections.location.district")}</label>
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
                  <label htmlFor="city" className="text-sm text-muted-foreground">{t("sections.location.city")}</label>
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
                {t("sections.specs.title")}
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="areaAcres" className="text-sm text-muted-foreground">{t("sections.specs.area")}</label>
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
                  <label htmlFor="soilType" className="text-sm text-muted-foreground">{t("sections.specs.soilType")}</label>
                  {isEditing ? (
                    <select
                      name="soilType"
                      id="soilType"
                      value={farmData.soilType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      {SOIL_TYPES_INDIA.map((soil) => (
                        <option key={soil.value} value={soil.value}>{t(`soilTypes.${soil.value}`)}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{t(`soilTypes.${farmData.soilType}`)}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="crop" className="text-sm text-muted-foreground">{t("sections.specs.crop")}</label>
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
                {t("sections.irrigation.title")}
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="waterSource" className="text-sm text-muted-foreground">{t("sections.irrigation.waterSource")}</label>
                  {isEditing ? (
                    <select
                      name="waterSource"
                      id="waterSource"
                      value={farmData.waterSource}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="well">{t("waterSources.well")}</option>
                      <option value="borewell">{t("waterSources.borewell")}</option>
                      <option value="canal">{t("waterSources.canal")}</option>
                      <option value="river">{t("waterSources.river")}</option>
                      <option value="rainwater">{t("waterSources.rainwater")}</option>
                      <option value="pond">{t("waterSources.pond")}</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{t(`waterSources.${farmData.waterSource}`)}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="irrigationType" className="text-sm text-muted-foreground">{t("sections.irrigation.type")}</label>
                  {isEditing ? (
                    <select
                      name="irrigationType"
                      id="irrigationType"
                      value={farmData.irrigationType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="drip">{t("irrigationTypes.drip")}</option>
                      <option value="sprinkler">{t("irrigationTypes.sprinkler")}</option>
                      <option value="flood">{t("irrigationTypes.flood")}</option>
                      <option value="furrow">{t("irrigationTypes.furrow")}</option>
                      <option value="manual">{t("irrigationTypes.manual")}</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{t(`irrigationTypes.${farmData.irrigationType}`)}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="season" className="text-sm text-muted-foreground">{t("sections.irrigation.season")}</label>
                  {isEditing ? (
                    <select
                      name="season"
                      id="season"
                      value={farmData.season}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="kharif">{t("seasons.kharif")}</option>
                      <option value="rabi">{t("seasons.rabi")}</option>
                      <option value="zaid">{t("seasons.zaid")}</option>
                    </select>
                  ) : (
                    <p className="font-medium capitalize">{t(`seasons.${farmData.season}`)}</p>
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
          <h2 className="text-xl font-semibold text-foreground">{t("sections.analytics.title")}</h2>
          {usesDemoSensorData && (
            <Badge variant="secondary" className="text-xs">
              <Info className="w-3 h-3 mr-1" />
              {t("sections.analytics.demo")}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{soilStats.moisture}%</p>
            <p className="text-sm text-muted-foreground">{t("sections.analytics.moisture")}</p>
          </Card>

          <Card className="p-4 text-center">
            <Thermometer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{soilStats.temperature}°C</p>
            <p className="text-sm text-muted-foreground">{t("sections.analytics.temperature")}</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 font-bold text-sm">pH</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.ph}</p>
            <p className="text-sm text-muted-foreground">{t("sections.analytics.ph")}</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold text-sm">N</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.nitrogen}</p>
            <p className="text-sm text-muted-foreground">{t("sections.analytics.nitrogen")}</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-bold text-sm">P</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.phosphorus}</p>
            <p className="text-sm text-muted-foreground">{t("sections.analytics.phosphorus")}</p>
          </Card>

          <Card className="p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 font-bold text-sm">K</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{soilStats.potassium}</p>
            <p className="text-sm text-muted-foreground">{t("sections.analytics.potassium")}</p>
          </Card>
        </div>
      </div>

      {/* Strategic Crop Advisor */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <CropAdvisor sensorData={soilStats} />
      </motion.div>

      {/* Precision Agronomy Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <PrecisionAgriculture sensorDataOverride={precisionData} />
      </motion.div>

      {/* Soil Health Indicator */}
      <Card className="p-6" data-tour-id="farm-soil-health">
        <h3 className="font-semibold text-foreground mb-4">{t("sections.health.title")}</h3>
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
            <span className="text-muted-foreground">{t("sections.health.status")}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {t("sections.health.recommendation")}
        </p>
      </Card>
    </div>
  );
};
