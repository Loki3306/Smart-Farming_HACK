import React, { useState, useEffect } from 'react';
import { FarmMapEditor } from '../components/FarmMap/FarmMapEditor';
import { SectionDetailsPanel } from '../components/FarmMap/SectionDetailsPanel';
import { farmGeometryService, type FarmSection, type FarmSectionsSummary } from '../services/farmGeometryService';
import { toast, Toaster } from 'react-hot-toast';
import { Map, Layers, BarChart3, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FarmMappingPage: React.FC = () => {
  const { user } = useAuth();
  // Get farm ID from localStorage (where FarmContext stores it) or use user's ID as fallback
  const [farmId] = useState(() => {
    const storedFarmId = localStorage.getItem('current_farm_id');
    return storedFarmId || user?.id || '35596319-ef8f-4e76-a0cb-cbd88742a05d';
  });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [summary, setSummary] = useState<FarmSectionsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [farmId]);

  const loadSummary = async () => {
    try {
      const data = await farmGeometryService.getSectionsSummary(farmId);
      setSummary(data);
    } catch (error: any) {
      // Summary might not exist yet if no sections created
      if (error.response?.status !== 404) {
        console.error('Failed to load summary:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionUpdate = (section: FarmSection) => {
    // Reload summary when section is updated
    loadSummary();
  };

  const handleSectionDelete = (sectionId: string) => {
    setSelectedSection(null);
    loadSummary();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Farm Mapping System</h1>
              <p className="text-sm text-gray-600">Draw and manage your farm boundaries and sections</p>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && !isLoading && (
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Layers className="w-4 h-4" />
                  <span>Sections</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{summary.total_sections}</p>
                <p className="text-xs text-gray-500">{summary.active_sections} active</p>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BarChart3 className="w-4 h-4" />
                  <span>Total Area</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(summary.total_area_sq_meters / 4046.86).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">acres</p>
              </div>

              {summary.average_health_score !== null && summary.average_health_score !== undefined && (
                <div className="text-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info className="w-4 h-4" />
                    <span>Avg Health</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.average_health_score.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">health score</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <FarmMapEditor
          farmId={farmId}
          initialCenter={[12.9716, 77.5946]} // Default Bangalore coordinates
          initialZoom={15}
          selectedSection={selectedSection}
          onSectionSelect={setSelectedSection}
          onBoundaryDrawn={() => {
            toast.success('Farm boundary saved!');
            loadSummary();
          }}
          onSectionDrawn={() => {
            toast.success('Section created!');
            loadSummary();
          }}
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
      <div className="bg-blue-50 border-t border-blue-100 px-6 py-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Getting Started</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Tip:</strong> Click "My Location" button to center the map on your current GPS position</li>
              <li>• <strong>Step 1:</strong> Click "Draw Farm Boundary" and click points on the map to draw your farm perimeter</li>
              <li>• <strong>Step 2:</strong> Click "Add New Section" to divide your farm into manageable sections</li>
              <li>• <strong>Step 3:</strong> Click on any section to add crop details, soil type, and track health</li>
              <li>• <strong>Step 4:</strong> Use the toolbar on the map to edit or delete sections as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmMappingPage;
