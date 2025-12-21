# Smart Irrigation Application

## Overview
This is a Smart Irrigation management application built with React (Vite) frontend and Express backend. It provides farm management features including irrigation control, weather monitoring, and sensor data visualization.

## Project Architecture
- **Frontend**: React with Vite, TailwindCSS, Radix UI components
- **Backend**: Express server integrated as Vite middleware
- **Build System**: Vite for both client and server builds

### Directory Structure
- `/client` - React frontend code
  - `/components` - UI components (dashboard, auth, ui)
  - `/pages` - Page components (Home, Login, Signup, etc.)
  - `/services` - API service modules
  - `/context` - React context providers
  - `/hooks` - Custom React hooks
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
