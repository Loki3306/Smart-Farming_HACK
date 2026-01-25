import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Sprout, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { AuthGuide } from "@/components/AuthGuide";
import { motion } from "framer-motion";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!phone || !password) {
      setLocalError("Please enter mobile number and password");
      return;
    }

    // Phone validation - must be 10 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setLocalError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      await login({ phone: `+91${phone}`, password });
      navigate("/dashboard");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };



  const displayError = error || localError;

  return (
    <>
      <AuthGuide mode="login" currentField={currentField} fieldValues={{ phone, password }} />

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
          <div className="absolute top-0 right-0 w-96 h-96 bg-havens-golden/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          {/* Content */}
          <div className="relative z-10 max-w-lg text-white">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Cultivating the <br />
              <span className="text-havens-golden">Future of Farming</span>
            </h1>
            <p className="text-lg text-emerald-50/90 leading-relaxed mb-8">
              Join a community of sustainable farmers using smart irrigation to maximize yield and conserve water. Your digital farming assistant awaits.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold mb-1">20%</div>
                <div className="text-sm text-emerald-100/70">Water Saved</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold mb-1">100+</div>
                <div className="text-sm text-emerald-100/70">Happy Farmers</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
          <div className="w-full max-w-md space-y-8">
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
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                <p className="text-muted-foreground mt-2">Enter your credentials to access your farm</p>
              </div>

              {displayError && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3 text-destructive animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{displayError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mobile Number</label>
                  <div className="flex rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                    <span className="flex select-none items-center pl-4 pr-2 text-muted-foreground font-medium border-r border-border/50">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setCurrentField("phone")}
                      placeholder="9876543210"
                      maxLength={10}
                      className="block flex-1 border-0 bg-transparent py-3 pl-3 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm sm:leading-6"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="rounded-xl shadow-sm ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary bg-card/50">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setCurrentField("password")}
                      placeholder="••••••••"
                      className="block w-full border-0 bg-transparent py-3 px-4 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm sm:leading-6 rounded-xl"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30"
                >
                  {isLoading ? "Signing in..." : "Sign In to Farm"}
                </Button>
              </form>



              <p className="mt-8 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group">
                  Sign up
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};
