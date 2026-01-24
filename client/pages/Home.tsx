import React, { useEffect, useState, useMemo } from "react";
import { MapPin, Activity, User, LogOut, RotateCcw, Sprout, Link, Bot, Sunrise, Sun, Sunset, Moon, CloudSun } from "lucide-react";
import { SoilMoisture } from "../components/dashboard/SoilMoisture";
import { ControlCenter } from "../components/dashboard/ControlCenter";
import { ActionLog } from "../components/dashboard/ActionLog";
import { LiveSensorGrid } from "../components/dashboard/LiveSensorGrid";
import { PrecisionAgriculture } from "../components/dashboard/PrecisionAgriculture";
import { FarmerSwitcher } from "../components/demo/FarmerSwitcher";
import { useFarmContext } from "../context/FarmContext";
import { useAuth } from "../context/AuthContext";
import { useInterval } from "../hooks/useInterval";
import { useSensorAlerts } from "../hooks/useSensorAlerts";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

// Time-based farm images (WebP optimized - 94% smaller!)
import morningImage from "../assets/farm-time-images/morning.webp";
import afternoonImage from "../assets/farm-time-images/afternoon.webp";
import eveningImage from "../assets/farm-time-images/evening.webp";
import nightImage from "../assets/farm-time-images/night.webp";
import farmerImage from "../assets/farm-time-images/farmer.webp";

