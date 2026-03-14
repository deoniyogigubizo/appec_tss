import mongoose, { Schema, models, model } from 'mongoose';

export type UserRole = 'admin' | 'secretary' | 'dos' | 'dod' | 'teacher' | 'student' | 'hod';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'secretary', 'dos', 'dod', 'teacher', 'student', 'hod'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance (only role, email has unique: true which auto-creates index)
UserSchema.index({ role: 1 });

const User = models.User || model<IUser>('User', UserSchema);

export default User;
