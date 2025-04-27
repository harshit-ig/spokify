import mongoose, { Document } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  description: string;
  category: string;
  iconColor: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  xpPoints: number;
  skills: string[];
  content: {
    stages: {
      prompt: string;
      expectedTopics: string[];
      aiResponses: string[];
    }[];
    completion: {
      title: string;
      message: string;
      keyTakeaways: string[];
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: ['conversation', 'grammar', 'vocabulary', 'pronunciation', 'writing', 'reading']
  },
  iconColor: {
    type: String,
    default: 'blue'
  },
  difficulty: {
    type: String,
    required: [true, 'Please specify difficulty level'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  estimatedTime: {
    type: Number,
    required: [true, 'Please add estimated completion time in minutes'],
    min: [1, 'Estimated time must be at least 1 minute']
  },
  xpPoints: {
    type: Number,
    required: [true, 'Please add XP points for this lesson'],
    min: [1, 'XP points must be at least 1']
  },
  skills: {
    type: [String],
    required: [true, 'Please add at least one skill'],
    validate: {
      validator: function(val: string[]) {
        return val.length > 0;
      },
      message: 'Please add at least one skill'
    }
  },
  content: {
    stages: [{
      prompt: {
        type: String,
        required: [true, 'Please add a prompt for this stage']
      },
      expectedTopics: {
        type: [String],
        required: [true, 'Please add expected topics for this stage']
      },
      aiResponses: {
        type: [String],
        required: [true, 'Please add AI responses for this stage']
      }
    }],
    completion: {
      title: {
        type: String,
        required: [true, 'Please add a completion title']
      },
      message: {
        type: String,
        required: [true, 'Please add a completion message']
      },
      keyTakeaways: {
        type: [String],
        required: [true, 'Please add key takeaways']
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
LessonSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ILesson>('Lesson', LessonSchema); 