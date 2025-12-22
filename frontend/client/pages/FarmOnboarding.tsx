import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Check, MapPin, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  INDIAN_STATES,
  INDIAN_FARM_LOCATIONS,
  INDIAN_CROPS,
  SOIL_TYPES_INDIA,
  WATER_SOURCES_INDIA,
  INDIAN_CROP_SEASONS,
} from "../lib/india-data";

interface FarmData {
  // Step 1: Farm Basics
  farmName: string;
  farmLocation: string;
  state: string;
  latitude?: number;
  longitude?: number;
  totalArea: string;
  areaUnit: "acres" | "hectares";
  soilType: string;

  // Step 2: Crop & Irrigation
  primaryCrop: string;
  cropSeason: "kharif" | "rabi" | "zaid";
  sowingDate: string;
  irrigationType: "drip" | "sprinkler" | "flood";
  waterSource: string;

  // Step 3: System Preferences
  defaultMode: "autonomous" | "manual";
  alertPreference: "dashboard-only";
  measurementUnits: "metric" | "imperial";
}

const INITIAL_FARM_DATA: FarmData = {
  farmName: "",
  farmLocation: "",
  state: "Maharashtra",
  latitude: undefined,
  longitude: undefined,
  totalArea: "",
  areaUnit: "acres",
  soilType: "black",
  primaryCrop: "rice",
  cropSeason: "kharif",
  sowingDate: "",
  irrigationType: "drip",
  waterSource: "borewell",
  defaultMode: "autonomous",
  alertPreference: "dashboard-only",
  measurementUnits: "metric",
};

