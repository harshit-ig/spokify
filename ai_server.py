import torch
# transformers ==4.47.1 is Must
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer, StoppingCriteria, StoppingCriteriaList
from threading import Thread
import json
import time
import logging
import re
import pymongo
from bson import ObjectId
from pymongo import MongoClient
from datetime import datetime
import uuid
import signal
import sys
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ai_backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# MongoDB Atlas connection
MONGODB_URI = os.getenv("MONGODB_URI")
client = pymongo.MongoClient(MONGODB_URI)
# Use the main database instead of 'chatapp'
db = client.spokify
# Match collections to Mongoose models
prompt_collection = db.prompts
response_collection = db.responses 
chat_history_collection = db.chathistories

# Replace the model loading block with:
logger.info("Loading model and tokenizer...")
model_id = "microsoft/Phi-3.5-mini-instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)

try:
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        trust_remote_code=True,
        attn_implementation="eager"  # Add this line
    ).to("xpu")
    logger.info("Model loaded with float16 precision")
except Exception as e:
    logger.warning(f"Failed to load model with float16: {str(e)}")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        trust_remote_code=True,
        attn_implementation="eager"  # Add this line
    ).to("xpu")
    logger.info("Model loaded with default precision")


# Define stopping criteria
class StopOnTokens(StoppingCriteria):
    def __init__(self, stop_token_ids):
        self.stop_token_ids = stop_token_ids
    
    def __call__(self, input_ids, scores, **kwargs):
        for stop_ids in self.stop_token_ids:
            if len(stop_ids) <= input_ids.shape[1] and input_ids[0][-len(stop_ids):].tolist() == stop_ids:
                return True
        return False

