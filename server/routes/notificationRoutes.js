import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', verifyCsrf, markAsRead);
router.post('/mark-all-read', verifyCsrf, markAllRead);
router.delete('/:id', verifyCsrf, deleteNotification);

export default router;
