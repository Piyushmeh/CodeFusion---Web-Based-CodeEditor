import Project from '../models/Project.js';
import File from '../models/File.js';
import Activity from '../models/Activity.js';
import { getBoilerplateFiles } from '../utils/boilerplate.js';

const logActivity = (userId, type, title, description, metadata = {}) =>
  Activity.create({ user: userId, type, title, description, metadata });

export const getStats = async (req, res) => {
  const ownerId = req.user._id;
  const base = { owner: ownerId };

  const [total, languages, publicCount, projectIds] = await Promise.all([
    Project.countDocuments(base),
    Project.distinct('language', base),
    Project.countDocuments({ ...base, visibility: 'public' }),
    Project.find(base).distinct('_id'),
  ]);

  let linesOfCode = 0;
  if (projectIds.length > 0) {
    const files = await File.find({ project: { $in: projectIds } }).select('content');
    linesOfCode = files.reduce((sum, file) => {
      if (!file.content) return sum;
      return sum + file.content.split(/\r?\n/).length;
    }, 0);
  }

  res.json({
    total,
    languages: languages.length,
    linesOfCode,
    public: publicCount,
  });
};

export const getProjects = async (req, res) => {
  const { search, language, sort, filter, page = '1', limit = '24' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 24));

  const query = { owner: req.user._id };

  if (filter === 'starred') {
    query.starred = true;
  } else if (filter === 'public') {
    query.visibility = 'public';
  } else if (filter === 'private') {
    query.visibility = 'private';
  } else if (filter === 'shared') {
    delete query.owner;
    query.$or = [
      { 'collaborators.user': req.user._id },
      { visibility: 'public', owner: { $ne: req.user._id } },
    ];
  }

  if (language && language !== 'All') {
    query.language = language === 'JS' ? 'JavaScript' : language;
  }

  if (search?.trim()) {
    const searchClause = {
      $or: [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { language: { $regex: search.trim(), $options: 'i' } },
      ],
    };
    if (query.$or) {
      const accessOr = query.$or;
      delete query.$or;
      query.$and = [{ $or: accessOr }, searchClause];
    } else {
      Object.assign(query, searchClause);
    }
  }

  let sortOption = { updatedAt: -1 };
  switch (sort) {
    case 'title':
      sortOption = { title: 1 };
      break;
    case 'title-desc':
      sortOption = { title: -1 };
      break;
    case 'created':
      sortOption = { createdAt: -1 };
      break;
    case 'created-asc':
      sortOption = { createdAt: 1 };
      break;
    case 'starred':
      sortOption = { starred: -1, updatedAt: -1 };
      break;
    case 'views':
      sortOption = { viewCount: -1, updatedAt: -1 };
      break;
    default:
      sortOption = { updatedAt: -1 };
  }

  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .sort(sortOption)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  for (const p of projects) {
    p.fileCount = await File.countDocuments({ project: p._id });
  }

  res.json({
    projects,
    total,
    page: pageNum,
    limit: limitNum,
    hasMore: pageNum * limitNum < total,
  });
};

export const getProject = async (req, res) => {
  const project = await Project.findById(req.params.id).populate(
    'owner',
    'name username avatar'
  );
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const isOwner = project.owner._id.toString() === req.user._id.toString();
  const isCollab = project.collaborators.some(
    (c) => c.user?.toString() === req.user._id.toString()
  );
  if (!isOwner && !isCollab && project.visibility !== 'public') {
    return res.status(403).json({ message: 'Access denied' });
  }

  project.lastOpenedAt = new Date();
  project.viewCount = (project.viewCount || 0) + 1;
  await project.save();

  res.json(project);
};

export const createProject = async (req, res) => {
  const { title, description, language, visibility } = req.body;

  const project = await Project.create({
    title,
    description: description || '',
    language,
    visibility: visibility || 'public',
    owner: req.user._id,
  });

  const boilerplate = getBoilerplateFiles(language, title);
  const files = await File.insertMany(
    boilerplate.map((f, i) => ({
      project: project._id,
      name: f.name,
      path: f.path,
      content: f.content,
      language: f.language,
      order: i,
    }))
  );

  project.fileCount = files.length;
  await project.save();

  await logActivity(
    req.user._id,
    'project_create',
    `Created project "${title}"`,
    `${language} project`,
    { projectId: project._id }
  );

  res.status(201).json(project);
};

export const updateProject = async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { title, description, language, visibility, pinned, starred } = req.body;
  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (language) project.language = language;
  if (visibility) project.visibility = visibility;
  if (pinned !== undefined) project.pinned = pinned;
  if (starred !== undefined) project.starred = starred;

  await project.save();

  await logActivity(
    req.user._id,
    'project_update',
    `Updated "${project.title}"`,
    'Project settings changed'
  );

  res.json(project);
};

export const deleteProject = async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  await File.deleteMany({ project: project._id });
  await project.deleteOne();

  await logActivity(
    req.user._id,
    'project_delete',
    `Deleted project`,
    project.title
  );

  res.json({ message: 'Project deleted' });
};

export const getRecentFiles = async (req, res) => {
  const projects = await Project.find({ owner: req.user._id })
    .sort({ lastOpenedAt: -1 })
    .limit(5);

  const recent = [];
  for (const p of projects) {
    const file = await File.findOne({ project: p._id }).sort({ updatedAt: -1 });
    if (file) {
      recent.push({
        _id: file._id,
        name: file.name,
        path: file.path,
        language: file.language,
        projectId: p._id,
        projectTitle: p.title,
        projectLanguage: p.language,
        lastOpenedAt: p.lastOpenedAt,
      });
    }
  }

  res.json(recent);
};
