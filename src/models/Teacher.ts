import mongoose, { Schema, models, model } from 'mongoose';

export type TradeType = 'CSA' | 'BDC' | 'ACC' | 'SWD';
export type LevelType = 'L3' | 'L4' | 'L5';

export interface ITeacher {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  department: string;
  trade?: TradeType;
  level?: LevelType;
  subjects: string[];
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  isActive: boolean;
  assignedToDos: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
  },
  subjects: [{
    type: String,
  }],
  phoneNumber: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
  },
  address: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  assignedToDos: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
TeacherSchema.index({ department: 1 });

const Teacher = models.Teacher || model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;
