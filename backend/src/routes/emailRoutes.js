import express from 'express';
import { sendTest, sendNotification, sendViolation, sendResult, sendBulkInvitation, sendCancellationEmail, sendStartCredentials } from '../controllers/emailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route (no auth for testing)
router.post('/test', sendTest);

// UptimeRobot Worker Route (no auth, triggered by external ping)
router.get('/worker', async (req, res) => {
    try {
        // We import the logic here to avoid circular dependencies if any
        const { processScheduledEmails } = await import('../utils/emailScheduler.js');
        await processScheduledEmails();
        res.status(200).json({ success: true, message: 'Worker processed successfully' });
    } catch (error) {
        console.error('Worker failed:', error);
        res.status(500).json({ success: false, message: 'Worker failed', error: error.message });
    }
});

// Protected routes
router.use(protect);
router.post('/notification', sendNotification);
router.post('/violation-alert', sendViolation);
router.post('/result', sendResult);
router.post('/bulk-invitation/:examId', sendBulkInvitation);
router.post('/cancel-exam/:examId', sendCancellationEmail);
router.post('/send-credentials/:examId', sendStartCredentials);

export default router;
