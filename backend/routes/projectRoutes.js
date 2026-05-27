import express from 'express';
import { body } from 'express-validator';
import {
  getStats,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getRecentFiles,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/recent', getRecentFiles);
router.get('/', getProjects);
router.get('/:id', getProject);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('language')
      .isIn(['Java', 'C++', 'Python', 'HTML', 'CSS', 'JavaScript'])
      .withMessage('Invalid language'),
  ],
  validate,
  createProject
);

router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
