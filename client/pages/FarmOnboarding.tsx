import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  MapPin, 
  Loader,
  Phone,
  User,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OtpInput } from "../components/auth/OtpInput";
import {
  INDIAN_STATES,
  SOIL_TYPES_INDIA,
} from "../lib/india-data";
import {
  validateIndianPhone,
  validateEmail,
  validateIndianLocation,
} from "../lib/utils";
import { reverseGeocode, normalizeStateName } from "../services/GeocodingService";
import { saveFarmerOnboarding } from "../services/SupabaseService";

/**
 * Simplified 5-Step Farm Onboarding
 * Step 1: Farmer Info (Name, Email, Experience)
 * Step 2: Phone + OTP Verification
 * Step 3: Farm Location (GPS auto-fills city/district/state, Area, Soil)
 * Step 4: Sensor Connection (simplified - just connect)
 * Step 5: Review & Save
 */

interface FarmData {
  // Step 1: Farmer Info
  fullName: string;
  email: string;
  yearsExperience: string;

  // Step 2: Phone Verification
  phoneNumber: string;
  phoneVerified: boolean;

  // Step 3: Farm Location
  farmName: string;
  state: string;
  city: string;
  district: string;
  village: string;
  latitude?: number;
  longitude?: number;
  fullAddress: string;
  totalArea: string;
  areaUnit: "acres" | "hectares";
  soilType: string;

  // Step 4: Sensor
  sensorConnected: boolean;
  sensorId: string;
}

const INITIAL_FARM_DATA: FarmData = {
  // Step 1
  fullName: "",
  email: "",
  yearsExperience: "",

  // Step 2
  phoneNumber: "",
  phoneVerified: false,

  // Step 3
  farmName: "",
  state: "",
  city: "",
  district: "",
  village: "",
  latitude: undefined,
  longitude: undefined,
  fullAddress: "",
  totalArea: "",
  areaUnit: "acres",
  soilType: "black",

  // Step 4
  sensorConnected: false,
  sensorId: "",
};

