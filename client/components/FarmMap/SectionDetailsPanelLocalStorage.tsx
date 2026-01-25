import React, { useState, useEffect } from 'react';
import { getSection, saveSection, deleteSection, getFarmMapping, type SectionData } from '../../utils/farmMappingStorage';
import { toast } from 'react-hot-toast';
import { X, Save, Trash2, MapPin, Droplets } from 'lucide-react';

interface SectionDetailsPanelProps {
  farmId: string;
  sectionId: string | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (sectionId: string) => void;
}

export const SectionDetailsPanelLocalStorage: React.FC<SectionDetailsPanelProps> = ({
  farmId,
  sectionId,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [section, setSection] = useState<SectionData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<SectionData>>({});

  useEffect(() => {
    if (sectionId) {
      loadSection();
    }
  }, [sectionId]);

  const loadSection = () => {
    if (!sectionId) return;

    const data = getSection(sectionId);
    if (data) {
      setSection(data);
      setFormData({
        name: data.name,
        cropType: data.cropType,
        soilType: data.soilType,
        irrigationType: data.irrigationType,
        color: data.color,
      });
    } else {
      toast.error('Section not found');
    }
  };

  const handleSave = () => {
    if (!sectionId || !section) return;

    const updatedSection: SectionData = {
      ...section,
      name: formData.name || section.name,
      cropType: formData.cropType || section.cropType,
      soilType: formData.soilType || section.soilType,
      irrigationType: formData.irrigationType || section.irrigationType,
      color: formData.color || section.color,
    };

    const success = saveSection(farmId, updatedSection);

    if (success) {
      setSection(updatedSection);
      onUpdate();
      setIsEditing(false);
      toast.success('Section updated successfully');

      // Reload the page to refresh the map
      window.location.reload();
    } else {
      toast.error('Failed to update section');
    }
  };

  const handleDelete = () => {
    if (!sectionId) return;

    const confirmed = window.confirm('Are you sure you want to delete this section? This action cannot be undone.');
    if (!confirmed) return;

    const success = deleteSection(sectionId);

    if (success) {
      onDelete(sectionId);
      onClose();
      toast.success('Section deleted successfully');

      // Reload the page to refresh the map
      window.location.reload();
    } else {
      toast.error('Failed to delete section');
    }
  };

  if (!section) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 bottom-0 top-auto h-[60vh] rounded-t-3xl border-t border-gray-200 sm:inset-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-96 sm:h-auto sm:rounded-lg sm:border-t-0 shadow-2xl bg-white overflow-hidden z-[1000] flex flex-col transition-all duration-300 ease-in-out animate-slide-up-mobile sm:animate-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-bold">Section Details</h2>
            <p className="text-sm opacity-90">{section.area.toFixed(2)} acres</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Section Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Section Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., North Field"
            />
          ) : (
            <p className="text-gray-900 font-medium text-lg">{section.name}</p>
          )}
        </div>

        {/* Crop Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Type
          </label>
          {isEditing ? (
            <select
              value={formData.cropType || ''}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select crop type</option>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Maize">Maize</option>
              <option value="Cotton">Cotton</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Pulses">Pulses</option>
              <option value="Oilseeds">Oilseeds</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            <p className="text-gray-900">{section.cropType || 'Not set'}</p>
          )}
        </div>

        {/* Soil Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soil Type
          </label>
          {isEditing ? (
            <select
              value={formData.soilType || ''}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select soil type</option>
              <option value="Clay">Clay</option>
              <option value="Sandy">Sandy</option>
              <option value="Loamy">Loamy</option>
              <option value="Silt">Silt</option>
              <option value="Peaty">Peaty</option>
              <option value="Chalky">Chalky</option>
            </select>
          ) : (
            <p className="text-gray-900">{section.soilType || 'Not set'}</p>
          )}
        </div>

        {/* Irrigation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Irrigation Type
          </label>
          {isEditing ? (
            <select
              value={formData.irrigationType || ''}
              onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select irrigation type</option>
              <option value="Drip">Drip Irrigation</option>
              <option value="Sprinkler">Sprinkler</option>
              <option value="Flood">Flood Irrigation</option>
              <option value="Surface">Surface Irrigation</option>
              <option value="Subsurface">Subsurface Irrigation</option>
              <option value="Rainfed">Rainfed</option>
            </select>
          ) : (
            <p className="text-gray-900">{section.irrigationType || 'Not set'}</p>
          )}
        </div>

        {/* Section Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Color
          </label>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: section.color }}
            />
            <span className="text-gray-600 text-sm">{section.color}</span>
          </div>
        </div>

        {/* Created Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Created On
          </label>
          <p className="text-gray-900">
            {new Date(section.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Water Source Information */}
        {section.nearestWaterSource && (() => {
          const farmData = getFarmMapping();
          const waterSource = farmData?.waterSources?.find(ws => ws.id === section.nearestWaterSource?.id);

          if (waterSource) {
            const distanceKm = (section.nearestWaterSource.distance / 1000).toFixed(2);
            const distanceM = section.nearestWaterSource.distance.toFixed(0);

            const typeLabels: Record<string, string> = {
              river: 'River',
              lake: 'Lake',
              pond: 'Pond',
              reservoir: 'Reservoir',
              canal: 'Canal',
              stream: 'Stream',
              well: 'Well',
              water_tower: 'Water Tower',
              spring: 'Spring',
              waterway: 'Waterway',
            };

            const getIrrigationRecommendation = (distance: number): string => {
              if (distance < 500) return 'Drip or Sprinkler recommended';
              if (distance < 1000) return 'Sprinkler irrigation suitable';
              if (distance < 2000) return 'Consider pumping system';
              return 'Long distance - assess feasibility';
            };

            return (
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                  <label className="text-sm font-medium text-cyan-900">
                    Nearest Water Source
                  </label>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-cyan-700 font-medium">{waterSource.name}</span>
                    <span className="text-cyan-600 ml-2">({typeLabels[waterSource.type]})</span>
                  </div>

                  <div className="text-cyan-800">
                    <strong>Distance:</strong> {distanceM}m ({distanceKm}km)
                  </div>

                  <div className="text-cyan-800">
                    <strong>Suggestion:</strong> {getIrrigationRecommendation(section.nearestWaterSource.distance)}
                  </div>

                  <div className="text-xs text-cyan-600 mt-2 pt-2 border-t border-cyan-200">
                    Source: OpenStreetMap
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: section.name,
                  cropType: section.cropType,
                  soilType: section.soilType,
                  irrigationType: section.irrigationType,
                  color: section.color,
                });
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Edit Section
            </button>
            <button
              onClick={handleDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
