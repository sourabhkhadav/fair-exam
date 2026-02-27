import mongoose from 'mongoose';

const violationSchema = new mongoose.Schema({
    candidateId: {
        type: String,
        required: true
    },
    candidateName: {
        type: String,
        required: true
    },
    examId: {
        type: String,
        required: true
    },
    examName: {
        type: String,
        required: true
    },
    violationType: {
        type: String,
        enum: ['face', 'sound', 'fullscreen', 'tab_switch'],
        required: true
    },
    violationCount: {
        faceDetection: { type: Number, default: 0 },
        soundDetection: { type: Number, default: 0 },
        fullscreenExit: { type: Number, default: 0 },
        tabSwitch: { type: Number, default: 0 }
    },
    screenshotUrl: String,
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for fast violation lookups (upsert pattern + per-exam queries)
violationSchema.index({ candidateId: 1, examId: 1 });
violationSchema.index({ examId: 1 });

export default mongoose.model('Violation', violationSchema);
