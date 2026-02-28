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
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import './config/email.js';
import { startEmailScheduler } from './utils/emailScheduler.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://fair-exam.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use('/api/health', healthRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start the server and scheduler if NOT running on Vercel
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startEmailScheduler();
  });
}

// Export the app for Vercel serverless
export default app;
