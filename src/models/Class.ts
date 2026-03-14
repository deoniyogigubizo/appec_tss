import mongoose, { Schema, models, model } from 'mongoose';

export interface IClass {
  _id: mongoose.Types.ObjectId;
  name: string;
  level: string;
  department: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
ClassSchema.index({ name: 1 });
ClassSchema.index({ level: 1 });
ClassSchema.index({ department: 1 });
ClassSchema.index({ level: 1, department: 1 });

const Class = models.Class || model<IClass>('Class', ClassSchema);

export default Class;
