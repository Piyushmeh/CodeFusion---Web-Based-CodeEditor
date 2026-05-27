import express from 'express';
import { body } from 'express-validator';
import {
  updateProfile,
  uploadAvatar,
  removeAvatar,
  getActivities,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.put(
  '/profile',
  [
    body('email').optional().isEmail(),
    body('bio').optional().isLength({ max: 160 }),
  ],
  validate,
  updateProfile
);

router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', removeAvatar);
router.get('/activities', getActivities);

export default router;
