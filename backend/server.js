import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { exec } from 'child_process';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandler } from './socket/socketHandler.js';
import { ensureTempRoot } from './utils/cleanup.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import runRoutes from './routes/runRoutes.js';
import teamCollaborationRoutes from './routes/teamCollaborationRoutes.js';
import { executeCode } from './controllers/runController.js';
import { protect } from './middleware/auth.js';
import Project from './models/Project.js';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e6,
  pingTimeout: 60_000,
});

setupSocketHandler(io);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', compiler: 'local', realtime: 'socket.io' })
);

app.get('/api/xdebug-cpp-check', (req, res) => {
  exec('which g++ && g++ --version && ls /usr/include/bits/stdc++.h', (err, stdout, stderr) => {
    res.json({ err: err?.message, stdout, stderr });
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/run', runRoutes);
app.use('/api', teamCollaborationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await Project.syncIndexes();
    await ensureTempRoot();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('REST run: POST /api/run/execute');
      console.log('Realtime: Socket.IO compile:* events');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Check MONGODB_URI in backend/.env and your network / Atlas IP whitelist.');
    process.exit(1);
  }
};

startServer();