# MongoDB based chat function
def process_mongodb_chat(user_message, user_id, response_id, prompt_id):
    """Process a chat message from MongoDB and stream response back to MongoDB"""
    
    # Get chat history from MongoDB or initialize
    history_doc = chat_history_collection.find_one({"user_id": user_id})
    if not history_doc:
        user_history = []
        # Create new chat history document matching Mongoose schema
        chat_history_collection.insert_one({
            "user_id": user_id, 
            "messages": [],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
    else:
        user_history = history_doc.get("messages", [])
    
    # Clean the user message to remove any existing format markers
    # First check for special tokens
    if "<|user|>" in user_message and "<|end|>" in user_message:
        # Extract the actual user message from the formatted input
        match = re.search(r'<|user|> (.*?)<|end|>', user_message, re.DOTALL)
        if match:
            clean_message = match.group(1).strip()
            logger.info(f"Extracted user message from special tokens: {clean_message}")
            user_message = clean_message
    
    # Then remove any User/Assistant prefixes
    if user_message.startswith('<|user|>'):
        user_message = user_message.replace('<|user|>', '', 1).strip()
    
    # Remove any Assistant: tag if present
    if '<|assistant|>' in user_message:
        user_message = user_message.split('<|assistant|>', 1)[0].strip()
    
    # Convert "<|user|>" and "Assistant:" from the middle of messages
    user_message = re.sub(r'User\s*:', '', user_message)
    
    logger.info(f"Cleaned user message: {user_message}")

    # Add message to history with structure matching MessageSchema
    user_history.append({"role": "user", "content": user_message, "timestamp": datetime.now()})
   
    system_prompt = """
You are Emma, a friendly AI English conversation partner. Provide explicit corrections to help users improve their spoken English.

===EXPLICIT CORRECTION GUIDELINES===
1. **Error Identification**
   - Clearly highlight mistakes using this format:
   "Nice try! We say [CORRECT PHRASE] instead of [ORIGINAL PHRASE] because [BRIEF REASON]. [CONTINUE CONVERSATION]"

2. **Correction Focus**
   - Address 1-2 errors per response
   - Priority order:
     1. Errors causing confusion
     2. Verb tense/articles/prepositions
     3. Naturalization (contractions/reductions)

3. **Explanation Style**
   - Use simple, non-technical terms
   - Give concrete examples
   - Always include a reason

===CONVERSATION RULES===
1. **Error Response Template**:
   a. Acknowledge content
   b. Correct error explicitly
   c. Continue conversation naturally

   Example:
   User: "I eat breakfast already"
   Emma: "I understand! Just a note: We say 'I ate breakfast already' instead of 'I eat breakfast already' because it happened in the past. What did you have?"

2. **Error Types to Explicitly Correct**:
   - Verb tense errors
   - Missing articles (a/an/the)
   - Subject-verb agreement
   - Pronoun misuse
   - Preposition errors

3. **Do NOT Correct**:
   - Accent or pronunciation
   - Minor slips that don't affect meaning
   - Creative word choices

===TONE GUIDELINES===
- Always start with positive reinforcement
- Keep explanations under 10 words
- Maintain natural flow after correction

===EXAMPLE DIALOGUES===
1. **Verb Tense Error**
User: "Yesterday I go to park"
Emma: "Good effort! We say 'I went to the park' instead of 'I go to park' because it's past tense. What did you do there?"

2. **Article Error**
User: "She is doctor"
Emma: "Almost there! We say 'She is a doctor' with an 'a' before jobs. Where does she work?"

3. **Double Correction**
User: "Me want to going store"
Emma: "You're getting there! We say:
- 'I want' instead of 'Me want'
- 'to go to the store' instead of 'to going store' What do you need to buy?"
"""


    # Build conversation in new order: history + system prompt + current message
    conversation = []
    conversation.extend(user_history[-100:-1])
    conversation.append({"role": "system", "content": system_prompt})
    conversation.extend(user_history[-5:-1])
    conversation.append(user_history[-1])
    
    logger.info(f"Conversation structure: {[msg['role'] for msg in conversation]}")
    
    # Initialize the response in MongoDB (empty but with status)
    # Match fields with Mongoose Response model
    response_collection.update_one(
        {"_id": response_id},
        {"$set": {
            "user_id": user_id,
            "tokens": [],
            "complete": False,
            "error": None,
            "updated_at": datetime.now(),
            "created_at": datetime.now()
        }},
        upsert=True
    )
    # Modified prompt construction with Phi-3 tokens
    try:
        messages = ['===PAST CONVERSATION FOR CONTEXT===\n']
        for msg in conversation[:-1]:
            if msg["role"] == "system":
                messages.append(f"\n===PAST CONVERSATION FOR CONTEXT END===\n<|system|>\n{msg['content']}\n<|end|>\n===CURRENT CONVERSATION FOR CONTEXT===")
            elif msg["role"] == "user":
                messages.append(f"<|user|>\n{msg['content']}<|end|>")
            elif msg["role"] == "assistant":
                messages.append(f"<|assistant|>\n{msg['content']}<|end|>")
        messages.append(f"\n===CURRENT CONVERSATION FOR CONTEXT END===\n<|user|>\n{conversation[-1]['content']}<|end|>")
        messages.append("<|assistant|>")  # Start of model's response
        prompt_text = "\n".join(messages)
        print(prompt_text)
        
        encoded = tokenizer(prompt_text, return_tensors="pt")
        prompt = encoded['input_ids'].to("xpu")
        attention_mask = encoded['attention_mask'].to("xpu")
        
    except Exception as e:
        error_msg = f"Error in simplified prompt creation: {str(e)}"
        logger.error(error_msg)
        response_collection.update_one(
            {"_id": response_id},
            {"$set": {"error": error_msg, "complete": True, "updated_at": datetime.now()}}
        )
        return

    # Create stopping criteria to prevent generating User: tags
    stop_words = ["<|end|>", "<|user|>"]
    try:
        stop_token_ids = [tokenizer.encode(word, add_special_tokens=False) for word in stop_words]
        stopping_criteria = StoppingCriteriaList([StopOnTokens(stop_token_ids)])
    except Exception as e:
        logger.error(f"Error creating stopping criteria: {str(e)}")
        # Continue without stopping criteria if there's an error
        stopping_criteria = None
    
    # Set up the streamer
    streamer = TextIteratorStreamer(tokenizer, skip_special_tokens=True, skip_prompt=True)
    
    # Handle the model generation
    def model_generate():
        try:
          # In the model_generate() function:
            generation_kwargs = {
                "input_ids": prompt,
                "max_new_tokens": 300,
                "do_sample": True,
                "temperature": 0.7,
                "streamer": streamer,
                "use_cache": True,  # Keep this as True for better performance
                "pad_token_id": tokenizer.eos_token_id  # Add this
            }
            
            # Add attention mask if available
            if attention_mask is not None:
                generation_kwargs["attention_mask"] = attention_mask
                
            # Add stopping criteria if available
            if stopping_criteria is not None:
                generation_kwargs["stopping_criteria"] = stopping_criteria

            torch.xpu.synchronize()  # Add this line
            model.generate(**generation_kwargs)
        except Exception as e:
            # Log the error
            error_msg = f"Generation error: {str(e)}"
            logger.error(error_msg)
            # Update MongoDB with the error
            response_collection.update_one(
                {"_id": response_id},
                {"$set": {"error": error_msg, "complete": True, "updated_at": datetime.now()}}
            )
    
    # Generate in a separate thread
    thread = Thread(target=model_generate)
    thread.start()
    
    # Process streamer output and update MongoDB
    collected_chunks = []
    try:
        for new_text in streamer:
            # Skip any text that starts a new "User:" sequence
            if any(stop_word in new_text for stop_word in stop_words):
                logger.info(f"Stopping generation due to stop word in: {new_text}")
                break
            
            # Add token to the collected chunks
            collected_chunks.append(new_text)
            
            # Update MongoDB with new token - matches Response schema
            response_collection.update_one(
                {"_id": response_id},
                {
                    "$push": {"tokens": new_text},
                    "$set": {"updated_at": datetime.now()}
                }
            )
            time.sleep(0.01)  # Small delay to simulate typing
        
        # Join all chunks to create the full response
        full_response = "".join(collected_chunks)
        if '<|end|>' in full_response:
            full_response = full_response.split('<|end|>', 1)[0].strip()
        full_response = full_response.replace("<|assistant|>", "").strip()
        
        # Ensure the response doesn't contain "User:" or other unwanted markers
        if any(marker in full_response for marker in ["<|user|>", "<|assistant|>"]):
            # Clean up the response if needed
            logger.info(f"Cleaning response to remove markers")
            full_response = full_response.split("<|user|>", 1)[0].strip()
            if "<|assistant|>" in full_response:
                parts = full_response.split("<|assistant|>", 1)
                if len(parts) > 1:
                    full_response = parts[1].strip()
        
        # Add assistant response to history in MongoDB
        # Use consistent timestamp field name
        user_history.append({"role": "assistant", "content": full_response, "timestamp": datetime.now()})
        
        # Update chat history with new message and update timestamp
        chat_history_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "messages": user_history,
                    "updated_at": datetime.now()
                }
            }
        )
        
        # Mark response as complete in MongoDB - matches Response schema
        response_collection.update_one(
            {"_id": response_id},
            {"$set": {
                "complete": True, 
                "full_response": full_response, 
                "updated_at": datetime.now()
            }}
        )
        # Store the response ID in the prompt document - matches Prompt schema
        prompt_collection.update_one(
                    {"_id": prompt_id},
                    {"$set": {
                        "response_id": response_id,
                        "processed": True,
                        "processing": False,
                        "processed_at": datetime.now()
                    }}
                )
    except Exception as e:
        error_msg = f"Streaming error: {str(e)}"
        logger.error(error_msg)
        response_collection.update_one(
            {"_id": response_id},
            {"$set": {"error": error_msg, "complete": True, "updated_at": datetime.now()}}
        )

