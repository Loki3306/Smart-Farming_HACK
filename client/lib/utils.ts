import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== VALIDATION UTILITIES =====

/**
 * Validates Indian phone numbers
 * Accepts formats: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
 * Returns normalized format: +91XXXXXXXXXX
 */
export function validateIndianPhone(phone: string): {
  isValid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Pattern 1: +91 followed by 10 digits
  const pattern1 = /^\+91(\d{10})$/;
  // Pattern 2: 91 followed by 10 digits (without +)
  const pattern2 = /^91(\d{10})$/;
  // Pattern 3: 0 followed by 10 digits
  const pattern3 = /^0(\d{10})$/;
  // Pattern 4: Just 10 digits
  const pattern4 = /^(\d{10})$/;

  let match;
  let digits: string;

  if ((match = cleaned.match(pattern1))) {
    digits = match[1];
  } else if ((match = cleaned.match(pattern2))) {
    digits = match[1];
  } else if ((match = cleaned.match(pattern3))) {
    digits = match[1];
  } else if ((match = cleaned.match(pattern4))) {
    digits = match[1];
  } else {
    return {
      isValid: false,
      error: "Invalid phone format. Use 10 digits or +91 prefix",
    };
  }

  // Validate that first digit is 6-9 (valid Indian mobile numbers)
  const firstDigit = parseInt(digits[0]);
  if (firstDigit < 6) {
    return {
      isValid: false,
      error: "Invalid phone number. Must start with 6-9",
    };
  }

  return {
    isValid: true,
    normalized: `+91${digits}`,
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  // Additional checks
  if (email.length > 254) {
    return { isValid: false, error: "Email is too long" };
  }

  const [localPart, domain] = email.split("@");
  if (localPart.length > 64) {
    return { isValid: false, error: "Email local part is too long" };
  }

  return { isValid: true };
}

/**
 * Validates if coordinates are within India's boundaries
 * Approximate bounds: Lat 8°N to 37°N, Lon 68°E to 97°E
 */
export function validateIndianLocation(lat: number, lng: number): {
  isValid: boolean;
  error?: string;
} {
  const INDIA_BOUNDS = {
    latMin: 6.0,
    latMax: 37.0,
    lngMin: 68.0,
    lngMax: 98.0,
  };

  if (
    lat >= INDIA_BOUNDS.latMin &&
    lat <= INDIA_BOUNDS.latMax &&
    lng >= INDIA_BOUNDS.lngMin &&
    lng <= INDIA_BOUNDS.lngMax
  ) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Location must be within India. Please check your GPS.",
  };
}

/**
 * Formats a phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleaned.startsWith("91")) {
    const digits = cleaned.substring(2);
    return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
}
