import { Router } from 'express';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  testPush,
  sendPush,
} from '../controllers/pushController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { pushTestLimiter } from '../middleware/rateLimiter.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  subscribeSchema,
  unsubscribeSchema,
  sendPushSchema,
} from '../validations/schemas.js';

const router = Router();

// 1. GET /vapid-public-key (public, returns ONLY the public key)
router.get('/vapid-public-key', getVapidPublicKey);

// 2. POST /subscribe (auth, validated, upsert by endpoint)
router.post('/subscribe', authenticate, verifyCsrf, validate(subscribeSchema), subscribe);

// 3. POST /unsubscribe (auth, validated, delete user's own subscription)
router.post('/unsubscribe', authenticate, verifyCsrf, validate(unsubscribeSchema), unsubscribe);

// 4. POST /test (auth, rate limited, sends test push)
router.post('/test', authenticate, verifyCsrf, pushTestLimiter, testPush);

// 5. POST /send (admin only via role middleware)
router.post('/send', authenticate, verifyCsrf, authorize('admin'), validate(sendPushSchema), sendPush);

export default router;
