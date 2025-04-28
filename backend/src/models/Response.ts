import mongoose from 'mongoose';

// Schema for AI responses
const ResponseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokens: {
    type: [String],
    default: []
  },
  complete: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  full_response: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const Response = mongoose.model('Response', ResponseSchema);

export default Response; 