export const Home: React.FC = () => {
  const { refreshSensorData, refreshWeather, refreshBlockchain, systemStatus } =
    useFarmContext();
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [originalUser, setOriginalUser] = useState<{ phone: string; name: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [farmName, setFarmName] = useState<string>("Your Farm");

  // Monitor sensor data and trigger alerts for critical conditions
  useSensorAlerts();

  // Fetch farm name on mount
  useEffect(() => {
    const fetchFarmName = async () => {
      try {
        const farmId = localStorage.getItem('current_farm_id');
        if (farmId) {
          const response = await fetch(`/api/farms/${farmId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.farm?.farm_name) {
              setFarmName(result.farm.farm_name);
            }
          }
        }
      } catch (error) {
        console.error('[Home] Error fetching farm name:', error);
      }
    };
    fetchFarmName();
  }, [user]);

  // Listen for IoT Notifications (Agronomy Alerts)
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const data = event.detail;

      toast({
        title: data.level === 'error' ? '🚨 Critical Alert' : data.level === 'warning' ? '⚠️ Warning' : 'ℹ️ Notification',
        description: data.message,
        variant: data.level === 'error' || data.level === 'warning' ? 'destructive' : 'default',
        duration: 5000,
      });
    };

    window.addEventListener('iot-notification', handleNotification as EventListener);
    return () => window.removeEventListener('iot-notification', handleNotification as EventListener);
  }, [toast]);

  // Determine which farm image to show based on current time
  const getTimeBasedImage = () => {
    const hour = new Date().getHours();
    console.log('Current hour:', hour); // Debug log

    if (hour >= 5 && hour < 12) {
      // Morning: 5 AM to 12 PM
      return { image: morningImage, period: 'Morning' };
    } else if (hour >= 12 && hour < 17) {
      // Afternoon: 12 PM to 5 PM
      return { image: afternoonImage, period: 'Afternoon' };
    } else if (hour >= 17 && hour < 20) {
      // Evening: 5 PM to 8 PM
      return { image: eveningImage, period: 'Evening' };
    } else {
      // Night: 8 PM to 5 AM
      return { image: nightImage, period: 'Night' };
    }
  };

  // Calculate time-based image immediately (not in useEffect for HMR compatibility)
  const timeData = getTimeBasedImage();
  const currentFarmImage = timeData.image;
  const timeOfDay = timeData.period;

  // Load original user from localStorage
  useEffect(() => {
    const storedOriginal = localStorage.getItem('original_user');
    if (storedOriginal) {
      setOriginalUser(JSON.parse(storedOriginal));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleRestoreOriginal = async () => {
    if (!originalUser) return;

    setIsRestoring(true);

    // Demo farmers list
    const DEMO_FARMERS = [
      { phone: '+919876543210' },
      { phone: '+919876543211' },
      { phone: '+919876543212' },
      { phone: '+919876543213' }
    ];

    const isDemoFarmer = DEMO_FARMERS.some(f => f.phone === originalUser.phone);

    if (isDemoFarmer) {
      // Demo farmer - use demo password
      try {
        await login({ phone: originalUser.phone, password: 'demo123' });

        toast({
          title: `Restored to ${originalUser.name}`,
          description: 'Back to your original account',
          duration: 3000,
        });

        localStorage.removeItem('current_farm_id');
        window.location.reload();
      } catch (error) {
        toast({
          title: 'Restore failed',
          description: 'Could not restore original account',
          variant: 'destructive',
        });
      } finally {
        setIsRestoring(false);
      }
    } else {
      // Real user account - need to logout and redirect to login
      setIsRestoring(false);
      toast({
        title: 'Restore Original Account',
        description: 'You will be logged out. Please log back in with your credentials.',
        duration: 4000,
      });

      // Small delay for toast to show
      setTimeout(async () => {
        try {
          await logout();
          localStorage.removeItem('current_farm_id');
          navigate('/login');
        } catch (error) {
          navigate('/login');
        }
      }, 1500);
    }
  };

  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    const names = user.fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.fullName[0].toUpperCase();
  };

  // Initial load
  useEffect(() => {
    refreshSensorData();
    refreshWeather();
    refreshBlockchain();
  }, [refreshSensorData, refreshWeather, refreshBlockchain]);

  // Auto-refresh sensor data every 30 seconds (optimized from 5s)
  useInterval(() => {
    refreshSensorData();
  }, 30000);

  // Auto-refresh weather every 5 minutes (optimized from 30s)
  useInterval(() => {
    refreshWeather();
  }, 300000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800">
      {/* Demo Farmer Switcher */}

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {farmName}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Live Farm View • Real-time Data
            </p>
          </div>

          {/* Status & Profile */}
          <div className="flex items-center gap-3">
            {/* Demo Farmer Switcher */}
            <FarmerSwitcher />

            {/* Status Badge */}
            <div className="hidden sm:flex px-4 py-2.5 bg-card rounded-xl shadow-sm border border-border/50 items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${systemStatus?.isOnline ? 'bg-primary animate-pulse' : 'bg-destructive'}`}></div>
              <div>
                <div className="text-xs text-muted-foreground">System</div>
                <div className="font-semibold text-foreground text-sm">
                  {systemStatus?.isOnline ? "Online" : "Offline"}
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                  <Avatar className="h-11 w-11 cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-lg border-2 border-card">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.phone || ""}
                    </p>
                    {originalUser && originalUser.phone !== user?.phone && (
                      <p className="text-xs leading-none text-primary mt-2 font-medium">
                        Original: {originalUser.name}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {originalUser && originalUser.phone !== user?.phone && (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer text-primary focus:text-primary bg-primary/5"
                      onClick={handleRestoreOriginal}
                      disabled={isRestoring}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>{isRestoring ? "Restoring..." : "Restore Original"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Time-Based Farm Banner with Personal Greeting */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/20 min-h-[360px] group">

            {/* 1. Background Scene - Full Cover */}
            <div className="absolute inset-0">
              <img
                key={timeOfDay}
                src={currentFarmImage}
                alt={`Farm - ${timeOfDay}`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:via-black/20" />
            </div>

            {/* 2. Content Overlay */}
            <div className="relative z-10 w-full h-full p-6 md:p-10 flex flex-col justify-start pt-8 md:justify-center md:pt-0 h-full min-h-[360px]">
              <div className="max-w-[65%] md:max-w-xl">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium mb-3">
                    {timeOfDay === 'Morning' && <Sunrise className="w-4 h-4 text-amber-300" />}
                    {timeOfDay === 'Afternoon' && <Sun className="w-4 h-4 text-yellow-300" />}
                    {timeOfDay === 'Evening' && <Sunset className="w-4 h-4 text-orange-300" />}
                    {timeOfDay === 'Night' && <Moon className="w-4 h-4 text-blue-200" />}
                    <span>{timeOfDay}</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-md">
                    {timeOfDay.includes('Morning')
                      ? 'Good Morning'
                      : timeOfDay.includes('Afternoon')
                        ? 'Good Afternoon'
                        : timeOfDay.includes('Evening')
                          ? 'Good Evening'
                          : 'Good Night'}, {user?.fullName?.split(' ')[0] || 'Farmer'}!
                  </h2>
                </div>

                <p className="text-white/90 text-lg mb-6 leading-relaxed max-w-lg drop-shadow-sm">
                  {timeOfDay.includes('Morning')
                    ? "The sun is rising over your fields. A perfect day to check on your crops!"
                    : timeOfDay.includes('Afternoon')
                      ? "Your crops are soaking up the sunshine. Everything looks great!"
                      : timeOfDay.includes('Evening')
                        ? "The sun is setting beautifully. Time to review today's farm activities!"
                        : "Time to rest. I'll keep watching over your farm while you sleep."}
                </p>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-100 rounded-lg font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Your crops are thriving
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Farmer Character - Standing in Scene */}
            <div className="absolute bottom-0 right-[-10px] md:right-10 w-[150px] md:w-[280px] pointer-events-none">
              <img
                src={farmerImage}
                alt="Farmer"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Location Bar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-md rounded-xl shadow-sm border border-amber-200/50 dark:border-amber-700/30 w-fit hover:shadow-md transition-all duration-300" data-tour-id="dashboard-header">
          <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-foreground font-medium">{systemStatus?.location || "Loading location..."}</span>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live IoT Sensor Monitor */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
              <LiveSensorGrid />
            </div>

            {/* Precision Agriculture Dashboard (Advanced Agronomy) */}
            <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
              <PrecisionAgriculture />
            </div>

            {/* Soil Moisture Hero */}
            <div data-tour-id="soil-moisture">
              <SoilMoisture />
            </div>
          </div>

          {/* Right Column - Controls & Sidebar */}
          <div className="space-y-6">
            {/* Control Center */}
            <div data-tour-id="control-center">
              <ControlCenter />
            </div>

            {/* Action Log */}
            <div data-tour-id="action-log">
              <ActionLog />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5"><Sprout className="w-4 h-4 text-green-500" /> Real-time sensor data</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1.5"><Link className="w-4 h-4 text-blue-500" /> Blockchain-verified actions</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1.5"><Bot className="w-4 h-4 text-purple-500" /> AI-powered optimization</span>
          </p>
        </div>
      </div>
    </div>
  );
};