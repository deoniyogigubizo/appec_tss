import mongoose, { Schema, models, model } from 'mongoose';

export interface IDisciplineIncident {
  date: Date;
  description: string;
  points: number;
  enteredBy: mongoose.Types.ObjectId;
}

export interface IDisciplineMark {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  term: string;
  incidents: IDisciplineIncident[];
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const DisciplineMarkSchema = new Schema<IDisciplineMark>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  incidents: [{
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }],
  totalPoints: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate total points before saving
DisciplineMarkSchema.pre('save', function(next) {
  this.totalPoints = this.incidents.reduce((sum, incident) => sum + incident.points, 0);
  next();
});

// Indexes
DisciplineMarkSchema.index({ studentId: 1, term: 1 });
DisciplineMarkSchema.index({ term: 1 });

const DisciplineMark = models.DisciplineMark || model<IDisciplineMark>('DisciplineMark', DisciplineMarkSchema);

export default DisciplineMark;
