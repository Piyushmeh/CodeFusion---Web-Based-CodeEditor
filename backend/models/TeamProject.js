import mongoose from 'mongoose';

const teamProjectSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['Java', 'C++', 'Python', 'HTML', 'CSS', 'JavaScript'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

teamProjectSchema.index({ team: 1, title: 1 }, { unique: true });

const TeamProject = mongoose.model('TeamProject', teamProjectSchema);
export default TeamProject;
