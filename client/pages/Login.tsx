import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGuide } from "@/components/AuthGuide";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, skipLoginAsDemo, error, clearError, isLoading } = useAuth();

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
      // Navigation will be handled by router based on onboarding status
      // If completed, ProtectedRoute will allow access to dashboard
      // If not completed, will redirect to onboarding
      navigate("/dashboard");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleDemoLogin = () => {
    skipLoginAsDemo();
    navigate("/dashboard");
  };

  const displayError = error || localError;

  return (
    <>
      {/* Auth Guide */}
      <AuthGuide mode="login" currentField={currentField} fieldValues={{ phone, password }} />

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Smart Irrigation
              </h1>
              <p className="text-muted-foreground mt-2">Sign in to your farm</p>
            </div>

            {/* Error Alert */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{displayError}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mobile Number
                </label>
                <div className="flex flex-nowrap items-stretch">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-foreground whitespace-nowrap">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setCurrentField("phone")}
                    placeholder="9876543210"
                    maxLength={10}
                    className="flex-1 min-w-0 px-4 py-2 rounded-r-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setCurrentField("password")}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Demo Mode */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full"
              >
                Continue as Demo Farmer
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                No account needed. Changes are not saved.
              </p>
            </div>

            {/* Signup Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>

            {/* Test Credentials Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Test Account:</strong>
                <br />
                Email: test@example.com
                <br />
                Password: password123
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
