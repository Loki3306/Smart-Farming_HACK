# Smart Irrigation Application

## Overview
This is a Smart Irrigation management application built with React (Vite) frontend and Express backend. It provides farm management features including irrigation control, weather monitoring, and sensor data visualization. **Now fully localized for Indian farmers**.

## Project Architecture
- **Frontend**: React with Vite, TailwindCSS, Radix UI components
- **Backend**: Express server integrated as Vite middleware
- **Build System**: Vite for both client and server builds

### Directory Structure
- `/client` - React frontend code
  - `/components` - UI components (dashboard, auth, ui)
  - `/pages` - Page components (Home, Login, Signup, FarmOnboarding, etc.)
  - `/services` - API service modules
  - `/context` - React context providers
  - `/hooks` - Custom React hooks
  - `/lib/india-data.ts` - Indian-specific data (states, crops, soil types, water sources)
- `/server` - Express backend
  - `/routes` - API route handlers
- `/shared` - Shared types and utilities
- `/public` - Static assets

## Development
- **Port**: 5000 (frontend and API via Vite middleware)
- **Dev Command**: `npm run dev`
- **Build**: `npm run build` (builds both client and server)
- **Start Production**: `npm run start`

## Configuration
- API endpoints use relative paths (`/api/...`)
- Mock data mode enabled by default in `client/config.ts`

## Recent Updates - Indian Localization

### Signup Form Changes
- **Placeholders**: Changed to Indian farmer names (e.g., Rajesh Gupta, Ravi Patil)
- **Phone Format**: Updated to Indian format (+91 XXXXX XXXXX)
- **Country**: Default changed to India
- **State/Province**: Converted from text input to dropdown with all 36 Indian states & territories

### Farm Onboarding Changes
- **Location Input**: Indian farm location placeholders (e.g., Nashik, Maharashtra; Warangal, Telangana)
- **GPS Integration**: Added GPS button (MapPin icon) to capture farm location coordinates
  - Shows latitude/longitude after capture
  - Provides user feedback for GPS errors
- **State Dropdown**: Added dedicated state dropdown with all Indian states
- **Soil Types**: Updated to Indian soil types:
  - Black Soil (Regur), Red Soil, Alluvial Soil, Sandy Soil, Laterite Soil, Clay Soil
- **Crops**: Updated to Indian staple crops:
  - Rice (Paddy), Wheat, Cotton, Sugarcane, Soybean, Tomato, Onion, Groundnut, Maize, Potato, Chilli, Mango
- **Crop Seasons**: Updated to Indian agricultural seasons:
  - Kharif (Monsoon: Jun-Oct), Rabi (Winter: Oct-Mar), Zaid (Summer: Mar-Jun)
- **Water Sources**: Updated to Indian-relevant water sources:
  - Borewell, Open Well, Canal, Tank/Lake, Rain-fed

### Data Files
- **`client/lib/india-data.ts`**: Central repository for all Indian-specific data
  - INDIAN_STATES: All 36 states and territories
  - INDIAN_FARMER_NAMES: Common Indian farmer names
  - INDIAN_FARM_LOCATIONS: Sample Indian farm locations
  - INDIAN_CROPS: Indian staple crops with labels
  - SOIL_TYPES_INDIA: Indian soil classifications
  - WATER_SOURCES_INDIA: Indian water sources
  - INDIAN_CROP_SEASONS: Indian agricultural seasons with descriptions
