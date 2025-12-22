import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  MapPin, 
  Loader,
  Phone,
  Mail,
  User,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { OtpInput } from "../components/auth/OtpInput";
import {
  INDIAN_STATES,
  INDIAN_FARM_LOCATIONS,
  INDIAN_CROPS,
  SOIL_TYPES_INDIA,
  WATER_SOURCES_INDIA,
  INDIAN_CROP_SEASONS,
} from "../lib/india-data";
import {
  validateIndianPhone,
  validateEmail,
  validateIndianLocation,
  formatPhoneDisplay,
} from "../lib/utils";

interface FarmData {
  // Step 1: Farmer Personal Info
  fullName: string;
  phoneNumber: string;
  phoneVerified: boolean;
  email: string;
  yearsExperience: string;

  // Step 2: Farm Location & Basics
  farmName: string;
  farmLocation: string;
  state: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  totalArea: string;
  areaUnit: "acres" | "hectares";
  soilType: string;

  // Step 3: Sensor Setup (NEW)
  hasSensor: "yes" | "no" | "later";
  sensorType: string;
  sensorModel: string;
  sensorSerial: string;
  mqttConnected: boolean;

  // Step 4: Crop & Irrigation
  primaryCrop: string;
  cropSeason: "kharif" | "rabi" | "zaid";
  sowingDate: string;
  irrigationType: "drip" | "sprinkler" | "flood";
  waterSource: string;

  // Step 5: System Preferences
  defaultMode: "autonomous" | "manual";
  alertPreference: "dashboard-only";
  measurementUnits: "metric" | "imperial";
}

const INITIAL_FARM_DATA: FarmData = {
  // Step 1: Farmer Personal Info
  fullName: "",
  phoneNumber: "",
  phoneVerified: false,
  email: "",
  yearsExperience: "",

  // Step 2: Farm Location & Basics
  farmName: "",
  farmLocation: "",
  state: "Maharashtra",
  latitude: undefined,
  longitude: undefined,
  address: undefined,
  totalArea: "",
  areaUnit: "acres",
  soilType: "black",

  // Step 3: Sensor Setup
  hasSensor: "yes",
  sensorType: "moisture-temp",
  sensorModel: "",
  sensorSerial: "",
  mqttConnected: false,

  // Step 4: Crop & Irrigation
  primaryCrop: "rice",
  cropSeason: "kharif",
  sowingDate: "",
  irrigationType: "drip",
  waterSource: "borewell",

  // Step 5: System Preferences
  defaultMode: "autonomous",
  alertPreference: "dashboard-only",
  measurementUnits: "metric",
};

