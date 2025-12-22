import { useState } from 'react';
import { Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Demo Farmer Switcher
 * Quick switch between demo accounts for judges
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
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  const currentFarmer = DEMO_FARMERS.find(f => f.phone === user?.phone);

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

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-sm text-gray-700">Demo Mode</span>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600">
          Current: <span className="font-semibold">{currentFarmer?.name}</span>
          <br />
          <span className="text-gray-500">
            {currentFarmer?.icon} {currentFarmer?.description}
          </span>
        </div>

        <Select onValueChange={handleSwitch} disabled={switching}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Switch farmer..." />
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
                    <div className="text-xs text-gray-500">{farmer.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="pt-2 border-t text-xs text-gray-500">
          💡 Each farmer has different sensor data to showcase AI adaptability
        </div>
      </div>
    </div>
  );
}
