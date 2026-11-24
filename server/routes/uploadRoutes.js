import { Router } from 'express';
import multer from 'multer';
import { analyzeUpload, confirmUpload } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { confirmUploadSchema } from '../validations/schemas.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 1,
  },
});

const router = Router();

router.use(authenticate);

router.post(
  '/analyze',
  uploadLimiter,
  upload.single('file'),
  analyzeUpload
);

router.post(
  '/confirm',
  verifyCsrf,
  validate(confirmUploadSchema),
  confirmUpload
);

export default router;
