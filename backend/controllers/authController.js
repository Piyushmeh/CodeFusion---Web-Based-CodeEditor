import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { generateToken } from '../utils/generateToken.js';

const logActivity = async (userId, type, title, description = '') => {
  await Activity.create({ user: userId, type, title, description });
};

export const register = async (req, res) => {
  const { name, username, email, password } = req.body;

  const exists = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });
  if (exists) {
    return res.status(400).json({
      message: exists.email === email ? 'Email already registered' : 'Username taken',
    });
  }

  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email,
    password,
  });

  await logActivity(user._id, 'login', 'Account created', 'Welcome to CodeFusion');

  res.status(201).json({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  await logActivity(user._id, 'login', 'Logged in', 'Successful login');

  res.json({
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    location: user.location,
    website: user.website,
    token: generateToken(user._id),
  });
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
