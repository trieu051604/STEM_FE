// Simple encoding utility for sensitive data
// Note: This is NOT encryption - it just obfuscates data from casual viewing
// For production, use HttpOnly cookies or proper encryption

const SECRET_PREFIX = 'STEM_ENC_';

/**
 * Encode a string with a simple prefix to make it less obvious
 * This is NOT security - just obfuscation
 */
export function encodeData(data: string): string {
  try {
    if (!data) return data;
    // Simple base64 encoding with prefix
    const encoded = btoa(unescape(encodeURIComponent(data)));
    return SECRET_PREFIX + encoded;
  } catch {
    return data;
  }
}

/**
 * Decode a string that was encoded with encodeData
 */
export function decodeData(encoded: string): string {
  try {
    if (!encoded || typeof encoded !== 'string') return encoded;
    if (!encoded.startsWith(SECRET_PREFIX)) {
      return encoded;
    }
    const data = encoded.slice(SECRET_PREFIX.length);
    return decodeURIComponent(escape(atob(data)));
  } catch (e) {
    // If decode fails, return the original string
    console.warn('Failed to decode data:', e);
    return encoded;
  }
}

/**
 * Check if data is encoded
 */
export function isEncoded(data: string): boolean {
  return data?.startsWith(SECRET_PREFIX) || false;
}
