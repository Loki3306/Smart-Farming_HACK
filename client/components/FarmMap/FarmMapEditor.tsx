import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { farmGeometryService, type FarmGeometry, type FarmSection, type GeoJSONPolygon } from '../../services/farmGeometryService';
import { toast } from 'react-hot-toast';
import { Navigation } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Fix leaflet-draw type error by setting default measurement options
if (typeof (L.GeometryUtil as any) !== 'undefined') {
  (L.GeometryUtil as any).readableArea = function (area: number, isMetric: boolean) {
    let areaStr;
    if (isMetric) {
      if (area >= 10000) {
        areaStr = (area * 0.0001).toFixed(2) + ' ha';
      } else {
        areaStr = area.toFixed(2) + ' m²';
      }
    } else {
      area /= 0.836127; // sq meters to sq yards
      if (area >= 3097600) {
        areaStr = (area / 3097600).toFixed(2) + ' mi²';
      } else if (area >= 4840) {
        areaStr = (area / 4840).toFixed(2) + ' acres';
      } else {
        areaStr = Math.ceil(area) + ' yd²';
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
  onSectionsChange?: (sections: FarmSection[]) => void;
  onBoundaryDrawn?: (boundary: GeoJSONPolygon) => void;
  onSectionDrawn?: (section: GeoJSONPolygon) => void;
}

export const FarmMapEditor: React.FC<FarmMapEditorProps> = ({
  farmId,
  initialCenter = [12.9716, 77.5946], // Default: Bangalore
  initialZoom = 15,
  selectedSection: externalSelectedSection,
  onSectionSelect,
  onSectionsChange,
  onBoundaryDrawn,
  onSectionDrawn,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const farmBoundaryRef = useRef<L.Polygon | null>(null);
  const sectionsLayerRef = useRef<L.FeatureGroup | null>(null);
  const isDrawingBoundaryRef = useRef<boolean>(false);
  const isDrawingSectionRef = useRef<boolean>(false);

  const [farmGeometry, setFarmGeometry] = useState<FarmGeometry | null>(null);
  const [sections, setSections] = useState<FarmSection[]>([]);
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Use external or internal selected section
  const selectedSection = externalSelectedSection !== undefined ? externalSelectedSection : null;
  const handleSectionSelect = (sectionId: string | null) => {
    if (onSectionSelect) {
      onSectionSelect(sectionId);
    }
  };

  // Notify parent of sections changes
  useEffect(() => {
    if (onSectionsChange) {
      onSectionsChange(sections);
    }
  }, [sections]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, { attributionControl: false }).setView(initialCenter, initialZoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize feature groups
    drawnItemsRef.current = new L.FeatureGroup();
    sectionsLayerRef.current = new L.FeatureGroup();
    map.addLayer(drawnItemsRef.current);
    map.addLayer(sectionsLayerRef.current);

    // Add drawing controls
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
      const geoJSON = layer.toGeoJSON();

      console.log('Draw created event fired', {
        isDrawingBoundary: isDrawingBoundaryRef.current,
        isDrawingSection: isDrawingSectionRef.current,
        geometry: geoJSON.geometry
      });

      if (isDrawingBoundaryRef.current) {
        handleBoundaryDrawn(geoJSON.geometry as GeoJSONPolygon, layer);
      } else if (isDrawingSectionRef.current) {
        handleSectionDrawn(geoJSON.geometry as GeoJSONPolygon, layer);
      } else {
        // Fallback: if no mode is set, treat as boundary if no boundary exists
        if (!farmGeometry?.has_geometry) {
          handleBoundaryDrawn(geoJSON.geometry as GeoJSONPolygon, layer);
        } else {
          handleSectionDrawn(geoJSON.geometry as GeoJSONPolygon, layer);
        }
      }
    });

    // Handle draw edited
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: L.Layer) => {
        const geoJSON = (layer as any).toGeoJSON();
        // Handle boundary or section edit
        if (layer === farmBoundaryRef.current) {
          updateFarmBoundary(geoJSON.geometry as GeoJSONPolygon);
        } else {
          // Find which section was edited
          const sectionId = (layer as any).options.sectionId;
          if (sectionId) {
            updateSection(sectionId, geoJSON.geometry as GeoJSONPolygon);
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
          setFarmGeometry(null);
        } else {
          const sectionId = (layer as any).options.sectionId;
          if (sectionId) {
            handleSectionDelete(sectionId);
          }
        }
      });
    });

    mapInstanceRef.current = map;

    // Load existing farm geometry
    loadFarmGeometry();
    loadFarmSections();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [farmId]);

  // Load existing farm boundary
  const loadFarmGeometry = async () => {
    try {
      const geometry = await farmGeometryService.getFarmGeometry(farmId);
      if (geometry.boundary_geojson && mapInstanceRef.current && drawnItemsRef.current) {
        const polygon = L.geoJSON(geometry.boundary_geojson, {
          style: {
            color: '#3B82F6',
            weight: 3,
            fillOpacity: 0.1,
          },
        });

        const layer = polygon.getLayers()[0] as L.Polygon;
        farmBoundaryRef.current = layer;
        drawnItemsRef.current.addLayer(layer);

        // Fit map to boundary
        mapInstanceRef.current.fitBounds(layer.getBounds());

        setFarmGeometry(geometry);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load farm geometry:', error);
      }
    }
  };

  // Load existing sections
  const loadFarmSections = async () => {
    try {
      const loadedSections = await farmGeometryService.listSections(farmId, true);

      // Ensure we have an array
      const sectionsArray = Array.isArray(loadedSections) ? loadedSections : [];
      setSections(sectionsArray);

      if (sectionsLayerRef.current && mapInstanceRef.current) {
        sectionsLayerRef.current.clearLayers();

        sectionsArray.forEach((section) => {
          if (section.section_geojson) {
            const polygon = L.geoJSON(section.section_geojson, {
              style: {
                color: section.display_color || '#3B82F6',
                weight: 2,
                fillOpacity: 0.3,
              },
            });

            const layer = polygon.getLayers()[0] as L.Polygon;
            (layer as any).options.sectionId = section.section_id;

            // Add popup with section info
            layer.bindPopup(`
              <div>
                <strong>${section.section_name}</strong><br/>
                ${section.crop_type ? `Crop: ${section.crop_type}<br/>` : ''}
                ${section.area_acres ? `Area: ${section.area_acres.toFixed(2)} acres<br/>` : ''}
                ${section.health_score ? `Health: ${section.health_score}%` : ''}
              </div>
            `);

            layer.on('click', () => {
              handleSectionSelect(section.section_id);
            });

            sectionsLayerRef.current?.addLayer(layer);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load farm sections:', error);
    }
  };

  // Handle farm boundary drawn
  const handleBoundaryDrawn = async (geometry: GeoJSONPolygon, layer: L.Polygon) => {
    try {
      const updatedGeometry = await farmGeometryService.updateFarmBoundary(farmId, geometry);

      // Remove old boundary if exists
      if (farmBoundaryRef.current && drawnItemsRef.current) {
        drawnItemsRef.current.removeLayer(farmBoundaryRef.current);
      }

      farmBoundaryRef.current = layer;
      drawnItemsRef.current?.addLayer(layer);
      setFarmGeometry(updatedGeometry);

      toast.success(`Farm boundary saved! Area: ${updatedGeometry.area_acres?.toFixed(2)} acres`);

      if (onBoundaryDrawn) {
        onBoundaryDrawn(geometry);
      }

      setIsDrawingBoundary(false);
      isDrawingBoundaryRef.current = false;
    } catch (error: any) {
      console.error('Failed to save boundary:', error);
      toast.error(error.response?.data?.detail || 'Failed to save farm boundary');
      drawnItemsRef.current?.removeLayer(layer);
    }
  };

  // Handle section drawn
  const handleSectionDrawn = async (geometry: GeoJSONPolygon, layer: L.Polygon) => {
    try {
      // Validate section is within farm boundary
      if (!farmGeometry?.has_geometry) {
        toast.error('Please draw farm boundary first');
        drawnItemsRef.current?.removeLayer(layer);
        return;
      }

      // Create section with default data
      const sectionNumber = sections.length + 1;
      const newSection = await farmGeometryService.createSection(farmId, {
        section_name: `Section ${sectionNumber}`,
        section_number: sectionNumber,
        section_geojson: geometry,
        display_color: getRandomColor(),
      });

      (layer as any).options.sectionId = newSection.section_id;
      layer.setStyle({
        color: newSection.display_color || '#3B82F6',
        weight: 2,
        fillOpacity: 0.3,
      });

      layer.bindPopup(`
        <div>
          <strong>${newSection.section_name}</strong><br/>
          Area: ${newSection.area_acres?.toFixed(2)} acres
        </div>
      `);

      layer.on('click', () => {
        handleSectionSelect(newSection.section_id);
      });

      sectionsLayerRef.current?.addLayer(layer);
      setSections([...sections, newSection]);

      toast.success(`Section created: ${newSection.area_acres?.toFixed(2)} acres`);

      setIsDrawingSection(false);
      isDrawingSectionRef.current = false;
      if (onSectionDrawn) {
        onSectionDrawn(geometry);
      }

      setIsDrawingSection(false);
    } catch (error: any) {
      console.error('Failed to save section:', error);
      toast.error(error.response?.data?.detail || 'Failed to save section');
      drawnItemsRef.current?.removeLayer(layer);
    }
  };

  // Update farm boundary
  const updateFarmBoundary = async (geometry: GeoJSONPolygon) => {
    try {
      const updatedGeometry = await farmGeometryService.updateFarmBoundary(farmId, geometry);
      setFarmGeometry(updatedGeometry);
      toast.success('Farm boundary updated');
    } catch (error: any) {
      console.error('Failed to update boundary:', error);
      toast.error(error.response?.data?.detail || 'Failed to update boundary');
    }
  };

  // Update section
  const updateSection = async (sectionId: string, geometry: GeoJSONPolygon) => {
    try {
      const updatedSection = await farmGeometryService.updateSection(farmId, sectionId, {
        section_geojson: geometry,
      });

      setSections(sections.map((s) => (s.section_id === sectionId ? updatedSection : s)));
      toast.success('Section updated');
    } catch (error: any) {
      console.error('Failed to update section:', error);
      toast.error(error.response?.data?.detail || 'Failed to update section');
      loadFarmSections(); // Reload to revert changes
    }
  };

  // Delete section
  const handleSectionDelete = async (sectionId: string) => {
    try {
      await farmGeometryService.deleteSection(farmId, sectionId);
      setSections(sections.filter((s) => s.section_id !== sectionId));
      toast.success('Section deleted');
    } catch (error: any) {
      console.error('Failed to delete section:', error);
      toast.error('Failed to delete section');
    }
  };

  // Utility: Generate random color
  const getRandomColor = (): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!mapInstanceRef.current) return;

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    toast.loading('Getting your location...', { id: 'geolocation' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: [number, number] = [latitude, longitude];
        setUserLocation(location);

        if (mapInstanceRef.current) {
          // Center map on user location
          mapInstanceRef.current.setView(location, 18);

          // Remove old marker if exists
          if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current);
          }

          // Add custom marker for user location
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background: #3B82F6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                position: relative;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 8px;
                  height: 8px;
                  background: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker(location, { icon: userIcon }).addTo(mapInstanceRef.current);
          marker.bindPopup('<strong>Your Location</strong><br/>📍 Current Position');
          userMarkerRef.current = marker;

          toast.success('Location found!', { id: 'geolocation' });
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);

        let errorMessage = 'Unable to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable location permissions in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }

        toast.error(errorMessage, { id: 'geolocation', duration: 4000 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs">
        <h3 className="text-lg font-semibold mb-3">Farm Mapping Tools</h3>

        {/* Farm Info */}
        {farmGeometry?.has_geometry && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm font-medium">Farm Boundary</p>
            <p className="text-xs text-gray-600">
              Area: {farmGeometry.area_acres?.toFixed(2)} acres ({farmGeometry.area_sq_meters?.toFixed(0)} m²)
            </p>
          </div>
        )}

        {/* Drawing Buttons */}
        <div className="space-y-2">
          <button
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {isLocating ? 'Locating...' : 'My Location'}
          </button>

          <button
            onClick={() => {
              setIsDrawingBoundary(true);
              setIsDrawingSection(false);
              isDrawingBoundaryRef.current = true;
              isDrawingSectionRef.current = false;
              toast('Click on the map to start drawing farm boundary', { icon: 'ℹ️' });
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {farmGeometry?.has_geometry ? 'Redraw' : 'Draw'} Farm Boundary
          </button>

          <button
            onClick={() => {
              if (!farmGeometry?.has_geometry) {
                toast.error('Please draw farm boundary first');
                return;
              }
              setIsDrawingSection(true);
              setIsDrawingBoundary(false);
              isDrawingSectionRef.current = true;
              isDrawingBoundaryRef.current = false;
              toast('Click on the map to start drawing a section', { icon: 'ℹ️' });
            }}
            disabled={!farmGeometry?.has_geometry}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add New Section
          </button>
        </div>

        {/* Sections List */}
        {sections.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Sections ({sections.length})</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {sections.map((section) => (
                <div
                  key={section.section_id}
                  onClick={() => setSelectedSection(section.section_id)}
                  className={`p-2 rounded cursor-pointer transition ${selectedSection === section.section_id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: section.display_color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{section.section_name}</p>
                      <p className="text-xs text-gray-600">
                        {section.area_acres?.toFixed(2)} acres
                        {section.crop_type && ` • ${section.crop_type}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click "My Location" to center map</li>
            <li>Draw farm boundary first</li>
            <li>Add sections within boundary</li>
            <li>Use toolbar to edit/delete</li>
            <li>Click sections for details</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
