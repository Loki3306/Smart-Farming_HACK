import CONFIG from "../config";
// supabase removed — auth handled by backend OTP API (/api/otp/*)
import { encryptData, hashPassword } from "../lib/encryption";

export interface SignupPayload {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  country: string;
  state: string;
  experienceLevel: "beginner" | "intermediate" | "experienced";
  preferredLanguage?: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  country: string;
  state: string;
  experienceLevel: "beginner" | "intermediate" | "experienced";
  preferredLanguage?: string;
  hasCompletedOnboarding: boolean;
  createdAt: Date;
  isDemoUser?: boolean;
  isFirstLogin?: boolean; // True for new registrations, false for returning users
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// Mock users database
const mockUsers: Map<string, User & { password: string }> = new Map();

// Demo user
const DEMO_USER: User = {
  id: "35596319-ef8f-4e76-a0cb-cbd88742a05d",
  phone: "+1-555-000-0000",
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
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  fullName: "Test Farmer",
  phone: "555-1234",
  country: "United States",
  state: "California",
  experienceLevel: "beginner",
  hasCompletedOnboarding: true,
  createdAt: new Date("2024-01-01"),
  password: "password123", // plain text for mock (bcrypt would be used in real backend)
  isDemoUser: false,
  isFirstLogin: false,
});

class AuthServiceClass {
  private normalizeUser(rawUser: any): User | null {
    if (!rawUser || typeof rawUser !== "object") {
      return null;
    }

    const id = typeof rawUser.id === "string" ? rawUser.id : "";
    if (!id) {
      return null;
    }

    const fullName =
      typeof rawUser.fullName === "string"
        ? rawUser.fullName
        : typeof rawUser.name === "string"
          ? rawUser.name
          : "Demo Farmer";

    const experienceLevel: User["experienceLevel"] =
      rawUser.experienceLevel === "beginner" ||
      rawUser.experienceLevel === "intermediate" ||
      rawUser.experienceLevel === "experienced"
        ? rawUser.experienceLevel
        : "beginner";

    return {
      id,
      phone: typeof rawUser.phone === "string" ? rawUser.phone : "",
      email: typeof rawUser.email === "string" ? rawUser.email : undefined,
      fullName,
      country: typeof rawUser.country === "string" ? rawUser.country : "India",
      state: typeof rawUser.state === "string" ? rawUser.state : "Maharashtra",
      experienceLevel,
      preferredLanguage:
        typeof rawUser.preferredLanguage === "string"
          ? rawUser.preferredLanguage
          : undefined,
      hasCompletedOnboarding: Boolean(rawUser.hasCompletedOnboarding),
      createdAt: rawUser.createdAt ? new Date(rawUser.createdAt) : new Date(),
      isDemoUser: Boolean(rawUser.isDemoUser),
      isFirstLogin: Boolean(rawUser.isFirstLogin),
    };
  }

  private cacheSession(user: User, token?: string): void {
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("user_id", user.id);
    localStorage.setItem(
      "onboarding_completed",
      user.hasCompletedOnboarding ? "true" : "false",
    );

    if (token) {
      localStorage.setItem("auth_token", token);
    }
  }

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.SIGNUP || "/api/auth/signup"}`,
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

    const data = await response.json();
    return data;
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.LOGIN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    const normalizedUser = this.normalizeUser(data.user ?? data);

    if (!normalizedUser) {
      throw new Error("Login succeeded but user payload is invalid");
    }

    this.cacheSession(normalizedUser, data.token);

    return {
      user: normalizedUser,
      token: data.token,
    };
  }

  async logout(): Promise<void> {
    // Clear client-side data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    localStorage.removeItem("user_id");
    localStorage.removeItem("onboarding_completed");
    console.log("[Logout] All session data cleared");

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.LOGOUT}`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Logout failed");
    }
  }

  async updateProfile(updates: {
    fullName?: string;
    email?: string;
    phone?: string;
  }): Promise<User> {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.UPDATE || "/api/auth/update"}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    const data = await response.json();
    const updatedUser = this.normalizeUser(data.user ?? data);
    if (updatedUser) {
      this.cacheSession(updatedUser);
    }

    if (!updatedUser) {
      throw new Error("Invalid profile response from server");
    }

    return updatedUser;
  }

  async getCurrentUser(): Promise<User | null> {
    const cachedUser = localStorage.getItem("current_user");

    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        const user = this.normalizeUser(parsedUser);

        if (!user) {
          throw new Error("Cached user is invalid");
        }

        const onboardingCompleted =
          localStorage.getItem("onboarding_completed") === "true";
        const hydratedUser: User = {
          ...user,
          hasCompletedOnboarding:
            onboardingCompleted || user.hasCompletedOnboarding,
        };

        this.cacheSession(hydratedUser);
        return hydratedUser;
      } catch (error) {
        console.error("Failed to parse cached user:", error);
      }
    }

    // Real backend call
    const response = await fetch(
      `${CONFIG.API_BASE_URL}${CONFIG.AUTH_ENDPOINTS.GET_CURRENT_USER}`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const currentUser = this.normalizeUser(data.user ?? data);
    if (!currentUser) {
      return null;
    }

    this.cacheSession(currentUser, data.token);
    return currentUser;
  }

  getDemoUser(): User {
    return DEMO_USER;
  }

  private generateMockToken(userId: string): string {
    // Simple mock token generation (not actual JWT)
    return `mock-jwt-${userId}-${Date.now()}`;
  }

  private setMockCookie(name: string, value: string): void {
    // Store auth in localStorage to persist across page reloads and devices
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(name, value);
        console.log("[Auth] Stored in localStorage:", name);
      }
    } catch (error) {
      console.error("[Auth] Failed to store in localStorage:", error);
    }
  }

  private getMockCookie(name: string): string | null {
    try {
      if (typeof localStorage !== "undefined") {
        const value = localStorage.getItem(name);
        if (value) {
          console.log("[Auth] Retrieved from localStorage:", name);
        }
        return value;
      }
    } catch (error) {
      console.error("[Auth] Failed to retrieve from localStorage:", error);
    }
    return null;
  }

  private clearMockCookie(name: string): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(name);
        console.log("[Auth] Removed from localStorage:", name);
      }
    } catch (error) {
      console.error("[Auth] Failed to remove from localStorage:", error);
    }
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }

  // Debug function to check session status
  debugSessionStatus(): void {
    console.log("=== SESSION DEBUG INFO ===");
    console.log("localStorage available:", typeof localStorage !== "undefined");
    console.log(
      "auth_token:",
      localStorage.getItem("auth_token") ? "EXISTS" : "MISSING",
    );
    console.log("user_id:", localStorage.getItem("user_id") || "MISSING");
    console.log(
      "current_user:",
      localStorage.getItem("current_user") ? "EXISTS" : "MISSING",
    );
    console.log(
      "onboarding_completed:",
      localStorage.getItem("onboarding_completed") || "NOT SET",
    );
    console.log("========================");
  }
}

export const AuthService = new AuthServiceClass();
