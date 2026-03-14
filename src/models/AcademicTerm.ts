import mongoose, { Schema, models, model } from 'mongoose';

export interface IAcademicTerm {
  _id: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicTermSchema = new Schema<IAcademicTerm>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
AcademicTermSchema.index({ name: 1 });
AcademicTermSchema.index({ isActive: 1 });

const AcademicTerm = models.AcademicTerm || model<IAcademicTerm>('AcademicTerm', AcademicTermSchema);

export default AcademicTerm;
