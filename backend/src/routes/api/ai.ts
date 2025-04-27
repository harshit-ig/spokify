import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { protect } from '../../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// MongoDB connection setup
const MONGODB_URI = process.env.MONGODB_AI_URI;
const client = new MongoClient(MONGODB_URI || '');
let db: any;

// Connect to MongoDB for AI functionality
async function connectAIDB() {
  try {
    await client.connect();
    db = client.db('chatapp');
    console.log('Connected to MongoDB for AI services');
    return true;
  } catch (err) {
    console.error('MongoDB connection error for AI services:', err);
    return false;
  }
}

// Initialize connection
connectAIDB();

// Create a prompt and start processing
router.post('/prompt', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    if (!message) {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }
    
    // Verify MongoDB connection
    if (!db) {
      const connected = await connectAIDB();
      if (!connected) {
        res.status(503).json({ success: false, error: 'AI service unavailable' });
        return;
      }
    }
    
    // Create prompt in MongoDB
    const prompt = {
      user_id: userId,
      message: message,
      created_at: new Date(),
      processed: false,
      processing: false
    };
    
    const result = await db.collection('prompts').insertOne(prompt);
    
    // Return the prompt ID so the client can use it to connect to the stream
    res.status(201).json({
      success: true,
      promptId: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Stream AI responses (using Server-Sent Events)
router.get('/stream/:promptId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptId } = req.params;
    console.log(`Stream request for promptId: ${promptId}`);
    
    // Validate ID format
    if (!ObjectId.isValid(promptId)) {
      console.error(`Invalid prompt ID format: ${promptId}`);
      res.status(400).json({ error: 'Invalid prompt ID format' });
      return;
    }
    
    // Verify MongoDB connection
    if (!db) {
      const connected = await connectAIDB();
      if (!connected) {
        res.status(503).json({ success: false, error: 'AI service unavailable' });
        return;
      }
    }
    
    // Set up SSE connection
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Allow cross-origin requests (important for EventSource)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders(); // Important for SSE
    
    // Find the prompt and wait for response_id
    let responseId = null;
    let findPromptAttempts = 0;
    const maxAttempts = 20; // Limit the number of attempts (10 seconds at 500ms intervals)
    
    while (!responseId && findPromptAttempts < maxAttempts) {
      const prompt = await db.collection('prompts').findOne({
        _id: new ObjectId(promptId)
      });
      
      if (!prompt) {
        findPromptAttempts++;
        if (findPromptAttempts >= maxAttempts) {
          res.write(`data: ${JSON.stringify({
            tokens: ["Error: Prompt not found after multiple attempts."],
            partial: false,
            error: true
          })}\n\n`);
          res.end();
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      if (prompt.response_id) {
        // Validate response_id format
        if (!ObjectId.isValid(prompt.response_id)) {
          res.write(`data: ${JSON.stringify({
            tokens: ["Error: Invalid response ID format."],
            partial: false,
            error: true
          })}\n\n`);
          res.end();
          return;
        }
        responseId = prompt.response_id;
      } else {
        findPromptAttempts++;
        if (findPromptAttempts >= maxAttempts) {
          res.write(`data: ${JSON.stringify({
            tokens: ["Error: No response generated within the time limit."],
            partial: false,
            error: true
          })}\n\n`);
          res.end();
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // If we couldn't get a responseId, return an error
    if (!responseId) {
      res.write(`data: ${JSON.stringify({
        tokens: ["Error: Failed to get response ID."],
        partial: false,
        error: true
      })}\n\n`);
      res.end();
      return;
    }
    
    // Stream tokens from response collection
    let lastUpdate = Date.now();
    let previousLength = 0;
    const interval = setInterval(async () => {
      try {
        const response = await db.collection('responses').findOne({
          _id: new ObjectId(responseId)
        });
        
        if (!response) {
          console.log(`Response not found for responseId: ${responseId}`);
          // Add timeout before giving up
          const currentTime = Date.now();
          if (!(interval as any).startTime) {
            (interval as any).startTime = currentTime;
          }
          
          // Wait up to 5 seconds for the response to be created
          if (currentTime - (interval as any).startTime > 5000) {
            console.error(`Response not found after waiting: ${responseId}`);
            clearInterval(interval);
            res.write(`data: ${JSON.stringify({
              tokens: ["Error: Response not found after waiting."],
              partial: false,
              error: true
            })}\n\n`);
            res.end();
            return;
          }
          return;
        }
        
        // Send new tokens
        if (response.tokens && response.tokens.length > previousLength) {
          const newTokens = response.tokens.slice(previousLength);
          res.write(`data: ${JSON.stringify({
            tokens: newTokens,
            partial: !response.complete,
            totalTokens: response.tokens.length
          })}\n\n`);
          previousLength = response.tokens.length;
          lastUpdate = Date.now();
          // Make sure to flush after each write
          if ((res as any).flush) (res as any).flush();
        }
        
        // End stream if complete AND we have all tokens
        // Only close if we've seen all tokens (to avoid race condition)
        if (response.complete && response.tokens && previousLength >= response.tokens.length) {
          console.log(`Stream complete for response ${responseId}, all ${response.tokens.length} tokens sent.`);
          clearInterval(interval);
          
          // Send a final completion message
          res.write(`data: ${JSON.stringify({
            tokens: [],
            partial: false,
            complete: true,
            totalTokens: response.tokens.length
          })}\n\n`);
          
          res.end();
        } else if (response.complete && (!response.tokens || previousLength < response.tokens.length)) {
          // Response is marked complete but we haven't sent all tokens yet
          // Wait for next interval to send remaining tokens
          console.log(`Response marked complete but waiting for tokens. Have ${previousLength}, total ${response.tokens?.length || 0}`);
        }
        
        // Timeout after 60s inactivity (increased from 30s)
        if (Date.now() - lastUpdate > 60000) {
          clearInterval(interval);
          res.write(`data: ${JSON.stringify({
            tokens: ["Error: Stream timed out due to inactivity."],
            partial: false,
            error: true
          })}\n\n`);
          res.end();
        }
      } catch (err) {
        console.error('Stream error:', err);
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({
          tokens: ["Error: Stream encountered a server error."],
          partial: false,
          error: true
        })}\n\n`);
        res.end();
      }
    }, 500);
    
    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
    
  } catch (error) {
    console.error('Stream setup error:', error);
    res.write(`data: ${JSON.stringify({
      tokens: ["Error: Failed to set up stream."],
      partial: false,
      error: true
    })}\n\n`);
    res.end();
  }
});

export default router; 