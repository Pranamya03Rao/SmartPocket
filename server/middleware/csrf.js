import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Double-submit cookie CSRF protection.
 *
 * setCsrfToken(res) — sets a non-httpOnly cookie readable by JS.
 * verifyCsrf — middleware that compares cookie vs X-CSRF-Token header.
 * Only enforced on state-changing methods (POST/PUT/PATCH/DELETE).
 */

export function setCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf-token', token, {
    httpOnly: false, // Must be readable by client JS
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

export function verifyCsrf(req, res, next) {
  // Skip safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}
