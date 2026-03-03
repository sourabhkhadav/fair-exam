import asyncHandler from '../middleware/asyncHandler.js';
import { sendTestEmail, sendExamNotification, sendViolationAlert, sendExamResult, sendExamCancellation } from '../utils/emailService.js';
import Exam from '../models/Exam.js';
import Candidate from '../models/Candidate.js';

// @desc    Send test email
// @route   POST /api/email/test
// @access  Private
export const sendTest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email address is required');
    }

    await sendTestEmail(email);

    res.status(200).json({
        success: true,
        message: `Test email sent to ${email}`
    });
});

// @desc    Send exam notification
// @route   POST /api/email/notification
// @access  Private
export const sendNotification = asyncHandler(async (req, res) => {
    const { email, examDetails } = req.body;

    if (!email || !examDetails) {
        res.status(400);
        throw new Error('Email and exam details are required');
    }

    await sendExamNotification(email, examDetails);

    res.status(200).json({
        success: true,
        message: `Notification sent to ${email}`
    });
});

// @desc    Send violation alert
// @route   POST /api/email/violation-alert
// @access  Private
export const sendViolation = asyncHandler(async (req, res) => {
    const { email, violationDetails } = req.body;

    if (!email || !violationDetails) {
        res.status(400);
        throw new Error('Email and violation details are required');
    }

    await sendViolationAlert(email, violationDetails);

    res.status(200).json({
        success: true,
        message: `Violation alert sent to ${email}`
    });
});

// @desc    Send exam result
// @route   POST /api/email/result
// @access  Private
export const sendResult = asyncHandler(async (req, res) => {
    const { email, resultDetails } = req.body;

    if (!email || !resultDetails) {
        res.status(400);
        throw new Error('Email and result details are required');
    }

    await sendExamResult(email, resultDetails);

    res.status(200).json({
        success: true,
        message: `Result sent to ${email}`
    });
});

// @desc    Send bulk notifications to all candidates
// @route   POST /api/email/bulk-invitation/:examId
// @access  Private
export const sendBulkInvitation = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const candidates = await Candidate.find({ examId: req.params.examId });

    if (candidates.length === 0) {
        res.status(400);
        throw new Error('No candidates found for this exam');
    }

    const examDetails = {
        title: exam.title,
        startDate: exam.startDate || 'TBD',
        startTime: exam.startTime || 'TBD',
        endTime: exam.endTime || 'TBD',
        duration: exam.duration || 0
    };

    const results = { sent: 0, failed: 0, emails: [] };

    for (const candidate of candidates) {
        if (candidate.email) {
            try {
                await sendExamNotification(candidate.email, examDetails);
                results.sent++;
                results.emails.push(candidate.email);
                console.log(`✅ Sent to ${candidate.email}`);
            } catch (error) {
                console.error(`❌ Failed to send to ${candidate.email}:`, error.message);
                results.failed++;
            }
        } else {
            console.log(`⚠️ No email for candidate: ${candidate.name}`);
        }
    }

    res.status(200).json({
        success: true,
        message: `Notifications sent to ${results.sent} candidates`,
        results
    });
});

// @desc    Send exam cancellation emails
// @route   POST /api/email/cancel-exam/:examId
// @access  Private
export const sendCancellationEmail = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const candidates = await Candidate.find({ examId: req.params.examId });

    if (candidates.length === 0) {
        res.status(200).json({
            success: true,
            message: 'No candidates to notify'
        });
        return;
    }

    const examDetails = {
        title: exam.title,
        startDate: exam.startDate || 'TBD',
        startTime: exam.startTime || 'TBD'
    };

    const results = { sent: 0, failed: 0 };

    for (const candidate of candidates) {
        if (candidate.email) {
            try {
                await sendExamCancellation(candidate.email, examDetails);
                results.sent++;
            } catch (error) {
                console.error(`Failed to send cancellation to ${candidate.email}:`, error.message);
                results.failed++;
            }
        }
    }

    res.status(200).json({
        success: true,
        message: `Cancellation emails sent to ${results.sent} candidates`,
        results
    });
});

// @desc    Send exam start credentials manually
// @route   POST /api/email/send-credentials/:examId
// @access  Private
export const sendStartCredentials = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const candidates = await Candidate.find({ examId: req.params.examId });

    if (candidates.length === 0) {
        res.status(400);
        throw new Error('No candidates found for this exam');
    }

    const examDetails = {
        examId: exam._id,
        title: exam.title,
        startDate: exam.startDate || 'TBD',
        startTime: exam.startTime || 'TBD',
        duration: exam.duration || 0
    };

    const results = { sent: 0, failed: 0, emails: [] };

    for (const candidate of candidates) {
        if (candidate.email) {
            // Generate credentials if they don't exist
            if (!candidate.candidateId || !candidate.password) {
                const candidateId = `CAND${exam._id.toString().slice(-4)}${String(candidates.indexOf(candidate) + 1).padStart(4, '0')}`;
                const password = Math.random().toString(36).slice(-8).toUpperCase();
                candidate.candidateId = candidateId;
                candidate.password = password;
                await candidate.save();
            }

            try {
                const candidateDetails = {
                    name: candidate.name,
                    candidateId: candidate.candidateId,
                    password: candidate.password
                };
                // Need to import sendExamStartEmail at top of file, adding it below
                const { sendExamStartEmail } = await import('../utils/emailService.js');
                await sendExamStartEmail(candidate.email, examDetails, candidateDetails);
                results.sent++;
                results.emails.push(candidate.email);
            } catch (error) {
                console.error(`Failed to send start email to ${candidate.email}:`, error);
                results.failed++;
            }
        }
    }

    // Mark as sent so scheduler doesn't send duplicate
    exam.examStartEmailSent = true;
    exam.emailSent = true;
    await exam.save();

    res.status(200).json({
        success: true,
        message: `Credentials sent to ${results.sent} candidates`,
        results
    });
});
