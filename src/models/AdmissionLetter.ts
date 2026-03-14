import mongoose, { Schema, models, model } from 'mongoose';

export interface IAdmissionLetter {
  _id: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  token: string;
  generatedBy: mongoose.Types.ObjectId;
  status: 'issued' | 'used' | 'expired';
  expiresAt: Date;
  studentName?: string;
  class?: string;
  level?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionLetterSchema = new Schema<IAdmissionLetter>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['issued', 'used', 'expired'],
    default: 'issued',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  studentName: {
    type: String,
  },
  class: {
    type: String,
  },
  level: {
    type: String,
  },
  department: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
AdmissionLetterSchema.index({ token: 1 });
AdmissionLetterSchema.index({ status: 1 });
AdmissionLetterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdmissionLetter = models.AdmissionLetter || model<IAdmissionLetter>('AdmissionLetter', AdmissionLetterSchema);

export default AdmissionLetter;