export const FarmOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoUser, markOnboardingComplete, user } = useAuth();
  const [step, setStep] = useState(1);
  const [farmData, setFarmData] = useState<FarmData>({
    ...INITIAL_FARM_DATA,
    fullName: user?.fullName || "",
    email: user?.email || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sensorConnecting, setSensorConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  // GPS Location Handler with Real Reverse Geocoding
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

          // Reverse geocode to get city, district, state
          const geoResult = await reverseGeocode(latitude, longitude);
          
          if (geoResult.success) {
            const normalizedState = normalizeStateName(geoResult.state);
            setFarmData((prev) => ({
              ...prev,
              latitude,
              longitude,
              city: geoResult.city,
              district: geoResult.district,
              state: normalizedState || prev.state,
              village: geoResult.village,
              fullAddress: geoResult.fullAddress,
            }));
            console.log('[GPS] Location filled:', geoResult);
          } else {
            // GPS worked but geocoding failed - still save coordinates
            setFarmData((prev) => ({
              ...prev,
              latitude,
              longitude,
            }));
            setErrors((prev) => ({
              ...prev,
              gpsError: "Location captured but couldn't fetch address details. Please enter manually.",
            }));
          }
          
          setGpsLoading(false);
        },
        (error) => {
          setGpsLoading(false);
          let errorMessage = "Unable to get location";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location permission denied. Please enable GPS.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location unavailable. Please try again.";
          }
          setErrors((prev) => ({ ...prev, gpsError: errorMessage }));
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      setGpsLoading(false);
      setErrors((prev) => ({
        ...prev,
        gpsError: "GPS not supported in this browser",
      }));
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Step 1: Farmer Info Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!farmData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (farmData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    // Email is optional, but if provided, validate it
    if (farmData.email.trim()) {
      const emailValidation = validateEmail(farmData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || "Invalid email";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2: Phone Validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const phoneValidation = validateIndianPhone(farmData.phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.error || "Invalid phone number";
    } else if (!farmData.phoneVerified) {
      newErrors.phoneNumber = "Please verify your phone with OTP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3: Farm Location Validation
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!farmData.farmName.trim()) {
      newErrors.farmName = "Farm name is required";
    }

    if (!farmData.latitude || !farmData.longitude) {
      newErrors.location = "Please get your GPS location";
    }

    if (!farmData.totalArea || parseFloat(farmData.totalArea) <= 0) {
      newErrors.totalArea = "Enter valid farm area";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4: Sensor - No validation needed, optional
  const validateStep4 = (): boolean => {
    return true; // Sensor is optional
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

  const handleSendOtp = async () => {
    const phoneValidation = validateIndianPhone(farmData.phoneNumber);
    if (!phoneValidation.isValid) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: phoneValidation.error || "Invalid phone number",
      }));
      return;
    }

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneValidation.normalized }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowOtpInput(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: data.error || "Failed to send OTP",
        }));
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "Failed to send OTP. Please try again.",
      }));
    }
  };

  const handlePhoneVerified = () => {
    setFarmData((prev) => ({ ...prev, phoneVerified: true }));
    setShowOtpInput(false);
    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
  };

  // Mock sensor connection
  const handleConnectSensor = async () => {
    setSensorConnecting(true);
    setErrors((prev) => ({ ...prev, sensor: "" }));

    try {
      // Simulate sensor connection (2 second delay)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Generate mock sensor ID
      const sensorId = `SF-${Date.now().toString(36).toUpperCase()}`;
      
      setFarmData((prev) => ({
        ...prev,
        sensorConnected: true,
        sensorId,
      }));

      console.log('[Sensor] Connected with ID:', sensorId);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        sensor: "Failed to connect sensor. Please try again.",
      }));
    } finally {
      setSensorConnecting(false);
    }
  };

  // Complete onboarding and save to database
  const handleComplete = async () => {
    if (isDemoUser) {
      markOnboardingComplete();
      navigate("/dashboard");
      return;
    }

    setSaving(true);

    try {
      const result = await saveFarmerOnboarding({
        farmer: {
          fullName: farmData.fullName,
          phone: validateIndianPhone(farmData.phoneNumber).normalized || farmData.phoneNumber, // Normalize to +91XXXXXXXXXX
          email: farmData.email,
          experience: farmData.yearsExperience,
        },
        farm: {
          farmName: farmData.farmName,
          state: farmData.state,
          city: farmData.city,
          district: farmData.district,
          village: farmData.village,
          latitude: farmData.latitude!,
          longitude: farmData.longitude!,
          areaAcres: parseFloat(farmData.totalArea),
          soilType: farmData.soilType,
        },
        sensor: {
          connected: farmData.sensorConnected,
          sensorId: farmData.sensorId,
        },
      });

      if (result.success) {
        console.log('[Onboarding] Profile saved:', result.farmerId);
        markOnboardingComplete();
        navigate("/dashboard");
      } else {
        setErrors((prev) => ({
          ...prev,
          save: result.error || "Failed to save profile",
        }));
      }
    } catch (err) {
      console.error('[Onboarding] Save error:', err);
      setErrors((prev) => ({
        ...prev,
        save: "An error occurred. Please try again.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const progressPercentage = (step / 5) * 100;

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
                Step {step} of 5
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

          {/* Step Indicators */}
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((s) => (
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
            {/* Step 1: Farmer Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Your Information</h2>
                </div>
                
                <p className="text-muted-foreground">
                  Let's start with your basic details.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={farmData.fullName}
                    onChange={handleChange}
                    placeholder="e.g., Rajesh Kumar"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={farmData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Farming Experience (Optional)
                  </label>
                  <select
                    name="yearsExperience"
                    value={farmData.yearsExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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

            {/* Step 2: Phone Verification */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Verify Your Phone</h2>
                </div>
                
                <p className="text-muted-foreground">
                  We'll send you important alerts about your farm on this number.
                </p>

                {!showOtpInput ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={farmData.phoneNumber}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            disabled={farmData.phoneVerified}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                          />
                        </div>
                        {!farmData.phoneVerified ? (
                          <Button type="button" onClick={handleSendOtp} className="gap-2">
                            Send OTP
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 px-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>

                    {farmData.phoneVerified && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <p className="font-medium text-green-800">Phone Verified!</p>
                        <p className="text-sm text-green-700">
                          You'll receive SMS alerts at this number
                        </p>
                      </div>
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
            )}

            {/* Step 3: Farm Location */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Farm Location</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Farm Name *
                  </label>
                  <input
                    type="text"
                    name="farmName"
                    value={farmData.farmName}
                    onChange={handleChange}
                    placeholder="e.g., Green Valley Farm"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.farmName && (
                    <p className="text-xs text-red-600 mt-1">{errors.farmName}</p>
                  )}
                </div>

                {/* GPS Location Button */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        GPS Location *
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to auto-fill your city, district & state
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
                      ) : farmData.latitude ? (
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
                    <div className="bg-white rounded p-3 text-sm space-y-1">
                      <p className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Location captured!
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Coordinates: {farmData.latitude.toFixed(6)}°N, {farmData.longitude.toFixed(6)}°E
                      </p>
                    </div>
                  )}

                  {errors.location && (
                    <p className="text-xs text-red-600">{errors.location}</p>
                  )}
                  {errors.gpsError && (
                    <p className="text-xs text-orange-600">{errors.gpsError}</p>
                  )}
                </div>

                {/* Auto-filled Location Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={farmData.city}
                      onChange={handleChange}
                      placeholder="Auto-filled from GPS"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={farmData.district}
                      onChange={handleChange}
                      placeholder="Auto-filled from GPS"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Village
                    </label>
                    <input
                      type="text"
                      name="village"
                      value={farmData.village}
                      onChange={handleChange}
                      placeholder="Auto-filled from GPS"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      State
                    </label>
                    <select
                      name="state"
                      value={farmData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Area *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="totalArea"
                        value={farmData.totalArea}
                        onChange={handleChange}
                        placeholder="e.g., 5"
                        min="0"
                        step="0.1"
                        className="flex-1 px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <select
                        name="areaUnit"
                        value={farmData.areaUnit}
                        onChange={handleChange}
                        className="px-4 py-3 rounded-lg border border-border bg-white"
                      >
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                      </select>
                    </div>
                    {errors.totalArea && (
                      <p className="text-xs text-red-600 mt-1">{errors.totalArea}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Soil Type
                    </label>
                    <select
                      name="soilType"
                      value={farmData.soilType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {SOIL_TYPES_INDIA.map((soil) => (
                        <option key={soil.value} value={soil.value}>
                          {soil.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Sensor Connection (Simplified) */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Connect Your Sensor</h2>
                </div>

                <p className="text-muted-foreground">
                  Connect your smart sensor to start receiving real-time farm data.
                </p>

                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
                  {!farmData.sensorConnected ? (
                    <>
                      <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-md">
                        {sensorConnecting ? (
                          <Loader className="w-10 h-10 text-primary animate-spin" />
                        ) : (
                          <Wifi className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">Smart Sensor</h3>
                        <p className="text-sm text-muted-foreground">
                          Make sure your sensor is powered on and nearby
                        </p>
                      </div>

                      <Button
                        onClick={handleConnectSensor}
                        disabled={sensorConnecting}
                        className="gap-2 px-8"
                        size="lg"
                      >
                        {sensorConnecting ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Wifi className="w-5 h-5" />
                            Connect Sensor
                          </>
                        )}
                      </Button>

                      {errors.sensor && (
                        <p className="text-sm text-red-600">{errors.sensor}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Don't have a sensor? You can skip and connect later.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg text-green-800">
                          Sensor Connected!
                        </h3>
                        <p className="text-sm text-green-700">
                          Sensor ID: {farmData.sensorId}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 text-left space-y-2">
                        <p className="text-sm font-medium">Receiving data:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-green-50 p-2 rounded text-center">
                            <p className="text-green-600 font-medium">Moisture</p>
                            <p className="text-green-800">✓ Active</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded text-center">
                            <p className="text-green-600 font-medium">Temperature</p>
                            <p className="text-green-800">✓ Active</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded text-center">
                            <p className="text-green-600 font-medium">Humidity</p>
                            <p className="text-green-800">✓ Active</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review & Complete */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Review Your Details</h2>
                </div>

                <div className="space-y-4">
                  {/* Farmer Info */}
                  <Card className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Farmer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{farmData.fullName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{farmData.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{farmData.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-medium">{farmData.yearsExperience || "Not specified"}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Farm Info */}
                  <Card className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Farm Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Farm Name</p>
                        <p className="font-medium">{farmData.farmName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {[farmData.village, farmData.city, farmData.district, farmData.state]
                            .filter(Boolean)
                            .join(", ") || "Location captured"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area</p>
                        <p className="font-medium">{farmData.totalArea} {farmData.areaUnit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Soil Type</p>
                        <p className="font-medium capitalize">{farmData.soilType}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Sensor Info */}
                  <Card className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      Sensor Status
                    </h3>
                    <div className="flex items-center gap-2">
                      {farmData.sensorConnected ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium">
                            Connected (ID: {farmData.sensorId})
                          </span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-700">
                            Not connected - You can add later from dashboard
                          </span>
                        </>
                      )}
                    </div>
                  </Card>

                  {errors.save && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errors.save}</p>
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-emerald-800">
                      <strong>🔒 Your data is encrypted</strong> - Phone, email, and sensitive information 
                      are securely encrypted before being stored.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FarmOnboarding;
