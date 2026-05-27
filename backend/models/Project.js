import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    language: {
      type: String,
      required: true,
      enum: ['Java', 'C++', 'Python', 'HTML', 'CSS', 'JavaScript'],
    },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'public',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['viewer', 'editor'], default: 'editor' },
      },
    ],
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    pinned: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
    fileCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    lastOpenedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, updatedAt: -1 });
// Do NOT use text index here — we have a `language` field (Java, Python, etc.)
// and MongoDB treats `language` as text-search override, causing insert errors.
projectSchema.index({ title: 1 });
projectSchema.index({ owner: 1, starred: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