def poll_mongodb_for_prompts():
    """Poll MongoDB for new prompts and process them"""
    logger.info("Starting MongoDB polling for prompts...")
    
    # Keep track of processed prompt IDs
    processed_prompts = set()
    
    while True:
        try:
            # Find new prompts (unprocessed ones) - matches Prompt schema
            prompts = prompt_collection.find({"processed": False}).sort("created_at", 1)
            
            for prompt in prompts:
                prompt_id = prompt["_id"]
                
                # Skip if already processed
                if prompt_id in processed_prompts:
                    continue
                # Generate a response ID
                response_id = ObjectId()
                
                # Mark as being processed - matches Prompt schema
                prompt_collection.update_one(
                    {"_id": prompt_id},
                    {"$set": {
                        "response_id": response_id, 
                        "processing": True, 
                        "processed_at": datetime.now()
                    }}
                )
                
                # Process the prompt - uses fields from Prompt schema
                user_message = prompt.get("message", "")
                user_id = prompt.get("user_id", "default_user")
                
                logger.info(f"Processing new prompt from user {user_id}: {user_message[:50]}...")
                
                # Start processing in a new thread
                Thread(
                    target=process_mongodb_chat,
                    args=(user_message, user_id, response_id, prompt_id)
                ).start()
                
                # Add to processed set
                processed_prompts.add(prompt_id)
                
                # Prevent set from growing too large
                if len(processed_prompts) > 1000:
                    # Keep only the most recent 500
                    processed_prompts = set(list(processed_prompts)[-500:])
        
        except Exception as e:
            logger.error(f"Error in MongoDB polling: {str(e)}")
        
        # Wait before checking again
        time.sleep(1)

def handle_exit(signum, frame):
    """Handle exit signals gracefully"""
    logger.info("Shutting down server...")
    # Close MongoDB connection
    client.close()
    sys.exit(0)

if __name__ == '__main__':
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    
    # Log server start
    logger.info("Starting AI backend server with MongoDB communication")
    
    try:
        # Start MongoDB polling - this is now the main loop
        poll_mongodb_for_prompts()
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
