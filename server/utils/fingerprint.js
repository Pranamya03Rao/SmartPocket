import { createHash } from 'crypto';

/**
 * Generate a SHA-256 fingerprint for duplicate detection.
 * Normalized: userId|YYYY-MM-DD|amount|lowercase-trimmed-merchant
 */
export function generateFingerprint(userId, date, amount, merchant) {
  const dateStr = new Date(date).toISOString().split('T')[0];
  const normalized = `${userId}|${dateStr}|${amount}|${merchant.toLowerCase().trim()}`;
  return createHash('sha256').update(normalized).digest('hex');
}
