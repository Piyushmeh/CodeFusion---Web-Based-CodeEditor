import mongoose from 'mongoose';

const collaborationSessionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamProject',
      required: true,
      unique: true,
    },
    activeUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        activeFile: {
          type: String,
          default: '',
        },
        color: {
          type: String,
          default: '#7c3aed',
        },
      },
    ],
    // Store Yjs CRDT document binary state updates for the project
    // Key-value map from filePath -> Base64 update string or binary buffer
    yDocStates: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const CollaborationSession = mongoose.model('CollaborationSession', collaborationSessionSchema);
export default CollaborationSession;
