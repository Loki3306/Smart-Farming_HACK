import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Briefcase, MapPin, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { motion } from "framer-motion";

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (phone.startsWith("+91")) {
      const digits = phone.substring(3);
      return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
    }
    return phone;
  };

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "N/A";
      }
      
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(dateObj);
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground">
                    {user?.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .substring(0, 2) || "U"}
                  </span>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground">
                    {user?.fullName || "User"}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {user?.experienceLevel === "beginner" && "Beginner Farmer"}
                    {user?.experienceLevel === "intermediate" && "Intermediate Farmer"}
                    {user?.experienceLevel === "experienced" && "Experienced Farmer"}
                  </p>
                  {user?.isDemoUser && (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      Demo Account
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium text-foreground">
                        {user?.phone ? formatPhone(user.phone) : "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium text-foreground break-all">
                        {user?.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Experience Level</p>
                      <p className="font-medium text-foreground capitalize">
                        {user?.experienceLevel?.replace("-", " ") || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">
                        {user?.state || "Not specified"}, {user?.country || "India"}
                      </p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium text-foreground">
                        {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Onboarding Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <p className="font-medium text-foreground">
                        {user?.hasCompletedOnboarding ? (
                          <span className="text-green-600">✓ Onboarding Complete</span>
                        ) : (
                          <span className="text-orange-600">⚠ Onboarding Pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack}>
                    Go to Dashboard
                  </Button>
                  <Button variant="destructive" onClick={handleLogout}>
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
