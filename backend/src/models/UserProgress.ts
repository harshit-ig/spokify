import mongoose, { Document } from 'mongoose';

export interface IAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  type: 'streak' | 'completion' | 'score' | 'practice';
  color: string;
  unlockedAt?: Date;
}

export interface IUserProgress extends Document {
  user: mongoose.Schema.Types.ObjectId;
  lessonsCompleted: number;
  practiceMinutes: number;
  fluencyScore: number;
  weeklyGoal: {
    current: number;
    target: number;
    lastResetDate?: Date;
  };
  streak: {
    current: number;
    longest: number;
    lastPracticeDate: Date;
  };
  achievements: IAchievement[];
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  unlocked: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['streak', 'completion', 'score', 'practice'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  unlockedAt: {
    type: Date
  }
});

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  lessonsCompleted: {
    type: Number,
    default: 0
  },
  practiceMinutes: {
    type: Number,
    default: 0
  },
  fluencyScore: {
    type: Number,
    default: 0
  },
  weeklyGoal: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      default: 5
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastPracticeDate: {
      type: Date,
      default: Date.now
    }
  },
  achievements: [AchievementSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
UserProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IUserProgress>('UserProgress', UserProgressSchema); 