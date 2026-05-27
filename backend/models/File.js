import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: { type: String, required: true },
    path: { type: String, required: true },
    content: { type: String, default: '' },
    language: { type: String, default: 'plaintext' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

fileSchema.index({ project: 1, path: 1 }, { unique: true });

const File = mongoose.model('File', fileSchema);
export default File;
