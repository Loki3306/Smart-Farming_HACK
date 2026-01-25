import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SectionData, FarmMappingData } from '../../utils/farmMappingStorage';

interface FarmOverviewMapProps {
  farmData: FarmMappingData;
  selectedSectionId: string | null;
  onSectionClick?: (sectionId: string) => void;
}

const FarmOverviewMap: React.FC<FarmOverviewMapProps> = ({
  farmData,
  selectedSectionId,
  onSectionClick,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const layersRef = useRef<{ [key: string]: L.Layer }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [20.5937, 78.9629], // Center of India
          zoom: 5,
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        // Small delay to ensure map renders properly
        setTimeout(() => {
          map.invalidateSize();
          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsLoading(false);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !farmData) return;

    const map = mapRef.current;

    // Clear existing layers
    Object.values(layersRef.current).forEach(layer => {
      map.removeLayer(layer);
    });
    layersRef.current = {};

    // Draw farm boundary if exists
    if (farmData.farmBoundary) {
      const coordinates = farmData.farmBoundary.coordinates[0].map(
        (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
      );

      const boundaryLayer = L.polygon(coordinates, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 3,
        dashArray: '10, 5',
      }).addTo(map);

      boundaryLayer.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">Farm Boundary</h3>
          <p class="text-xs">Area: ${farmData.farmBoundary.area.toFixed(2)} acres</p>
        </div>
      `);

      layersRef.current['boundary'] = boundaryLayer;

      // Fit bounds to farm boundary
      map.fitBounds(boundaryLayer.getBounds(), { padding: [50, 50] });
    }

    // Draw sections
    farmData.sections.forEach((section: SectionData) => {
      const coordinates = section.geometry.coordinates[0].map(
        (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
      );

      const isSelected = section.id === selectedSectionId;

      const sectionLayer = L.polygon(coordinates, {
        color: section.color,
        fillColor: section.color,
        fillOpacity: isSelected ? 0.5 : 0.3,
        weight: isSelected ? 4 : 2,
      }).addTo(map);

      sectionLayer.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-semibold text-base mb-2">${section.name}</h3>
          <div class="space-y-1 text-sm">
            <p><span class="font-medium">Area:</span> ${section.area.toFixed(2)} acres</p>
            <p><span class="font-medium">Crop:</span> ${section.cropType || 'Not set'}</p>
            <p><span class="font-medium">Soil:</span> ${section.soilType || 'Not set'}</p>
            <p><span class="font-medium">Irrigation:</span> ${section.irrigationType || 'Not set'}</p>
          </div>
        </div>
      `);

      // Handle click events
      sectionLayer.on('click', () => {
        if (onSectionClick) {
          onSectionClick(section.id);
        }
      });

      // Add hover effect
      sectionLayer.on('mouseover', function () {
        this.setStyle({
          fillOpacity: 0.5,
          weight: 3,
        });
      });

      sectionLayer.on('mouseout', function () {
        if (section.id !== selectedSectionId) {
          this.setStyle({
            fillOpacity: 0.3,
            weight: 2,
          });
        }
      });

      layersRef.current[section.id] = sectionLayer;
    });

    // If no boundary, fit to sections
    if (!farmData.farmBoundary && farmData.sections.length > 0) {
      const allCoordinates = farmData.sections.flatMap((section: SectionData) =>
        section.geometry.coordinates[0].map(
          (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
        )
      );

      if (allCoordinates.length > 0) {
        const bounds = L.latLngBounds(allCoordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [farmData, selectedSectionId, onSectionClick]);

  // Highlight selected section
  useEffect(() => {
    if (!selectedSectionId) return;

    const sectionLayer = layersRef.current[selectedSectionId];
    if (sectionLayer && sectionLayer instanceof L.Polygon) {
      sectionLayer.setStyle({
        fillOpacity: 0.5,
        weight: 4,
      });

      // Zoom to selected section
      const bounds = sectionLayer.getBounds();
      mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedSectionId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 bg-blue-500 bg-opacity-10"></div>
            <span>Farm Boundary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 bg-opacity-30 border-2 border-green-500"></div>
            <span>Sections</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmOverviewMap;
