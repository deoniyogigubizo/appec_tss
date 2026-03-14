import mongoose, { Schema, models, model } from 'mongoose';

export interface IMark {
  assessment: string;
  score: number;
  maxScore: number;
}

export interface IAcademicMark {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  term: string;
  marks: IMark[];
  submitted: boolean;
  submittedAt?: Date;
  approved: boolean;
  approvedAt?: Date;
  published: boolean;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicMarkSchema = new Schema<IAcademicMark>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  marks: [{
    assessment: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
  }],
  submitted: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  published: {
    type: Boolean,
    default: false,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
AcademicMarkSchema.index({ studentId: 1, courseId: 1, term: 1 });
AcademicMarkSchema.index({ courseId: 1, term: 1 });
AcademicMarkSchema.index({ teacherId: 1, term: 1 });
AcademicMarkSchema.index({ submitted: 1, approved: 1, published: 1 });

const AcademicMark = models.AcademicMark || model<IAcademicMark>('AcademicMark', AcademicMarkSchema);

export default AcademicMark;
