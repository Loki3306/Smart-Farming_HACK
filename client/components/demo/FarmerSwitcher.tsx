
import React, { useState } from 'react';
import {
    Users,
    ChevronDown,
    Leaf,
    Wheat,
    Droplets,
    Sprout
} from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const DEMO_FARMERS = [
    {
        name: 'Ravi Kumar',
        phone: '+919876543210',
        crop: 'Wheat & Rice',
        icon: Wheat,
        color: 'text-amber-500'
    },
    {
        name: 'Anita Desai',
        phone: '+919876543211',
        crop: 'Cotton & Soy',
        icon: Leaf,
        color: 'text-green-500'
    },
    {
        name: 'Vikram Singh',
        phone: '+919876543212',
        crop: 'Sugarcane',
        icon: Droplets,
        color: 'text-blue-500'
    },
    {
        name: 'Priya Patel',
        phone: '+919876543213',
        crop: 'Vegetables',
        icon: Sprout,
        color: 'text-emerald-500'
    }
];

export const FarmerSwitcher: React.FC = () => {
    const { user, login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSwitchFarmer = async (farmer: typeof DEMO_FARMERS[0]) => {
        if (user?.phone === farmer.phone) {
            toast({
                title: "Already Active",
                description: `You are currently viewing ${farmer.name}'s farm.`,
            });
            return;
        }

        setIsLoading(true);

        try {
            // Store original user if not already stored
            const storedOriginal = localStorage.getItem('original_user');
            if (!storedOriginal && user) {
                localStorage.setItem('original_user', JSON.stringify({
                    phone: user.phone,
                    name: user.fullName || 'Original User'
                }));
            }

            // Login as demo farmer
            await login({
                phone: farmer.phone,
                password: 'demo123'
            });

            localStorage.removeItem('current_farm_id');

            toast({
                title: `Switched to ${farmer.name}`,
                description: `Viewing demo farm for ${farmer.crop}`,
            });

            // Reload to ensure all contexts refresh cleanly
            window.location.reload();

        } catch (error) {
            console.error('Failed to switch farmer:', error);
            toast({
                title: "Switch Failed",
                description: "Could not switch to demo farmer.",
                variant: "destructive"
            });
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all"
                >
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Demo Farms</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Select Demo Farmer</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DEMO_FARMERS.map((farmer) => (
                    <DropdownMenuItem
                        key={farmer.phone}
                        onClick={() => handleSwitchFarmer(farmer)}
                        disabled={isLoading || user?.phone === farmer.phone}
                        className="cursor-pointer gap-3 py-3"
                    >
                        <div className={`p-2 rounded-full bg-muted ${user?.phone === farmer.phone ? 'bg-primary/10' : ''}`}>
                            <farmer.icon className={`w-4 h-4 ${farmer.color}`} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className={`font-medium ${user?.phone === farmer.phone ? 'text-primary' : ''}`}>
                                {farmer.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {farmer.crop}
                            </span>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
