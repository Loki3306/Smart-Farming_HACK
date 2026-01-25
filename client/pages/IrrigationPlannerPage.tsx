import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  User,
  Lightbulb,
  Info,
} from 'lucide-react';

const IrrigationPlannerPage: React.FC = () => {
  const { t } = useTranslation('irrigationPlanner');
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
      toast(t('toast.regionChanged', { region: regionName }), {
        icon: <Info className="w-5 h-5 text-emerald-500" />,
        duration: 4000,
      });
    } else {
      // Recalculate recommendations if already selected
      if (selectedSection && selectedWaterSources.length > 0) {
        const primarySource = selectedWaterSources[0];

        // Calculate center of section
        const coords = selectedSection.geometry.coordinates[0];
        let totalLat = 0;
        let totalLng = 0;
        coords.forEach(coord => {
          totalLng += coord[0];
          totalLat += coord[1];
        });
        const centerLat = totalLat / coords.length;
        const centerLng = totalLng / coords.length;

        // Calculate distance
        const distance = calculateDistance(
          centerLat,
          centerLng,
          primarySource.coordinates[0],
          primarySource.coordinates[1]
        );

        const recs = getIrrigationRecommendations(selectedSection, primarySource, distance);
        setRecommendations(recs);

        toast.success(t('toast.pricesUpdated', { region: regionName }));
      } else {
        toast.success(t('toast.regionSet', { region: regionName }));
      }
    }
  };

  const handleSectionSelect = (section: SectionData) => {
    if (selectedSection?.id === section.id) {
      setSelectedSection(null);
      setSelectedWaterSources([]);
      setRecommendations([]);
      return;
    }
    setSelectedSection(section);
    setSelectedWaterSources([]);
    setRecommendations([]);

    // Auto-scroll to next step
    setTimeout(() => {
      const step2 = document.getElementById('step-2');
      if (step2) step2.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleWaterSourceToggle = (source: WaterSource) => {
    setSelectedWaterSources(prev => {
      const exists = prev.find(s => s.id === source.id);
      let newSources;
      if (exists) {
        newSources = prev.filter(s => s.id !== source.id);
      } else {
        newSources = [...prev, source];
      }

      // Update recommendations based on new selection
      if (selectedSection && newSources.length > 0) {
        const primarySource = newSources[0];

        // Calculate center of section
        const coords = selectedSection.geometry.coordinates[0];
        let totalLat = 0;
        let totalLng = 0;
        coords.forEach(coord => {
          totalLng += coord[0];
          totalLat += coord[1];
        });
        const centerLat = totalLat / coords.length;
        const centerLng = totalLng / coords.length;

        // Calculate distance
        const distance = calculateDistance(
          centerLat,
          centerLng,
          primarySource.coordinates[0],
          primarySource.coordinates[1]
        );

        const recs = getIrrigationRecommendations(selectedSection, primarySource, distance);
        setRecommendations(recs);

        // Auto-scroll to step 3 if this is the first selection
        if (prev.length === 0) {
          setTimeout(() => {
            const step3 = document.getElementById('step-3');
            if (step3) step3.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } else {
        setRecommendations([]);
      }

      return newSources;
    });
  };

  const handleCreatePlan = async (method: IrrigationMethod) => {
    if (!selectedSection || selectedWaterSources.length === 0) return;

    setIsCreatingPlan(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use primary water source (first selected)
      const primarySource = selectedWaterSources[0];
      const plan = createIrrigationPlan(selectedSection, primarySource, method, recommendations);
      saveIrrigationPlan(plan);

      setSavedPlans(prev => [plan, ...prev]);
      setIsCreatingPlan(false);

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Plan Created Successfully!
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedSection?.name} - {formatCurrency(plan.estimatedCost.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ));

      // Reset selection and switch tab
      setSelectedSection(null);
      setSelectedWaterSources([]);
      setRecommendations([]);
      setActiveTab('saved');

    } catch (error) {
      console.error(error);
      setIsCreatingPlan(false);
      toast.error('Failed to create plan');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-teal-600 dark:text-teal-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'completed': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      case 'in-progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleStatusChange = (planId: string, newStatus: StoredIrrigationPlan['status']) => {
    updateIrrigationPlanStatus(planId, newStatus);
    setSavedPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, status: newStatus } : p
    ));
    toast.success(t('toast.statusUpdated'));
  };

  const handleDeletePlan = (planId: string) => {
    deleteIrrigationPlan(planId);
    setSavedPlans(prev => prev.filter(p => p.id !== planId));
    toast.success(t('toast.planDeleted'));
  };

  const handleExportPlan = (plan: StoredIrrigationPlan) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `irrigation_plan_${plan.sectionName}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success(t('toast.planExported'));
  };

  const getMethodIconComponent = (method: IrrigationMethod | string) => {
    switch (method) {
      case 'drip': return <Droplets className="w-6 h-6" />;
      case 'sprinkler': return <CloudRain className="w-6 h-6" />;
      case 'flood': return <Waves className="w-6 h-6" />;
      case 'manual': return <User className="w-6 h-6" />; // Assuming User is imported or replace with another icon
      case 'smart': return <Gauge className="w-6 h-6" />;
      default: return <Droplets className="w-6 h-6" />;
    }
  };

  // Filter logic
  const filteredPlans = savedPlans.filter(plan => {
    const matchesSearch = plan.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />

      <div ref={containerRef} className="max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shrink-0 mt-1">
                <Droplets className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white leading-tight break-words">
                  {t('title')}
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            {/* Region Selector - Modern Pill Style */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 self-start md:self-center w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 md:hidden">Region:</span>
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="bg-transparent font-medium text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer text-sm md:text-base"
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
                <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {t('regionalPricing')}
                </span>
                {diff && (
                  <span className={`px-3 py-1.5 rounded-full font-medium ${Number(diff) > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                    {Number(diff) > 0 ? '+' : ''}{diff}% {t('vsBase')}
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
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('emptyState.setupRequired')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {sections.length === 0 && t('emptyState.noSections') + ' '}
              {waterSources.length === 0 && t('emptyState.noWaterSources')}
            </p>
            <button
              onClick={() => navigate('/farm-mapping')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
            >
              <MapPin className="w-5 h-5" />
              {t('emptyState.goToMapping')}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {/* Modern Tab Pills */}
          <div className="flex gap-2 p-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-sm w-fit">
            <button
              className={`animate-tab opacity-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'create'
                ? 'bg-green-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t('tabs.createPlan')}</span>
            </button>
            <button
              className={`animate-tab opacity-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'saved'
                ? 'bg-green-700 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">{t('tabs.savedPlans')}</span>
              {savedPlans.length > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'saved' ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'}`}>
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
            <div className="animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4 md:p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('steps.step1.title')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('steps.step1.subtitle')}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-none md:max-h-80 overflow-y-auto smooth-scroll pr-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => handleSectionSelect(section)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${selectedSection?.id === section.id
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-md'
                      : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-emerald-200 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                          {section.area.toFixed(1)} {t('steps.step1.acres')} • {section.cropType || t('steps.step1.noCrop')}
                        </p>
                      </div>
                      {selectedSection?.id === section.id && (
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Select Water Sources (Multi-select) */}
            <div className={`animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4 md:p-6 hover:shadow-lg transition-all duration-300 ${!selectedSection ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${selectedSection
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>2</div>
                <div className="flex-1">
                  <h2 className={`text-lg font-semibold ${!selectedSection ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                    {t('steps.step2.title')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedWaterSources.length > 0
                      ? `${selectedWaterSources.length} ${t('steps.step2.selected')}`
                      : selectedSection ? t('steps.step2.subtitle') : t('steps.step2.selectSectionFirst')}
                  </p>
                </div>
              </div>

              {!selectedSection ? (
                <div className="text-center py-6 md:py-8">
                  <Droplets className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500">{t('steps.step2.selectSectionFirst')}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {t('steps.step2.selectMultiple')}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-none md:max-h-72 overflow-y-auto smooth-scroll pr-2">
                    {waterSources
                      .map(source => {
                        let distance = 0;
                        if (selectedSection) {
                          // Calculate section center (simple centroid)
                          const coords = selectedSection.geometry.coordinates[0];
                          let totalLat = 0;
                          let totalLng = 0;
                          coords.forEach(coord => {
                            totalLng += coord[0];
                            totalLat += coord[1];
                          });
                          const centerLat = totalLat / coords.length;
                          const centerLng = totalLng / coords.length;

                          // source.coordinates is [lat, lng]
                          distance = calculateDistance(
                            centerLat,
                            centerLng,
                            source.coordinates[0],
                            source.coordinates[1]
                          );
                        }
                        return { source, distance };
                      })
                      .sort((a, b) => a.distance - b.distance)
                      .map(({ source, distance }) => {
                        const isSelected = selectedWaterSources.some(s => s.id === source.id);
                        const isPrimary = selectedWaterSources[0]?.id === source.id;
                        return (
                          <div
                            key={source.id}
                            onClick={() => handleWaterSourceToggle(source)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${isSelected
                              ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/30 shadow-md'
                              : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-teal-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                ? 'bg-cyan-500 border-cyan-500'
                                : 'border-gray-300'
                                }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div className={`p-2 rounded-xl ${isSelected ? 'bg-teal-100 dark:bg-teal-800/50' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                                <Droplets className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-emerald-500'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-800 dark:text-white truncate">{source.name}</p>
                                  {isPrimary && (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                                      {t('steps.step2.primary')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {source.type?.replace('_', ' ') || 'Unknown'} • {Math.round(distance)}m
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
                      className="w-full mt-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {showAllWaterSources ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          {t('steps.step2.showLess')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          +{waterSources.length - 5} {t('steps.step2.more')}
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Step 3: View Recommendations */}
            <div className={`animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4 md:p-6 hover:shadow-lg transition-all duration-300 ${selectedWaterSources.length === 0 ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md ${selectedWaterSources.length > 0
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>3</div>
                <div>
                  <h2 className={`text-lg font-semibold ${selectedWaterSources.length === 0 ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                    {t('steps.step3.title')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {recommendations.length > 0 ? `${recommendations.length} ${t('steps.step3.options')}` : t('steps.step3.subtitle')}
                  </p>
                </div>
              </div>

              {selectedWaterSources.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <Gauge className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500">{t('steps.step3.selectWaterFirst')}</p>
                </div>
              ) : (
                <>
                  {selectedWaterSources.length > 1 && (
                    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                          {selectedWaterSources.length} {t('steps.step3.sourcesSelected')}
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-500">
                          {selectedWaterSources[0].name} {t('steps.step3.asPrimary')}
                        </p>
                      </div>
                    </div>
                  )}
                  {recommendations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t('steps.step3.noMethods')}</p>
                  ) : (
                    <div className="space-y-3 max-h-none md:max-h-[500px] overflow-y-auto">
                      {recommendations.map((rec, index) => (
                        <div
                          key={rec.method}
                          className={`rounded-2xl overflow-hidden transition-all duration-300 ${expandedMethod === rec.method
                            ? 'border-2 border-emerald-400 shadow-lg shadow-emerald-500/10'
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
                                <div className={`p-2.5 rounded-xl ${expandedMethod === rec.method ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-white dark:bg-gray-600'} text-emerald-600 shadow-sm`}>
                                  {getMethodIconComponent(rec.method)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-white">
                                    {getMethodDisplayName(rec.method)}
                                  </p>
                                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
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
                                    {t('steps.step3.best')}
                                  </span>
                                )}
                                <div className={`p-1 rounded-full ${expandedMethod === rec.method ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}`}>
                                  {expandedMethod === rec.method ? (
                                    <ChevronUp className="w-4 h-4 text-emerald-600" />
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
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('steps.step3.efficiency')}</p>
                                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{rec.efficiency}%</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl text-center">
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('steps.step3.perYear')}</p>
                                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                    {formatCurrency(rec.estimatedCost.operational)}
                                  </p>
                                </div>
                              </div>

                              {/* Pros */}
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">{t('steps.step3.advantages')}</p>
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
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">{t('steps.step3.consider')}</p>
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
                                  className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                  {t('steps.step3.visualizeLayout')}
                                </button>
                                <button
                                  onClick={() => handleCreatePlan(rec.method)}
                                  disabled={isCreatingPlan}
                                  className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-emerald-400 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                  {isCreatingPlan ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  {t('steps.step3.createPlan')}
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
          <div className="animate-fade-in">
            {savedPlans.length === 0 ? (
              <div className="animate-card opacity-0 bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-12 text-center shadow-sm">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('savedPlans.noPlans')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{t('savedPlans.noPlansDesc')}</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  {t('savedPlans.createFirst')}
                </button>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('savedPlans.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm overflow-x-auto">
                    {['all', 'draft', 'approved', 'in-progress', 'completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterStatus === status
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        {status === 'all' ? t('savedPlans.filterAll') :
                          status === 'draft' ? t('savedPlans.filterDraft') :
                            status === 'approved' ? t('savedPlans.filterApproved') :
                              status === 'in-progress' ? t('savedPlans.filterInProgress') :
                                t('savedPlans.filterCompleted')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredPlans.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t('savedPlans.noResults')}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t('savedPlans.tryDifferent')}</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterStatus('all');
                        }}
                        className="mt-4 text-emerald-500 hover:underline"
                      >
                        {t('savedPlans.clearFilters')}
                      </button>
                    </div>
                  ) : (
                    filteredPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 overflow-hidden"
                      >
                        {/* Plan Header */}
                        <div className="p-6 cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-2xl ${plan.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                plan.status === 'in-progress' ? 'bg-amber-100 text-amber-600' :
                                  plan.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-gray-100 text-gray-600'
                                } dark:bg-gray-700 dark:text-gray-300`}>
                                {getMethodIconComponent(plan.method)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                    {plan.sectionName}
                                  </h3>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(plan.status)}`}>
                                    {plan.status === 'draft' ? t('status.draft') :
                                      plan.status === 'approved' ? t('status.approved') :
                                        plan.status === 'in-progress' ? t('status.inProgress') :
                                          t('status.completed')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1.5">
                                    <IndianRupee className="w-3.5 h-3.5" />
                                    {formatCurrency(plan.estimatedCost.total)}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(plan.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
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
                                  {t('planCard.warnings')}
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
                                  {t('planCard.implementationTips')}
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
                                <option value="draft">{t('status.draft')}</option>
                                <option value="approved">{t('status.approved')}</option>
                                <option value="in-progress">{t('status.inProgress')}</option>
                                <option value="completed">{t('status.completed')}</option>
                              </select>

                              <button
                                onClick={() => handleExportPlan(plan)}
                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                {t('planCard.export')}
                              </button>

                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2 ml-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t('planCard.delete')}
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
      {
        showLayoutMap && selectedSection && selectedWaterSources.length > 0 && expandedMethod && (() => {
          const sourcesWithDistance = selectedWaterSources.map(s => ({
            source: s,
            distance: calculateDistance(
              selectedSection.geometry.coordinates[0][0][1], // lat
              selectedSection.geometry.coordinates[0][0][0], // lng
              s.coordinates[0],
              s.coordinates[1]
            ),
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
        })()
      }
    </div >
  );
};

export default IrrigationPlannerPage;