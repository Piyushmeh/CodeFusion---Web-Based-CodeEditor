import express from 'express';
import { body } from 'express-validator';
import {
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  inviteMember,
  acceptInvite,
  removeMember,
  linkProject,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getTeams);
router.post('/', [body('name').trim().notEmpty()], validate, createTeam);
router.post('/accept-invite', acceptInvite);
router.get('/:id', getTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post(
  '/:id/invite',
  [body('email').trim().isEmail().withMessage('Enter a valid email address')],
  validate,
  inviteMember
);
router.delete('/:id/members/:memberId', removeMember);
router.post('/:id/projects', linkProject);

export default router;
