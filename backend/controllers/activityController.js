import Activity from '../models/Activity.js';

export const getActivities = async (req, res) => {
  const activities = await Activity.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(activities);
};
