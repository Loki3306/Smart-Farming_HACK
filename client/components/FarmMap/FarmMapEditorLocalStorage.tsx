import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import {
  getFarmMapping,
  saveFarmBoundary,
  saveSection,
  deleteSection,
  getSection,
  getSectionColor,
  initializeFarmMapping,
  saveWaterSources,
  updateAllSectionsWaterSources,
  type SectionData,
  type WaterSource,
} from '../../utils/farmMappingStorage';
import { fetchWaterSourcesFromOSM, isCacheValid } from '../../services/osmWaterService';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { Navigation, Droplets } from 'lucide-react';

// Add custom CSS for modern labels
const labelStyles = `
  .modern-section-label {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .modern-section-label::before {
    display: none !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = labelStyles;
  if (!document.head.querySelector('style[data-section-labels]')) {
    styleSheet.setAttribute('data-section-labels', 'true');
    document.head.appendChild(styleSheet);
  }
}

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fix leaflet-draw area measurement
if (typeof (L.GeometryUtil as any) !== 'undefined') {
  (L.GeometryUtil as any).readableArea = function (area: number, isMetric: boolean, precision?: any) {
    let areaStr;
    if (isMetric) {
      if (area >= 10000) {
        areaStr = (area * 0.0001).toFixed(2) + ' ha';
      } else {
        areaStr = area.toFixed(2) + ' m²';
      }
    } else {
      const areaYards = area / 0.836127; // sq meters to sq yards
      if (areaYards >= 3097600) {
        areaStr = (areaYards / 3097600).toFixed(2) + ' mi²';
      } else if (areaYards >= 4840) {
        areaStr = (areaYards / 4840).toFixed(2) + ' acres';
      } else {
        areaStr = Math.ceil(areaYards) + ' yd²';
      }
    }
    return areaStr;
  };
}

interface FarmMapEditorProps {
  farmId: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  selectedSection?: string | null;
  onSectionSelect?: (sectionId: string | null) => void;
  onBoundaryDrawn?: () => void;
  onSectionDrawn?: () => void;
  onStatsUpdate?: () => void;
}

export const FarmMapEditor: React.FC<FarmMapEditorProps> = ({
  farmId,
  initialCenter = [12.9716, 77.5946],
  initialZoom = 15,
  selectedSection: externalSelectedSection,
  onSectionSelect,
  onBoundaryDrawn,
  onSectionDrawn,
  onStatsUpdate,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const farmBoundaryRef = useRef<L.Polygon | null>(null);
  const sectionsLayerRef = useRef<L.FeatureGroup | null>(null);
  const waterSourcesLayerRef = useRef<L.FeatureGroup | null>(null);
  const isDrawingBoundaryRef = useRef<boolean>(false);
  const isDrawingSectionRef = useRef<boolean>(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [isFetchingWater, setIsFetchingWater] = useState(false);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);

  // Calculate area in acres from Leaflet geometry
  const calculateArea = (layer: L.Polygon): number => {
    const area = (L.GeometryUtil as any).geodesicArea(layer.getLatLngs()[0]);
    return area / 4046.86; // Convert sq meters to acres
  };

  // Get user location on mount
  useEffect(() => {
    // If initialCenter is provided (from navigation), use it directly
    if (initialCenter[0] !== 12.9716 || initialCenter[1] !== 77.5946) {
      setMapCenter(initialCenter);
      return;
    }
    
    // Otherwise, try to get user's GPS location and save it
    const savedLocation = localStorage.getItem('user_gps_location');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      setMapCenter([location.lat, location.lng]);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          localStorage.setItem('user_gps_location', JSON.stringify(location));
          setMapCenter([latitude, longitude]);
        },
        () => {
          // If geolocation fails, use default center
          setMapCenter(initialCenter);
        }
      );
    }
  }, [initialCenter]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(mapCenter, initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    drawnItemsRef.current = new L.FeatureGroup();
    sectionsLayerRef.current = new L.FeatureGroup();
    waterSourcesLayerRef.current = new L.FeatureGroup();
    
    // Add layers to map with error handling
    try {
      map.addLayer(drawnItemsRef.current);
      map.addLayer(sectionsLayerRef.current);
      map.addLayer(waterSourcesLayerRef.current);
    } catch (error) {
      console.error('Error adding layers to map:', error);
    }

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          feet: false,
          nautic: false,
          shapeOptions: {
            color: '#3B82F6',
            weight: 3,
            fillOpacity: 0.2,
          },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Handle draw created
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;

      if (isDrawingBoundaryRef.current) {
        handleBoundaryDrawn(layer);
      } else if (isDrawingSectionRef.current) {
        handleSectionDrawn(layer);
      } else {
        // Default: if no explicit mode is set, check if boundary exists
        const farmData = getFarmMapping();
        if (!farmData?.farmBoundary) {
          handleBoundaryDrawn(layer);
        } else {
          handleSectionDrawn(layer);
        }
      }
    });

    // Handle draw edited - save changes to localStorage
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: L.Layer) => {
        if (layer === farmBoundaryRef.current) {
          // Update farm boundary
          const polygon = layer as L.Polygon;
          const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
          const coordinates = [latLngs.map(ll => [ll.lng, ll.lat])];
          const area = calculateArea(polygon);
          const bounds = polygon.getBounds();
          const center: [number, number] = [bounds.getCenter().lat, bounds.getCenter().lng];
          
          saveFarmBoundary(farmId, coordinates, area, center);
          toast.success('Farm boundary updated');
          if (onStatsUpdate) onStatsUpdate();
        } else {
          // Update section
          const sectionId = (layer as any).options.sectionId;
          if (sectionId) {
            const section = getSection(sectionId);
            if (section) {
              const polygon = layer as L.Polygon;
              const latLngs = polygon.getLatLngs()[0] as L.LatLng[];
              const coordinates = [latLngs.map(ll => [ll.lng, ll.lat])];
              const area = calculateArea(polygon);
              
              const updatedSection = {
                ...section,
                geometry: {
                  type: 'Polygon' as const,
                  coordinates,
                },
                area,
              };
              
              saveSection(farmId, updatedSection);
              toast.success(`${section.name} updated`);
              if (onStatsUpdate) onStatsUpdate();
            }
          }
        }
      });
    });

    // Handle draw deleted
    map.on(L.Draw.Event.DELETED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: L.Layer) => {
        if (layer === farmBoundaryRef.current) {
          farmBoundaryRef.current = null;
          toast.success('Farm boundary removed');
        } else {
          const sectionId = (layer as any).options.sectionId;
          if (sectionId) {
            handleSectionDeleteFromMap(sectionId);
          }
        }
      });
      if (onStatsUpdate) onStatsUpdate();
    });

    // Handle zoom to show/hide labels based on zoom level
    map.on('zoomend', () => {
      const currentZoom = map.getZoom();
      const minZoomForLabels = 14; // Show labels only when zoomed in enough

      if (sectionsLayerRef.current) {
        sectionsLayerRef.current.eachLayer((layer: any) => {
          const tooltip = layer.getTooltip();
          if (tooltip) {
            if (currentZoom >= minZoomForLabels) {
              layer.openTooltip();
            } else {
              layer.closeTooltip();
            }
          }
        });
      }
    });

    mapInstanceRef.current = map;
    loadFarmData();

    return () => {
      // Clean up layers before removing map
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
        drawnItemsRef.current = null;
      }
      if (sectionsLayerRef.current) {
        sectionsLayerRef.current.clearLayers();
        sectionsLayerRef.current = null;
      }
      if (waterSourcesLayerRef.current) {
        waterSourcesLayerRef.current.clearLayers();
        waterSourcesLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [farmId, mapCenter]);

  // Load farm data from localStorage
  const loadFarmData = () => {
    const farmData = getFarmMapping();
    if (!farmData) {
      initializeFarmMapping(farmId);
      return;
    }

    // Load boundary
    if (farmData.farmBoundary && mapInstanceRef.current && drawnItemsRef.current) {
      const coords = farmData.farmBoundary.coordinates[0].map(
        (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
      );

      const boundaryLayer = L.polygon(coords, {
        color: '#3B82F6',
        weight: 3,
        fillOpacity: 0.1,
      });

      farmBoundaryRef.current = boundaryLayer;
      drawnItemsRef.current.addLayer(boundaryLayer);
      mapInstanceRef.current.fitBounds(boundaryLayer.getBounds());
    }

    // Load sections
    if (farmData.sections && sectionsLayerRef.current) {
      sectionsLayerRef.current.clearLayers();

      farmData.sections.forEach((section: SectionData) => {
        const coords = section.geometry.coordinates[0].map(
          (coord: number[]) => [coord[1], coord[0]] as L.LatLngExpression
        );

        const sectionLayer = L.polygon(coords, {
          color: section.color,
          weight: 2,
          fillOpacity: 0.3,
        });

        (sectionLayer as any).options.sectionId = section.id;

        // Bind popup for click
        sectionLayer.bindPopup(`
          <div class="p-2">
            <strong>${section.name}</strong><br/>
            Crop: ${section.cropType || 'Not set'}<br/>
            Area: ${section.area.toFixed(2)} acres
          </div>
        `);

        // Bind permanent tooltip with modern styling and GPS icon
        sectionLayer.bindTooltip(`
          <div style="
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 3px solid ${section.color};
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(8px);
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div>
              <div style="font-weight: 600; color: #1f2937; font-size: 13px;">${section.name}</div>
              <div style="color: #6b7280; font-size: 11px;">${section.area.toFixed(2)} acres</div>
            </div>
          </div>
        `, {
          permanent: true,
          direction: 'center',
          className: 'modern-section-label',
          opacity: 1,
        });

        sectionLayer.on('click', () => {
          if (onSectionSelect) {
            onSectionSelect(section.id);
          }
        });

        sectionsLayerRef.current?.addLayer(sectionLayer);

        // Check initial zoom level to show/hide tooltip
        if (mapInstanceRef.current) {
          const currentZoom = mapInstanceRef.current.getZoom();
          if (currentZoom < 14) {
            sectionLayer.closeTooltip();
          }
        }
      });
    }

    // Load water sources
    if (farmData.waterSources && waterSourcesLayerRef.current && mapInstanceRef.current) {
      setWaterSources(farmData.waterSources);
      renderWaterSources(farmData.waterSources);
    }

    // Fetch water sources from OSM if cache is invalid (with delay to ensure map is ready)
    if (!isCacheValid(farmData.waterSourcesLastFetched) && mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          fetchAndDisplayWaterSources();
        }
      }, 1000);
    }
  };

  // Render water sources on map
  const renderWaterSources = (sources: WaterSource[]) => {
    if (!waterSourcesLayerRef.current || !mapInstanceRef.current) return;

    try {
      waterSourcesLayerRef.current.clearLayers();
    } catch (error) {
      // Layer might not be properly initialized yet
      console.warn('Could not clear water sources layer:', error);
      return;
    }

    sources.forEach((source) => {
      const waterIcon = L.divIcon({
        className: 'water-source-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([source.coordinates[0], source.coordinates[1]], {
        icon: waterIcon,
      });

      const typeLabels: Record<WaterSource['type'], string> = {
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

      marker.bindPopup(`
        <div style="padding: 8px; min-width: 150px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
            <strong style="color: #1f2937; font-size: 14px;">${source.name}</strong>
          </div>
          <div style="color: #6b7280; font-size: 12px; margin-left: 28px;">
            <div><strong>Type:</strong> ${typeLabels[source.type]}</div>
            <div style="margin-top: 4px;"><strong>Source:</strong> ${source.source === 'osm' ? 'OpenStreetMap' : 'Manual'}</div>
          </div>
        </div>
      `);

      try {
        if (waterSourcesLayerRef.current && mapInstanceRef.current) {
          waterSourcesLayerRef.current.addLayer(marker);
        }
      } catch (error) {
        console.warn('Could not add water source marker:', error);
      }
    });
  };

  // Fetch water sources from OSM
  const fetchAndDisplayWaterSources = async () => {
    if (!mapInstanceRef.current || isFetchingWater) return;

    setIsFetchingWater(true);

    try {
      const center = mapInstanceRef.current.getCenter();
      const sources = await fetchWaterSourcesFromOSM(center.lat, center.lng, 3);

      if (sources.length > 0) {
        saveWaterSources(sources);
        setWaterSources(sources);
        renderWaterSources(sources);
        
        // Update all sections with nearest water sources
        updateAllSectionsWaterSources();
        
        toast.success(`Found ${sources.length} water source${sources.length !== 1 ? 's' : ''} nearby!`, {
          icon: '💧',
        });
      } else {
        toast('No water sources found in this area', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error fetching water sources:', error);
      toast.error('Failed to fetch water sources from OpenStreetMap');
    } finally {
      setIsFetchingWater(false);
    }
  };

  // Handle boundary drawn
  const handleBoundaryDrawn = (layer: L.Polygon) => {
    if (farmBoundaryRef.current && drawnItemsRef.current) {
      drawnItemsRef.current.removeLayer(farmBoundaryRef.current);
    }

    farmBoundaryRef.current = layer;
    drawnItemsRef.current?.addLayer(layer);

    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    const coordinates = [latLngs.map(ll => [ll.lng, ll.lat])];
    const area = calculateArea(layer);
    const bounds = layer.getBounds();
    const center: [number, number] = [bounds.getCenter().lat, bounds.getCenter().lng];

    const saved = saveFarmBoundary(farmId, coordinates, area, center);

    setIsDrawingBoundary(false);
    isDrawingBoundaryRef.current = false;

    if (saved) {
      if (onBoundaryDrawn) onBoundaryDrawn();
      if (onStatsUpdate) onStatsUpdate();
    }

    mapInstanceRef.current?.fitBounds(layer.getBounds());
  };

  // Handle section drawn
  const handleSectionDrawn = (layer: L.Polygon) => {
    const farmData = getFarmMapping();
    if (!farmData) return;

    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    const coordinates = [latLngs.map(ll => [ll.lng, ll.lat])];
    const area = calculateArea(layer);

    const sectionId = uuidv4();
    const colorIndex = farmData.sections.length;

    const newSection: SectionData = {
      id: sectionId,
      name: `Section ${farmData.sections.length + 1}`,
      geometry: {
        type: 'Polygon',
        coordinates,
      },
      area,
      cropType: '',
      soilType: '',
      irrigationType: '',
      color: getSectionColor(colorIndex),
      createdAt: new Date().toISOString(),
    };

    const saved = saveSection(farmId, newSection);

    if (saved) {
      // Update layer styling
      layer.setStyle({
        color: newSection.color,
        weight: 2,
        fillOpacity: 0.3,
      });

      (layer as any).options.sectionId = sectionId;

      layer.bindPopup(`
        <div class="p-2">
          <strong>${newSection.name}</strong><br/>
          Crop: Not set<br/>
          Area: ${area.toFixed(2)} acres
        </div>
      `);

      // Bind permanent tooltip with modern styling and GPS icon
      layer.bindTooltip(`
        <div style="
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
          padding: 8px 12px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-left: 3px solid ${newSection.color};
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <div>
            <div style="font-weight: 600; color: #1f2937; font-size: 13px;">${newSection.name}</div>
            <div style="color: #6b7280; font-size: 11px;">${area.toFixed(2)} acres</div>
          </div>
        </div>
      `, {
        permanent: true,
        direction: 'center',
        className: 'modern-section-label',
        opacity: 1,
      });

      layer.on('click', () => {
        if (onSectionSelect) {
          onSectionSelect(sectionId);
        }
      });

      sectionsLayerRef.current?.addLayer(layer);

      setIsDrawingSection(false);
      isDrawingSectionRef.current = false;

      // Auto-open details panel for the newly created section
      if (onSectionSelect) {
        onSectionSelect(sectionId);
      }

      if (onSectionDrawn) onSectionDrawn();
      if (onStatsUpdate) onStatsUpdate();
    }
  };

  // Handle section delete from map
  const handleSectionDeleteFromMap = (sectionId: string) => {
    deleteSection(sectionId);
    toast.success('Section deleted');
    if (onStatsUpdate) onStatsUpdate();
  };

  // Start drawing boundary
  const startDrawingBoundary = () => {
    setIsDrawingBoundary(true);
    isDrawingBoundaryRef.current = true;
    setIsDrawingSection(false);
    isDrawingSectionRef.current = false;
    toast('Click on the map to draw farm boundary', { icon: 'ℹ️' });
  };

  // Start drawing section
  const startDrawingSection = () => {
    setIsDrawingSection(true);
    isDrawingSectionRef.current = true;
    setIsDrawingBoundary(false);
    isDrawingBoundaryRef.current = false;
    toast('Click on the map to draw a new section', { icon: '✏️' });
  };

  // Get user location
  const handleGetLocation = () => {
    if (!mapInstanceRef.current) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng: L.LatLngExpression = [latitude, longitude];

        if (userMarkerRef.current) {
          mapInstanceRef.current?.removeLayer(userMarkerRef.current);
        }

        userMarkerRef.current = L.marker(latlng, {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
        }).addTo(mapInstanceRef.current!);

        userMarkerRef.current.bindPopup('Your Location').openPopup();
        mapInstanceRef.current?.setView(latlng, 17);
        setIsLocating(false);
        toast.success('Location found!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get location');
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Control Buttons */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <button
          onClick={startDrawingBoundary}
          className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all ${
            isDrawingBoundary
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isDrawingBoundary ? 'Drawing Boundary...' : 'Draw Farm Boundary'}
        </button>

        <button
          onClick={startDrawingSection}
          className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all block ${
            isDrawingSection
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isDrawingSection ? 'Drawing Section...' : 'Add New Section'}
        </button>

        <button
          onClick={handleGetLocation}
          disabled={isLocating}
          className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Locating...' : 'My Location'}
        </button>

        <button
          onClick={fetchAndDisplayWaterSources}
          disabled={isFetchingWater}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Droplets className={`w-4 h-4 ${isFetchingWater ? 'animate-pulse' : ''}`} />
          {isFetchingWater ? 'Scanning...' : 'Find Water Sources'}
        </button>
      </div>
    </div>
  );
};
