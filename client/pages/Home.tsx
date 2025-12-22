import React, { useEffect, useState } from "react";
import { MapPin, Activity, User, LogOut, RotateCcw } from "lucide-react";
import { SoilMoisture } from "../components/dashboard/SoilMoisture";
import { WeatherCard } from "../components/dashboard/WeatherCard";
import { ControlCenter } from "../components/dashboard/ControlCenter";
import { ActionLog } from "../components/dashboard/ActionLog";
import { FarmerSwitcher } from "../components/demo/FarmerSwitcher";
import { useFarmContext } from "../context/FarmContext";
import { useAuth } from "../context/AuthContext";
import { useInterval } from "../hooks/useInterval";
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

export const Home: React.FC = () => {
  const { refreshSensorData, refreshWeather, refreshBlockchain, systemStatus } =
    useFarmContext();
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [originalUser, setOriginalUser] = useState<{ phone: string; name: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

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

  // Auto-refresh sensor data every 5 seconds
  useInterval(() => {
    refreshSensorData();
  }, 5000);

  // Auto-refresh weather every 30 seconds
  useInterval(() => {
    refreshWeather();
  }, 30000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-sage-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Demo Farmer Switcher */}
      <FarmerSwitcher />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4" data-tour-id="dashboard-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Smart Irrigation Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor and control your precision agriculture system
              </p>
            </div>

            {/* System Status & User Profile */}
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="px-6 py-4 bg-white rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">System</div>
                    <div className="font-semibold text-foreground">
                      {systemStatus?.isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                    <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
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
                      {/* Show Original User info if currently simulating someone else */}
                      {originalUser && originalUser.phone !== user?.phone && (
                        <p className="text-xs leading-none text-blue-600 mt-2 font-medium">
                          Original: {originalUser.name}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Restore Original Account Option */}
                  {originalUser && originalUser.phone !== user?.phone && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer text-blue-600 focus:text-blue-700 bg-blue-50/50"
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

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            <span>{systemStatus?.location || "Loading location..."}</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Soil Moisture Hero */}
            <div data-tour-id="soil-moisture">
              <SoilMoisture />
            </div>

            {/* Weather Card */}
            <div data-tour-id="weather-card">
              <WeatherCard />
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

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-border/20 text-center text-sm text-muted-foreground">
          <p>
            Real-time sensor data • Blockchain-verified actions • AI-powered
            optimization
          </p>
        </div>
      </div>
    </div>
  );
};