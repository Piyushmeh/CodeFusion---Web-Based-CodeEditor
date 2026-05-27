import mongoose from 'mongoose';

const teamFileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamProject',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    isFolder: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'plaintext',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compounded index ensures unique paths inside a team project
teamFileSchema.index({ project: 1, path: 1 }, { unique: true });

const TeamFile = mongoose.model('TeamFile', teamFileSchema);
export default TeamFile;
