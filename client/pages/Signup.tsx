import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Sprout, ArrowLeft, Leaf, Droplets } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
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
      <AuthGuide mode="signup" currentField={currentField} fieldValues={formData} />

      <div className="min-h-screen w-full flex bg-background">
        {/* Decorative Side Panel - Desktop Only */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center p-12"
        >
          {/* Background Texture & Gradient */}
          <div className="absolute inset-0 bg-texture-farm opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-foreground/20" />

          {/* Organic Shapes */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-havens-golden/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative z-10 max-w-lg text-white">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Start Your <br />
              <span className="text-havens-golden">Green Revolution</span>
            </h1>
            <p className="text-lg text-emerald-50/90 leading-relaxed mb-8">
              Create an account to access advanced weather insights, crop planning tools, and a community of like-minded farmers.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold">Optimize Yields</div>
                  <div className="text-sm text-emerald-100/70">Data-driven farming decisions</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold">Save Resources</div>
                  <div className="text-sm text-emerald-100/70">Smart irrigation management</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
          <div className="w-full max-w-lg space-y-8 my-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Smart Irrigation</h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h2>
                <p className="text-muted-foreground mt-2">Join thousands of sustainable farmers today</p>
              </div>

              {displayError && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3 text-destructive animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{displayError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name *</label>
                  <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onFocus={() => handleFocus("fullName")}
                      placeholder={INDIAN_FARMER_NAMES[Math.floor(Math.random() * INDIAN_FARMER_NAMES.length)]}
                      className="block w-full border-0 bg-transparent py-3 px-4 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mobile Number *</label>
                  <div className="flex rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                    <span className="flex select-none items-center pl-4 pr-2 text-muted-foreground font-medium border-r border-border/50">
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
                      className="block flex-1 border-0 bg-transparent py-3 pl-3 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm sm:leading-6"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password *</label>
                    <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => handleFocus("password")}
                        placeholder="••••••••"
                        className="block w-full border-0 bg-transparent py-3 px-4 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password *</label>
                    <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => handleFocus("confirmPassword")}
                        placeholder="••••••••"
                        className="block w-full border-0 bg-transparent py-3 px-4 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Country *</label>
                    <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        onFocus={() => handleFocus("country")}
                        className="block w-full border-0 bg-transparent py-3 px-4 text-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">State/Province *</label>
                    <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        onFocus={() => handleFocus("state")}
                        className="block w-full border-0 bg-transparent py-3 px-4 text-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
                        disabled={isLoading}
                      >
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Experience Level *</label>
                  <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      onFocus={() => handleFocus("experienceLevel")}
                      className="block w-full border-0 bg-transparent py-3 px-4 text-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
                      disabled={isLoading}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="experienced">Experienced</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30 mt-4"
                >
                  {isLoading ? "Creating Account..." : "Create Farm Account"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group">
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
