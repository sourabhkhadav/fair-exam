import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    sectionId: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['MCQ'],
        default: 'MCQ'
    },
    text: {
        type: String,
        required: [true, 'Please add question text']
    },
    options: {
        type: [String],
        validate: [arrayLimit, '{PATH} exceeds limit of 4']
    },
    correct: {
        type: Number,
        required: [true, 'Please specify correct option index']
    },
    marks: {
        type: Number,
        default: 2
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    tags: [String]
});

function arrayLimit(val) {
    return val.length <= 4;
}

const sectionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, { _id: false });

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add an exam title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: String,
    category: String,
    startDate: String,
    startTime: String,
    endDate: String,
    endTime: String,
    timezone: String,
    scheduleEmailDate: String,
    scheduleEmailTime: String,
    emailSent: {
        type: Boolean,
        default: false
    },
    examStartEmailSent: {
        type: Boolean,
        default: false
    },
    duration: {
        type: Number,
        default: 0
    },
    examiner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    sections: [sectionSchema],
    questions: [questionSchema],
    totalMarks: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    violationLimits: {
        faceLimit: {
            type: Number,
            default: 5
        },
        soundLimit: {
            type: Number,
            default: 5
        },
        fullscreenLimit: {
            type: Number,
            default: 5
        }
    },
    resultsSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate total marks before saving
examSchema.pre('save', function (next) {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    }
    next();
});

// Calculate total marks before updating
examSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.questions && update.questions.length > 0) {
        update.totalMarks = update.questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    }
    next();
});

// Indexes for fast examiner-scoped and status-filtered queries
examSchema.index({ examiner: 1 });
examSchema.index({ status: 1 });

export default mongoose.model('Exam', examSchema);
