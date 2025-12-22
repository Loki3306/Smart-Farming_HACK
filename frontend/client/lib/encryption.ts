/**
 * Encryption utilities for sensitive data
 * Uses AES-256 encryption for phone, email, and password
 */

import CryptoJS from 'crypto-js';

// Encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'smartfarm-secure-key-2025';

/**
 * Encrypt sensitive data using AES-256
 */
export function encryptData(data: string): string {
  if (!data) return '';
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Fallback to plain text if encryption fails
  }
}

/**
 * Decrypt encrypted data
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Return as-is if decryption fails
  }
}

/**
 * Hash password using SHA-256 (one-way)
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  return CryptoJS.SHA256(password).toString();
}

/**
 * Mask phone number for display (e.g., +91 ******* 750)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 10) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    const last3 = cleaned.slice(-3);
    const first3 = cleaned.length > 10 ? cleaned.slice(0, cleaned.length - 10) : '';
    return `+${first3} ******* ${last3}`;
  }
  return phone;
}

/**
 * Mask email for display (e.g., r***@gmail.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}***@${domain}`;
}
