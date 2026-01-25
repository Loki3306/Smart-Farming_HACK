import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import anime from 'animejs';
import { getFarmMapping, FarmMappingData, SectionData } from '../utils/farmMappingStorage';
import {
  MapPin, Sprout, Droplet, Layers, Map, Droplets,
  Plus, ArrowRight, Eye, Pencil, Sun,
  Leaf, Waves
} from 'lucide-react';

const FarmOverviewPage: React.FC = () => {
  const { t } = useTranslation('farmOverview');
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
        targets: `#section-${section.id}`, // Fixed: Removed spaces for valid selector
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-2" />
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
              <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>

          {/* Sections skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-gray-800 rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty State - No Farm Data
  if (!farmData || (!farmData.farmBoundary && farmData.sections.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div ref={containerRef} className="max-w-2xl mx-auto pt-12">
          <div className="text-center animate-fade-in">
            {/* Animated Icon */}
            <div className="absolute inset-0 bg-emerald-400 rounded-full opacity-20 animate-pulse" />
            <div className="absolute inset-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Leaf className="w-12 h-12 text-white animate-float" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            {t('emptyState.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {t('emptyState.description')}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleEditClick}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-green-700 hover:bg-green-800 text-white font-semibold text-lg rounded-2xl shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <MapPin className="w-6 h-6" />
            <span>{t('emptyState.startMapping')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Feature hints */}
          <div className="mt-16 grid grid-cols-3 gap-6 text-center">
            {[
              { icon: <Map className="w-6 h-6" />, label: t('emptyState.features.boundaries') },
              { icon: <Layers className="w-6 h-6" />, label: t('emptyState.features.sections') },
              { icon: <Droplets className="w-6 h-6" />, label: t('emptyState.features.water') },
            ].map((item, i) => (
              <div key={i} className="opacity-0 quick-action">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-green-700">
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ); // Fixed: Removed extra closing </div> tag here
  }

  // Main Farm Overview
  return (
    <div className="min-h-screen">
      <div ref={containerRef} className="max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">

        {/* Header */}
        <div className="animate-header opacity-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {farmData.sections.length} {t('subtitle', { count: totalArea.toFixed(1) })}
            </p>
          </div>

          {/* Weather widget placeholder */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Sun className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">28°</p>
              <p className="text-xs text-gray-500">{t('weather.sunny')}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleVisualizeClick}
            className="quick-action opacity-0 inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 group"
          >
            <Eye className="w-5 h-5 text-green-700" />
            <span className="font-medium text-gray-700 dark:text-gray-200">{t('quickActions.viewMap')}</span>
          </button>

          <button
            onClick={handleEditClick}
            className="quick-action opacity-0 inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300"
          >
            <Pencil className="w-5 h-5 text-green-700" />
            <span className="font-medium text-gray-700 dark:text-gray-200">{t('quickActions.editFarm')}</span>
          </button>

          <button
            onClick={() => navigate('/irrigation-planner')}
            className="quick-action opacity-0 inline-flex items-center gap-2 px-5 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-md transition-all duration-300"
          >
            <Droplets className="w-5 h-5" />
            <span className="font-medium">{t('quickActions.planIrrigation')}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Layers className="w-6 h-6" />}
            label={t('stats.sections')}
            value={farmData.sections.length}
            color="emerald"
            delay={0}
          />
          <StatCard
            icon={<Map className="w-6 h-6" />}
            label={t('stats.totalArea')}
            value={totalArea}
            suffix={t('stats.acres')}
            color="emerald"
            delay={80}
          />
          <StatCard
            icon={<Droplets className="w-6 h-6" />}
            label={t('stats.waterSources')}
            value={totalWaterSources}
            color="emerald"
            delay={160}
          />
          <StatCard
            icon={<Sprout className="w-6 h-6" />}
            label={t('stats.cropTypes')}
            value={uniqueCrops.length}
            color="emerald"
            delay={240}
          />
        </div>

        {/* Sections Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-green-700" />
              {t('sections.title')}
            </h2>
            <button
              onClick={handleEditClick}
              className="text-sm font-medium text-green-700 hover:text-green-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {t('sections.addSection')}
            </button>
          </div>

          {farmData.sections.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Layers className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('sections.noSections')}</h3>
              <p className="text-gray-500 mb-4">{t('sections.noSectionsDesc')}</p>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('sections.createSection')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farmData.sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  farmData={farmData}
                  isSelected={selectedSection?.id === section.id}
                  onClick={() => handleSectionClick(section)}
                  onEdit={handleEditClick}
                  index={index}
                  editLabel={t('sections.edit')}
                  irrigateLabel={t('sections.irrigate')}
                  acresLabel={t('stats.acres')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Water Sources Summary */}
        {farmData.waterSources && farmData.waterSources.length > 0 && (
          <div className="bg-green-50/40 backdrop-blur-sm border border-green-100/50 dark:bg-gray-800 rounded-2xl shadow-sm p-5 md:p-7">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <Waves className="w-5 h-5 text-green-700 dark:text-green-400" />
              </div>
              {t('waterSources.title')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {farmData.waterSources.map((source, i) => {
                // Fallback name logic: if name is generic (wrapped in parens) or empty, use type
                const displayName = (!source.name || source.name.startsWith('('))
                  ? source.type.charAt(0).toUpperCase() + source.type.slice(1).replace('_', ' ')
                  : source.name;

                return (
                  <div
                    key={source.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border border-gray-100 hover:border-green-100 dark:hover:border-green-800/50 group"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shadow-sm text-green-600 group-hover:scale-105 transition-transform">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 dark:text-gray-200 truncate text-sm">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-70">
                        {source.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                );
              })}
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
    emerald: 'bg-green-50 dark:bg-green-900/30 text-green-700',
    blue: 'bg-green-50 dark:bg-green-900/30 text-green-700',
    cyan: 'bg-green-50 dark:bg-green-900/30 text-green-700',
    amber: 'bg-green-50 dark:bg-green-900/30 text-green-700',
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
      className="stat-card opacity-0 relative p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden cursor-pointer"
    >
      {/* Background glow - refined */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${colors[color].split(' ')[0]} opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-700 blur-2xl`} />

      <div className="flex flex-col gap-4 relative z-10">
        {/* Icon - rounded full for less boxy look */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors[color]} transition-colors group-hover:bg-white/80 dark:group-hover:bg-gray-700`}>
          {icon}
        </div>

        <div>
          {/* Label */}
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>

          {/* Value */}
          <span ref={valueRef} className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            0{suffix}
          </span>
        </div>
      </div>
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
  editLabel: string;
  irrigateLabel: string;
  acresLabel: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  farmData,
  isSelected,
  onClick,
  onEdit,
  index,
  editLabel,
  irrigateLabel,
  acresLabel
}) => {
  const waterSource = section.nearestWaterSource
    ? farmData?.waterSources?.find(ws => ws.id === section.nearestWaterSource?.id)
    : null;

  return (
    <div
      id={`section-${section.id}`} // Fixed: Removed spaces
      onClick={onClick}
      className={`
        section-card opacity-0 relative p-5 md:p-7 rounded-2xl cursor-pointer transition-all duration-300
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        ${isSelected
          ? 'ring-2 ring-green-500 shadow-md bg-green-50/50'
          : 'hover:shadow-md hover:border-green-200 hover:bg-gray-50'
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
      <div className="flex items-start gap-5 mt-4">
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
            {section.area.toFixed(2)} {acresLabel}
          </p>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-3 mt-6">
        {section.cropType && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
            <Sprout className="w-3.5 h-3.5" />
            {section.cropType}
          </span>
        )}

        {section.soilType && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
            <Layers className="w-3.5 h-3.5" />
            {section.soilType}
          </span>
        )}

        {section.irrigationType && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
            <Droplet className="w-3.5 h-3.5" />
            {section.irrigationType}
          </span>
        )}
      </div>

      {/* Water source info */}
      {waterSource && (
        <div className="mt-7 flex items-center gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100">
          <Waves className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{waterSource.name}</span>
          <span className="text-xs text-gray-500 ml-auto">
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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-medium text-sm rounded-xl transition-colors"
          >
            <Pencil className="w-4 h-4" />
            {editLabel}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition-colors"
          >
            {irrigateLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default FarmOverviewPage;