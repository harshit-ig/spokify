import mongoose, { Document } from 'mongoose';

export interface IUserLesson extends Document {
  user: mongoose.Schema.Types.ObjectId;
  lesson: mongoose.Schema.Types.ObjectId;
  progress: number;
  score?: number;
  completedAt?: Date;
  currentStage: number;
  userResponses: string[];
  startedAt: Date;
  lastAccessedAt: Date;
}

const UserLessonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  completedAt: {
    type: Date
  },
  currentStage: {
    type: Number,
    default: 0
  },
  userResponses: {
    type: [String],
    default: []
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to ensure a user can only have one entry per lesson
UserLessonSchema.index({ user: 1, lesson: 1 }, { unique: true });

// Update lastAccessedAt on every save
UserLessonSchema.pre('save', function(next) {
  this.lastAccessedAt = new Date();
  next();
});

export default mongoose.model<IUserLesson>('UserLesson', UserLessonSchema); 