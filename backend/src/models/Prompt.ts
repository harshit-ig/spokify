import mongoose from 'mongoose';

// Schema for AI prompts
const PromptSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  processed: {
    type: Boolean,
    default: false
  },
  processing: {
    type: Boolean,
    default: false
  },
  response_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Response'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  processed_at: {
    type: Date
  }
});

const Prompt = mongoose.model('Prompt', PromptSchema);

export default Prompt; 