import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import {
  getFarmMapping,
  getIrrigationPlans,
  saveIrrigationPlan,
  deleteIrrigationPlan,
  updateIrrigationPlanStatus,
  type SectionData,
  type WaterSource,
  type StoredIrrigationPlan,
  calculateDistance,
} from '../utils/farmMappingStorage';
import { IrrigationLayoutMap } from '../components/irrigation/IrrigationLayoutMap';
import {
  getIrrigationRecommendations,
  createIrrigationPlan,
  formatCurrency,
  getMethodDisplayName,
  setRegion,
  getCurrentRegion,
  getAllRegions,
  type IrrigationRecommendation,
  type IrrigationMethod,
} from '../services/irrigationPlanningService';
import { toast, Toaster } from 'react-hot-toast';
import {
  Droplets,
  CloudRain,
  Waves,
  PipetteIcon,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  IndianRupee,
  Clock,
  Gauge,
  Trash2,
  FileText,
  Loader2,
  Sprout,
  Navigation,
  Download,
  Plus,
  Search,
  Filter,
  Copy,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
  Eye,
  Map,
} from 'lucide-react';

const IrrigationPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [savedPlans, setSavedPlans] = useState<StoredIrrigationPlan[]>([]);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [selectedWaterSources, setSelectedWaterSources] = useState<WaterSource[]>([]);
  const [recommendations, setRecommendations] = useState<IrrigationRecommendation[]>([]);
  const [expandedMethod, setExpandedMethod] = useState<IrrigationMethod | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [showAllWaterSources, setShowAllWaterSources] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('MH');
  const [availableRegions] = useState(getAllRegions());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLayoutMap, setShowLayoutMap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate on load
  useEffect(() => {
    if (!isLoading) {
      anime({
        targets: '.animate-header',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 600,
        easing: 'easeOutExpo',
      });
      
      anime({
        targets: '.animate-tab',
        opacity: [0, 1],
        translateX: [-20, 0],
        delay: anime.stagger(100, { start: 200 }),
        duration: 500,
        easing: 'easeOutExpo',
      });
      
      anime({
        targets: '.animate-card',
        opacity: [0, 1],
        translateY: [30, 0],
        delay: anime.stagger(80, { start: 400 }),
        duration: 600,
        easing: 'easeOutExpo',
      });
    }
  }, [isLoading, activeTab]);

  useEffect(() => {
    loadData();
    // Set initial region
    const currentReg = getCurrentRegion();
    setSelectedRegion(currentReg.code);
    // Simulate loading for better UX
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const loadData = () => {
    const farmData = getFarmMapping();
    if (farmData) {
      setSections(farmData.sections || []);
      setWaterSources(farmData.waterSources || []);
    }
    setSavedPlans(getIrrigationPlans());
  };

  // Handle region change
  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
    setRegion(regionCode);
    
    // Show message based on active tab
    const regionName = availableRegions.find(r => r.code === regionCode)?.name;
    
    if (activeTab === 'saved') {
      toast(`Region changed to ${regionName}. Switch to "Create New Plan" to see updated prices.`, {
        icon: '💡',
        duration: 4000,
      });
    } else {
      // Recalculate recommendations if already selected
      if (selectedSection && selectedWaterSources.length > 0) {
        const sourcesWithDistance = selectedWaterSources.map(s => ({
          source: s,
          distance: getDistance(selectedSection, s),
        }));
        sourcesWithDistance.sort((a, b) => a.distance - b.distance);
        const closestSource = sourcesWithDistance[0];
        
        const recs = getIrrigationRecommendations(
          selectedSection,
          closestSource.source,
          closestSource.distance
        );
        setRecommendations(recs);
        
        toast.success(`Prices updated for ${regionName}`);
      } else {
        toast.success(`Region set to ${regionName}`);
      }
    }
  };

  // Calculate distance between section and water source
  const getDistance = (section: SectionData, source: WaterSource): number => {
    const coords = section.geometry.coordinates[0];
    let totalLat = 0, totalLng = 0;
    coords.forEach(coord => {
      totalLng += coord[0];
      totalLat += coord[1];
    });
    const sectionLat = totalLat / coords.length;
    const sectionLng = totalLng / coords.length;
    return calculateDistance(sectionLat, sectionLng, source.coordinates[0], source.coordinates[1]);
  };

  // Handle section selection
  const handleSectionSelect = (section: SectionData) => {
    setSelectedSection(section);
    setSelectedWaterSources([]);
    setRecommendations([]);
    setExpandedMethod(null);
    setShowAllWaterSources(false);
  };

  // Handle water source selection (multi-select)
  const handleWaterSourceToggle = (source: WaterSource) => {
    if (!selectedSection) return;
    
    setSelectedWaterSources((prev) => {
      const isSelected = prev.some(s => s.id === source.id);
      const newSelection = isSelected
        ? prev.filter(s => s.id !== source.id)
        : [...prev, source];
      
      // Update recommendations based on all selected sources
      if (newSelection.length > 0) {
        // Use the closest water source for recommendations
        const sourcesWithDistance = newSelection.map(s => ({
          source: s,
          distance: getDistance(selectedSection, s),
        }));
        sourcesWithDistance.sort((a, b) => a.distance - b.distance);
        const closestSource = sourcesWithDistance[0];
        
        const recs = getIrrigationRecommendations(
          selectedSection,
          closestSource.source,
          closestSource.distance
        );
        setRecommendations(recs);
        
        if (recs.length > 0) {
          setExpandedMethod(recs[0].method);
        }
      } else {
        setRecommendations([]);
        setExpandedMethod(null);
      }
      
      return newSelection;
    });
  };

  // Create and save irrigation plan
  const handleCreatePlan = (method: IrrigationMethod) => {
    if (!selectedSection || selectedWaterSources.length === 0) return;
    
    setIsCreatingPlan(true);
    
    try {
      // Use the closest water source as primary
      const sourcesWithDistance = selectedWaterSources.map(s => ({
        source: s,
        distance: getDistance(selectedSection, s),
      }));
      sourcesWithDistance.sort((a, b) => a.distance - b.distance);
      const primarySource = sourcesWithDistance[0].source;
      
      const plan = createIrrigationPlan(
        selectedSection,
        primarySource,
        method,
        recommendations
      );
      
      // Add note about multiple sources if applicable
      if (selectedWaterSources.length > 1) {
        const additionalSources = selectedWaterSources
          .filter(s => s.id !== primarySource.id)
          .map(s => s.name)
          .join(', ');
        (plan as any).notes = `Multiple sources available: ${primarySource.name} (primary), ${additionalSources} (backup)`;
      }
      
      const success = saveIrrigationPlan(plan as StoredIrrigationPlan);
      
      if (success) {
        toast.success(
          selectedWaterSources.length > 1
            ? `Plan created with ${selectedWaterSources.length} water sources!`
            : 'Irrigation plan created successfully!'
        );
        loadData();
        setActiveTab('saved');
        // Reset selections
        setSelectedSection(null);
        setSelectedWaterSources([]);
        setRecommendations([]);
      } else {
        toast.error('Failed to save irrigation plan');
      }
    } catch (error) {
      toast.error('Error creating irrigation plan');
      console.error(error);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // Delete a plan
  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this irrigation plan?')) {
      const success = deleteIrrigationPlan(planId);
      if (success) {
        toast.success('Plan deleted');
        loadData();
      }
    }
  };

  // Duplicate a plan
  const handleDuplicatePlan = (plan: StoredIrrigationPlan) => {
    const duplicatedPlan: StoredIrrigationPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
      sectionName: `${plan.sectionName} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    const success = saveIrrigationPlan(duplicatedPlan);
    if (success) {
      toast.success('Plan duplicated successfully');
      loadData();
    }
  };

  // Filter plans
  const filteredPlans = savedPlans.filter(plan => {
    const matchesSearch = plan.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.waterSourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getMethodDisplayName(plan.method as IrrigationMethod).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || plan.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Update plan status
  const handleStatusChange = (planId: string, status: StoredIrrigationPlan['status']) => {
    const success = updateIrrigationPlanStatus(planId, status);
    if (success) {
      toast.success(`Plan marked as ${status}`);
      loadData();
    }
  };

  // Export plan as JSON
  const handleExportPlan = (plan: StoredIrrigationPlan) => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `irrigation-plan-${plan.sectionName.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get method icon component
  const getMethodIconComponent = (method: string) => {
    switch (method) {
      case 'drip': return <Droplets className="w-5 h-5" />;
      case 'sprinkler': return <CloudRain className="w-5 h-5" />;
      case 'surface': return <Waves className="w-5 h-5" />;
      case 'pump-pipeline': return <PipetteIcon className="w-5 h-5" />;
      default: return <Droplets className="w-5 h-5" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'in-progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-teal-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-2" />
            <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="flex gap-4">
            <div className="h-14 w-40 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-14 w-40 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white dark:bg-gray-800 rounded-3xl shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-teal-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
      <Toaster position="top-right" />
      
      <div ref={containerRef} className="max-w-7xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Droplets className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                  Irrigation Planner
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Smart water management for your farm
                </p>
              </div>
            </div>
            
            {/* Region Selector - Modern Pill Style */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20">
              <MapPin className="w-5 h-5 text-blue-500" />
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="bg-transparent font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {availableRegions.map(region => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Regional Pricing Badge */}
          {(() => {
            const region = availableRegions.find(r => r.code === selectedRegion);
            const diff = region && region.material !== 1.0 ? ((region.material - 1) * 100).toFixed(0) : null;
            return (
              <div className="flex items-center gap-2 mt-3 text-sm">
                <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  2026 Prices
                </span>
                {diff && (
                  <span className={`px-3 py-1.5 rounded-full font-medium ${Number(diff) > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                    {Number(diff) > 0 ? '+' : ''}{diff}% vs base
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Empty State - No Farm Data */}
        {(sections.length === 0 || waterSources.length === 0) && (
          <div className="animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Setup Required</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {sections.length === 0 && 'Create farm sections first. '}
              {waterSources.length === 0 && 'Add water sources to start planning.'}
            </p>
            <button
              onClick={() => navigate('/farm-mapping')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300"
            >
              <MapPin className="w-5 h-5" />
              Go to Farm Mapping
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
        {/* Modern Tab Pills */}
        <div className="flex gap-2 p-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('create')}
            className={`animate-tab opacity-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`animate-tab opacity-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="hidden sm:inline">Saved Plans</span>
            {savedPlans.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'saved' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                {savedPlans.length}
              </span>
            )}
          </button>
        </div>
        </div>

        {/* Create New Plan Tab */}
        {activeTab === 'create' && sections.length > 0 && waterSources.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Select Section */}
            <div className="animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Select Section</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose a farm section</p>
                </div>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto smooth-scroll pr-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => handleSectionSelect(section)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${
                      selectedSection?.id === section.id
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                        : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-blue-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: section.color }}
                      >
                        <Sprout className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{section.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {section.area.toFixed(1)} acres • {section.cropType || 'No crop'}
                        </p>
                      </div>
                      {selectedSection?.id === section.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Select Water Sources (Multi-select) */}
            <div className={`animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 ${!selectedSection ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
                  selectedSection 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-cyan-500/25' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>2</div>
                <div className="flex-1">
                  <h2 className={`text-lg font-semibold ${!selectedSection ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                    Water Sources
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedWaterSources.length > 0 
                      ? `${selectedWaterSources.length} selected` 
                      : selectedSection ? 'Select one or more' : 'Select section first'}
                  </p>
                </div>
              </div>
              
              {!selectedSection ? (
                <div className="text-center py-8">
                  <Droplets className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500">Select a section first</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-4">
                    <span className="text-lg">💡</span>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Select multiple for backup
                    </p>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto smooth-scroll pr-2">
                    {waterSources
                      .map((source) => ({
                        source,
                        distance: getDistance(selectedSection, source),
                      }))
                      .sort((a, b) => a.distance - b.distance)
                      .slice(0, showAllWaterSources ? undefined : 5)
                      .map(({ source, distance }) => {
                        const isSelected = selectedWaterSources.some(s => s.id === source.id);
                        const isPrimary = selectedWaterSources[0]?.id === source.id;
                        return (
                          <div
                            key={source.id}
                            onClick={() => handleWaterSourceToggle(source)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 shadow-md'
                                : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-cyan-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-cyan-500 border-cyan-500'
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-100 dark:bg-cyan-800/50' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                                <Droplets className={`w-4 h-4 ${isSelected ? 'text-cyan-600' : 'text-blue-500'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-800 dark:text-white truncate">{source.name}</p>
                                  {isPrimary && (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {source.type.replace('_', ' ')} • {Math.round(distance)}m
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {waterSources.length > 5 && (
                    <button
                      onClick={() => setShowAllWaterSources(!showAllWaterSources)}
                      className="w-full mt-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {showAllWaterSources ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          +{waterSources.length - 5} more
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Step 3: View Recommendations */}
            <div className={`animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 ${selectedWaterSources.length === 0 ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
                  selectedWaterSources.length > 0 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/25' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>3</div>
                <div>
                  <h2 className={`text-lg font-semibold ${selectedWaterSources.length === 0 ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                    Smart Picks
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {recommendations.length > 0 ? `${recommendations.length} options` : 'Based on your selection'}
                  </p>
                </div>
              </div>
              
              {selectedWaterSources.length === 0 ? (
                <div className="text-center py-8">
                  <Gauge className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500">Select water source first</p>
                </div>
              ) : (
                <>
                  {selectedWaterSources.length > 1 && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                          {selectedWaterSources.length} sources selected
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-500">
                          {selectedWaterSources[0].name} as primary
                        </p>
                      </div>
                    </div>
                  )}
                  {recommendations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No suitable methods found</p>
                  ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recommendations.map((rec, index) => (
                    <div
                      key={rec.method}
                      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                        expandedMethod === rec.method
                          ? 'border-2 border-blue-400 shadow-lg shadow-blue-500/10'
                          : 'border-2 border-transparent bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {/* Header */}
                      <div
                        onClick={() => setExpandedMethod(expandedMethod === rec.method ? null : rec.method)}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${expandedMethod === rec.method ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-white dark:bg-gray-600'} text-blue-600 shadow-sm`}>
                              {getMethodIconComponent(rec.method)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">
                                {getMethodDisplayName(rec.method)}
                              </p>
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {formatCurrency(rec.estimatedCost.total)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-xl font-bold ${getScoreColor(rec.suitabilityScore)}`}>
                              {rec.suitabilityScore}%
                            </div>
                            {index === 0 && (
                              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                                Best
                              </span>
                            )}
                            <div className={`p-1 rounded-full ${expandedMethod === rec.method ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
                              {expandedMethod === rec.method ? (
                                <ChevronUp className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedMethod === rec.method && (
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3 my-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl text-center">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Efficiency</p>
                              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{rec.efficiency}%</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl text-center">
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Per Year</p>
                              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                {formatCurrency(rec.estimatedCost.operational)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Pros */}
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">✓ Advantages</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5">
                              {rec.pros.slice(0, 3).map((pro, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Cons */}
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">⚠ Consider</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5">
                              {rec.cons.slice(0, 2).map((con, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={() => setShowLayoutMap(true)}
                              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                            >
                              <Eye className="w-4 h-4" />
                              View Layout
                            </button>
                            
                            <button
                              onClick={() => handleCreatePlan(rec.method)}
                              disabled={isCreatingPlan}
                              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                              {isCreatingPlan ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  Create Plan
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}

        {/* Saved Plans Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {/* Pricing Note for Saved Plans */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 animate-fade-in">
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  <strong>Note:</strong> Saved plans show prices from when they were created (historical pricing). 
                  Region selector only affects new plans. To see current regional prices, create a new plan.
                </span>
              </p>
            </div>
            
            {savedPlans.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12 text-center animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Saved Plans</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Create your first irrigation plan to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
                >
                  Create New Plan
                </button>
              </div>
            ) : (
              <>
                {/* Search and Filter Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative col-span-2">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search plans by section, water source, or method..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 dark:text-white placeholder-gray-400"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Status Filter */}
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none text-gray-800 dark:text-white"
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Results Count */}
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Showing <strong className="text-gray-800 dark:text-white">{filteredPlans.length}</strong> of {savedPlans.length} plans
                    </span>
                    {(searchQuery || filterStatus !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterStatus('all');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Plans List */}
                <div className="space-y-4">
                  {filteredPlans.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Plans Found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    filteredPlans.map((plan, index) => (
                    <div 
                      key={plan.id} 
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in animate-card"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                  {/* Plan Header */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 rounded-xl text-blue-600 transition-transform hover:scale-105">
                          {getMethodIconComponent(plan.method)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{plan.sectionName}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(plan.status)}`}>
                              {plan.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                            <span className="flex items-center gap-1.5">
                              <Droplets className="w-4 h-4 text-blue-500" />
                              {plan.waterSourceName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Navigation className="w-4 h-4 text-emerald-500" />
                              {plan.distance}m
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-500" />
                              {plan.implementationTime}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Quick Actions */}
                        <button
                          onClick={() => handleDuplicatePlan(plan)}
                          className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          title="Duplicate Plan"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                          className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                        >
                          {expandedPlan === plan.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Plan Summary - Always Visible */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Method</p>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{getMethodDisplayName(plan.method as IrrigationMethod)}</p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Cost</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(plan.estimatedCost.total)}</p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Efficiency</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{plan.efficiency}%</p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Water</p>
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{(plan.waterRequirement / 1000).toFixed(1)}K L</p>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suitability</p>
                        <p className={`font-bold text-sm ${getScoreColor(plan.suitabilityScore)}`}>{plan.suitabilityScore}%</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Plan Details - Collapsible */}
                  {expandedPlan === plan.id && (
                  <div className="p-5 animate-fade-in">
                    {/* Cost Breakdown */}
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <IndianRupee className="w-4 h-4 text-blue-600" />
                        </div>
                        Cost Breakdown
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl hover:scale-[1.02] transition-transform">
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Materials</p>
                          <p className="font-bold text-blue-900 dark:text-blue-100 text-lg">{formatCurrency(plan.estimatedCost.materials)}</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200/50 dark:border-emerald-700/30 rounded-xl hover:scale-[1.02] transition-transform">
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Labor</p>
                          <p className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">{formatCurrency(plan.estimatedCost.labor)}</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border border-amber-200/50 dark:border-amber-700/30 rounded-xl hover:scale-[1.02] transition-transform">
                          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Operational/yr</p>
                          <p className="font-bold text-amber-900 dark:text-amber-100 text-lg">{formatCurrency(plan.estimatedCost.operational)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Components */}
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Materials Required</h4>
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Item</th>
                              <th className="text-center p-3 font-semibold text-gray-600 dark:text-gray-300">Qty</th>
                              <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Unit Price</th>
                              <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.components.map((component, idx) => (
                              <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{component.name}</td>
                                <td className="text-center p-3 text-gray-600 dark:text-gray-400">{component.quantity} {component.unit}</td>
                                <td className="text-right p-3 text-gray-600 dark:text-gray-400">{formatCurrency(component.unitPrice)}</td>
                                <td className="text-right p-3 font-semibold text-gray-800 dark:text-white">{formatCurrency(component.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Warnings */}
                    {plan.warnings.length > 0 && (
                      <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Warnings
                        </h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1.5">
                          {plan.warnings.map((warning, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {plan.recommendations.length > 0 && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <Sprout className="w-4 h-4" />
                          Implementation Tips
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1.5">
                          {plan.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <select
                        value={plan.status}
                        onChange={(e) => handleStatusChange(plan.id, e.target.value as StoredIrrigationPlan['status'])}
                        className="px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-700 dark:text-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <button
                        onClick={() => handleExportPlan(plan)}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                  )}
                </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
      </div>
      
      {/* Layout Visualization Modal */}
      {showLayoutMap && selectedSection && selectedWaterSources.length > 0 && expandedMethod && (() => {
        const sourcesWithDistance = selectedWaterSources.map(s => ({
          source: s,
          distance: getDistance(selectedSection, s),
        }));
        sourcesWithDistance.sort((a, b) => a.distance - b.distance);
        const primarySource = sourcesWithDistance[0];
        const recommendation = recommendations.find(r => r.method === expandedMethod);
        
        // Calculate pipe length from components
        const pipeComponent = recommendation?.components.find(c => 
          c.name.toLowerCase().includes('pipe') || c.name.toLowerCase().includes('lateral')
        );
        const pipeLength = pipeComponent ? pipeComponent.quantity : primarySource.distance * 1.2;
        
        return (
          <IrrigationLayoutMap
            section={selectedSection}
            waterSource={primarySource.source}
            method={expandedMethod}
            distance={primarySource.distance}
            pipeLength={pipeLength}
            onClose={() => setShowLayoutMap(false)}
          />
        );
      })()}
    </div>
  );
};

export default IrrigationPlannerPage;