import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import aiService from '../services/aiService';

// TypeScript definitions for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

// Declare global browser API interfaces
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AIChatProps {
  onConversationComplete?: (transcript: string, score: number) => void;
  promptText?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isActive?: boolean;
  className?: string;
}

const AIChat: React.FC<AIChatProps> = ({
  onConversationComplete,
  promptText = "Tell me about yourself.",
  difficulty = 'intermediate',
  isActive = true,
  className
}) => {
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callMode, setCallMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [detectedSpeech, setDetectedSpeech] = useState(''); // Store speech without updating input box
  const [visibleSpeech, setVisibleSpeech] = useState(''); // Keep track of what to show in the UI
  const [pendingRestart, setPendingRestart] = useState(false); // Track when to restart listening
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakingVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isSpeechProcessingRef = useRef<boolean>(false);
  
  // Reference to track if all tokens have been received
  const responseCompleteRef = useRef(false);
  const allTokensProcessedRef = useRef(false);
  const lastTokenCountRef = useRef(0);
  const tokenCountStableRef = useRef(0);
  const isCompleteResponseReceivedRef = useRef<boolean>(false);
  
  // Initialize a ref to track if we've logged restart message
  const loggedRestartRef = useRef<boolean>(false);
  
  // Add tracking for recognition state
  const recognitionRunningRef = useRef(false);
  
  // Add reference to track last restart time
  const lastRestartTimeRef = useRef<number>(0);
  
  // Add a ref to track if there's been user interaction
  const hasUserInteractedRef = useRef<boolean>(false);
  
  // Add ref to track if we've shown the call mode toast
  const callModeToastShownRef = useRef<boolean>(false);
  
  // Monitor speech status and restart listening when appropriate
  useEffect(() => {
    // If we're in call mode, not currently speaking, not listening, and pending restart
    if (callMode && !isSpeaking && !isListening && pendingRestart) {
      console.log('Auto-restarting speech recognition after AI finished speaking');
      setPendingRestart(false);
      
      // Short delay before restarting listening
      setTimeout(() => {
        setIsListening(true);
      }, 200);
    }
  }, [callMode, isSpeaking, isListening, pendingRestart]);
  
  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;
    
    // Initialize speech recognition if supported
    if (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      
      // Move these assignments inside the conditional check
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        // Set up speech recognition handlers
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          
          // Update interim transcript for UI display
          if (interim) {
            setInterimTranscript(interim);
            
            // Show combined speech in UI - detectedSpeech plus interim
            setVisibleSpeech(detectedSpeech + ' ' + interim);
            
            // Reset silence timer when user is speaking
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
          
          if (final) {
            // In call mode, accumulate detected speech without updating input value
            const updatedSpeech = detectedSpeech + ' ' + final;
            setDetectedSpeech(updatedSpeech);
            
            // Also update the visible speech immediately
            setVisibleSpeech(updatedSpeech + ' ' + interim);
            setInterimTranscript('');
          }
        };
        
        recognitionRef.current.onend = () => {
          console.log('Recognition ended event fired');
          // Mark as not running
          recognitionRunningRef.current = false;
          
          // Log current state to help debug
          console.log('When recognition ended - callMode:', callMode, 'isListening:', isListening);
          
          // Only restart if we're still supposed to be listening
          if (isListening && callMode) {
            // In call mode, restart recognition after a short delay
            console.log('Will attempt to restart recognition after delay');
            setTimeout(() => {
              if (isListening && callMode) {
                console.log('Attempting to restart recognition after end event');
                const started = safeStartRecognition();
                if (started) {
                  console.log('Successfully restarted recognition after end event');
                }
              }
            }, 300);
          } else {
            // Check if we should be listening based on state
            if (callMode && responseCompleteRef.current && !isProcessing) {
              console.log('Recognition ended but we should be in call mode - restarting');
              setTimeout(() => {
                setIsListening(true);
              }, 500);
            } else {
              console.log('Not restarting recognition (not in listening/call mode)');
              setIsListening(false);
            }
          }
        };
        
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          
          // Mark as not running on error
          recognitionRunningRef.current = false;
          
          // Not all errors should stop listening
          const fatalErrors = ['not-allowed', 'service-not-allowed', 'bad-grammar', 'language-not-supported'];
          
          if (fatalErrors.includes(event.error)) {
            // Fatal errors - stop everything
            console.log('Fatal recognition error, stopping call mode');
            if (event.error === 'not-allowed') {
              toast.error('Microphone access denied. Please check your browser permissions.');
            } else {
              toast.error(`Speech recognition error: ${event.error}`);
            }
            setIsListening(false);
            setCallMode(false);
          } else if (event.error === 'aborted' || event.error === 'no-speech') {
            // Non-fatal errors - attempt restart if needed
            console.log('Non-fatal recognition error, will attempt restart if needed');
            
            // Show a subtle indicator for no-speech errors
            if (event.error === 'no-speech' && callMode) {
              // Don't show toast for every no-speech error as they're common
              // Only log to console to reduce noise
              console.log('No speech detected, continuing to listen...');
            }
            
            if (isListening && callMode) {
              console.log('Attempting to restart after non-fatal error');
              setTimeout(() => {
                if (isListening && callMode) {
                  const started = safeStartRecognition();
                  if (started) {
                    console.log('Successfully restarted recognition after error');
                  }
                }
              }, 500);
            } else {
              setIsListening(false);
            }
          } else {
            // Other errors - log and continue
            console.warn('Unknown recognition error, setting isListening to false');
            setIsListening(false);
          }
        };
      }
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [detectedSpeech, isListening, callMode]);
  
  // Set up silence timer when speech is detected
  useEffect(() => {
    if (callMode && isListening && detectedSpeech.trim()) {
      // If we have some speech and we're in call mode, set up silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      console.log('Setting up silence timer with speech: "' + detectedSpeech.trim() + '"');
      
      silenceTimerRef.current = setTimeout(() => {
        console.log('5 seconds of silence detected, sending message');
        console.log('Detected speech to send: "' + detectedSpeech.trim() + '"');
        
        // Only send if we have actual content
        if (detectedSpeech.trim()) {
          // Store speech before sending as it might get cleared
          const speechToSend = detectedSpeech.trim();
          sendMessageFromVoice(speechToSend);
        } else {
          console.log('No speech detected to send');
        }
      }, 2000);
    }
    
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [detectedSpeech, callMode, isListening]);
  
  // Handle speech recognition state changes
  useEffect(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      if (!recognitionRunningRef.current) {
        console.log('isListening changed to true, starting recognition');
        safeStartRecognition();
      } else {
        console.log('Recognition already running, no need to start again');
      }
    } else {
      if (recognitionRunningRef.current) {
        console.log('isListening changed to false, stopping recognition');
        safeStopRecognition();
        
        // Clear any pending silence timers when we stop listening
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else {
        console.log('Recognition already stopped, no need to stop again');
      }
    }
  }, [isListening, callMode]);
  
  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, visibleSpeech]);
  
  // Add initial prompt message
  useEffect(() => {
    if (promptText && messages.length === 0) {
      const initialMessage = { text: promptText, isUser: false };
      setMessages([initialMessage]);
      
      // Optionally speak the initial prompt
      if (synthRef.current) {
        speakText(promptText);
      }
    }
  }, [promptText]);

  // Emergency recovery system
  useEffect(() => {
    let emergencyTimer: number | null = null;
    // Track when we last tried emergency recovery
    let lastEmergencyAttempt = 0;
    
    // Function to check and restore call mode state
    const emergencyRestore = () => {
      const now = Date.now();
      
      // Only attempt recovery every 5 seconds at most
      if (now - lastEmergencyAttempt < 5000) {
        return;
      }
      
      lastEmergencyAttempt = now;
      
      // Only restore call mode if we know it was previously active
      // and got erroneously disabled during an ongoing conversation
      if (!callMode && pendingRestart && responseCompleteRef.current && !isProcessing) {
        console.log('EMERGENCY: Call mode was turned off during active conversation - restoring');
        setCallMode(true);
        return; // Wait for callMode effect to trigger
      }
      
      if (callMode && !isListening && !isProcessing && !isSpeaking && responseCompleteRef.current) {
        console.log('EMERGENCY: Call active but not listening after completion - forcing restart');
        
        // Force restart listening
        setIsListening(true);
        
        // Update the last restart time to prevent duplicate restarts
        lastRestartTimeRef.current = now;
        
        // Directly attempt to start recognition as well
        setTimeout(() => {
          if (!recognitionRunningRef.current) {
            console.log('EMERGENCY: Directly starting recognition');
            safeStartRecognition();
          }
        }, 300);
      }
    };
    
    // Monitor call state every 5 seconds (increased from 2 seconds)
    const checkCallStatus = () => {
      if (responseCompleteRef.current && !isProcessing) {
        // Reduce logging frequency by only logging every 10 seconds
        const now = Date.now();
        if (now - lastEmergencyAttempt >= 10000) {
          console.log('Call status check - callMode:', callMode, 'isListening:', isListening, 
                    'isProcessing:', isProcessing, 'isSpeaking:', isSpeaking);
        }
        
        emergencyRestore();
      }
    };
    
    // Set up emergency timer with less frequent checks
    emergencyTimer = window.setInterval(checkCallStatus, 5000);
    
    return () => {
      if (emergencyTimer) window.clearInterval(emergencyTimer);
    };
  }, [callMode, isListening, isProcessing, isSpeaking, responseCompleteRef.current, pendingRestart]);

  // Special version of sendMessage for voice mode that resets state properly
  const sendMessageFromVoice = async (message: string) => {
    console.log('Processing voice message: "' + message + '"');
    
    // Only proceed if we have actual content
    if (!message || !message.trim()) {
      console.log('Empty message, not processing');
      return;
    }
    
    // Clear the interim display and detected speech
    setInterimTranscript('');
    setDetectedSpeech('');
    setVisibleSpeech('');
    
    // Temporarily pause listening while AI responds
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        safeStopRecognition();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    // Clear any pending silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    // Make sure callMode stays active throughout
    const currentCallMode = callMode;
    
    // Store message in the UI immediately
    addMessage(message, true);
    
    // Process the message
    try {
      // Show loading indicator
      const loadingIndicator = showLoading();
      
      // Create prompt using the aiService
      const response = await aiService.createPrompt(message);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create prompt');
      }
      
      console.log(`Prompt created with ID: ${response.promptId}`);
      
      // Remove loading indicator
      if (loadingIndicator) loadingIndicator.remove();
      
      // Use Server-Sent Events to stream response
      await streamResponseFromBackend(response.promptId);
      
      // Calculate score (70-95 range)
      const score = Math.floor(Math.random() * 25) + 70;
      
      // Call the completion handler if provided
      if (onConversationComplete) {
        onConversationComplete(message, score);
      }
      
    } catch (error) {
      console.error('Error:', error);
      addMessage('Error: Could not connect to AI service. Please try again later.', false);
    } finally {
      setIsProcessing(false);
      
      // Resume listening in call mode after processing is complete
      if (callMode) {
        setTimeout(() => {
          if (!isSpeaking) {
            setIsListening(true);
          }
        }, 500);
      }
      
      // Ensure call mode stays the same as before
      if (currentCallMode && !callMode) {
        console.log('Call mode was turned off during processing, restoring it');
        setCallMode(true);
      }
    }
  };
  
  // Extract core message processing logic to be used by both send methods
  const processMessage = async (message: string) => {
    if (isProcessing || !message.trim()) return;
    
    setIsProcessing(true);
    
    // Add user message
    addMessage(message, true);
    
    try {
      // Show loading indicator
      const loadingIndicator = showLoading();
      
      // Create prompt using the aiService
      const response = await aiService.createPrompt(message);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create prompt');
      }
      
      console.log(`Prompt created with ID: ${response.promptId}`);
      
      // Remove loading indicator
      if (loadingIndicator) loadingIndicator.remove();
      
      // Use Server-Sent Events to stream response
      await streamResponseFromBackend(response.promptId);
      
      // Calculate score (70-95 range)
      const score = Math.floor(Math.random() * 25) + 70;
      
      // Call the completion handler if provided
      if (onConversationComplete) {
        onConversationComplete(message, score);
      }
      
    } catch (error) {
      console.error('Error:', error);
      addMessage('Error: Could not connect to AI service. Please try again later.', false);
    } finally {
      setIsProcessing(false);
      
      // Clear input if not in call mode
      if (!callMode) {
        setInputValue('');
      }
      
      // Resume listening in call mode after processing is complete
      if (callMode) {
        setTimeout(() => {
          if (!isSpeaking) {
            setIsListening(true);
          }
        }, 500);
      }
    }
  };

  const addMessage = (message: string, isUser: boolean) => {
    const newMessage = { text: message, isUser };
    setMessages(prev => [...prev, newMessage]);
    
    // If it's an AI message, speak it (handled in streamResponseFromBackend now)
    // We don't speak here anymore, as we want to speak tokens as they arrive
  };

  const showLoading = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant-message loading';
    loadingDiv.innerHTML = `<div class="dot-flashing"></div>`;
    messagesContainerRef.current?.appendChild(loadingDiv);
    messagesContainerRef.current?.scrollTo(0, messagesContainerRef.current.scrollHeight);
    return loadingDiv;
  };

  const sendMessage = async () => {
    if (isProcessing) return;
    
    const message = inputValue.trim();
    if (!message) return;
    
    // Clear input
    setInputValue('');
    
    await processMessage(message);
  };
  
  // Toggle call mode (continuous conversation)
  const toggleCallMode = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }
    
    const newCallModeState = !callMode;
    setCallMode(newCallModeState);
    
    // Always enable listening when entering call mode
    if (newCallModeState) {
      setIsListening(true);
      setDetectedSpeech(''); // Clear any previously detected speech
      setVisibleSpeech(''); // Clear visible speech
      // Reset toast shown flag when entering call mode
      callModeToastShownRef.current = false;
    } else {
      setIsListening(false);
      
      // When exiting call mode, stop any ongoing speech
      if (synthRef.current) {
        console.log('Stopping all speech when exiting call mode');
        synthRef.current.cancel();
        // Clear the speech queue
        speechQueueRef.current = [];
        setIsSpeaking(false);
      }
      
      // When exiting call mode, reset some states
      setPendingRestart(false);
      responseCompleteRef.current = false;
      isCompleteResponseReceivedRef.current = false;
    }
    
    // Reset input when toggling
    setInputValue('');
    setInterimTranscript('');
    
    toast.info(newCallModeState ? 
      'Call mode enabled.' : 
      'Call mode disabled.'
    );
  };

  // Track user interaction to enable speech synthesis
  useEffect(() => {
    const handleUserInteraction = () => {
      hasUserInteractedRef.current = true;
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    // Add listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      // Clean up
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Speak the provided text using speech synthesis
  const speakText = (text: string) => {
    if (!text.trim()) return;
    
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported by your browser');
      return;
    }
    
    // Skip auto-speaking on page load until user has interacted
    if (!hasUserInteractedRef.current && promptText && text === promptText) {
      console.log('Skipping initial speech until user interaction');
      return;
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = parseFloat(localStorage.getItem('speechRate') || '1');
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Set voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = localStorage.getItem('preferredVoice');
    
    if (voices.length > 0) {
      if (preferredVoice) {
        const savedVoice = voices.find(voice => voice.name === preferredVoice);
        if (savedVoice) utterance.voice = savedVoice;
      } else {
        // Default to first English voice
        const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
        if (englishVoice) utterance.voice = englishVoice;
      }
    }
    
    // Add to queue
    speechQueueRef.current.push(utterance);
    
    // Start speaking if not already
    if (!synthRef.current?.speaking) {
      startSpeaking();
    }
    
    // Explicitly set speaking state to true whenever we add to the queue
    setIsSpeaking(true);
    
    // Handle when speech is done
    utterance.onend = (event) => {
      currentUtteranceRef.current = null;
      isSpeechProcessingRef.current = false;
      
      // Remove spoken item from queue
      speechQueueRef.current.shift();
      
      // Check if more to speak
      if (speechQueueRef.current.length > 0) {
        startSpeaking();
      } else {
        // Only log once when the queue is fully complete
        console.log('Speech synthesis ended successfully.');
        setIsSpeaking(false);
        
        // Restart recognition after AI finishes speaking if needed
        if (callMode && responseCompleteRef.current) {
          if (!loggedRestartRef.current) {
            console.log('Auto-restarting speech recognition after AI finished speaking');
            loggedRestartRef.current = true;
          }
          setPendingRestart(true);
        }
      }
    };
    
    // Handle errors
    utterance.onerror = (event) => {
      // Don't treat 'interrupted' as an error if we're closing things down
      if (event.error === 'interrupted' && isCompleteResponseReceivedRef.current) {
        console.log('Speech synthesis interrupted during completion, not treating as error');
        // Still remove from queue and continue processing
        currentUtteranceRef.current = null;
        isSpeechProcessingRef.current = false;
        
        // Remove errored item from queue
        speechQueueRef.current.shift();
        
        // Try to continue with next item
        if (speechQueueRef.current.length > 0) {
          startSpeaking();
        } else {
          setIsSpeaking(false);
        }
        return;
      }
      
      // Handle not-allowed error more gracefully
      if (event.error === 'not-allowed') {
        console.warn('Speech synthesis not allowed. You may need to interact with the page first.');
        hasUserInteractedRef.current = false; // Reset to try again after interaction
      } else {
        console.error('Speech synthesis error:', event);
      }
      
      currentUtteranceRef.current = null;
      isSpeechProcessingRef.current = false;
      
      // Remove errored item from queue
      speechQueueRef.current.shift();
      
      // Try to continue with next item
      if (speechQueueRef.current.length > 0) {
        startSpeaking();
      } else {
        setIsSpeaking(false);
      }
    };
  };
  
  // Start speech synthesis process for the current queue
  const startSpeaking = () => {
    // If synthesis not available, or nothing to speak, or already processing
    if (!synthRef.current || speechQueueRef.current.length === 0 || isSpeechProcessingRef.current) {
      if (speechQueueRef.current.length === 0) {
        console.log('Speech queue empty. Speech synthesis ended successfully.');
        setIsSpeaking(false);
      }
      return;
    }
    
    isSpeechProcessingRef.current = true;
    // Explicitly set speaking state to true when synthesis starts
    setIsSpeaking(true);
    
    // Get the next text to speak
    const utterance = speechQueueRef.current[0];
    currentUtteranceRef.current = utterance;
    
    // Handle when speech is done
    utterance.onend = (event) => {
      currentUtteranceRef.current = null;
      isSpeechProcessingRef.current = false;
      
      // Remove spoken item from queue
      speechQueueRef.current.shift();
      
      // Check if more to speak
      if (speechQueueRef.current.length > 0) {
        startSpeaking();
      } else {
        console.log('Speech queue empty. Speech synthesis ended successfully.');
        setIsSpeaking(false);
        
        // Restart recognition after AI finishes speaking if needed
        if (callMode && responseCompleteRef.current) {
          if (!loggedRestartRef.current) {
            console.log('Auto-restarting speech recognition after AI finished speaking');
            loggedRestartRef.current = true;
          }
          setPendingRestart(true);
        }
      }
    };
    
    // Handle errors
    utterance.onerror = (event) => {
      // Don't treat 'interrupted' as an error if we're closing things down
      if (event.error === 'interrupted' && isCompleteResponseReceivedRef.current) {
        console.log('Speech synthesis interrupted during completion, not treating as error');
        // Still remove from queue and continue processing
        currentUtteranceRef.current = null;
        isSpeechProcessingRef.current = false;
        
        // Remove errored item from queue
        speechQueueRef.current.shift();
        
        // Try to continue with next item
        if (speechQueueRef.current.length > 0) {
          startSpeaking();
        } else {
          setIsSpeaking(false);
        }
        return;
      }
      
      console.error('Speech synthesis error:', event);
      currentUtteranceRef.current = null;
      isSpeechProcessingRef.current = false;
      
      // Remove errored item from queue
      speechQueueRef.current.shift();
      
      // Try to continue with next item
      if (speechQueueRef.current.length > 0) {
        startSpeaking();
      } else {
        setIsSpeaking(false);
      }
    };
    
    // Start speaking
    try {
      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      isSpeechProcessingRef.current = false;
    }
  };

  // Attempt to stream a response from the backend using SSE
  const streamResponseFromBackend = async (promptId: string) => {
    return new Promise<void>((resolve, reject) => {
      // Add abort controller for safety
      const controller = new AbortController();
      let eventSource: EventSource | null = null;
      
      try {
        // Build the URL with the difficulty parameter and auth token
        const token = aiService.getAuthToken();
        const streamUrl = `/api/ai/stream/${promptId}?difficulty=${difficulty}&token=${encodeURIComponent(token)}`;
        console.log(`Connecting to stream: ${streamUrl}`);
        
        // Create the EventSource
        eventSource = new EventSource(streamUrl);
        let assistantResponse = '';
        let lastSpokenIndex = 0;
        let addedInitialResponse = false;
        let expectedTotalTokens = 0;
        let receivedTokenCount = 0;
        let speechBuffer = '';
        let lastSpeechTime = Date.now();
        let allSpeechComplete = false;
        let tokenCountLastReported = 0;
        
        // Reset completion tracking
        responseCompleteRef.current = false;
        allTokensProcessedRef.current = false;
        isCompleteResponseReceivedRef.current = false;
        
        // Clear any existing speech queue
        speechQueueRef.current = [];
        
        // Function to process text for speech (split into sentences)
        const processTextForSpeech = (text: string, force = false) => {
          if (!callMode) return; // Prevent speech in text mode
          if (!text.trim()) return;
          
          // Add the text to our buffer
          speechBuffer += text;
          
          // Update tracked position
          lastSpokenIndex += text.length;
          
          // If the speech synthesis is paused (sometimes happens on some browsers),
          // resume it
          if (synthRef.current?.paused) {
            try {
              synthRef.current.resume();
            } catch (e) {
              console.error('Error resuming speech:', e);
            }
          }
          
          // Only speak if we have a complete sentence, enough text, or forcing
          const sentences = speechBuffer.match(/[^.!?;]+[.!?;]+/g);
          
          if (sentences && sentences.length > 0 || force || speechBuffer.length > 100) {
            // If we have complete sentences, speak them
            if (sentences && sentences.length > 0) {
              // Join all complete sentences
              const completeText = sentences.join(' ');
              
              // Update buffer to keep any remaining text
              speechBuffer = speechBuffer.substring(completeText.length);
              
              // Speak the complete sentences
              speakText(completeText);
            } else if (force || speechBuffer.length > 100) {
              // If forcing or buffer is getting long, speak what we have
              speakText(speechBuffer);
              speechBuffer = '';
            }
            
            lastSpeechTime = Date.now();
          }
        };
        
        // Function to ensure listening restarts after completion
        const ensureListening = () => {
          console.log('Ensuring listening restarts - callMode:', callMode);
          
          if (callMode) {
            // Force set listening to true after a short delay
            setTimeout(() => {
              if (callMode) {
                console.log('Forcing listening restart after completion');
                // Make sure we're truly restarting recognition
                setIsListening(true);
                
                // Double check after a short delay that recognition actually started
                setTimeout(() => {
                  if (!recognitionRunningRef.current && callMode) {
                    console.log('Recognition still not running, trying one more time');
                    safeStartRecognition();
                  }
                }, 1000);
              }
            }, 500);
          }
        };
        
        // Safe close function to prevent null reference errors
        const safeCloseEventSource = () => {
          if (eventSource) {
            try {
              eventSource.close();
            } catch (err) {
              console.error('Error closing event source:', err);
            }
          }
        };
        
        // A function to check if we can resolve the promise
        const checkForCompletion = () => {
          // Only resolve when we've received the complete response AND all speech is done
          if (isCompleteResponseReceivedRef.current && !isSpeaking && speechQueueRef.current.length === 0) {
            if (!allSpeechComplete) {
              allSpeechComplete = true;
              responseCompleteRef.current = true;
              console.log('All speech completed, resolving stream promise');
              clearInterval(speechCheckInterval);
              safeCloseEventSource();
              
              // Set pending restart to trigger listening restart only if still in call mode
              if (callMode) {
                console.log('Setting pending restart to trigger listening mode');
                setPendingRestart(true);
                
                // Also ensure listening with our backup method
                ensureListening();
              }
              
              resolve();
            }
          }
        };
        
        // Set up a timer to check for accumulated text to speak and completion
        const speechCheckInterval = setInterval(() => {
          // Check if we can resolve the promise
          checkForCompletion();
          
          // If it's been more than 800ms since we last spoke and we have buffer
          if (Date.now() - lastSpeechTime > 800 && speechBuffer.trim()) {
            processTextForSpeech('', true); // Force speak the buffer
          }
        }, 300);
        
        if (eventSource) {
          eventSource.onopen = (event) => {
            console.log('EventSource connection opened');
          };
          
          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              // Check for error messages
              if (data.error) {
                console.error('Error from SSE:', data.tokens.join(''));
                addMessage(data.tokens.join(''), false);
                safeCloseEventSource();
                clearInterval(speechCheckInterval);
                resolve();
                return;
              }
              
              // Keep track of expected total tokens
              if (data.totalTokens > expectedTotalTokens) {
                expectedTotalTokens = data.totalTokens;
              }
              
              // Handle explicit completion message
              if (data.complete === true) {
                console.log('Received explicit completion message');
                isCompleteResponseReceivedRef.current = true;
                
                // Force speak any remaining text in buffer
                if (speechBuffer.trim()) {
                  processTextForSpeech('', true);
                }
                
                // Force restart listening once speech queue is processed
                if (callMode) {
                  const checkAndRestartListening = () => {
                    if (speechQueueRef.current.length === 0 && !synthRef.current?.speaking) {
                      console.log('RESTART: Complete message triggered restart');
                      
                      // Only set listening if not already running and still in call mode
                      if (!recognitionRunningRef.current && callMode) {
                        setIsListening(true);
                      }
                      
                      // Call the ensureListening function to make doubly sure
                      ensureListening();
                    } else {
                      // Check again in 300ms
                      setTimeout(checkAndRestartListening, 300);
                    }
                  };
                  
                  // Start checking after 1 second
                  setTimeout(checkAndRestartListening, 1000);
                }
                
                // Try to check for completion immediately
                checkForCompletion();
                return;
              }
              
              if (!addedInitialResponse && data.tokens.length > 0) {
                // Initialize with empty message on first token
                setMessages(prev => {
                  // Check if last message is from assistant
                  if (prev.length > 0 && !prev[prev.length - 1].isUser) {
                    return prev; // Already have an AI response message
                  }
                  return [...prev, { text: '', isUser: false }];
                });
                addedInitialResponse = true;
              }
              
              // Add tokens to the assistant response
              if (data.tokens.length > 0) {
                // Append new tokens to response
                const newTokens = data.tokens.join('');
                assistantResponse += newTokens;
                receivedTokenCount += data.tokens.length;
                
                // Update the last message with the new content
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages.length > 0 && !newMessages[newMessages.length - 1].isUser) {
                    newMessages[newMessages.length - 1].text = assistantResponse;
                  } else if (addedInitialResponse) {
                    newMessages.push({ text: assistantResponse, isUser: false });
                  }
                  return newMessages;
                });
                
                // Process new tokens for speech
                processTextForSpeech(newTokens);
                
                // Only log token count every 50 tokens to reduce noise
                if (receivedTokenCount - tokenCountLastReported >= 50 || (!data.partial && receivedTokenCount >= expectedTotalTokens)) {
                  console.log(`Received ${receivedTokenCount}/${expectedTotalTokens} tokens`);
                  tokenCountLastReported = receivedTokenCount;
                  
                  // Update the token count reference
                  tokenCountStableRef.current = receivedTokenCount;
                }
              }
              
              // Check for completion based on token count
              if (!data.partial && receivedTokenCount >= expectedTotalTokens && expectedTotalTokens > 0) {
                console.log('Stream complete and all tokens received');
                isCompleteResponseReceivedRef.current = true;
                
                // Force speak any remaining text in buffer
                if (speechBuffer.trim()) {
                  processTextForSpeech('', true);
                }
                
                // Try to check for completion immediately
                checkForCompletion();
              }
            } catch (error) {
              console.error('Error processing SSE message:', error);
              safeCloseEventSource();
              clearInterval(speechCheckInterval);
              reject(error);
            }
          };
          
          eventSource.onerror = (error) => {
            // Check if we've already received a completion message
            // If so, this is likely just the server closing the connection normally
            if (isCompleteResponseReceivedRef.current) {
              console.log('Stream closed after completion');
              safeCloseEventSource();
              clearInterval(speechCheckInterval);
              // Don't reject - we've already received everything we need
              return;
            }
            
            // Otherwise, this is an actual error
            console.error('EventSource error:', error);
            safeCloseEventSource();
            clearInterval(speechCheckInterval);
            addMessage('Error connecting to AI service. Please try again.', false);
            reject(error);
          };
        }
        
        // Timeout failsafe in case stream doesn't end properly
        setTimeout(() => {
          if (eventSource && eventSource.readyState !== 2) { // 2 is CLOSED
            console.warn('Stream timeout reached after 5 minutes, closing connection gracefully');
            
            // Force speak any remaining text in buffer
            if (speechBuffer.trim()) {
              processTextForSpeech('', true);
            }
            
            // If we have a partial response, keep it but mark it as complete
            if (assistantResponse) {
              isCompleteResponseReceivedRef.current = true;
              
              // Don't close immediately, wait for speech to complete
              // Set up a final timeout to ensure we eventually resolve
              setTimeout(() => {
                if (!allSpeechComplete) {
                  console.warn('Forcing completion after timeout');
                  allSpeechComplete = true;
                  responseCompleteRef.current = true;
                  clearInterval(speechCheckInterval);
                  safeCloseEventSource();
                  resolve();
                }
              }, 10000); // Give 10 more seconds for speech to finish
              
              checkForCompletion();
            } else {
              // No response received at all
              addMessage('Response timed out. Please try again.', false);
              safeCloseEventSource();
              clearInterval(speechCheckInterval);
              resolve();
            }
          }
        }, 300000); // Extended timeout to 5 minutes to prevent premature timeouts
        
      } catch (error) {
        if (eventSource) {
          try {
            eventSource.close();
          } catch (err) {
            console.error('Error closing event source on catch block:', err);
          }
        }
        reject(error);
      }
      
      // Return cleanup function
      return () => {
        controller.abort();
        if (eventSource) {
          try {
            eventSource.close();
          } catch (err) {
            console.error('Error closing event source in cleanup:', err);
          }
        }
      };
    });
  };

  // Monitor isSpeaking changes to check for speech completion
  useEffect(() => {
    // When speech stops, check if we need to restart listening
    if (!isSpeaking && pendingRestart) {
      console.log('Speech has finished, preparing to restart listening');
      
      // Give a very short delay for any potential utterances to clear
      setTimeout(() => {
        // Double-check that speaking is still off and there's no queued speech
        if (!synthRef.current?.speaking && speechQueueRef.current.length === 0) {
          setPendingRestart(false);
          setIsListening(true);
        }
      }, 300);
    }
  }, [isSpeaking, pendingRestart]);

  // When isSpeaking changes, track if we should resume listening
  useEffect(() => {
    // Only handle this in call mode
    if (!callMode) return;
    
    // If stopped speaking and we need to restart, reset the listening state
    if (!isSpeaking && pendingRestart) {
      // Double check that speech queue is truly empty
      if (speechQueueRef.current.length === 0 && !synthRef.current?.speaking) {
        // Only log once to reduce noise
        if (!loggedRestartRef.current) {
          console.log('Auto-restarting speech recognition after AI finished speaking');
          loggedRestartRef.current = true;
        }
        
        setPendingRestart(false);
        
        // Make sure we're not already listening or processing
        if (!isListening && !isProcessing) {
          console.log('Starting listening mode now');
          setTimeout(() => {
            // CRITICAL: Force callMode to stay true
            if (!callMode) {
              console.log('*** Restoring call mode that was incorrectly turned off');
              setCallMode(true);
            }
            
            setIsListening(true);
            loggedRestartRef.current = false; // Reset for next time
          }, 500);
        }
      }
    }
  }, [isSpeaking, pendingRestart, isListening, isProcessing, callMode]);

  // Monitor speech synthesis and speech queue - but with rate limiting
  const speechMonitorInterval = setInterval(() => {
    const now = Date.now();
    // Only check every 2 seconds at most
    if (now - lastRestartTimeRef.current < 2000) {
      return;
    }
    
    if (isCompleteResponseReceivedRef.current && 
        !synthRef.current?.speaking && 
        speechQueueRef.current.length === 0 &&
        callMode && 
        !isListening && 
        !isProcessing) {
      console.log('RESTART: Speech monitor detected completion, restarting listening');
      clearInterval(speechMonitorInterval);
      setIsListening(true);
      // Update last restart time
      lastRestartTimeRef.current = now;
    }
  }, 2000); // Reduced check frequency from 500ms to 2000ms
  
  // Cleanup the interval when component unmounts
  useEffect(() => {
    return () => {
      if (speechMonitorInterval) {
        clearInterval(speechMonitorInterval);
      }
    };
  }, []);

  // Ensure listening restarts after speech finishes
  useEffect(() => {
    // Only apply in call mode
    if (!callMode) return;
    
    // If the response is complete and we're not speaking
    if (responseCompleteRef.current && !isSpeaking && !isListening && !isProcessing) {
      console.log('RESTART: Response complete and not speaking, restarting listening');
      // Delay slightly to ensure speech synthesis is fully done
      setTimeout(() => {
        if (!synthRef.current?.speaking && speechQueueRef.current.length === 0) {
          setIsListening(true);
        }
      }, 1000);
    }
  }, [responseCompleteRef.current, isSpeaking, isListening, isProcessing, callMode]);

  // Add explicit monitoring of speech synthesis state
  useEffect(() => {
    const checkSpeechStatus = () => {
      const isSpeakingNow = synthRef.current?.speaking || false;
      if (isSpeakingNow !== isSpeaking) {
        console.log(`Speech status changed to: ${isSpeakingNow ? 'speaking' : 'not speaking'}`);
        setIsSpeaking(isSpeakingNow);
      }
    };
    
    // Check every 250ms
    const speechStatusInterval = setInterval(checkSpeechStatus, 250);
    
    return () => {
      clearInterval(speechStatusInterval);
    };
  }, [isSpeaking]);
  
  // Add explicit monitoring of speech recognition state
  useEffect(() => {
    if (!recognitionRef.current) return;
    
    const checkRecognitionStatus = () => {
      // Check if the effect of start/stop operations has been applied
      if (callMode && !isProcessing && responseCompleteRef.current) {
        if (!isListening && !recognitionRunningRef.current) {
          console.log('Force enabling listening mode (from monitor)');
          setIsListening(true);
        } else if (isListening && !recognitionRunningRef.current) {
          console.log('isListening true but recognition not running, fixing');
          const started = safeStartRecognition();
          if (!started) {
            console.log('Failed to force start recognition, setting isListening false');
            setIsListening(false);
          }
        }
      }
    };
    
    // Check every 1 second
    const recognitionStatusInterval = setInterval(checkRecognitionStatus, 1000);
    
    return () => {
      clearInterval(recognitionStatusInterval);
    };
  }, [isListening, callMode, isProcessing, responseCompleteRef.current]);

  // Safe function to start recognition
  const safeStartRecognition = () => {
    if (!recognitionRef.current) return false;
    
    // Don't start if already running
    if (recognitionRunningRef.current) {
      console.log('Recognition already running, not starting again');
      return false;
    }
    
    try {
      recognitionRef.current.start();
      recognitionRunningRef.current = true;
      console.log('Speech recognition started successfully');
      return true;
    } catch (e) {
      console.error('Error starting speech recognition:', e);
      recognitionRunningRef.current = false;
      return false;
    }
  };
  
  // Safe function to stop recognition
  const safeStopRecognition = () => {
    if (!recognitionRef.current) return;
    
    // Only stop if actually running
    if (!recognitionRunningRef.current) {
      console.log('Recognition not running, nothing to stop');
      return;
    }
    
    try {
      recognitionRef.current.stop();
      recognitionRunningRef.current = false;
      console.log('Speech recognition stopped successfully');
    } catch (e) {
      console.error('Error stopping speech recognition:', e);
      // Force reset the state
      recognitionRunningRef.current = false;
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add a status message specifically for call mode
  const getCallStatusMessage = () => {
    if (isListening) {
      return "Listening...";
    } else if (isSpeaking) {
      return "Speaking...";
    } else if (pendingRestart) {
      return "Preparing to listen...";
    } else if (isProcessing) {
      return "Processing...";
    } else {
      return "Call Active";
    }
  };

  // Effect for emergency recovery of call mode state
  useEffect(() => {
    // Create an interval to monitor the call mode state
    const callModeCheckInterval = setInterval(() => {
      // Don't check too frequently
      if (Date.now() - lastRestartTimeRef.current < 5000) {
        return;
      }
      
      // Only log every 10 seconds to reduce noise
      if (Date.now() % 10000 < 300) {
        console.log(`Call status check: callMode=${callMode}, isListening=${isListening}, isProcessing=${isProcessing}, isSpeaking=${isSpeaking}`);
      }
      
      // If we're processing, don't interfere
      if (isProcessing) return;
      
      // If call mode is active but listening is off and we're not speaking,
      // and the response is complete, something might be wrong
      if (callMode && !isListening && !isSpeaking && responseCompleteRef.current &&
          speechQueueRef.current.length === 0 && !synthRef.current?.speaking) {
        console.log('Emergency call mode recovery: restarting listening');
        setIsListening(true);
        lastRestartTimeRef.current = Date.now();
      }
    }, 2000);
    
    return () => {
      clearInterval(callModeCheckInterval);
    };
  }, [callMode, isListening, isProcessing, isSpeaking, responseCompleteRef.current]);

  if (!isActive) return null;

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 overflow-hidden ${className}`}>
      {/* Messages Container - Standard top-to-bottom order */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        style={{
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch", // Improve scrolling on iOS
          paddingBottom: "100px", // Add extra padding at bottom to prevent content from being hidden behind input
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">Start a conversation</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Type a message below or click the microphone button to start a voice conversation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start max-w-[85%]">
                  {/* AI Avatar */}
                  {!msg.isUser && (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium mr-2 flex-shrink-0 shadow-sm">
                      AI
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.isUser
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                  
                  {/* User Avatar */}
                  {msg.isUser && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-medium ml-2 flex-shrink-0 shadow-sm">
                      You
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[85%]">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium mr-2 flex-shrink-0 shadow-sm">
                    AI
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Call Status Bar */}
      {callMode && (
        <div className="bg-red-50 dark:bg-red-900/30 px-4 py-2 text-center text-red-800 dark:text-red-200 text-sm font-medium border-t border-red-200 dark:border-red-800/50 z-10">
          <div className="flex items-center justify-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            {getCallStatusMessage()}
          </div>
        </div>
      )}

      {/* Input Area - Sticky at bottom */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-md sticky bottom-0 left-0 right-0 z-20">
        {/* Display speech in call mode */}
        {callMode && (
          <div className="mb-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-gray-700 dark:text-gray-300">
            {visibleSpeech || interimTranscript || 'Listening...'}
          </div>
        )}

        {/* Input form - hidden during call mode */}
        {!callMode && (
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
            <div className="relative flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleInputKeyPress}
                placeholder="Type your message..."
                className="w-full min-h-[44px] max-h-24 p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                disabled={isProcessing}
                rows={1}
              />
            </div>
            
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className={`p-3 rounded-full transition-colors ${
                !inputValue.trim() || isProcessing
                  ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
            
            <button
              type="button"
              onClick={toggleCallMode}
              className={`p-3 rounded-full transition-colors ${
                callMode 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              title={callMode ? 'End voice call' : 'Start voice call'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </form>
        )}
        
        {/* Call mode controls */}
        {callMode && (
          <div className="flex justify-center">
            <button
              onClick={toggleCallMode}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat; 