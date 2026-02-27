import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Exam',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Candidate',
        required: true
    },
    answers: [{
        questionId: mongoose.Schema.Types.Mixed,
        selectedOption: Number,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        default: 0
    },
    totalMarks: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number,
        default: 0
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

submissionSchema.pre('save', function (next) {
    if (this.totalMarks > 0) {
        this.percentage = Math.round((this.score / this.totalMarks) * 100);
    }
    next();
});

// Compound index for fast submission lookups and duplicate checks
submissionSchema.index({ examId: 1, candidateId: 1 });

export default mongoose.model('Submission', submissionSchema);
