import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import violationRoutes from './routes/violationRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import userRoutes from './routes/userRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import './config/email.js';
import { startEmailScheduler } from './utils/emailScheduler.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'FairExam API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', routes: 'registered', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/submissions', submissionRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startEmailScheduler();
});