export const FarmOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoUser, markOnboardingComplete, user } = useAuth();
  const [step, setStep] = useState(1);
  const [farmData, setFarmData] = useState<FarmData>({
    ...INITIAL_FARM_DATA,
    fullName: user?.fullName || "",
    email: user?.email || "",
    state: user?.state || "Maharashtra",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sensorTesting, setSensorTesting] = useState(false);

  const handleGetLocation = () => {
    setGpsLoading(true);
    setErrors((prev) => ({ ...prev, gpsError: "", location: "" }));
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Validate location is in India
          const locationValidation = validateIndianLocation(latitude, longitude);
          if (!locationValidation.isValid) {
            setErrors((prev) => ({
              ...prev,
              gpsError: locationValidation.error || "Location not in India",
            }));
            setGpsLoading(false);
            return;
          }

          // Mock reverse geocoding (in production, use Google Maps API or similar)
          const mockAddress = await getMockAddress(latitude, longitude);

          setFarmData((prev) => ({
            ...prev,
            latitude,
            longitude,
            address: mockAddress,
          }));
          setGpsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unable to access your location.";
          if (error.code === 1) {
            errorMessage = "Location permission denied. Please enable location access.";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please try again.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }
          setErrors((prev) => ({
            ...prev,
            gpsError: errorMessage,
          }));
          setGpsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setErrors((prev) => ({
        ...prev,
        gpsError: "Geolocation is not supported by your browser.",
      }));
      setGpsLoading(false);
    }
  };

  // Mock reverse geocoding - Replace with actual API in production
  const getMockAddress = async (lat: number, lng: number): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Simple mock based on coordinates
    const stateMap: Record<string, string> = {
      Maharashtra: "19.0,73.0",
      Karnataka: "15.0,76.0",
      "Tamil Nadu": "13.0,80.0",
      Gujarat: "23.0,72.0",
      Punjab: "31.0,75.0",
    };

    // Find closest state (very simplified)
    let closestState = farmData.state;
    for (const [state, coords] of Object.entries(stateMap)) {
      const [stateLat, stateLng] = coords.split(",").map(Number);
      if (Math.abs(lat - stateLat) < 3 && Math.abs(lng - stateLng) < 3) {
        closestState = state;
        break;
      }
    }

    return `${farmData.farmLocation || "Farm"}, ${closestState}, India`;
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

  // Step 1: Farmer Personal Info Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!farmData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (farmData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    const phoneValidation = validateIndianPhone(farmData.phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.error || "Invalid phone number";
    } else if (!farmData.phoneVerified) {
      newErrors.phoneNumber = "Please verify your phone number with OTP";
    }

    const emailValidation = validateEmail(farmData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || "Invalid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2: Farm Location & Basics Validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!farmData.farmName.trim()) {
      newErrors.farmName = "Farm name is required";
    } else if (farmData.farmName.trim().length < 2) {
      newErrors.farmName = "Farm name must be at least 2 characters";
    }

    if (!farmData.farmLocation.trim()) {
      newErrors.farmLocation = "Location is required";
    }

    if (!farmData.latitude || !farmData.longitude) {
      newErrors.location = "Please capture GPS location using the button";
    }

    if (!farmData.totalArea.trim()) {
      newErrors.totalArea = "Total area is required";
    } else {
      const area = Number(farmData.totalArea);
      if (isNaN(area) || area <= 0) {
        newErrors.totalArea = "Must be a valid number greater than 0";
      } else if (area > 10000) {
        newErrors.totalArea = "Area seems too large. Please verify.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3: Sensor Setup Validation (optional)
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (farmData.hasSensor === "yes") {
      if (!farmData.sensorModel.trim()) {
        newErrors.sensorModel = "Please enter your sensor model";
      }
      // Serial number is optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4: Crop & Irrigation Validation
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!farmData.sowingDate) {
      newErrors.sowingDate = "Sowing date is required";
    } else {
      const sowingDate = new Date(farmData.sowingDate);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (sowingDate > today) {
        newErrors.sowingDate = "Sowing date cannot be in the future";
      } else if (sowingDate < oneYearAgo) {
        newErrors.sowingDate = "Sowing date seems too old. Please verify.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;

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
    
    // TODO: In production, save farm data to backend
    console.log("Farm data to save:", farmData);
    
    navigate("/dashboard");
  };

  const handlePhoneVerified = () => {
    setFarmData((prev) => ({ ...prev, phoneVerified: true }));
    setShowOtpInput(false);
    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
  };

  const handleSendOtp = async () => {
    const phoneValidation = validateIndianPhone(farmData.phoneNumber);
    if (!phoneValidation.isValid) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: phoneValidation.error || "Invalid phone number",
      }));
      return;
    }

    // Normalize phone number
    if (phoneValidation.normalized) {
      setFarmData((prev) => ({
        ...prev,
        phoneNumber: phoneValidation.normalized!,
      }));
    }

    // Call Twilio API to send OTP
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneValidation.normalized || farmData.phoneNumber
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowOtpInput(true);
        console.log(`OTP sent to ${phoneValidation.normalized}`);
      } else {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: data.error || "Failed to send OTP. Please try again.",
        }));
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "Failed to send OTP. Please check your connection.",
      }));
    }
  };

  const handleTestSensorConnection = async () => {
    setSensorTesting(true);
    setErrors((prev) => ({ ...prev, sensor: "" }));

    try {
      // TODO: In production, test actual MQTT connection
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock success
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        setFarmData((prev) => ({ ...prev, mqttConnected: true }));
      } else {
        setErrors((prev) => ({
          ...prev,
          sensor: "Unable to connect to sensor. Please check your sensor is powered on and try again.",
        }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        sensor: "Connection failed. Please try again.",
      }));
    } finally {
      setSensorTesting(false);
    }
  };

  const progressPercentage = (step / 6) * 100;

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
                Step {step} of 6
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
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors flex-shrink-0 ${
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
            {/* Step 1: Farmer Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Your Information
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Let's start with your basic details
                </p>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={farmData.fullName}
                    onChange={handleChange}
                    placeholder="e.g., Rajesh Yadav"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone Number with OTP */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number *
                  </label>
                  {!showOtpInput ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={farmData.phoneNumber}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          disabled={farmData.phoneVerified}
                          className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
                        />
                        {!farmData.phoneVerified ? (
                          <Button
                            type="button"
                            onClick={handleSendOtp}
                            className="gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            Verify
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Verified</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You'll receive SMS alerts for irrigation updates
                      </p>
                      {errors.phoneNumber && (
                        <p className="text-xs text-red-600">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Card className="p-4">
                      <OtpInput
                        phoneNumber={farmData.phoneNumber}
                        onVerified={handlePhoneVerified}
                        onCancel={() => setShowOtpInput(false)}
                      />
                    </Card>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={farmData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Years of Experience (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Farming Experience (Optional)
                  </label>
                  <select
                    name="yearsExperience"
                    value={farmData.yearsExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="less-than-1">Less than 1 year</option>
                    <option value="1-5">1-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="more-than-10">More than 10 years</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Farm Location & Basics */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Farm Location & Details
                  </h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Farm Name *
                  </label>
                  <input
                    type="text"
                    name="farmName"
                    value={farmData.farmName}
                    onChange={handleChange}
                    placeholder="e.g., Green Valley Farm"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    What do locals call your farm?
                  </p>
                  {errors.farmName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.farmName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State *
                  </label>
                  <select
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Farm Location (Village/City) *
                  </label>
                  <input
                    type="text"
                    name="farmLocation"
                    value={farmData.farmLocation}
                    onChange={handleChange}
                    placeholder={INDIAN_FARM_LOCATIONS[Math.floor(Math.random() * INDIAN_FARM_LOCATIONS.length)]}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.farmLocation && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.farmLocation}
                    </p>
                  )}
                </div>

                {/* GPS Location */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        GPS Location *
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        We need accurate location for weather data
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gpsLoading}
                      className="gap-2"
                    >
                      {gpsLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Getting...
                        </>
                      ) : farmData.latitude && farmData.longitude ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Update
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Get Location
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {farmData.latitude && farmData.longitude && (
                    <div className="bg-white rounded p-3 text-xs space-y-1">
                      <p className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Location captured successfully!
                      </p>
                      <p className="text-muted-foreground">
                        Coordinates: {farmData.latitude.toFixed(6)}°N, {farmData.longitude.toFixed(6)}°E
                      </p>
                      {farmData.address && (
                        <p className="text-muted-foreground">
                          Address: {farmData.address}
                        </p>
                      )}
                    </div>
                  )}

                  {errors.location && (
                    <p className="text-xs text-red-600">{errors.location}</p>
                  )}
                  {errors.gpsError && (
                    <p className="text-xs text-orange-600">{errors.gpsError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Total Area *
                    </label>
                    <input
                      type="number"
                      name="totalArea"
                      value={farmData.totalArea}
                      onChange={handleChange}
                      placeholder="15"
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.totalArea && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.totalArea}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Unit *
                    </label>
                    <select
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Soil Type *
                  </label>
                  <select
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

            {/* Step 3: Sensor Setup (Mock MQTT) */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Sensor Setup
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your soil sensor to receive real-time data
                </p>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Do you have a sensor? *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="hasSensor"
                        value="yes"
                        checked={farmData.hasSensor === "yes"}
                        onChange={handleChange}
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          Yes, I have a sensor
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Let's connect it now
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="hasSensor"
                        value="later"
                        checked={farmData.hasSensor === "later"}
                        onChange={handleChange}
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          I'll set up later
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Continue without sensor for now
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="hasSensor"
                        value="no"
                        checked={farmData.hasSensor === "no"}
                        onChange={handleChange}
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          No, I need to order one
                        </div>
                        <div className="text-xs text-muted-foreground">
                          We'll show you recommended sensors
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {farmData.hasSensor === "yes" && (
                  <div className="space-y-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Sensor Type *
                      </label>
                      <select
                        name="sensorType"
                        value={farmData.sensorType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="moisture-temp">Moisture + Temperature</option>
                        <option value="moisture-ec">Moisture + EC</option>
                        <option value="full">Full Profile (Moisture/Temp/EC/pH)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Sensor Model/Brand *
                        </label>
                        <input
                          type="text"
                          name="sensorModel"
                          value={farmData.sensorModel}
                          onChange={handleChange}
                          placeholder="e.g., Wisen SoilWatch"
                          className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.sensorModel && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.sensorModel}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Serial Number (Optional)
                        </label>
                        <input
                          type="text"
                          name="sensorSerial"
                          value={farmData.sensorSerial}
                          onChange={handleChange}
                          placeholder="WS-2024-001"
                          className="w-full px-4 py-2 rounded-lg border border-border bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-blue-300">
                      <Button
                        type="button"
                        onClick={handleTestSensorConnection}
                        disabled={sensorTesting || !farmData.sensorModel}
                        className="w-full gap-2"
                        variant={farmData.mqttConnected ? "outline" : "default"}
                      >
                        {sensorTesting ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Testing Connection...
                          </>
                        ) : farmData.mqttConnected ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Sensor Connected
                          </>
                        ) : (
                          <>
                            <Wifi className="w-4 h-4" />
                            Test Connection
                          </>
                        )}
                      </Button>
                      
                      {farmData.mqttConnected && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Successfully connected to sensor via MQTT
                        </p>
                      )}
                      
                      {errors.sensor && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.sensor}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Make sure your sensor is powered on and within range
                      </p>
                    </div>
                  </div>
                )}

                {farmData.hasSensor === "no" && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900 font-medium mb-2">
                      Recommended Sensors for Indian Farms
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• Wisen SoilWatch Pro - ₹8,500</li>
                      <li>• Cropway Smart Sensor - ₹6,000</li>
                      <li>• AgriTech Soil Monitor - ₹7,200</li>
                    </ul>
                    <p className="text-xs text-amber-700 mt-2">
                      You can add your sensor later from dashboard settings
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Crop & Irrigation */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  Crop & Irrigation Details
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Primary Crop *
                    </label>
                    <select
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Crop Season *
                    </label>
                    <select
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sowing Date *
                  </label>
                  <input
                    type="date"
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Irrigation Type *
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Water Source *
                  </label>
                  <select
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

            {/* Step 5: System Preferences */}
            {step === 5 && (
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Measurement Units *
                  </label>
                  <select
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

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Review Your Setup
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-muted/30 rounded-lg p-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-semibold text-foreground">
                      {farmData.fullName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      {formatPhoneDisplay(farmData.phoneNumber)}
                      {farmData.phoneVerified && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Farm Name</p>
                    <p className="font-semibold text-foreground">
                      {farmData.farmName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-foreground">
                      {farmData.farmLocation}, {farmData.state}
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
                      {farmData.soilType.replace("-", " ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Sensor</p>
                    <p className="font-semibold text-foreground capitalize flex items-center gap-2">
                      {farmData.hasSensor === "yes" ? (
                        <>
                          {farmData.sensorModel}
                          {farmData.mqttConnected && (
                            <Wifi className="w-4 h-4 text-green-600" />
                          )}
                        </>
                      ) : farmData.hasSensor === "no" ? (
                        "To be ordered"
                      ) : (
                        "Set up later"
                      )}
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

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Units
                    </p>
                    <p className="font-semibold text-foreground capitalize">
                      {farmData.measurementUnits}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900 font-medium mb-1">
                    ✓ Everything looks good!
                  </p>
                  <p className="text-xs text-green-700">
                    You can edit any details later from your dashboard settings.
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

            {step < 6 ? (
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
