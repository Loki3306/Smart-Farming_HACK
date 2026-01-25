import React from 'react';
import { SectionData } from '../../utils/farmMappingStorage';
import { MapPin, Sprout, Droplet } from 'lucide-react';

interface SectionLegendProps {
  sections: SectionData[];
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
}

const SectionLegend: React.FC<SectionLegendProps> = ({
  sections,
  selectedSectionId,
  onSectionSelect,
}) => {
  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Sections</h3>
        <p className="text-gray-500 text-sm">No sections created yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">
        Sections ({sections.length})
      </h3>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sections.map((section) => {
          const isSelected = section.id === selectedSectionId;
          
          return (
            <div
              key={section.id}
              onClick={() => onSectionSelect(section.id)}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-green-500 bg-green-50 shadow-sm' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Color indicator */}
                <div
                  className="w-6 h-6 rounded-md border-2 flex-shrink-0 mt-1"
                  style={{
                    backgroundColor: section.color,
                    borderColor: section.color,
                  }}
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 truncate">
                    {section.name}
                  </h4>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>{section.area.toFixed(2)} acres</span>
                    </div>
                    
                    {section.cropType && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Sprout className="w-3 h-3" />
                        <span className="truncate">{section.cropType}</span>
                      </div>
                    )}
                    
                    {section.irrigationType && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Droplet className="w-3 h-3" />
                        <span className="truncate">{section.irrigationType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionLegend;
