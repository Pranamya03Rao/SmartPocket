import { Router } from 'express';
import {
  getMetrics,
  getUsers,
  updateUserRole,
  unlockUser,
  getServerHealth,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { createAnnouncementSchema } from '../validations/schemas.js';

const router = Router();

// Protect all admin routes with authentication and admin role authorization
router.use(authenticate, authorize('admin'));

router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.patch('/users/:id/role', verifyCsrf, updateUserRole);
router.post('/users/:id/unlock', verifyCsrf, unlockUser);
router.get('/health', getServerHealth);
router.get('/announcements', getAnnouncements);
router.post('/announcements', verifyCsrf, validate(createAnnouncementSchema), createAnnouncement);
router.delete('/announcements/:id', verifyCsrf, deleteAnnouncement);

export default router;
