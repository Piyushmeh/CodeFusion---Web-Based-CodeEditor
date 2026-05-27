import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getTeamProjects,
  createTeamProject,
  getProjectFiles,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
  getTeamMessages,
} from '../controllers/teamCollaborationController.js';

const router = express.Router();

router.use(protect);

// Team Projects
router.get('/teams/:id/projects', getTeamProjects);
router.post('/teams/:id/projects', createTeamProject);

// Team Files
router.get('/team-projects/:projectId/files', getProjectFiles);
router.post('/team-projects/:projectId/files', createProjectFile);
router.put('/team-files/:fileId', updateProjectFile);
router.delete('/team-files/:fileId', deleteProjectFile);

// Team Chat Messages
router.get('/teams/:id/messages', getTeamMessages);

export default router;
