import Team from '../models/Team.js';
import TeamMember from '../models/TeamMember.js';
import TeamProject from '../models/TeamProject.js';
import TeamFile from '../models/TeamFile.js';
import TeamMessage from '../models/TeamMessage.js';
import CollaborationSession from '../models/CollaborationSession.js';
import { getBoilerplateFiles } from '../utils/boilerplate.js';

// Helper to check membership
const verifyMembership = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return false;
  const isOwner = team.owner.toString() === userId.toString();
  const isMember = team.members.some((m) => m.user.toString() === userId.toString());
  return isOwner || isMember;
};

// ---------------- TEAM PROJECTS ----------------

export const getTeamProjects = async (req, res) => {
  const { id: teamId } = req.params;
  try {
    const authorized = await verifyMembership(teamId, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    const projects = await TeamProject.find({ team: teamId }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTeamProject = async (req, res) => {
  const { id: teamId } = req.params;
  const { title, description, language } = req.body;

  try {
    const authorized = await verifyMembership(teamId, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    if (!title || !language) {
      return res.status(400).json({ message: 'Title and language are required' });
    }

    const project = await TeamProject.create({
      team: teamId,
      title,
      description: description || '',
      language,
      owner: req.user._id,
    });

    // Populate with boilerplate files
    const boilerplate = getBoilerplateFiles(language, title);
    const filesToCreate = boilerplate.map((f) => ({
      project: project._id,
      name: f.name,
      path: f.path,
      isFolder: false,
      content: f.content,
      language: f.language,
    }));

    await TeamFile.insertMany(filesToCreate);

    // Initialize collaboration session
    await CollaborationSession.create({
      project: project._id,
      activeUsers: [],
      yDocStates: {},
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- TEAM FILES ----------------

export const getProjectFiles = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await TeamProject.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const authorized = await verifyMembership(project.team, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    const files = await TeamFile.find({ project: projectId }).sort({ isFolder: -1, path: 1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProjectFile = async (req, res) => {
  const { projectId } = req.params;
  const { name, path, isFolder, language } = req.body;

  try {
    const project = await TeamProject.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const authorized = await verifyMembership(project.team, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    if (!name || !path) {
      return res.status(400).json({ message: 'Name and path are required' });
    }

    const file = await TeamFile.create({
      project: projectId,
      name,
      path,
      isFolder: !!isFolder,
      content: '',
      language: language || 'plaintext',
    });

    res.status(201).json(file);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'File or folder already exists at this path' });
    }
    res.status(500).json({ message: err.message });
  }
};

export const updateProjectFile = async (req, res) => {
  const { fileId } = req.params;
  const { name, path, content } = req.body;

  try {
    const file = await TeamFile.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const project = await TeamProject.findById(file.project);
    const authorized = await verifyMembership(project.team, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    if (name) file.name = name;
    if (path) file.path = path;
    if (content !== undefined) file.content = content;

    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProjectFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await TeamFile.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const project = await TeamProject.findById(file.project);
    const authorized = await verifyMembership(project.team, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    if (file.isFolder) {
      // Recursive delete files inside this folder path
      const folderPrefix = file.path.endsWith('/') ? file.path : `${file.path}/`;
      await TeamFile.deleteMany({
        project: file.project,
        path: { $regex: `^${folderPrefix}` },
      });
    }

    await file.deleteOne();
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- TEAM CHAT MESSAGES ----------------

export const getTeamMessages = async (req, res) => {
  const { id: teamId } = req.params;

  try {
    const authorized = await verifyMembership(teamId, req.user._id);
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    const messages = await TeamMessage.find({ team: teamId })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
