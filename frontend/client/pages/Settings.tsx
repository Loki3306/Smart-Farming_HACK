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
  Moon,
  Sun,
  Volume2,
  Vibrate,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const Settings: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [notificationSettings, setNotificationSettings] = useState<SettingToggle[]>([
    {
      id: "push",
      label: "Push Notifications",
      description: "Receive push notifications on your device",
      enabled: true,
    },
    {
      id: "email",
      label: "Email Notifications",
      description: "Receive important updates via email",
      enabled: false,
    },
    {
      id: "sms",
      label: "SMS Alerts",
      description: "Receive critical alerts via SMS",
      enabled: true,
    },
    {
      id: "sound",
      label: "Notification Sound",
      description: "Play sound for new notifications",
      enabled: true,
    },
    {
      id: "vibrate",
      label: "Vibration",
      description: "Vibrate for notifications",
      enabled: true,
    },
  ]);

  const [alertSettings, setAlertSettings] = useState<SettingToggle[]>([
    {
      id: "moisture",
      label: "Low Moisture Alerts",
      description: "Alert when soil moisture drops below threshold",
      enabled: true,
    },
    {
      id: "weather",
      label: "Weather Alerts",
      description: "Severe weather warnings and forecasts",
      enabled: true,
    },
    {
      id: "pest",
      label: "Pest Alerts",
      description: "Pest and disease outbreak warnings",
      enabled: true,
    },
    {
      id: "harvest",
      label: "Harvest Reminders",
      description: "Reminders for optimal harvest time",
      enabled: true,
    },
  ]);

  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const toggleSetting = (
    settings: SettingToggle[],
    setSettings: React.Dispatch<React.SetStateAction<SettingToggle[]>>,
    id: string
  ) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
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
                className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all ${
                  activeSection === item.id
                    ? "bg-primary text-white"
                    : "bg-white hover:bg-muted border border-border"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.label}</h3>
                  <p
                    className={`text-sm truncate ${
                      activeSection === item.id ? "opacity-80" : "text-muted-foreground"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${
                    activeSection === item.id ? "rotate-90" : ""
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
                      key={setting.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {setting.id === "push" && <Bell className="w-5 h-5 text-primary" />}
                        {setting.id === "email" && <Mail className="w-5 h-5 text-primary" />}
                        {setting.id === "sms" && (
                          <MessageSquare className="w-5 h-5 text-primary" />
                        )}
                        {setting.id === "sound" && (
                          <Volume2 className="w-5 h-5 text-primary" />
                        )}
                        {setting.id === "vibrate" && (
                          <Vibrate className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <h4 className="font-medium">{setting.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          toggleSetting(notificationSettings, setNotificationSettings, setting.id)
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          setting.enabled ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            setting.enabled ? "right-1" : "left-1"
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
                      key={setting.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{setting.label}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          toggleSetting(alertSettings, setAlertSettings, setting.id)
                        }
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          setting.enabled ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            setting.enabled ? "right-1" : "left-1"
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
                      onClick={() => setLanguage(lang.code)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        language === lang.code
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h4 className="font-medium">{lang.native}</h4>
                      <p className="text-sm text-muted-foreground">{lang.name}</p>
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
                        onClick={() => setTheme("light")}
                        className={`flex-1 p-4 rounded-lg border text-center transition-all ${
                          theme === "light"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Sun className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium">Light</span>
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 p-4 rounded-lg border text-center transition-all ${
                          theme === "dark"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Moon className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium">Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`flex-1 p-4 rounded-lg border text-center transition-all ${
                          theme === "system"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Smartphone className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-medium">System</span>
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
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <span className="font-medium">FAQs</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <span className="font-medium">User Guide</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <span className="font-medium">Contact Support</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <span className="font-medium">Report a Bug</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">App Version 1.0.0</p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
