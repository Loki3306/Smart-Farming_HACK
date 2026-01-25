import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { getFarmMapping, FarmMappingData, SectionData } from '../utils/farmMappingStorage';
import { 
  MapPin, Sprout, Droplet, Layers, Map, Droplets, 
  Plus, ArrowRight, Eye, Pencil, Sun,
  Leaf, Waves
} from 'lucide-react';

const FarmOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [farmData, setFarmData] = useState<FarmMappingData | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = getFarmMapping();
    setFarmData(data);
    setIsLoading(false);
  }, []);

  // Animate elements on load
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      // Animate header
      anime({
        targets: '.animate-header',
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 800,
        easing: 'easeOutExpo',
      });

      // Animate quick actions
      anime({
        targets: '.quick-action',
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.9, 1],
        delay: anime.stagger(100, { start: 200 }),
        duration: 600,
        easing: 'easeOutBack',
      });

      // Animate stat cards
      anime({
        targets: '.stat-card',
        opacity: [0, 1],
        translateY: [40, 0],
        delay: anime.stagger(80, { start: 300 }),
        duration: 700,
        easing: 'easeOutExpo',
      });

      // Animate section cards
      anime({
        targets: '.section-card',
        opacity: [0, 1],
        translateX: [-30, 0],
        delay: anime.stagger(100, { start: 500 }),
        duration: 600,
        easing: 'easeOutExpo',
      });
    }
  }, [isLoading, farmData]);

  const calculateFarmCenter = (): [number, number] | null => {
    if (farmData?.farmBoundary?.center) {
      return farmData.farmBoundary.center;
    }
    
    if (farmData?.sections && farmData.sections.length > 0) {
      let totalLat = 0;
      let totalLng = 0;
      let pointCount = 0;
      
      farmData.sections.forEach(section => {
        section.geometry.coordinates[0].forEach(coord => {
          totalLng += coord[0];
          totalLat += coord[1];
          pointCount++;
        });
      });
      
      return [totalLat / pointCount, totalLng / pointCount];
    }
    
    return null;
  };

  const handleEditClick = () => {
    const center = calculateFarmCenter();
    if (center) {
      navigate('/farm-mapping', { state: { center, zoom: 16 } });
    } else {
      navigate('/farm-mapping');
    }
  };

  const handleSectionClick = (section: SectionData) => {
    setSelectedSection(selectedSection?.id === section.id ? null : section);
    
    // Animate selection
    if (selectedSection?.id !== section.id) {
      anime({
        targets: `#section-${section.id}`,
        scale: [1, 1.02, 1],
        duration: 400,
        easing: 'easeOutElastic(1, 0.5)',
      });
    }
  };

  const handleVisualizeClick = () => {
    const center = calculateFarmCenter();
    if (center) {
      navigate('/farm-mapping', { state: { center, zoom: 16 } });
    } else {
      navigate('/farm-mapping');
    }
  };

  // Calculate totals
  const totalArea = farmData?.sections.reduce((sum, s) => sum + s.area, 0) || 0;
  const totalWaterSources = farmData?.waterSources?.length || 0;
  const uniqueCrops = [...new Set(farmData?.sections.map(s => s.cropType).filter(Boolean))];

  // Modern Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-2" />
            <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          
          {/* Quick actions skeleton */}
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            ))}
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-3xl shadow-sm animate-pulse" />
            ))}
          </div>
          
          {/* Sections skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-gray-800 rounded-3xl shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty State - No Farm Data
  if (!farmData || (!farmData.farmBoundary && farmData.sections.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
        <div ref={containerRef} className="max-w-2xl mx-auto pt-12">
          <div className="text-center animate-fade-in">
            {/* Animated Icon */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-20 animate-pulse" />
              <div className="absolute inset-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Leaf className="w-12 h-12 text-white animate-float" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Welcome to Your Farm
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start by mapping your farm boundaries and sections. It only takes a few minutes!
            </p>
            
            {/* CTA Button */}
            <button
              onClick={handleEditClick}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-105 transition-all duration-300"
            >
              <MapPin className="w-6 h-6" />
              <span>Start Mapping</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* Feature hints */}
            <div className="mt-16 grid grid-cols-3 gap-6 text-center">
              {[
                { icon: <Map className="w-6 h-6" />, label: 'Draw Boundaries' },
                { icon: <Layers className="w-6 h-6" />, label: 'Add Sections' },
                { icon: <Droplets className="w-6 h-6" />, label: 'Mark Water' },
              ].map((item, i) => (
                <div key={i} className="opacity-0 quick-action">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-emerald-600">
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Farm Overview
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
      <div ref={containerRef} className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="animate-header opacity-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              Farm Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {farmData.sections.length} sections • {totalArea.toFixed(1)} acres total
            </p>
          </div>
          
          {/* Weather widget placeholder */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20">
            <Sun className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">28°</p>
              <p className="text-xs text-gray-500">Sunny</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleVisualizeClick}
            className="quick-action opacity-0 inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border-2 border-transparent hover:border-emerald-400 hover:shadow-lg transition-all duration-300 group"
          >
            <Eye className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-gray-700 dark:text-gray-200">View Map</span>
          </button>
          
          <button
            onClick={handleEditClick}
            className="quick-action opacity-0 inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 rounded-full shadow-sm border-2 border-transparent hover:border-blue-400 hover:shadow-lg transition-all duration-300"
          >
            <Pencil className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700 dark:text-gray-200">Edit Farm</span>
          </button>
          
          <button
            onClick={() => navigate('/irrigation-planner')}
            className="quick-action opacity-0 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
          >
            <Droplets className="w-5 h-5" />
            <span className="font-medium">Plan Irrigation</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Layers className="w-6 h-6" />}
            label="Sections"
            value={farmData.sections.length}
            color="emerald"
            delay={0}
          />
          <StatCard
            icon={<Map className="w-6 h-6" />}
            label="Total Area"
            value={totalArea}
            suffix=" acres"
            color="blue"
            delay={80}
          />
          <StatCard
            icon={<Droplets className="w-6 h-6" />}
            label="Water Sources"
            value={totalWaterSources}
            color="cyan"
            delay={160}
          />
          <StatCard
            icon={<Sprout className="w-6 h-6" />}
            label="Crop Types"
            value={uniqueCrops.length}
            color="amber"
            delay={240}
          />
        </div>

        {/* Sections Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Your Sections
            </h2>
            <button
              onClick={handleEditClick}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>

          {farmData.sections.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Layers className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No sections yet</h3>
              <p className="text-gray-500 mb-4">Add your first section to get started</p>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Section
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmData.sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  farmData={farmData}
                  isSelected={selectedSection?.id === section.id}
                  onClick={() => handleSectionClick(section)}
                  onEdit={handleEditClick}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Water Sources Summary */}
        {farmData.waterSources && farmData.waterSources.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
              <Waves className="w-5 h-5 text-blue-500" />
              Water Sources
            </h2>
            <div className="flex flex-wrap gap-3">
              {farmData.waterSources.map((source, i) => (
                <div
                  key={source.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Droplets className="w-4 h-4" />
                  <span className="font-medium">{source.name}</span>
                  <span className="text-xs opacity-70">({source.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: 'emerald' | 'blue' | 'cyan' | 'amber';
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, suffix = '', color, delay }) => {
  const valueRef = useRef<HTMLSpanElement>(null);

  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };

  useEffect(() => {
    // Animate number
    if (valueRef.current) {
      const obj = { val: 0 };
      anime({
        targets: obj,
        val: value,
        duration: 1500,
        delay: delay + 400,
        easing: 'easeOutExpo',
        round: value < 10 ? 10 : 1,
        update: () => {
          if (valueRef.current) {
            valueRef.current.textContent = obj.val.toFixed(value < 10 && suffix ? 1 : 0) + suffix;
          }
        },
      });
    }
  }, [value, suffix, delay]);

  return (
    <div
      className="stat-card opacity-0 relative p-5 bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden cursor-pointer"
    >
      {/* Background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colors[color].split(' ')[0]} opacity-50 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500`} />
      
      {/* Icon */}
      <div className={`inline-flex p-3 rounded-2xl ${colors[color]} mb-3`}>
        {icon}
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>

      {/* Value */}
      <span ref={valueRef} className="text-3xl font-bold text-gray-900 dark:text-white">
        0{suffix}
      </span>
    </div>
  );
};

// Section Card Component
interface SectionCardProps {
  section: SectionData;
  farmData: FarmMappingData;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  index: number;
}

const SectionCard: React.FC<SectionCardProps> = ({ 
  section, 
  farmData, 
  isSelected, 
  onClick, 
  onEdit,
  index 
}) => {
  const waterSource = section.nearestWaterSource 
    ? farmData?.waterSources?.find(ws => ws.id === section.nearestWaterSource?.id)
    : null;

  return (
    <div
      id={`section-${section.id}`}
      onClick={onClick}
      className={`
        section-card opacity-0 relative p-5 rounded-3xl cursor-pointer transition-all duration-300
        bg-white dark:bg-gray-800 border-2
        ${isSelected 
          ? 'border-emerald-400 shadow-xl shadow-emerald-500/10' 
          : 'border-transparent shadow-sm hover:shadow-lg hover:border-emerald-200'
        }
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Color indicator */}
      <div 
        className="absolute top-0 left-0 w-full h-1.5 rounded-t-3xl"
        style={{ backgroundColor: section.color }}
      />

      {/* Header */}
      <div className="flex items-start gap-4 mt-2">
        <div
          className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg"
          style={{ backgroundColor: section.color }}
        >
          <Sprout className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white truncate">
            {section.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {section.area.toFixed(2)} acres
          </p>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {section.cropType && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
            <Sprout className="w-3.5 h-3.5" />
            {section.cropType}
          </span>
        )}
        
        {section.soilType && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
            <Layers className="w-3.5 h-3.5" />
            {section.soilType}
          </span>
        )}
        
        {section.irrigationType && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
            <Droplet className="w-3.5 h-3.5" />
            {section.irrigationType}
          </span>
        )}
      </div>

      {/* Water source info */}
      {waterSource && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
          <Waves className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">{waterSource.name}</span>
          <span className="text-xs text-blue-500 ml-auto">
            {section.nearestWaterSource?.distance.toFixed(0)}m
          </span>
        </div>
      )}

      {/* Expanded actions */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-xl transition-colors"
          >
            <Droplets className="w-4 h-4" />
            Irrigate
          </button>
        </div>
      )}
    </div>
  );
};

export default FarmOverviewPage;
