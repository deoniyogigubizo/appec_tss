import mongoose, { Schema, models, model } from 'mongoose';

export type TradeType = 'CSA' | 'BDC' | 'ACC' | 'SWD';
export type LevelType = 'L3' | 'L4' | 'L5';

export interface ICourse {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  credits: number;
  department: string;
  trade?: TradeType;
  level?: LevelType;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  credits: {
    type: Number,
    required: true,
    default: 3,
  },
  department: {
    type: String,
    required: true,
  },
  trade: {
    type: String,
    enum: ['CSA', 'BDC', 'ACC', 'SWD'],
  },
  level: {
    type: String,
    enum: ['L3', 'L4', 'L5'],
  },
}, {
  timestamps: true,
});

// Indexes
// Note: code already has index from unique: true in schema
CourseSchema.index({ department: 1 });
CourseSchema.index({ name: 1 });

const Course = models.Course || model<ICourse>('Course', CourseSchema);

export default Course;
