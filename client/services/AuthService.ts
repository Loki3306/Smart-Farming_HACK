import CONFIG from "../config";
import { createClient } from '@supabase/supabase-js';
import { encryptData, hashPassword } from '../lib/encryption';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

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
    if (CONFIG.USE_MOCK_DATA && supabase) {
      await this.simulateDelay();

      const hashedPassword = hashPassword(payload.password);

      // Check if phone already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('farmers')
        .select('id')
        .eq('phone', payload.phone)
        .maybeSingle();

      console.log('[Signup] Phone format:', payload.phone);

      if (checkError) {
        console.error('[Signup] Check error:', checkError);
        throw new Error("Database error. Please try again.");
      }

      if (existingUser) {
        throw new Error("Phone number already registered");
      }

      // Insert user into Supabase
      const { data: newUser, error } = await supabase
        .from('farmers')
        .insert({
          name: payload.fullName,
          phone: payload.phone, // Store plain for login
          email: payload.email || null, // Optional
          experience: payload.experienceLevel,
          password: hashedPassword,
        })
        .select()
        .single();

      if (error) {
        console.error('[Signup] Supabase error:', error);
        throw new Error(error.message || "Signup failed");
      }

      // Create user object
      const user: User = {
        id: newUser.id,
        phone: payload.phone,
        email: payload.email,
        fullName: payload.fullName,
        country: payload.country,
        state: payload.state,
        experienceLevel: payload.experienceLevel,
        preferredLanguage: payload.preferredLanguage,
        hasCompletedOnboarding: false,
        createdAt: new Date(newUser.created_at),
        isDemoUser: false,
      };

      // Store auth token and user ID in localStorage (for session)
      const mockToken = this.generateMockToken(user.id);
      this.setMockCookie("auth_token", mockToken);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("current_user", JSON.stringify(user));

      return {
        user,
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
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Signup failed");
    }

    return response.json();
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (CONFIG.USE_MOCK_DATA && supabase) {
      await this.simulateDelay();

      // Hash password for comparison
      const hashedPassword = hashPassword(payload.password);

      console.log('[Login] Querying with phone:', payload.phone);

      // Query Supabase for user (phone is plain text)
      const { data: userData, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('phone', payload.phone)
        .maybeSingle();

      console.log('[Login] Query result:', userData ? `Found user with phone: ${userData.phone}` : 'No user found');

      if (error) {
        console.error('[Login] Supabase error:', error);
        if (error.code === 'PGRST116') {
          throw new Error("Database error: Multiple accounts found. Please contact support.");
        }
        throw new Error("Login failed. Please try again.");
      }

      if (!userData) {
        throw new Error("Invalid phone number or password");
      }

      // Verify password (compare hashes)
      if (userData.password !== hashedPassword) {
        throw new Error("Invalid email or password");
      }

      // Check if user has completed onboarding (has farm data)
      const { data: farmData } = await supabase
        .from('farms')
        .select('id')
        .eq('farmer_id', userData.id)
        .maybeSingle();

      const hasCompletedOnboarding = !!farmData; // If farm exists, onboarding is complete
      
      console.log('[Login] User:', userData.phone, 'Farm data:', farmData, 'Onboarding complete:', hasCompletedOnboarding);

      // Create user object
      const user: User = {
        id: userData.id,
        phone: userData.phone,
        email: userData.email || undefined,
        fullName: userData.name,
        country: 'India', // Default
        state: '', // Load from farms table if needed
        experienceLevel: userData.experience as any || 'beginner',
        hasCompletedOnboarding,
        createdAt: new Date(userData.created_at),
        isDemoUser: false,
      };

      // Store session (clear old cache first)
      const mockToken = this.generateMockToken(user.id);
      this.setMockCookie("auth_token", mockToken);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("current_user", JSON.stringify(user));
      
      // Store onboarding status explicitly
      if (hasCompletedOnboarding) {
        localStorage.setItem("onboarding_completed", "true");
        console.log('[Login] Set onboarding_completed to true');
      } else {
        localStorage.removeItem("onboarding_completed");
        console.log('[Login] Removed onboarding_completed flag');
      }
      
      return {
        user,
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
      },
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
      localStorage.removeItem("current_user");
      localStorage.removeItem("user_id");
      localStorage.removeItem("onboarding_completed");
      return;
    }

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

  async getCurrentUser(): Promise<User | null> {
    if (CONFIG.USE_MOCK_DATA && supabase) {
      await this.simulateDelay();

      // Check for auth token
      const token = this.getMockCookie("auth_token");
      const userId = localStorage.getItem("user_id");
      
      if (!token || !userId) {
        return null;
      }

      // Try loading from localStorage cache first (faster)
      const cachedUser = localStorage.getItem("current_user");
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser) as User;
          
          // Check onboarding status
          const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
          
          return {
            ...user,
            hasCompletedOnboarding: onboardingCompleted || user.hasCompletedOnboarding,
          };
        } catch (error) {
          console.error('Failed to parse cached user:', error);
        }
      }

      // If no cache, load from Supabase
      const { data: userData, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        console.error('[Auth] Failed to load user from Supabase:', error);
        return null;
      }

      // Reconstruct user object
      const user: User = {
        id: userData.id,
        email: '', // We'd need to decrypt, but don't for security
        fullName: userData.name,
        phoneNumber: '',
        country: 'India',
        state: '',
        experienceLevel: userData.experience as any || 'beginner',
        hasCompletedOnboarding: true,
        createdAt: new Date(userData.created_at),
        isDemoUser: false,
      };

      // Cache it
      localStorage.setItem("current_user", JSON.stringify(user));

      return user;
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
    // Store auth in localStorage to persist across page reloads
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(name, value);
    }
  }

  private getMockCookie(name: string): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(name);
    }
    return null;
  }

  private clearMockCookie(name: string): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(name);
    }
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }
}

export const AuthService = new AuthServiceClass();
