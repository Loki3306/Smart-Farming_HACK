import React, { useState, useEffect } from 'react';
import { farmGeometryService, type FarmSection, type UpdateFarmSection } from '../../services/farmGeometryService';
import { toast } from 'react-hot-toast';
import { X, Save, Trash2, MapPin } from 'lucide-react';

interface SectionDetailsPanelProps {
  farmId: string;
  sectionId: string | null;
  onClose: () => void;
  onUpdate: (section: FarmSection) => void;
  onDelete: (sectionId: string) => void;
}

export const SectionDetailsPanel: React.FC<SectionDetailsPanelProps> = ({
  farmId,
  sectionId,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [section, setSection] = useState<FarmSection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateFarmSection>({});

  useEffect(() => {
    if (sectionId) {
      loadSection();
    }
  }, [sectionId]);

  const loadSection = async () => {
    if (!sectionId) return;
    
    try {
      const data = await farmGeometryService.getSection(farmId, sectionId);
      setSection(data);
      setFormData({
        section_name: data.section_name,
        display_color: data.display_color,
        crop_type: data.crop_type,
        soil_type: data.soil_type,
        irrigation_type: data.irrigation_type,
        planting_date: data.planting_date,
        expected_harvest_date: data.expected_harvest_date,
        notes: data.notes,
      });
    } catch (error) {
      console.error('Failed to load section:', error);
      toast.error('Failed to load section details');
    }
  };

  const handleSave = async () => {
    if (!sectionId) return;
    
    setIsSaving(true);
    try {
      const updatedSection = await farmGeometryService.updateSection(farmId, sectionId, formData);
      setSection(updatedSection);
      onUpdate(updatedSection);
      setIsEditing(false);
      toast.success('Section updated successfully');
    } catch (error: any) {
      console.error('Failed to update section:', error);
      toast.error(error.response?.data?.detail || 'Failed to update section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!sectionId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this section? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await farmGeometryService.deleteSection(farmId, sectionId);
      onDelete(sectionId);
      onClose();
      toast.success('Section deleted successfully');
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleNeighbors = async () => {
    if (!sectionId) return;
    
    try {
      const neighbors = await farmGeometryService.getNeighboringSections(farmId, sectionId);
      if (neighbors.length === 0) {
        toast.info('No neighboring sections found');
      } else {
        const neighborsList = neighbors
          .map((n) => `${n.section_name} (${n.shared_boundary_length_meters.toFixed(1)}m shared)`)
          .join('\n');
        toast.success(`Neighbors:\n${neighborsList}`, { duration: 5000 });
      }
    } catch (error) {
      console.error('Failed to get neighbors:', error);
      toast.error('Failed to get neighboring sections');
    }
  };

  if (!section) {
    return null;
  }

  return (
    <div className="absolute right-4 top-4 w-96 bg-white rounded-lg shadow-2xl z-[1001] max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Section Details</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Section Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.section_name || ''}
              onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900">{section.section_name}</p>
          )}
        </div>

        {/* Display Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Color</label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.display_color || '#3B82F6'}
                onChange={(e) => setFormData({ ...formData, display_color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{formData.display_color}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: section.display_color }}
              />
              <span className="text-sm text-gray-600">{section.display_color}</span>
            </div>
          )}
        </div>

        {/* Area Information */}
        <div className="p-3 bg-blue-50 rounded">
          <p className="text-sm font-medium text-gray-700">Area</p>
          <p className="text-lg font-semibold text-blue-600">
            {section.area_acres?.toFixed(2)} acres
          </p>
          <p className="text-xs text-gray-600">{section.area_sq_meters?.toFixed(0)} m²</p>
        </div>

        {/* Crop Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.crop_type || ''}
              onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
              placeholder="e.g., Wheat, Rice, Corn"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900">{section.crop_type || 'Not specified'}</p>
          )}
        </div>

        {/* Soil Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
          {isEditing ? (
            <select
              value={formData.soil_type || ''}
              onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select soil type</option>
              <option value="clay">Clay</option>
              <option value="sandy">Sandy</option>
              <option value="loam">Loam</option>
              <option value="silt">Silt</option>
              <option value="peat">Peat</option>
              <option value="chalk">Chalk</option>
            </select>
          ) : (
            <p className="text-gray-900">{section.soil_type || 'Not specified'}</p>
          )}
        </div>

        {/* Irrigation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation Type</label>
          {isEditing ? (
            <select
              value={formData.irrigation_type || ''}
              onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select irrigation type</option>
              <option value="drip">Drip Irrigation</option>
              <option value="sprinkler">Sprinkler</option>
              <option value="surface">Surface Irrigation</option>
              <option value="subsurface">Subsurface Drip</option>
              <option value="manual">Manual</option>
              <option value="none">None</option>
            </select>
          ) : (
            <p className="text-gray-900">{section.irrigation_type || 'Not specified'}</p>
          )}
        </div>

        {/* Planting Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date</label>
          {isEditing ? (
            <input
              type="date"
              value={formData.planting_date || ''}
              onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900">
              {section.planting_date
                ? new Date(section.planting_date).toLocaleDateString()
                : 'Not specified'}
            </p>
          )}
        </div>

        {/* Expected Harvest Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest</label>
          {isEditing ? (
            <input
              type="date"
              value={formData.expected_harvest_date || ''}
              onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900">
              {section.expected_harvest_date
                ? new Date(section.expected_harvest_date).toLocaleDateString()
                : 'Not specified'}
            </p>
          )}
        </div>

        {/* Health Score */}
        {section.health_score !== null && section.health_score !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Health Score</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${section.health_score}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{section.health_score}%</span>
            </div>
          </div>
        )}

        {/* Analysis Status */}
        {section.analysis_status && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Status</label>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                section.analysis_status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : section.analysis_status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {section.analysis_status.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          {isEditing ? (
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Add notes about this section..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-900 text-sm">{section.notes || 'No notes'}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
          <p>Section #{section.section_number}</p>
          <p>Created: {new Date(section.created_at).toLocaleString()}</p>
          <p>Updated: {new Date(section.updated_at).toLocaleString()}</p>
          {section.last_analysis_date && (
            <p>Last Analysis: {new Date(section.last_analysis_date).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 space-y-2">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                loadSection(); // Reset form
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Edit Section
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleNeighbors}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                <MapPin className="w-4 h-4" />
                Find Neighbors
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
