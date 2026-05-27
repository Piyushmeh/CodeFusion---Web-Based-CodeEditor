import User from '../models/User.js';
import Activity from '../models/Activity.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

export const updateProfile = async (req, res) => {
  const { name, username, bio, email, location, website } = req.body;
  const user = req.user;

  if (username && username.toLowerCase() !== user.username) {
    const taken = await User.findOne({ username: username.toLowerCase() });
    if (taken) return res.status(400).json({ message: 'Username already taken' });
    user.username = username.toLowerCase();
  }

  if (email && email !== user.email) {
    const taken = await User.findOne({ email });
    if (taken) return res.status(400).json({ message: 'Email already in use' });
    user.email = email;
  }

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (location !== undefined) user.location = location;
  if (website !== undefined) user.website = website;

  await user.save();

  await Activity.create({
    user: user._id,
    type: 'profile_update',
    title: 'Updated profile information',
    description: 'Profile details were saved',
  });

  res.json(user);
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          'Image upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env',
      });
    }

    const user = req.user;

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'codefusion/avatars', width: 400, height: 400, crop: 'fill' },
        (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
      );
      stream.end(req.file.buffer);
    });

    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (err) {
    console.error('Avatar upload failed:', err);
    res.status(500).json({
      message: err.message || 'Failed to upload avatar',
    });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const user = req.user;

    if (user.avatarPublicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    }

    user.avatar = '';
    user.avatarPublicId = '';
    await user.save();

    res.json({ avatar: '' });
  } catch (err) {
    console.error('Avatar remove failed:', err);
    res.status(500).json({ message: err.message || 'Failed to remove avatar' });
  }
};

export const getActivities = async (req, res) => {
  const activities = await Activity.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10);
  res.json(activities);
};
