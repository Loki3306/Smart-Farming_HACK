/**
 * Geocoding Service - Reverse geocode coordinates to city, district, state
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

export interface GeocodingResult {
  success: boolean;
  city: string;
  district: string;
  state: string;
  village: string;
  fullAddress: string;
  error?: string;
}

/**
 * Reverse geocode coordinates to get location details
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @returns GeocodingResult with city, district, state, village
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SmartFarmingApp/1.0',
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        city: '',
        district: '',
        state: '',
        village: '',
        fullAddress: '',
        error: data.error,
      };
    }

    const address = data.address || {};

    // Extract location components (Nominatim uses different keys)
    const city = 
      address.city || 
      address.town || 
      address.municipality ||
      '';

    const district = 
      address.state_district || 
      address.county || 
      address.district ||
      address.city_district ||
      '';

    const state = 
      address.state || 
      '';

    const village = 
      address.village || 
      address.hamlet || 
      address.suburb ||
      address.neighbourhood ||
      '';

    const fullAddress = data.display_name || '';

    console.log('[Geocoding] Result:', { city, district, state, village });

    return {
      success: true,
      city,
      district,
      state: normalizeStateName(state),
      village,
      fullAddress,
    };
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return {
      success: false,
      city: '',
      district: '',
      state: '',
      village: '',
      fullAddress: '',
      error: error instanceof Error ? error.message : 'Geocoding failed',
    };
  }
}

/**
 * Normalize state names to match our database format
 */
export function normalizeStateName(state: string): string {
  if (!state) return '';
  
  // Map of common variations to standard names
  const stateMap: Record<string, string> = {
    'maharashtra': 'Maharashtra',
    'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu',
    'tamilnadu': 'Tamil Nadu',
    'andhra pradesh': 'Andhra Pradesh',
    'andhrapradesh': 'Andhra Pradesh',
    'telangana': 'Telangana',
    'kerala': 'Kerala',
    'gujarat': 'Gujarat',
    'rajasthan': 'Rajasthan',
    'madhya pradesh': 'Madhya Pradesh',
    'madhyapradesh': 'Madhya Pradesh',
    'uttar pradesh': 'Uttar Pradesh',
    'uttarpradesh': 'Uttar Pradesh',
    'bihar': 'Bihar',
    'west bengal': 'West Bengal',
    'westbengal': 'West Bengal',
    'punjab': 'Punjab',
    'haryana': 'Haryana',
    'odisha': 'Odisha',
    'orissa': 'Odisha',
    'chhattisgarh': 'Chhattisgarh',
    'jharkhand': 'Jharkhand',
    'assam': 'Assam',
    'himachal pradesh': 'Himachal Pradesh',
    'uttarakhand': 'Uttarakhand',
    'goa': 'Goa',
  };

  const normalized = state.toLowerCase().trim();
  return stateMap[normalized] || state;
}
