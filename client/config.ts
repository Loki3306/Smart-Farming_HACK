export const CONFIG = {
  USE_MOCK_DATA: false, // ✅ Using real database now
  API_BASE_URL: "/api",
  SIMULATION_DELAY: 500, // milliseconds
  AUTH_ENDPOINTS: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    GET_CURRENT_USER: "/auth/me",
  },
};

export default CONFIG;
