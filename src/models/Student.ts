import mongoose, { Schema, models, model } from 'mongoose';

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  registrationNumber: string;
  class: string;
  level: string;
  trade: string;
  admissionLetterStatus: 'pending' | 'confirmed' | 'rejected';
  admissionToken?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  class: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  trade: {
    type: String,
    required: true,
  },
  admissionLetterStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending',
  },
  admissionToken: {
    type: String,
    unique: true,
    sparse: true,
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
  phoneNumber: {
    type: String,
  },
  parentName: {
    type: String,
  },
  parentPhone: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
StudentSchema.index({ registrationNumber: 1 });
StudentSchema.index({ class: 1 });
StudentSchema.index({ level: 1 });
StudentSchema.index({ trade: 1 });
StudentSchema.index({ admissionLetterStatus: 1 });

const Student = models.Student || model<IStudent>('Student', StudentSchema);

export default Student;
