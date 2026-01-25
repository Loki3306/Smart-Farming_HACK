import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FarmMapEditor } from '../components/FarmMap/FarmMapEditorLocalStorage';
import { SectionDetailsPanelLocalStorage as SectionDetailsPanel } from '../components/FarmMap/SectionDetailsPanelLocalStorage';
import { getFarmMappingStats, SectionData } from '../utils/farmMappingStorage';
import { toast, Toaster } from 'react-hot-toast';
import { Map, Layers, BarChart3, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FarmMappingPage: React.FC = () => {
  const { t } = useTranslation('farmMapping');
  const { user } = useAuth();
  const location = useLocation();
  const navigationState = location.state as { center?: [number, number]; zoom?: number } | null;
  // Get farm ID from localStorage (where FarmContext stores it) or use user's ID as fallback
  const [farmId] = useState(() => {
    const storedFarmId = localStorage.getItem('current_farm_id');
    return storedFarmId || user?.id || '35596319-ef8f-4e76-a0cb-cbd88742a05d';
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [stats, setStats] = useState(getFarmMappingStats());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const loadStats = () => {
    const newStats = getFarmMappingStats();
    setStats(newStats);
  };

  const handleSectionUpdate = () => {
    loadStats();
    setRefreshKey(prev => prev + 1);
  };

  const handleSectionDelete = (sectionId: string) => {
    setSelectedSection(null);
    loadStats();
    setRefreshKey(prev => prev + 1);
  };

  const handleStatsUpdate = () => {
    // Immediate sync - no reload needed
    const newStats = getFarmMappingStats();
    setStats(newStats);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh)]">
      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Header - Transparent to show global background */}
      <div className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Map className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>

          {/* Summary Stats */}
          {stats.hasBoundary && (
            <div className="flex gap-4 md:gap-6 ml-11 md:ml-0 overflow-x-auto pb-1 md:pb-0">
              <div className="text-center min-w-fit">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{t('stats.sections')}</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stats.sectionsCount}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{t('stats.sectionsCreated')}</p>
              </div>

              <div className="text-center min-w-fit">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{t('stats.totalArea')}</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {stats.totalArea.toFixed(2)}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{t('stats.acres')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative rounded-xl md:rounded-2xl mx-2 md:mx-4 overflow-hidden border border-border shadow-sm">
        <FarmMapEditor
          farmId={farmId}
          initialCenter={navigationState?.center || [12.9716, 77.5946]}
          initialZoom={navigationState?.zoom || 15}
          selectedSection={selectedSection}
          onSectionSelect={setSelectedSection}
          onBoundaryDrawn={() => {
            toast.success(t('toast.boundarySaved'));
            handleStatsUpdate();
          }}
          onSectionDrawn={() => {
            toast.success(t('toast.sectionCreated'));
            handleStatsUpdate();
          }}
          onStatsUpdate={handleStatsUpdate}
        />

        {/* Section Details Panel */}
        {selectedSection && (
          <SectionDetailsPanel
            farmId={farmId}
            sectionId={selectedSection}
            onClose={() => setSelectedSection(null)}
            onUpdate={handleSectionUpdate}
            onDelete={handleSectionDelete}
          />
        )}
      </div>

      {/* Instructions Banner */}
      <div className="hidden md:block px-6 py-4 pb-6">
        <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl px-6 py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">{t('instructions.title')}</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>{t('instructions.tip')}</strong> {t('instructions.tipText')}</li>
                <li>• <strong>{t('instructions.step1')}</strong> {t('instructions.step1Text')}</li>
                <li>• <strong>{t('instructions.step2')}</strong> {t('instructions.step2Text')}</li>
                <li>• <strong>{t('instructions.step3')}</strong> {t('instructions.step3Text')}</li>
                <li>• <strong>{t('instructions.step4')}</strong> {t('instructions.step4Text')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmMappingPage;
