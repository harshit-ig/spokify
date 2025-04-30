import torch
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
MONGO_URL = os.getenv("MONGODB_URI") 
client = pymongo.MongoClient(MONGO_URL)
# Use the main database instead of 'chatapp'
db = client.spokify
# Match collections to Mongoose models
prompt_collection = db.prompts
response_collection = db.responses 
chat_history_collection = db.chathistories

# Load Qwen model and tokenizer
logger.info("Loading Qwen model and tokenizer...")
model_id = "Qwen/Qwen3-8B"

try:
    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        trust_remote_code=True
    )
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True
    )
    logger.info("Qwen-3-8B model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    sys.exit(1)

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
    """Process a chat message from MongoDB using Qwen3-8B"""
    
    # Get chat history
    history_doc = chat_history_collection.find_one({"user_id": user_id})
    user_history = history_doc.get("messages", []) if history_doc else []

    # Clean input message
    user_message = re.sub(r'(<\|user\|>|<\/?think>|<\/?im_end>|User:)', '', user_message).strip()
    user_history.append({"role": "user", "content": user_message, "timestamp": datetime.now()})
    print(user_message)
    print(user_history)
    # Prepare system prompt
    system_prompt = """You are Emma, a friendly AI English conversation partner. Provide explicit corrections to help users improve their spoken English.

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

    # Build conversation messages
    messages = [
        {"role": "system", "content": system_prompt},
        *[{"role": msg["role"], "content": msg["content"]} for msg in user_history[-4:]],
        {"role": "user", "content": user_message}
    ]

    # Apply Qwen chat template with thinking disabled
    try:
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=False  # Disable thinking mode
        )
        model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    except Exception as e:
        error_msg = f"Template error: {str(e)}"
        logger.error(error_msg)
        response_collection.update_one(
            {"_id": response_id},
            {"$set": {"error": error_msg, "complete": True}}
        )
        return

    # Set up stopping criteria
    stop_words = ["<|im_end|>", "<|user|>"]
    stop_token_ids = [tokenizer.encode(w, add_special_tokens=False) for w in stop_words]
    stopping_criteria = StoppingCriteriaList([StopOnTokens(stop_token_ids)])

    # Initialize response in MongoDB
    response_collection.update_one(
        {"_id": response_id},
        {"$set": {
            "user_id": user_id,
            "tokens": [],
            "complete": False,
            "error": None,
            "updated_at": datetime.now()
        }},
        upsert=True
    )

    # Set up streamer
    streamer = TextIteratorStreamer(tokenizer, skip_special_tokens=True, skip_prompt=True)

    # Generation thread
    def generate():
        try:
            generated_ids = model.generate(
                **model_inputs,
                max_new_tokens=512,
                temperature=0.7,
                do_sample=True,
                streamer=streamer,
                stopping_criteria=stopping_criteria
            )
        except Exception as e:
            logger.error(f"Generation error: {str(e)}")
            response_collection.update_one(
                {"_id": response_id},
                {"$set": {"error": str(e), "complete": True}}
            )

    Thread(target=generate).start()

    # Stream handling
    collected_chunks = []
    try:
        for new_text in streamer:
            if any(stop_word in new_text for stop_word in stop_words):
                break
            
            collected_chunks.append(new_text)
            response_collection.update_one(
                {"_id": response_id},
                {"$push": {"tokens": new_text}, "$set": {"updated_at": datetime.now()}}
            )
            time.sleep(0.01)

        full_response = "".join(collected_chunks).replace("<|im_end|>", "").strip()
        
        # Update chat history
        user_history.append({"role": "assistant", "content": full_response})
        chat_history_collection.update_one(
            {"user_id": user_id},
            {"$set": {"messages": user_history[-10:]}},  # Keep last 10 messages
            upsert=True
        )

        response_collection.update_one(
            {"_id": response_id},
            {"$set": {"complete": True, "full_response": full_response}}
        )
        prompt_collection.update_one(
            {"_id": prompt_id},
            {"$set": {"response_id": response_id, "processed": True}}
        )

    except Exception as e:
        logger.error(f"Stream error: {str(e)}")
        response_collection.update_one(
            {"_id": response_id},
            {"$set": {"error": str(e), "complete": True}}
        )
def poll_mongodb_for_prompts():
    """Poll MongoDB for new prompts and process them"""
    logger.info("Starting MongoDB polling for prompts...")
    
    # Keep track of processed prompt IDs
    processed_prompts = set()
    
    while True:
        try:
            # Find new prompts (unprocessed ones)
            prompts = prompt_collection.find({"processed": False}).sort("created_at", 1)
            
            for prompt in prompts:
                prompt_id = prompt["_id"]
                
                # Skip if already processed
                if prompt_id in processed_prompts:
                    continue
                # Generate a response ID
                response_id = str(uuid.uuid4())
                response_id = ObjectId()
                
                # Mark as being processed
                prompt_collection.update_one(
                    {"_id": prompt_id},
                    {"$set": {"response_id": response_id, "processing": True, "processed_at": datetime.now()}}
                )
                
                
                
                # Process the prompt
                user_message = prompt.get("message", "")
                user_id = prompt.get("user_id", "default_user")
                
                logger.info(f"Processing new prompt from user {user_id}: {user_message[:50]}...")
                
                # Start processing in a new thread
                Thread(
                    target=process_mongodb_chat,
                    args=(user_message, user_id, response_id , prompt_id)
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