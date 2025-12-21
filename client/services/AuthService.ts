import CONFIG from "../config";

export interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  country: string;
  state: string;
  experienceLevel: "beginner" | "intermediate" | "experienced";
  preferredLanguage?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  country: string;
  state: string;
  experienceLevel: "beginner" | "intermediate" | "experienced";
  preferredLanguage?: string;
  hasCompletedOnboarding: boolean;
  createdAt: Date;
  isDemoUser?: boolean;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// Mock users database
const mockUsers: Map<string, User & { password: string }> = new Map();

// Demo user
const DEMO_USER: User = {
  id: "demo-user-123",
  email: "demo@irrigate.farm",
  fullName: "Demo Farmer",
  country: "United States",
  state: "California",
  experienceLevel: "intermediate",
  hasCompletedOnboarding: true,
  createdAt: new Date(),
  isDemoUser: true,
};

// Add a default test user for demo
mockUsers.set("test@example.com", {
  id: "user-001",
  email: "test@example.com",
  fullName: "Test Farmer",
  phoneNumber: "555-1234",
  country: "United States",
  state: "California",
  experienceLevel: "beginner",
  hasCompletedOnboarding: true,
  createdAt: new Date("2024-01-01"),
  password: "password123", // plain text for mock (bcrypt would be used in real backend)
  isDemoUser: false,
});

class AuthServiceClass {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();

      // Check if user already exists
      if (mockUsers.has(payload.email)) {
        throw new Error("Email already registered");
      }

      // Create new user
      const newUser: User & { password: string } = {
        id: `user-${Date.now()}`,
        email: payload.email,
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        country: payload.country,
        state: payload.state,
        experienceLevel: payload.experienceLevel,
        preferredLanguage: payload.preferredLanguage,
        hasCompletedOnboarding: false,
        createdAt: new Date(),
        password: payload.password, // In real backend, bcrypt would hash this
        isDemoUser: false,
      };

      mockUsers.set(payload.email, newUser);

      // Mock JWT token (in real backend, actual JWT would be generated)
      const mockToken = this.generateMockToken(newUser.id);

      // Mock cookie setting (real backend would set HttpOnly cookie)
      this.setMockCookie("auth_token", mockToken);

      const { password, ...userWithoutPassword } = newUser;
      return {
        user: userWithoutPassword,
        token: mockToken,
      };
    }

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.SIGNUP}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Signup failed");
    }

    return response.json();
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();

      const user = mockUsers.get(payload.email);

      if (!user || user.password !== payload.password) {
        throw new Error("Invalid email or password");
      }

      // Mock JWT token
      const mockToken = this.generateMockToken(user.id);
      this.setMockCookie("auth_token", mockToken);

      const { password, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token: mockToken,
      };
    }

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.LOGIN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  }

  async logout(): Promise<void> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      this.clearMockCookie("auth_token");
      return;
    }

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.LOGOUT}`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Logout failed");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();

      // Check for mock auth token
      const token = this.getMockCookie("auth_token");
      if (!token) {
        return null;
      }

      // Find user by token (simplified)
      for (const user of mockUsers.values()) {
        if (this.generateMockToken(user.id) === token) {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
      }

      return null;
    }

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.GET_CURRENT_USER}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user || null;
  }

  getDemoUser(): User {
    return DEMO_USER;
  }

  private generateMockToken(userId: string): string {
    // Simple mock token generation (not actual JWT)
    return `mock-jwt-${userId}-${Date.now()}`;
  }

  private setMockCookie(name: string, value: string): void {
    // Simulate cookie setting in sessionStorage for demo
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(name, value);
    }
  }

  private getMockCookie(name: string): string | null {
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem(name);
    }
    return null;
  }

  private clearMockCookie(name: string): void {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(name);
    }
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY)
    );
  }
}

export const AuthService = new AuthServiceClass();
