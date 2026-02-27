import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    email: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
    },
    examId: {
        type: String,
        required: true
    },
    candidateId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for fast candidate lookups by exam
candidateSchema.index({ examId: 1 });

export default mongoose.model('Candidate', candidateSchema);
