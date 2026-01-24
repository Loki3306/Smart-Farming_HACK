import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { INDIAN_STATES, INDIAN_FARMER_NAMES } from "../lib/india-data";
import { motion } from "framer-motion";
import { AuthGuide } from "@/components/AuthGuide";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, error, clearError, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "India",
    state: "Maharashtra",
    experienceLevel: "beginner" as const,
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFocus = (fieldName: string) => {
    setCurrentField(fieldName);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.phone || !formData.password) {
      setLocalError("Full name, phone number, and password are required");
      return false;
    }

    // Phone validation - must be 10 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setLocalError("Please enter a valid 10-digit mobile number");
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await signup({
        fullName: formData.fullName,
        phone: `+91${formData.phone}`, // Add country code
        password: formData.password,
        country: formData.country,
        state: formData.state,
        experienceLevel: formData.experienceLevel,
      });
      navigate("/onboarding");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  const displayError = error || localError;

  return (
    <>
      {/* Auth Guide */}
      <AuthGuide mode="signup" currentField={currentField} fieldValues={formData} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 py-8 px-4"
      >
        <Card className="w-full max-w-2xl mx-auto p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Create Farm Account
              </h1>
              <p className="text-muted-foreground mt-2">
                Join thousands of sustainable farmers
              </p>
            </div>

            {/* Error Alert */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onFocus={() => handleFocus("fullName")}
                  placeholder={INDIAN_FARMER_NAMES[Math.floor(Math.random() * INDIAN_FARMER_NAMES.length)]}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mobile Number *
                </label>
                <div className="flex flex-nowrap items-stretch">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-foreground whitespace-nowrap">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => handleFocus("phone")}
                    placeholder="9876543210"
                    maxLength={10}
                    className="flex-1 min-w-0 px-4 py-2 rounded-r-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Enter 10-digit mobile number</p>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => handleFocus("password")}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => handleFocus("confirmPassword")}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Country *
                  </label>
                  <select
                    title="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    onFocus={() => handleFocus("country")}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  >
                    <option>India</option>
                    <option>United States</option>
                    <option>Australia</option>
                    <option>Canada</option>
                    <option>Brazil</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* State and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    State/Province *
                  </label>
                  <select
                    title="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    onFocus={() => handleFocus("state")}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
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
                    Experience Level *
                  </label>
                  <select
                    title="experienceLevel"
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    onFocus={() => handleFocus("experienceLevel")}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
};
