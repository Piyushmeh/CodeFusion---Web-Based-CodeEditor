import crypto from 'crypto';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import TeamProject from '../models/TeamProject.js';
import TeamMember from '../models/TeamMember.js';

export const getTeams = async (req, res) => {
  const teams = await Team.find({
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
  })
    .populate('owner', 'name username avatar')
    .populate('members.user', 'name username avatar email')
    .sort({ updatedAt: -1 });

  const teamsWithStats = await Promise.all(
    teams.map(async (team) => {
      const teamProjCount = await TeamProject.countDocuments({ team: team._id });
      const standardProjCount = await Project.countDocuments({ team: team._id });
      const totalProjects = teamProjCount + standardProjCount;

      // Check if any member has online presence flag
      const onlineMembersCount = await TeamMember.countDocuments({ team: team._id, online: true });
      const isOnline = onlineMembersCount > 0;

      return {
        ...team.toObject(),
        projectCount: totalProjects,
        online: isOnline,
        lastActive: team.updatedAt,
      };
    })
  );

  res.json(teamsWithStats);
};

export const createTeam = async (req, res) => {
  const { name, description } = req.body;

  const team = await Team.create({
    name,
    description: description || '',
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });

  await TeamMember.create({
    team: team._id,
    user: req.user._id,
    role: 'owner',
  });

  await Activity.create({
    user: req.user._id,
    type: 'team_create',
    title: `Created team "${name}"`,
    description: 'New team workspace',
    metadata: { teamId: team._id },
  });

  const populated = await Team.findById(team._id)
    .populate('owner', 'name username avatar')
    .populate('members.user', 'name username avatar email');

  res.status(201).json(populated);
};

export const getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name username avatar')
    .populate('members.user', 'name username avatar email');

  if (!team) return res.status(404).json({ message: 'Team not found' });

  const isMember =
    team.owner._id.toString() === req.user._id.toString() ||
    team.members.some((m) => m.user?._id?.toString() === req.user._id.toString());

  if (!isMember) return res.status(403).json({ message: 'Access denied' });

  const projects = await Project.find({ team: team._id });
  res.json({ team, projects });
};

export const updateTeam = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, owner: req.user._id });
  if (!team) return res.status(404).json({ message: 'Team not found' });

  if (req.body.name) team.name = req.body.name;
  if (req.body.description !== undefined) team.description = req.body.description;
  await team.save();

  res.json(team);
};

export const deleteTeam = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, owner: req.user._id });
  if (!team) return res.status(404).json({ message: 'Team not found' });

  await Project.updateMany({ team: team._id }, { $unset: { team: 1 } });
  await team.deleteOne();

  res.json({ message: 'Team deleted' });
};

export const inviteMember = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, owner: req.user._id });
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const { email, role } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const already = team.members.some(
      (m) => m.user?.toString() === user._id.toString()
    );
    if (already) return res.status(400).json({ message: 'User already in team' });

    team.members.push({ user: user._id, role: role || 'member' });
    team.invites = team.invites.filter((i) => i.email !== email.toLowerCase());
    await team.save();

    await TeamMember.create({
      team: team._id,
      user: user._id,
      role: role || 'editor',
    });

    await Activity.create({
      user: user._id,
      type: 'team_join',
      title: `Joined team "${team.name}"`,
      description: 'Added by invite',
    });

    const populated = await Team.findById(team._id)
      .populate('owner', 'name username avatar')
      .populate('members.user', 'name username avatar email');

    return res.json({ message: 'Member added', team: populated });
  }

  const token = crypto.randomBytes(32).toString('hex');
  team.invites.push({
    email: email.toLowerCase(),
    role: role || 'member',
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await team.save();

  res.json({
    message: 'Invite created. Share token with user to accept.',
    inviteToken: token,
  });
};

export const acceptInvite = async (req, res) => {
  const { token } = req.body;
  const team = await Team.findOne({ 'invites.token': token });
  if (!team) return res.status(404).json({ message: 'Invalid invite' });

  const invite = team.invites.find((i) => i.token === token);
  if (invite.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invite expired' });
  }
  if (invite.email !== req.user.email) {
    return res.status(403).json({ message: 'Invite not for this account' });
  }

  team.members.push({ user: req.user._id, role: invite.role });
  team.invites = team.invites.filter((i) => i.token !== token);
  await team.save();

  await TeamMember.create({
    team: team._id,
    user: req.user._id,
    role: invite.role || 'editor',
  });

  await Activity.create({
    user: req.user._id,
    type: 'team_join',
    title: `Joined team "${team.name}"`,
    description: 'Accepted invite',
  });

  res.json({ message: 'Joined team', teamId: team._id });
};

export const removeMember = async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, owner: req.user._id });
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const memberId = req.params.memberId;
  if (memberId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot remove owner' });
  }

  team.members = team.members.filter(
    (m) => m.user?.toString() !== memberId
  );
  await team.save();

  await TeamMember.deleteOne({ team: team._id, user: memberId });

  res.json({ message: 'Member removed' });
};

export const linkProject = async (req, res) => {
  const team = await Team.findOne({
    _id: req.params.id,
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
  });
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const project = await Project.findOne({
    _id: req.body.projectId,
    owner: req.user._id,
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  project.team = team._id;
  await project.save();

  res.json(project);
};