export const FarmOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoUser, markOnboardingComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [farmData, setFarmData] = useState<FarmData>(INITIAL_FARM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleGetLocation = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFarmData((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          setGpsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setErrors((prev) => ({
            ...prev,
            gpsError: "Unable to access your location. Please check permissions.",
          }));
          setGpsLoading(false);
        },
      );
    } else {
      setErrors((prev) => ({
        ...prev,
        gpsError: "Geolocation is not supported by your browser.",
      }));
      setGpsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFarmData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!farmData.farmName.trim()) newErrors.farmName = "Farm name is required";
    if (!farmData.farmLocation.trim())
      newErrors.farmLocation = "Location is required";
    if (!farmData.totalArea.trim())
      newErrors.totalArea = "Total area is required";
    if (isNaN(Number(farmData.totalArea)))
      newErrors.totalArea = "Must be a valid number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!farmData.sowingDate) newErrors.sowingDate = "Sowing date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleComplete = async () => {
    if (isDemoUser) {
      // Demo users go straight to dashboard
      navigate("/dashboard");
      return;
    }

    // Mark onboarding complete in context
    markOnboardingComplete();
    // In real app, save farm data to backend
    navigate("/dashboard");
  };

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Set Up Your Farm
            </h1>
            <p className="text-muted-foreground mt-2">
              {isDemoUser
                ? "Demo Mode - Changes not saved"
                : "Complete this wizard to access your dashboard"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Step {step} of 4
              </span>
              <span className="text-muted-foreground">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex gap-4 justify-center">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                      ? "bg-primary text-primary-foreground border-2 border-primary/50"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Farm Basics */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  Farm Basics
                </h2>

                <div>
                  <label htmlFor="farmName" className="block text-sm font-medium text-foreground mb-2">
                    Farm Name *
                  </label>
                  <input
                    type="text"
                    id="farmName"
                    name="farmName"
                    value={farmData.farmName}
                    onChange={handleChange}
                    placeholder="e.g., Green Valley Farm"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.farmName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.farmName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="farmLocation" className="block text-sm font-medium text-foreground mb-2">
                    Farm Location (Village/City) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="farmLocation"
                      name="farmLocation"
                      value={farmData.farmLocation}
                      onChange={handleChange}
                      placeholder={INDIAN_FARM_LOCATIONS[Math.floor(Math.random() * INDIAN_FARM_LOCATIONS.length)]}
                      className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetLocation}
                      disabled={gpsLoading}
                      className="px-3"
                    >
                      {gpsLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {farmData.latitude && farmData.longitude && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Location captured: {farmData.latitude.toFixed(4)}, {farmData.longitude.toFixed(4)}
                    </p>
                  )}
                  {errors.farmLocation && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.farmLocation}
                    </p>
                  )}
                  {errors.gpsError && (
                    <p className="text-xs text-orange-600 mt-1">
                      {errors.gpsError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-foreground mb-2">
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={farmData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="totalArea" className="block text-sm font-medium text-foreground mb-2">
                      Total Area *
                    </label>
                    <input
                      type="number"
                      id="totalArea"
                      name="totalArea"
                      value={farmData.totalArea}
                      onChange={handleChange}
                      placeholder="100"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.totalArea && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.totalArea}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="areaUnit" className="block text-sm font-medium text-foreground mb-2">
                      Unit *
                    </label>
                    <select
                      id="areaUnit"
                      name="areaUnit"
                      value={farmData.areaUnit}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="soilType" className="block text-sm font-medium text-foreground mb-2">
                    Soil Type *
                  </label>
                  <select
                    id="soilType"
                    name="soilType"
                    value={farmData.soilType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {SOIL_TYPES_INDIA.map((soil) => (
                      <option key={soil.value} value={soil.value}>
                        {soil.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Crop & Irrigation */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  Crop & Irrigation Details
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="primaryCrop" className="block text-sm font-medium text-foreground mb-2">
                      Primary Crop *
                    </label>
                    <select
                      id="primaryCrop"
                      name="primaryCrop"
                      value={farmData.primaryCrop}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {INDIAN_CROPS.map((crop) => (
                        <option key={crop.value} value={crop.value}>
                          {crop.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cropSeason" className="block text-sm font-medium text-foreground mb-2">
                      Crop Season *
                    </label>
                    <select
                      id="cropSeason"
                      name="cropSeason"
                      value={farmData.cropSeason}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {INDIAN_CROP_SEASONS.map((season) => (
                        <option key={season.value} value={season.value}>
                          {season.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="sowingDate" className="block text-sm font-medium text-foreground mb-2">
                    Sowing Date *
                  </label>
                  <input
                    type="date"
                    id="sowingDate"
                    name="sowingDate"
                    value={farmData.sowingDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.sowingDate && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.sowingDate}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="irrigationType" className="block text-sm font-medium text-foreground mb-2">
                    Irrigation Type *
                  </label>
                  <select
                    id="irrigationType"
                    name="irrigationType"
                    value={farmData.irrigationType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="drip">Drip Irrigation</option>
                    <option value="sprinkler">Sprinkler</option>
                    <option value="flood">Flood</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="waterSource" className="block text-sm font-medium text-foreground mb-2">
                    Water Source *
                  </label>
                  <select
                    id="waterSource"
                    name="waterSource"
                    value={farmData.waterSource}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {WATER_SOURCES_INDIA.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: System Preferences */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  System Preferences
                </h2>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Default Mode *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="defaultMode"
                        value="autonomous"
                        checked={farmData.defaultMode === "autonomous"}
                        onChange={handleChange}
                        aria-label="Autonomous mode"
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          Autonomous (Recommended)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          AI makes irrigation & fertilization decisions
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="defaultMode"
                        value="manual"
                        checked={farmData.defaultMode === "manual"}
                        onChange={handleChange}
                        aria-label="Manual mode"
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          Manual
                        </div>
                        <div className="text-xs text-muted-foreground">
                          You control all operations
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="measurementUnits" className="block text-sm font-medium text-foreground mb-2">
                    Measurement Units *
                  </label>
                  <select
                    id="measurementUnits"
                    name="measurementUnits"
                    value={farmData.measurementUnits}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="metric">Metric (L, kg, °C)</option>
                    <option value="imperial">Imperial (gal, lb, °F)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-foreground">
                  Review Your Setup
                </h2>

                <div className="grid grid-cols-2 gap-6 bg-muted/30 rounded-lg p-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Farm Name</p>
                    <p className="font-semibold text-foreground">
                      {farmData.farmName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-foreground">
                      {farmData.farmLocation}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Total Area</p>
                    <p className="font-semibold text-foreground">
                      {farmData.totalArea} {farmData.areaUnit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Soil Type</p>
                    <p className="font-semibold text-foreground capitalize">
                      {farmData.soilType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Primary Crop
                    </p>
                    <p className="font-semibold text-foreground capitalize">
                      {farmData.primaryCrop}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Irrigation Type
                    </p>
                    <p className="font-semibold text-foreground capitalize">
                      {farmData.irrigationType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Water Source
                    </p>
                    <p className="font-semibold text-foreground capitalize">
                      {farmData.waterSource.replace("-", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Default Mode
                    </p>
                    <p className="font-semibold text-foreground capitalize">
                      {farmData.defaultMode}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    ✓ Review the information above. You can edit any details
                    later in your farm settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="gap-2">
                <Check className="w-4 h-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
