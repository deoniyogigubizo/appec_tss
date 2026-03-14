import mongoose, { Schema, models, model } from 'mongoose';

export interface IDemonessa {
  _id: mongoose.Types.ObjectId;
  fullname: string;
  email: string;
  examinationCode: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
  gender: string;
  nationality: string;
  previousSchool: string;
  admittedSchool: string;
  admittedTrade: string;
  level: string;
  program?: string;
  result: {
    marks: {
      biology: number;
      math: number;
      kinyarwanda: number;
      chemistry: number;
      history: number;
      geography: number;
      english: number;
      entrepreneurship: number;
      physics: number;
    };
    totalMarks?: number;
    average?: number;
    percentage?: number;
    status?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DemonessaSchema = new Schema<IDemonessa>(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    examinationCode: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
    },
    nationality: {
      type: String,
      required: true,
    },
    previousSchool: {
      type: String,
      required: true,
    },
    admittedSchool: {
      type: String,
      required: true,
    },
    admittedTrade: {
      type: String,
      required: true,
      enum: ['SWD', 'ACC', 'BDC', 'CSA', ''],
    },
    level: {
      type: String,
      required: true,
      enum: ['L3', 'L4', 'L5', ''],
    },
    program: {
      type: String,
    },
    result: {
      marks: {
        biology: {
          type: Number,
          required: true,
          default: 0,
        },
        math: {
          type: Number,
          required: true,
          default: 0,
        },
        kinyarwanda: {
          type: Number,
          required: true,
          default: 0,
        },
        chemistry: {
          type: Number,
          required: true,
          default: 0,
        },
        history: {
          type: Number,
          required: true,
          default: 0,
        },
        geography: {
          type: Number,
          required: true,
          default: 0,
        },
        english: {
          type: Number,
          required: true,
          default: 0,
        },
        entrepreneurship: {
          type: Number,
          required: true,
          default: 0,
        },
        physics: {
          type: Number,
          required: true,
          default: 0,
        },
      },
      totalMarks: {
        type: Number,
        default: 0,
      },
      average: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['PASS', 'FAIL'],
        default: 'FAIL',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate stats
DemonessaSchema.pre('save', function (next) {
  const marks = this.result.marks;
  const subjectMarks = [
    marks.biology,
    marks.math,
    marks.kinyarwanda,
    marks.chemistry,
    marks.history,
    marks.geography,
    marks.english,
    marks.entrepreneurship,
    marks.physics,
  ];
  
  const total = subjectMarks.reduce((a, b) => a + b, 0);
  const average = total / subjectMarks.length;
  const percentage = (total / 900) * 100;
  
  this.result.totalMarks = total;
  this.result.average = parseFloat(average.toFixed(2));
  this.result.percentage = parseFloat(percentage.toFixed(2));
  this.result.status = percentage >= 50 ? 'PASS' : 'FAIL';
  
  next();
});

// Indexes
DemonessaSchema.index({ email: 1 });
DemonessaSchema.index({ examinationCode: 1 });
DemonessaSchema.index({ fullname: 1 });
DemonessaSchema.index({ 'result.status': 1 });

const Demonessa = models.Demonessa || model<IDemonessa>('Demonessa', DemonessaSchema);

export default Demonessa;
