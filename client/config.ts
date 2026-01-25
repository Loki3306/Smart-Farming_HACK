export const CONFIG = {
  USE_MOCK_DATA: false, // ✅ Using real database now
  API_BASE_URL: "/api",
  FARM_API_BASE_URL: "http://localhost:8000/api",
  SIMULATION_DELAY: 500, // milliseconds
  AUTH_ENDPOINTS: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    GET_CURRENT_USER: "/auth/me",
  },
};

export const API_BASE_URL = CONFIG.API_BASE_URL;
export const FARM_API_BASE_URL = CONFIG.FARM_API_BASE_URL;

export default CONFIG;
