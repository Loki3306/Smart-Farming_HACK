export const CONFIG = {
  USE_MOCK_DATA: false, // Using real database now
  API_BASE_URL: "/api",
  // Use /python-api prefix which is proxied by Vite to http://localhost:8000
  // This avoids CORS issues during development
  FARM_API_BASE_URL: "/python-api/api",
  PYTHON_API_BASE_URL: "/python-api",
  SIMULATION_DELAY: 500, // milliseconds
  AUTH_ENDPOINTS: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    GET_CURRENT_USER: "/auth/me",
    UPDATE: "/auth/update",
  },
};

export const API_BASE_URL = CONFIG.API_BASE_URL;
export const FARM_API_BASE_URL = CONFIG.FARM_API_BASE_URL;
export const PYTHON_API_BASE_URL = CONFIG.PYTHON_API_BASE_URL;

export default CONFIG;
