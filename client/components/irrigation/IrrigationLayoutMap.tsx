import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SectionData, WaterSource } from '../../utils/farmMappingStorage';
import { IrrigationMethod } from '../../services/irrigationPlanningService';
import { X, Droplets, Navigation, Ruler } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface IrrigationLayoutMapProps {
  section: SectionData;
  waterSource: WaterSource;
  method: IrrigationMethod;
  distance: number;
  pipeLength: number;
  onClose: () => void;
}

export const IrrigationLayoutMap: React.FC<IrrigationLayoutMapProps> = ({
  section,
  waterSource,
  method,
  distance,
  pipeLength,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Calculate section centroid
    const coords = section.geometry.coordinates[0];
    let totalLat = 0, totalLng = 0;
    coords.forEach(coord => {
      totalLng += coord[0];
      totalLat += coord[1];
    });
    const sectionCentroid: [number, number] = [totalLat / coords.length, totalLng / coords.length];
    
    // Initialize map centered between water source and section
    const centerLat = (waterSource.coordinates[0] + sectionCentroid[0]) / 2;
    const centerLng = (waterSource.coordinates[1] + sectionCentroid[1]) / 2;
    
    // Small delay to ensure container is rendered
    setTimeout(() => {
      if (!mapRef.current) return;
      
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([centerLat, centerLng], 16);
      
      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // 1. Draw Section Polygon
    const sectionCoords = coords.map(coord => [coord[1], coord[0]] as [number, number]);
    const sectionPolygon = L.polygon(sectionCoords, {
      color: section.color,
      weight: 3,
      fillOpacity: 0.2,
      fillColor: section.color,
    }).addTo(map);
    
    sectionPolygon.bindPopup(`
      <div class="text-sm">
        <strong class="text-base">${section.name}</strong><br/>
        <span class="text-gray-600">Area: ${section.area.toFixed(2)} acres</span><br/>
        <span class="text-gray-600">Crop: ${section.cropType || 'Not set'}</span>
      </div>
    `);

    // 2. Add Water Source Marker
    const waterSourceIcon = L.divIcon({
      className: 'custom-water-source-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const waterSourceMarker = L.marker([waterSource.coordinates[0], waterSource.coordinates[1]], {
      icon: waterSourceIcon,
    }).addTo(map);
    
    waterSourceMarker.bindPopup(`
      <div class="text-sm">
        <strong class="text-base">${waterSource.name}</strong><br/>
        <span class="text-gray-600 capitalize">${waterSource.type.replace('_', ' ')}</span><br/>
        <span class="text-blue-600">Water Source</span>
      </div>
    `);

    // 3. Add Section Centroid Marker
    const centroidIcon = L.divIcon({
      className: 'custom-centroid-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: ${section.color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(sectionCentroid, { icon: centroidIcon }).addTo(map)
      .bindPopup(`
        <div class="text-sm">
          <strong>Section Center</strong><br/>
          <span class="text-gray-600">Main delivery point</span>
        </div>
      `);

    // 4. Draw Main Pipeline
    const pipelineCoords: [number, number][] = [
      [waterSource.coordinates[0], waterSource.coordinates[1]],
      sectionCentroid,
    ];

    // Main pipeline
    const mainPipeline = L.polyline(pipelineCoords, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 5',
    }).addTo(map);

    mainPipeline.bindPopup(`
      <div class="text-sm">
        <strong class="text-base">Main Pipeline</strong><br/>
        <span class="text-gray-600">Length: ${Math.round(distance)}m</span><br/>
        <span class="text-gray-600">Method: ${method}</span><br/>
        <span class="text-blue-600">Pipe Length: ${Math.round(pipeLength)}m</span>
      </div>
    `);

    // Add animated flow arrows
    const arrowSpacing = 50; // meters between arrows
    const numArrows = Math.floor(distance / arrowSpacing);
    
    for (let i = 1; i <= numArrows; i++) {
      const fraction = i / (numArrows + 1);
      const arrowLat = waterSource.coordinates[0] + (sectionCentroid[0] - waterSource.coordinates[0]) * fraction;
      const arrowLng = waterSource.coordinates[1] + (sectionCentroid[1] - waterSource.coordinates[1]) * fraction;
      
      const arrowIcon = L.divIcon({
        className: 'flow-arrow',
        html: `
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 12px solid #2563eb;
            transform: rotate(${getAngle(waterSource.coordinates, sectionCentroid)}deg);
            animation: flowPulse 2s ease-in-out infinite;
            animation-delay: ${i * 0.2}s;
          "></div>
          <style>
            @keyframes flowPulse {
              0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(${getAngle(waterSource.coordinates, sectionCentroid)}deg); }
              50% { opacity: 1; transform: scale(1.2) rotate(${getAngle(waterSource.coordinates, sectionCentroid)}deg); }
            }
          </style>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      
      L.marker([arrowLat, arrowLng], { icon: arrowIcon }).addTo(map);
    }

    // 5. Method-Specific Visualization
    if (method === 'drip') {
      addDripIrrigationPattern(map, section, sectionCentroid);
    } else if (method === 'sprinkler') {
      addSprinklerPattern(map, section, sectionCentroid);
    }

      // Fit map to show both water source and section
      const bounds = L.latLngBounds([
        [waterSource.coordinates[0], waterSource.coordinates[1]],
        ...sectionCoords,
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });

      mapInstanceRef.current = map;
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [section, waterSource, method, distance]);

  // Helper: Calculate angle for arrow rotation
  const getAngle = (from: [number, number], to: [number, number]): number => {
    const dy = to[0] - from[0];
    const dx = to[1] - from[1];
    return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  };

  // Helper: Check if a point is inside the polygon using ray casting algorithm
  const isPointInPolygon = (lat: number, lng: number, coords: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i][1], yi = coords[i][0];
      const xj = coords[j][1], yj = coords[j][0];
      
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Add drip irrigation pattern
  const addDripIrrigationPattern = (map: L.Map, section: SectionData, centroid: [number, number]) => {
    const coords = section.geometry.coordinates[0];
    const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]] as [number, number]));
    
    // Calculate number of drip lines (spacing ~1.2m for row crops)
    const latDiff = bounds.getNorthEast().lat - bounds.getSouthWest().lat;
    const lineSpacing = 1.2; // meters between drip lines
    
    // Rough conversion: 0.00001 degrees ≈ 1 meter
    const numLines = Math.max(5, Math.min(20, Math.floor((latDiff * 111000) / lineSpacing)));
    
    // Draw drip lines across the section horizontally
    for (let i = 0; i < numLines; i++) {
      const fraction = (i + 0.5) / numLines;
      const lat = bounds.getSouthWest().lat + (bounds.getNorthEast().lat - bounds.getSouthWest().lat) * fraction;
      
      // Find intersection points with polygon boundary
      const linePoints: [number, number][] = [];
      const numTestPoints = 100;
      
      for (let k = 0; k <= numTestPoints; k++) {
        const testLng = bounds.getSouthWest().lng + (bounds.getNorthEast().lng - bounds.getSouthWest().lng) * (k / numTestPoints);
        if (isPointInPolygon(lat, testLng, coords)) {
          linePoints.push([lat, testLng]);
        }
      }
      
      // Group consecutive points into line segments
      if (linePoints.length > 1) {
        let segmentStart = 0;
        for (let k = 1; k <= linePoints.length; k++) {
          if (k === linePoints.length || Math.abs(linePoints[k][1] - linePoints[k-1][1]) > 0.0002) {
            if (k - segmentStart > 1) {
              L.polyline(linePoints.slice(segmentStart, k), {
                color: '#10b981',
                weight: 2,
                opacity: 0.7,
                dashArray: '4, 6',
              }).addTo(map);
              
              // Add emitter dots along this segment
              const segmentPoints = linePoints.slice(segmentStart, k);
              for (let j = 0; j < segmentPoints.length; j += 3) {
                const emitterIcon = L.divIcon({
                  className: 'drip-emitter',
                  html: `
                    <div style="
                      width: 4px;
                      height: 4px;
                      background: #10b981;
                      border-radius: 50%;
                    "></div>
                  `,
                  iconSize: [4, 4],
                  iconAnchor: [2, 2],
                });
                L.marker(segmentPoints[j], { icon: emitterIcon }).addTo(map);
              }
            }
            segmentStart = k;
          }
        }
      }
    }
  };

  // Add sprinkler pattern
  const addSprinklerPattern = (map: L.Map, section: SectionData, centroid: [number, number]) => {
    const coords = section.geometry.coordinates[0];
    const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]] as [number, number]));
    
    // Calculate area in square meters roughly
    const latDiff = bounds.getNorthEast().lat - bounds.getSouthWest().lat;
    const lngDiff = bounds.getNorthEast().lng - bounds.getSouthWest().lng;
    
    // Realistic sprinkler coverage: each covers ~80-100m² (8-10m diameter)
    // For a 1 acre (4047m²) section, we'd need about 40-50 sprinklers
    // Let's use 15m spacing for better visualization
    const sprinklerSpacing = 15; // meters between sprinklers
    const coverageRadius = 8; // meters coverage radius per sprinkler
    
    // Calculate grid size based on approximate meters
    // Rough conversion: 0.00001 degrees ≈ 1 meter
    const numRows = Math.max(2, Math.min(6, Math.floor((latDiff * 111000) / sprinklerSpacing)));
    const numCols = Math.max(2, Math.min(6, Math.floor((lngDiff * 111000 * Math.cos(centroid[0] * Math.PI / 180)) / sprinklerSpacing)));
    
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const lat = bounds.getSouthWest().lat + (bounds.getNorthEast().lat - bounds.getSouthWest().lat) * ((row + 0.5) / numRows);
        const lng = bounds.getSouthWest().lng + (bounds.getNorthEast().lng - bounds.getSouthWest().lng) * ((col + 0.5) / numCols);
        
        // Only place sprinkler if it's inside the polygon
        if (isPointInPolygon(lat, lng, coords)) {
          // Draw sprinkler coverage circle
          L.circle([lat, lng], {
            radius: coverageRadius,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '4, 4',
          }).addTo(map);
          
          // Add sprinkler marker
          const sprinklerIcon = L.divIcon({
            className: 'sprinkler-marker',
            html: `
              <div style="
                width: 16px;
                height: 16px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          
          L.marker([lat, lng], { icon: sprinklerIcon }).addTo(map);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-750">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Droplets className="w-6 h-6 text-blue-500" />
              Irrigation Layout Visualization
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {section.name} • {waterSource.name} • {method}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
              <p className="font-semibold text-gray-800 dark:text-white">{Math.round(distance)}m</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pipe Length</p>
              <p className="font-semibold text-gray-800 dark:text-white">{Math.round(pipeLength)}m</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full`} style={{ backgroundColor: section.color }} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Section Area</p>
              <p className="font-semibold text-gray-800 dark:text-white">{section.area.toFixed(2)} acres</p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[500px]">
          <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-lg overflow-hidden" style={{ minHeight: '500px' }} />
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white"></div>
              <span className="text-gray-600 dark:text-gray-400">Water Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-600" style={{ borderTop: '2px dashed #2563eb' }}></div>
              <span className="text-gray-600 dark:text-gray-400">Main Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: section.color, opacity: 0.3, border: `2px solid ${section.color}` }}></div>
              <span className="text-gray-600 dark:text-gray-400">Section Boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Water Flow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
