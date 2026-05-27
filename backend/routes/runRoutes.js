import express from 'express';
import { executeCode } from '../controllers/runController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/execute', protect, executeCode);

export default router;
