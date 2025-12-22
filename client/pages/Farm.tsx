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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "../context/AuthContext";
import { INDIAN_STATES, SOIL_TYPES_INDIA } from "../lib/india-data";
import { motion } from "framer-motion";

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

  // Mock soil stats - in production, this would come from sensors
  const soilStats = {
    moisture: 45,
    temperature: 28,
    ph: 6.8,
    nitrogen: 42,
    phosphorus: 35,
    potassium: 38,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFarmData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Save to database
    console.log("Saving farm data:", farmData);
    setIsEditing(false);
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
                  value={farmData.farmName}
                  onChange={handleChange}
                  className="text-2xl font-bold w-full px-2 py-1 border border-border rounded-lg"
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
                  <label className="text-sm text-muted-foreground">State</label>
                  {isEditing ? (
                    <select
                      name="state"
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
                  <label className="text-sm text-muted-foreground">District</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="district"
                      value={farmData.district}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{farmData.district || "Not specified"}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
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
                  <label className="text-sm text-muted-foreground">Total Area</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="areaAcres"
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
                  <label className="text-sm text-muted-foreground">Soil Type</label>
                  {isEditing ? (
                    <select
                      name="soilType"
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
                  <label className="text-sm text-muted-foreground">Current Crop</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="crop"
                      value={farmData.crop}
                      onChange={handleChange}
                      placeholder="e.g., Rice, Wheat, Cotton"
                      className="w-full px-3 py-2 border border-border rounded-lg"
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
                  <label className="text-sm text-muted-foreground">Water Source</label>
                  {isEditing ? (
                    <select
                      name="waterSource"
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
                  <label className="text-sm text-muted-foreground">Irrigation Type</label>
                  {isEditing ? (
                    <select
                      name="irrigationType"
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
                  <label className="text-sm text-muted-foreground">Season</label>
                  {isEditing ? (
                    <select
                      name="season"
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
        <h2 className="text-xl font-semibold text-foreground mb-4">Soil Analytics</h2>
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
