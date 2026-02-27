import { v2 as cloudinary } from 'cloudinary';
import Violation from '../models/Violation.js';
import Exam from '../models/Exam.js';

// Calculate severity by comparing each violation count against the exam's violation limits
// High   = any violation type reached its limit (100%+)  → auto-submit, direct fail
// Medium = any violation type at 50%+ of its limit        → check cutoff
// Low    = any violations but below 50% of all limits     → check cutoff
const calculateSeverity = async (counts, examId) => {
    try {
        const exam = await Exam.findById(examId).select('violationLimits').lean();
        const limits = exam?.violationLimits || { faceLimit: 5, soundLimit: 5, fullscreenLimit: 5 };

        const faceRatio = limits.faceLimit > 0 ? (counts.faceDetection || 0) / limits.faceLimit : 0;
        const soundRatio = limits.soundLimit > 0 ? (counts.soundDetection || 0) / limits.soundLimit : 0;
        const fullscreenRatio = limits.fullscreenLimit > 0 ? (counts.fullscreenExit || 0) / limits.fullscreenLimit : 0;

        const maxRatio = Math.max(faceRatio, soundRatio, fullscreenRatio);

        if (maxRatio >= 1) return 'High';       // Reached or exceeded any limit
        if (maxRatio >= 0.5) return 'Medium';    // 50%+ of any limit
        if (maxRatio > 0) return 'Low';          // Some violations but under 50%
        return 'Low';
    } catch (error) {
        console.error('Severity calc fallback:', error.message);
        // Fallback if exam lookup fails
        const total = (counts.faceDetection || 0) + (counts.soundDetection || 0) +
                      (counts.fullscreenExit || 0) + (counts.tabSwitch || 0);
        if (total >= 10) return 'High';
        if (total >= 5) return 'Medium';
        return 'Low';
    }
};

// Record a violation
export const recordViolation = async (req, res) => {
    try {
        const { candidateId, candidateName, examId, examName, violationType, screenshotUrl, violationCount } = req.body;

        let violation = await Violation.findOne({ candidateId, examId });

        if (violation) {
            // Update with provided counts or increment
            if (violationCount) {
                violation.violationCount = violationCount;
            } else {
                if (violationType === 'face') violation.violationCount.faceDetection++;
                if (violationType === 'sound') violation.violationCount.soundDetection++;
                if (violationType === 'fullscreen') violation.violationCount.fullscreenExit++;
                if (violationType === 'tab_switch') violation.violationCount.tabSwitch++;
            }

            // Calculate severity using exam-specific limits
            violation.severity = await calculateSeverity(violation.violationCount, examId);

            if (screenshotUrl) violation.screenshotUrl = screenshotUrl;
            violation.timestamp = Date.now();

            await violation.save();
        } else {
            const newViolationCount = violationCount || {
                faceDetection: violationType === 'face' ? 1 : 0,
                soundDetection: violationType === 'sound' ? 1 : 0,
                fullscreenExit: violationType === 'fullscreen' ? 1 : 0,
                tabSwitch: violationType === 'tab_switch' ? 1 : 0
            };

            // Calculate severity using exam-specific limits
            const severity = await calculateSeverity(newViolationCount, examId);

            violation = await Violation.create({
                candidateId,
                candidateName,
                examId,
                examName,
                violationType: violationType || 'face',
                violationCount: newViolationCount,
                screenshotUrl,
                severity
            });
        }

        res.status(200).json({
            success: true,
            message: 'Violation recorded',
            violation
        });
    } catch (error) {
        console.error('Record violation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record violation',
            error: error.message
        });
    }
};

export const uploadViolationScreenshot = async (req, res) => {
    try {
        const { image, candidateId, candidateName, examId, examName, violationCount } = req.body;

        if (!image) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        cloudinary.config({
            cloud_name: 'dhue3xnpx',
            api_key: '212913295232361',
            api_secret: 'FklRkFnZZzTVSEZAyx348LbRb1c'
        });

        const uploadResult = await cloudinary.uploader.upload(image, {
            folder: 'exam-violations',
            public_id: `${candidateId}_violation_${Date.now()}`,
            resource_type: 'image'
        });

        // Update existing violation or create new one
        let violation = await Violation.findOne({ candidateId, examId });

        if (violation) {
            violation.screenshotUrl = uploadResult.secure_url;
            violation.timestamp = Date.now();
            await violation.save();
        } else {
            violation = await Violation.create({
                candidateId,
                candidateName,
                examId,
                examName,
                violationType: 'face',
                screenshotUrl: uploadResult.secure_url,
                violationCount: {
                    faceDetection: violationCount || 0,
                    soundDetection: 0,
                    fullscreenExit: 0,
                    tabSwitch: 0
                },
                severity: 'Low'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Screenshot uploaded successfully',
            url: uploadResult.secure_url,
            violation
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload screenshot',
            error: error.message
        });
    }
};

export const getViolationsByExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const violations = await Violation.find({ examId }).sort({ timestamp: -1 }).lean();
        res.status(200).json({ success: true, violations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getViolationsByCandidate = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const violations = await Violation.find({ candidateId }).sort({ timestamp: -1 }).lean();
        res.status(200).json({ success: true, violations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all violations with stats for examiner
export const getAllViolations = async (req, res) => {
    try {
        const violations = await Violation.find()
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        const totalViolations = violations.length;
        const highSeverity = violations.filter(v => v.severity === 'High').length;
        const underReview = violations.filter(v => v.severity === 'Medium').length;

        const formattedViolations = violations.map(v => {
            const total = v.violationCount.faceDetection +
                v.violationCount.soundDetection +
                v.violationCount.fullscreenExit +
                v.violationCount.tabSwitch;

            let type = 'Multiple Violations';
            if (v.violationCount.faceDetection > 0) type = 'Multiple Face Detected';
            else if (v.violationCount.tabSwitch > 0) type = 'Tab Switch';
            else if (v.violationCount.soundDetection > 0) type = 'Unusual Noise Detected';
            else if (v.violationCount.fullscreenExit > 0) type = 'Fullscreen Exit';

            return {
                id: v._id,
                name: v.candidateName,
                exam: v.examName,
                type,
                time: new Date(v.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
                severity: v.severity,
                screenshotUrl: v.screenshotUrl,
                violationCount: v.violationCount
            };
        });

        res.status(200).json({
            success: true,
            data: {
                violations: formattedViolations,
                stats: {
                    totalViolations,
                    highSeverity,
                    underReview
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
