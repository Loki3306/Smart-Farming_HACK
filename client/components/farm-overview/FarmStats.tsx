import React from 'react';
import { getFarmMappingStats, getFarmMapping } from '../../utils/farmMappingStorage';
import { Map, Grid3x3, Sprout, Calendar, Droplets } from 'lucide-react';

interface FarmStatsProps {
  onEditClick: () => void;
}

const FarmStats: React.FC<FarmStatsProps> = ({ onEditClick }) => {
  const stats = getFarmMappingStats();
  const farmData = getFarmMapping();
  const waterSourceCount = farmData?.waterSources?.length || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Total Farm Area</p>
              <p className="text-2xl font-bold">
                {stats.totalArea.toFixed(2)}
              </p>
              <p className="text-xs opacity-80">acres</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Grid3x3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Total Sections</p>
              <p className="text-2xl font-bold">{stats.sectionsCount}</p>
              <p className="text-xs opacity-80">
                {stats.sectionsCount === 1 ? 'section' : 'sections'}
              </p>
            </div>
          </div>
        </div>

        {waterSourceCount > 0 && (
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Water Sources</p>
                <p className="text-2xl font-bold">{waterSourceCount}</p>
                <p className="text-xs opacity-80">nearby sources found</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crop Distribution */}
      {Object.keys(stats.cropDistribution).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sprout className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Crop Distribution</h3>
          </div>
          
          <div className="space-y-2">
            {Object.entries(stats.cropDistribution).map(([crop, count]) => (
              <div key={crop} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{crop}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-green-200 rounded-full w-20">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{
                        width: `${(count / stats.sectionsCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {stats.lastUpdated && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-medium text-gray-700">Last Updated</h4>
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(stats.lastUpdated)}
          </p>
        </div>
      )}

      {/* Edit Button */}
      <button
        onClick={onEditClick}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Map className="w-5 h-5" />
        Edit Farm Mapping
      </button>
    </div>
  );
};

export default FarmStats;
