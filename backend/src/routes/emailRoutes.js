import express from 'express';
import { sendTest, sendNotification, sendViolation, sendResult, sendBulkInvitation, sendCancellationEmail } from '../controllers/emailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route (no auth for testing)
router.post('/test', sendTest);

// Cron route (no auth, triggered by Vercel Cron)
router.get('/cron', async (req, res) => {
    try {
        // We import the logic here to avoid circular dependencies if any
        const { processScheduledEmails } = await import('../utils/emailScheduler.js');
        await processScheduledEmails();
        res.status(200).json({ success: true, message: 'Cron job executed successfully' });
    } catch (error) {
        console.error('Cron job failed:', error);
        res.status(500).json({ success: false, message: 'Cron job failed', error: error.message });
    }
});

// Protected routes
router.use(protect);
router.post('/notification', sendNotification);
router.post('/violation-alert', sendViolation);
router.post('/result', sendResult);
router.post('/bulk-invitation/:examId', sendBulkInvitation);
router.post('/cancel-exam/:examId', sendCancellationEmail);

export default router;
