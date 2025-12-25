import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Demo Farmer Switcher
 * Quick switch between demo accounts for judges with minimize/maximize and restore functionality
 */

const DEMO_FARMERS = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+919876543210',
    icon: '🔴',
    description: 'Critical Issues',
    scenario: 'Very low moisture & nitrogen, alkaline soil',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '+919876543211',
    icon: '🟡',
    description: 'Moderate Care',
    scenario: 'Minor nutrient deficiencies',
  },
  {
    id: '3',
    name: 'Arjun Patel',
    phone: '+919876543212',
    icon: '🟢',
    description: 'Optimal Conditions',
    scenario: 'Perfect soil health, just monitoring',
  },
  {
    id: '4',
    name: 'Lakshmi Reddy',
    phone: '+919876543213',
    icon: '🔴',
    description: 'Heat Stress',
    scenario: 'High temperature, emergency cooling needed',
  },
];

export function FarmerSwitcher() {
  const { user, login, logout } = useAuth();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [originalUser, setOriginalUser] = useState<{ phone: string; name: string } | null>(null);

  const currentFarmer = DEMO_FARMERS.find(f => f.phone === user?.phone);

  // Store the original user when component mounts (first login)
  useEffect(() => {
    if (user && !originalUser) {
      const storedOriginal = localStorage.getItem('original_user');
      if (storedOriginal) {
        setOriginalUser(JSON.parse(storedOriginal));
      } else {
        // First time - store current user as original
        const original = { phone: user.phone, name: user.fullName };
        setOriginalUser(original);
        localStorage.setItem('original_user', JSON.stringify(original));
      }
    }
  }, [user]);

  const handleSwitch = async (farmerId: string) => {
    const farmer = DEMO_FARMERS.find(f => f.id === farmerId);
    if (!farmer) return;

    setSwitching(true);
    try {
      // Quick switch with demo password
      await login({ phone: farmer.phone, password: 'demo123' });

      toast({
        title: `Switched to ${farmer.name}`,
        description: `${farmer.icon} ${farmer.description}: ${farmer.scenario}`,
        duration: 4000,
      });

      // Force recalculation of farm selection for the new user
      localStorage.removeItem('current_farm_id');

      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Switch failed',
        description: 'Make sure database is seeded with demo farmers',
        variant: 'destructive',
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleRestoreOriginal = async () => {
    if (!originalUser) {
      toast({
        title: 'No original account',
        description: 'Cannot restore original account',
        variant: 'destructive',
      });
      return;
    }

    setSwitching(true);

    // Check if original account is a demo farmer
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
        setSwitching(false);
      }
    } else {
      // Real user account - need to logout and redirect to login
      setSwitching(false);
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
          window.location.href = '/login';
        } catch (error) {
          window.location.href = '/login';
        }
      }, 1500);
    }
  };

  const handleClearOriginal = () => {
    localStorage.removeItem('original_user');
    setOriginalUser({ phone: user?.phone || '', name: user?.fullName || '' });
    toast({
      title: 'Original account reset',
      description: 'Current account set as original',
      duration: 2000,
    });
  };

  if (!user) return null;

  const isOnOriginalAccount = originalUser?.phone === user?.phone;

  return (
    <div className="fixed top-4 right-4 z-50 bg-card/95 dark:bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg max-w-md transition-all">
      {/* Minimized State */}
      {isMinimized ? (
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm text-foreground">Demo Mode</span>
            {!isOnOriginalAccount && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Switched
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isOnOriginalAccount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestoreOriginal}
                disabled={switching}
                className="h-7 px-2"
                title="Restore original account"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="h-7 px-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Expanded State */
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-foreground">Demo Mode</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-7 px-2"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {/* Current User Info */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <div className="flex items-center justify-between">
                <div>
                  Current: <span className="font-semibold">{currentFarmer?.name || user?.fullName}</span>
                  <br />
                  <span className="text-muted-foreground">
                    {currentFarmer?.icon} {currentFarmer?.description}
                  </span>
                </div>
                {!isOnOriginalAccount && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    Switched
                  </span>
                )}
              </div>
            </div>

            {/* Original User Info */}
            {originalUser && !isOnOriginalAccount && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center justify-between">
                <div>
                  Original: <span className="font-semibold">{originalUser.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestoreOriginal}
                  disabled={switching}
                  className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              </div>
            )}

            {/* Farmer Switcher */}
            <Select onValueChange={handleSwitch} disabled={switching}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Switch to another farmer..." />
              </SelectTrigger>
              <SelectContent>
                {DEMO_FARMERS.map((farmer) => (
                  <SelectItem
                    key={farmer.id}
                    value={farmer.id}
                    disabled={farmer.phone === user?.phone}
                  >
                    <div className="flex items-center gap-2">
                      <span>{farmer.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{farmer.name}</div>
                        <div className="text-xs text-muted-foreground">{farmer.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Info Footer */}
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs text-muted-foreground">
                💡 Each farmer has different sensor data to showcase AI adaptability
              </div>

              {/* Reset Original Account */}
              {originalUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearOriginal}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground w-full"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset Original Account
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
