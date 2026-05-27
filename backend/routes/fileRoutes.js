import express from 'express';
import {
  getFiles,
  getFile,
  updateFile,
  createFile,
  deleteFile,
  saveFile,
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getFiles);
router.post('/project/:projectId', createFile);
router.get('/:id', getFile);
router.put('/:id', updateFile);
router.put('/:id/save', saveFile);
router.delete('/:id', deleteFile);

export default router;
