import File from '../models/File.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';

const canAccessProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isOwner = project.owner.toString() === userId.toString();
  const isCollab = project.collaborators.some(
    (c) => c.user?.toString() === userId.toString()
  );
  if (isOwner || isCollab || project.visibility === 'public') return project;
  return null;
};

export const getFiles = async (req, res) => {
  const project = await canAccessProject(req.params.projectId, req.user._id);
  if (!project) return res.status(403).json({ message: 'Access denied' });

  const files = await File.find({ project: project._id }).sort({ order: 1 });
  res.json(files);
};

export const getFile = async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: 'File not found' });

  const project = await canAccessProject(file.project, req.user._id);
  if (!project) return res.status(403).json({ message: 'Access denied' });

  res.json(file);
};

export const updateFile = async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: 'File not found' });

  const project = await canAccessProject(file.project, req.user._id);
  if (!project) return res.status(403).json({ message: 'Access denied' });

  if (req.body.content !== undefined) file.content = req.body.content;
  if (req.body.name) file.name = req.body.name;
  await file.save();

  project.updatedAt = new Date();
  await project.save();

  res.json(file);
};

export const createFile = async (req, res) => {
  const project = await canAccessProject(req.params.projectId, req.user._id);
  if (!project) return res.status(403).json({ message: 'Access denied' });

  const { name, path, content, language } = req.body;
  const exists = await File.findOne({ project: project._id, path });
  if (exists) return res.status(400).json({ message: 'File already exists' });

  const file = await File.create({
    project: project._id,
    name,
    path,
    content: content || '',
    language: language || 'plaintext',
  });

  project.fileCount = await File.countDocuments({ project: project._id });
  await project.save();

  res.status(201).json(file);
};

export const deleteFile = async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: 'File not found' });

  const project = await Project.findOne({
    _id: file.project,
    owner: req.user._id,
  });
  if (!project) return res.status(403).json({ message: 'Access denied' });

  await file.deleteOne();
  project.fileCount = await File.countDocuments({ project: project._id });
  await project.save();

  res.json({ message: 'File deleted' });
};

export const saveFile = async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: 'File not found' });

  const project = await canAccessProject(file.project, req.user._id);
  if (!project) return res.status(403).json({ message: 'Access denied' });

  file.content = req.body.content ?? file.content;
  await file.save();

  await Activity.create({
    user: req.user._id,
    type: 'file_save',
    title: `Saved ${file.name}`,
    description: project.title,
    metadata: { projectId: project._id, fileId: file._id },
  });

  res.json(file);
};
