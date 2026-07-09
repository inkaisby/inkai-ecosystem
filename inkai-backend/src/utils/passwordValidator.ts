export interface PasswordValidation {
  valid: boolean;
  message: string;
}

/**
 * Validate password strength.
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export function validatePassword(password: string): PasswordValidation {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Kata sandi wajib diisi' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Kata sandi minimal 8 karakter' };
  }

  if (password.length > 128) {
    return { valid: false, message: 'Kata sandi maksimal 128 karakter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung huruf kecil' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung huruf besar' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Kata sandi harus mengandung angka' };
  }

  // Check for common weak passwords
  const WEAK_PASSWORDS = ['12345678', 'password', 'Password1', 'Qwerty123', '123456789', 'Abcd1234'];
  if (WEAK_PASSWORDS.includes(password)) {
    return { valid: false, message: 'Kata sandi terlalu umum. Gunakan kombinasi yang lebih unik.' };
  }

  return { valid: true, message: 'OK' };
}

/**
 * Generate a random secure password.
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  // Ensure at least one of each required type
  if (!/[a-z]/.test(password)) password = password.slice(0, -1) + 'a';
  if (!/[A-Z]/.test(password)) password = password.slice(0, -2) + 'A' + password.slice(-1);
  if (!/[0-9]/.test(password)) password = password.slice(0, -3) + '3' + password.slice(-2);
  return password;
}
