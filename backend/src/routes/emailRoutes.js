import express from 'express';
import { sendTest, sendNotification, sendViolation, sendResult, sendBulkInvitation, sendCancellationEmail } from '../controllers/emailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route (no auth for testing)
router.post('/test', sendTest);

// Protected routes
router.use(protect);
router.post('/notification', sendNotification);
router.post('/violation-alert', sendViolation);
router.post('/result', sendResult);
router.post('/bulk-invitation/:examId', sendBulkInvitation);
router.post('/cancel-exam/:examId', sendCancellationEmail);

export default router;
