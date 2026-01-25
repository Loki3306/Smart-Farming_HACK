import CONFIG from "../config";
import supabase from '../lib/supabase';
import { encryptData, hashPassword } from '../lib/encryption';

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
  id: "demo-user-123",
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
  id: "user-001",
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
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    // AUTH ALWAYS USES SUPABASE DIRECTLY
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
        isFirstLogin: true, // New user just registered
      };

      // Store auth token and user ID in localStorage (for session persistence)
      const mockToken = this.generateMockToken(user.id);

      // CRITICAL: Store all auth data directly in localStorage
      localStorage.setItem("auth_token", mockToken);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("current_user", JSON.stringify(user));
      localStorage.removeItem("onboarding_completed"); // Fresh signup, onboarding not done

      console.log('[Signup] New user registered:', user.phone, 'Session stored');

      return {
        user,
        token: mockToken,
      };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    // AUTH ALWAYS USES SUPABASE DIRECTLY
    if (supabase) {
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
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id')
        .eq('farmer_id', userData.id)
        .limit(1)
        .maybeSingle();

      if (farmError) {
        console.warn('[Login] Farm lookup error (treating as not onboarded):', farmError);
      }

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
        isFirstLogin: false, // Returning user
      };

      // Store session - CRITICAL: Must use localStorage directly, not setMockCookie
      const mockToken = this.generateMockToken(user.id);

      // IMPORTANT: Store all auth data in localStorage for persistence across page reloads
      localStorage.setItem("auth_token", mockToken);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("current_user", JSON.stringify(user));

      // Ensure farm selection is recalculated for the newly logged-in user
      localStorage.removeItem('current_farm_id');

      // Store onboarding status explicitly based on farm data check
      if (hasCompletedOnboarding) {
        localStorage.setItem("onboarding_completed", "true");
        console.log('[Login] Login successful for', userData.phone, '- Onboarding completed: true');
      } else {
        localStorage.removeItem("onboarding_completed");
        console.log('[Login] Login successful for', userData.phone, '- Onboarding required');
      }

      console.log('[Login] Session stored. Auth token:', mockToken.substring(0, 20) + '...');
      console.log('[Login] User object:', JSON.stringify(user));

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
    // AUTH is client-side only with localStorage
    await this.simulateDelay();
    console.log('[Logout] Clearing all session data');
    // Clear all session data
    this.clearMockCookie("auth_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    localStorage.removeItem("user_id");
    localStorage.removeItem("onboarding_completed");
    console.log('[Logout] All session data cleared');
    return;

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

  async updateProfile(updates: { fullName?: string; email?: string; phone?: string }): Promise<User> {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      throw new Error("No user logged in");
    }

    if (supabase) {
      await this.simulateDelay();

      // Map frontend field names to database column names
      const dbUpdates: Record<string, any> = {};
      if (updates.fullName !== undefined) dbUpdates.name = updates.fullName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

      // Update in Supabase
      const { data, error } = await supabase
        .from('farmers')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[UpdateProfile] Supabase error:', error);
        throw new Error(error.message || "Failed to update profile");
      }

      // Get current user from cache and update it
      const cachedUser = localStorage.getItem("current_user");
      if (cachedUser) {
        const user = JSON.parse(cachedUser) as User;
        const updatedUser: User = {
          ...user,
          fullName: updates.fullName ?? user.fullName,
          email: updates.email ?? user.email,
          phone: updates.phone ?? user.phone,
        };

        // Update cache
        localStorage.setItem("current_user", JSON.stringify(updatedUser));
        console.log('[UpdateProfile] Profile updated successfully:', updatedUser.fullName);

        return updatedUser;
      }

      throw new Error("User session not found");
    }

    // Fallback for non-Supabase (shouldn't happen in production)
    throw new Error("Database not available");
  }

  async getCurrentUser(): Promise<User | null> {
    // AUTH ALWAYS USES SUPABASE DIRECTLY (not Express backend)
    // This is because auth is stored client-side in localStorage
    if (supabase) {
      await this.simulateDelay();

      // Step 1: Check for cached user first (even if no token - it means browser has localStorage)
      const cachedUser = localStorage.getItem("current_user");
      const userId = localStorage.getItem("user_id");

      if (cachedUser && userId) {
        try {
          const user = JSON.parse(cachedUser) as User;

          // Check onboarding status from localStorage
          const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
          console.log('[Auth] Restored user from cache:', user.fullName, 'Onboarding:', onboardingCompleted);

          return {
            ...user,
            hasCompletedOnboarding: onboardingCompleted || user.hasCompletedOnboarding,
          };
        } catch (error) {
          console.error('Failed to parse cached user:', error);
          // Continue to load from Supabase if cache is corrupted
        }
      }

      // Step 2: If no cache, check for auth token
      const token = this.getMockCookie("auth_token");
      if (!token || !userId) {
        console.log('[Auth] No session found (token or userId missing)');
        return null;
      }

      // Step 3: Load from Supabase if cache miss
      console.log('[Auth] Cache miss, loading from Supabase for userId:', userId);
      const { data: userData, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userData) {
        console.error('[Auth] Failed to load user from Supabase:', error);
        return null;
      }

      // Check if user has completed onboarding (has farm data)
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id')
        .eq('farmer_id', userData.id)
        .limit(1)
        .maybeSingle();

      if (farmError) {
        console.warn('[Auth] Farm lookup error (treating as not onboarded):', farmError);
      }

      const hasCompletedOnboarding = !!farmData;

      // Reconstruct user object
      const user: User = {
        id: userData.id,
        phone: userData.phone,
        email: userData.email || undefined,
        fullName: userData.name,
        country: 'India',
        state: '',
        experienceLevel: userData.experience as any || 'beginner',
        hasCompletedOnboarding,
        createdAt: new Date(userData.created_at),
        isDemoUser: false,
      };

      // Re-cache it for next time
      localStorage.setItem("current_user", JSON.stringify(user));
      if (hasCompletedOnboarding) {
        localStorage.setItem("onboarding_completed", "true");
      } else {
        localStorage.removeItem("onboarding_completed");
      }
      console.log('[Auth] User loaded from Supabase and cached:', user.fullName);

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
    // Store auth in localStorage to persist across page reloads and devices
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(name, value);
        console.log('[Auth] Stored in localStorage:', name);
      }
    } catch (error) {
      console.error('[Auth] Failed to store in localStorage:', error);
    }
  }

  private getMockCookie(name: string): string | null {
    try {
      if (typeof localStorage !== "undefined") {
        const value = localStorage.getItem(name);
        if (value) {
          console.log('[Auth] Retrieved from localStorage:', name);
        }
        return value;
      }
    } catch (error) {
      console.error('[Auth] Failed to retrieve from localStorage:', error);
    }
    return null;
  }

  private clearMockCookie(name: string): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(name);
        console.log('[Auth] Removed from localStorage:', name);
      }
    } catch (error) {
      console.error('[Auth] Failed to remove from localStorage:', error);
    }
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }

  // Debug function to check session status
  debugSessionStatus(): void {
    console.log('=== SESSION DEBUG INFO ===');
    console.log('localStorage available:', typeof localStorage !== 'undefined');
    console.log('auth_token:', localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING');
    console.log('user_id:', localStorage.getItem('user_id') || 'MISSING');
    console.log('current_user:', localStorage.getItem('current_user') ? 'EXISTS' : 'MISSING');
    console.log('onboarding_completed:', localStorage.getItem('onboarding_completed') || 'NOT SET');
    console.log('========================');
  }
}

export const AuthService = new AuthServiceClass();
