import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Smartphone,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  Volume2,
  Vibrate,
  Mail,
  MessageSquare,
  Loader2,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const Settings: React.FC = () => {
  const { logout, user, updateProfile } = useAuth();
  const { settings, isLoading, isSaving, updateSettings } = useSettings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleToggle = async (key: keyof typeof settings, currentValue: boolean) => {
    await updateSettings({ [key]: !currentValue });
    toast({
      title: "Setting updated",
      description: "Your preference has been saved.",
      duration: 2000,
    });
  };

  const handleLanguageChange = async (lang: string) => {
    await updateSettings({ language: lang });
    toast({
      title: "Language changed",
      description: `Language set to ${languages.find(l => l.code === lang)?.name || lang}`,
      duration: 2000,
    });
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updateSettings({ theme });
    toast({
      title: "Theme changed",
      description: `Theme set to ${theme}`,
      duration: 2000,
    });
  };

  const menuItems = [
    {
      id: "profile",
      icon: User,
      label: "Profile Settings",
      description: "Update your personal information",
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notification Preferences",
      description: "Manage how you receive notifications",
    },
    {
      id: "alerts",
      icon: Shield,
      label: "Alert Settings",
      description: "Configure farm monitoring alerts",
    },
    {
      id: "language",
      icon: Globe,
      label: "Language & Region",
      description: "Change language and regional settings",
    },
    {
      id: "appearance",
      icon: Palette,
      label: "Appearance",
      description: "Customize the look and feel",
    },
    {
      id: "devices",
      icon: Smartphone,
      label: "Connected Devices",
      description: "Manage sensors and IoT devices",
    },
    {
      id: "help",
      icon: HelpCircle,
      label: "Help & Support",
      description: "Get help and contact support",
    },
  ];

  const languages = [
    { code: "en", name: "English", native: "English" },
    { code: "hi", name: "Hindi", native: "हिंदी" },
    { code: "mr", name: "Marathi", native: "मराठी" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  ];

  const notificationSettings = [
    {
      key: "pushNotifications" as const,
      label: "Push Notifications",
      description: "Receive push notifications on your device",
      icon: Bell,
    },
    {
      key: "emailNotifications" as const,
      label: "Email Notifications",
      description: "Receive important updates via email",
      icon: Mail,
    },
    {
      key: "smsAlerts" as const,
      label: "SMS Alerts",
      description: "Receive critical alerts via SMS",
      icon: MessageSquare,
    },
    {
      key: "notificationSound" as const,
      label: "Notification Sound",
      description: "Play sound for new notifications",
      icon: Volume2,
    },
    {
      key: "vibration" as const,
      label: "Vibration",
      description: "Vibrate for notifications",
      icon: Vibrate,
    },
  ];

  const alertSettings = [
    {
      key: "moistureAlerts" as const,
      label: "Low Moisture Alerts",
      description: "Alert when soil moisture drops below threshold",
    },
    {
      key: "weatherAlerts" as const,
      label: "Weather Alerts",
      description: "Severe weather warnings and forecasts",
    },
    {
      key: "pestAlerts" as const,
      label: "Pest Alerts",
      description: "Pest and disease outbreak warnings",
    },
    {
      key: "harvestAlerts" as const,
      label: "Harvest Reminders",
      description: "Reminders for optimal harvest time",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>
        <AnimatePresence>
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <button
                onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all ${activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted border border-border"
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.label}</h3>
                  <p
                    className={`text-sm truncate ${activeSection === item.id ? "opacity-80" : "text-muted-foreground"
                      }`}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${activeSection === item.id ? "rotate-90" : ""
                    }`}
                />
              </button>
            </motion.div>
          ))}

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: menuItems.length * 0.05 }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-4 rounded-lg text-left bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          {!activeSection && (
            <Card className="p-12 text-center">
              <SettingsIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select a Setting
              </h3>
              <p className="text-muted-foreground">
                Choose a category from the menu to view and modify settings
              </p>
            </Card>
          )}

          {/* Profile Settings */}
          {activeSection === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">
                    Profile Settings
                  </h2>
                  <Button
                    variant={isEditingProfile ? "default" : "outline"}
                    disabled={isSavingProfile}
                    onClick={async () => {
                      if (isEditingProfile) {
                        // Save changes to database
                        setIsSavingProfile(true);
                        try {
                          await updateProfile({
                            fullName: profileForm.fullName,
                            email: profileForm.email,
                            phone: profileForm.phone,
                          });
                          toast({
                            title: "Profile updated",
                            description: "Your personal information has been saved.",
                            duration: 2000,
                          });
                          setIsEditingProfile(false);
                        } catch (error) {
                          toast({
                            title: "Failed to update",
                            description: error instanceof Error ? error.message : "Please try again.",
                            variant: "destructive",
                            duration: 3000,
                          });
                        } finally {
                          setIsSavingProfile(false);
                        }
                      } else {
                        setIsEditingProfile(true);
                      }
                    }}
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isEditingProfile ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      "Edit Profile"
                    )}
                  </Button>
                </div>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Full Name
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{user?.fullName || "Not set"}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Phone Number
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{user?.phone || "Not set"}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      Email Address
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <p className="text-foreground font-medium">{user?.email || "Not set"}</p>
                    )}
                  </div>

                  {/* Read-only info */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground mb-2">Account Info</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Experience: </span>
                        <span className="font-medium capitalize">{user?.experienceLevel || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Member since: </span>
                        <span className="font-medium">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Notification Settings */}
          {activeSection === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  {notificationSettings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <setting.icon className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{setting.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(setting.key, settings[setting.key] as boolean)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings[setting.key] ? "bg-primary" : "bg-muted"
                          }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-transform ${settings[setting.key] ? "right-1" : "left-1"
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Alert Settings */}
          {activeSection === "alerts" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Alert Settings
                </h2>
                <div className="space-y-4">
                  {alertSettings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{setting.label}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(setting.key, settings[setting.key] as boolean)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings[setting.key] ? "bg-primary" : "bg-muted"
                          }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-transform ${settings[setting.key] ? "right-1" : "left-1"
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Language Settings */}
          {activeSection === "language" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Language & Region
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-4 rounded-lg border text-left transition-all ${settings.language === lang.code
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{lang.native}</h4>
                          <p className="text-sm text-muted-foreground">{lang.name}</p>
                        </div>
                        {settings.language === lang.code && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Appearance Settings */}
          {activeSection === "appearance" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Appearance</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Theme</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleThemeChange("light")}
                        className={`flex-1 p-4 rounded-lg border text-center transition-all ${settings.theme === "light"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <Sun className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium">Light</span>
                        {settings.theme === "light" && (
                          <Check className="w-4 h-4 mx-auto mt-2 text-primary" />
                        )}
                      </button>
                      <button
                        onClick={() => handleThemeChange("dark")}
                        className={`flex-1 p-4 rounded-lg border text-center transition-all ${settings.theme === "dark"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <Moon className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium">Dark</span>
                        {settings.theme === "dark" && (
                          <Check className="w-4 h-4 mx-auto mt-2 text-primary" />
                        )}
                      </button>
                      <button
                        onClick={() => handleThemeChange("system")}
                        className={`flex-1 p-4 rounded-lg border text-center transition-all ${settings.theme === "system"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <Smartphone className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium">System</span>
                        {settings.theme === "system" && (
                          <Check className="w-4 h-4 mx-auto mt-2 text-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Profile Settings */}
          {activeSection === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Profile Settings
                </h2>
                <Button onClick={() => navigate("/profile")}>
                  Go to Profile Page
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Connected Devices */}
          {activeSection === "devices" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Connected Devices
                </h2>
                <p className="text-muted-foreground mb-4">
                  Manage your IoT sensors and connected devices
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <h4 className="font-medium">Soil Moisture Sensor #1</h4>
                        <p className="text-sm text-muted-foreground">Online • Last sync 5m ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <h4 className="font-medium">Weather Station</h4>
                        <p className="text-sm text-muted-foreground">Online • Last sync 2m ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div>
                        <h4 className="font-medium">Irrigation Controller</h4>
                        <p className="text-sm text-muted-foreground">
                          Low Battery • Last sync 1h ago
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
                <Button className="mt-6 w-full">Add New Device</Button>
              </Card>
            </motion.div>
          )}

          {/* Help & Support */}
          {activeSection === "help" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Help & Support</h2>

                {/* FAQ Accordion */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide mb-3">
                    Frequently Asked Questions
                  </h3>
                  {[
                    {
                      question: "How do I connect my soil sensors?",
                      answer: "Go to Settings → Connected Devices and click 'Add New Device'. Follow the setup wizard to pair your sensors via Bluetooth or Wi-Fi."
                    },
                    {
                      question: "How accurate is the weather forecast?",
                      answer: "Our weather data is sourced from OpenWeatherMap and updated every 3 hours. We provide 7-day forecasts with 85%+ accuracy for local conditions."
                    },
                    {
                      question: "Can I use the app offline?",
                      answer: "Yes! The app caches your farm data and recent forecasts. However, real-time sensor data and AI recommendations require an internet connection."
                    },
                    {
                      question: "How do I change crop recommendations?",
                      answer: "Navigate to My Farm → Edit Details and update your current crop. The AI will recalibrate recommendations based on your new crop selection."
                    },
                    {
                      question: "What languages are supported?",
                      answer: "Currently we support English and Hindi. More regional languages including Marathi, Tamil, Telugu, Kannada, Punjabi, and Gujarati are coming soon!"
                    },
                    {
                      question: "How can I reset my irrigation schedule?",
                      answer: "Go to Dashboard → Control Center and click on any active irrigation. You can modify, pause, or cancel schedules from there."
                    },
                  ].map((faq, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left"
                      >
                        <span className="font-medium text-foreground pr-4">{faq.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${expandedFaq === index ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="p-4 text-muted-foreground text-sm bg-card">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Contact Support */}
                <div className="space-y-3">
                  <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
                    Contact Support
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a
                      href="mailto:support@smartfarm.app"
                      className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-muted-foreground">support@smartfarm.app</p>
                      </div>
                    </a>
                    <a
                      href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20Krushi%20Unnati%20app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">WhatsApp</p>
                        <p className="text-sm text-green-600 dark:text-green-400">Chat with us</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* App Version */}
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Krushi Unnati Version 1.0.0</p>
                  <p className="text-xs text-muted-foreground mt-1">© 2024 Krushi Unnati Technologies</p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
