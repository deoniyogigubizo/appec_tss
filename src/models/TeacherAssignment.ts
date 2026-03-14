import mongoose, { Schema, models, model } from 'mongoose';

export interface ITeacherAssignment {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  course?: {
    name: string;
    code: string;
    trade: string;
    level: string;
  };
  classId?: mongoose.Types.ObjectId | null;
  term: string;
  permissionGranted: boolean;
  grantedBy?: mongoose.Types.ObjectId | null;
  grantedAt?: Date | null;
  revokedBy?: mongoose.Types.ObjectId | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAssignmentSchema = new Schema<ITeacherAssignment>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  course: {
    name: { type: String, required: true },
    code: { type: String, default: '' },
    trade: { type: String, default: '' },
    level: { type: String, default: '' }
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: false,
    default: null
  },
  term: {
    type: String,
    required: true,
  },
  permissionGranted: {
    type: Boolean,
    default: false,
  },
  grantedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  grantedAt: {
    type: Date,
    default: null
  },
  revokedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  revokedAt: {
    type: Date,
    default: null
  },
}, {
  timestamps: true,
});

// Indexes
TeacherAssignmentSchema.index({ teacherId: 1, term: 1 });
TeacherAssignmentSchema.index({ courseId: 1, classId: 1, term: 1 });
TeacherAssignmentSchema.index({ teacherId: 1, courseId: 1, term: 1 }, { unique: true });

const TeacherAssignment = models.TeacherAssignment || model<ITeacherAssignment>('TeacherAssignment', TeacherAssignmentSchema);

export default TeacherAssignment;
