import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

interface VoiceConversationProps {
  onConversationComplete?: (transcript: string, score: number) => void;
  promptText?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isActive?: boolean;
}

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

const VoiceConversation: React.FC<VoiceConversationProps> = ({ 
  onConversationComplete, 
  promptText = "Tell me about yourself.", 
  difficulty = 'intermediate',
  isActive = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    pronunciation: number;
    grammar: number;
    fluency: number;
    vocabulary: number;
    overall: number;
    suggestions: string[];
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }

    // Use the SpeechRecognition interface
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionConstructor() as SpeechRecognition;
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    // Set up speech synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Configure speech recognition handlers
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prevTranscript => prevTranscript + finalTranscript);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current?.start();
      } else {
        setIsListening(false);
        // Process the full transcript when stopped
        if (transcript) {
          processUserSpeech(transcript);
        }
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error(`Speech recognition error: ${event.error}`);
    };
  }, [isListening, transcript]);

  // Process user speech
  const processUserSpeech = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // In a real app, this would call an API to process the speech
      // Simulating API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI response based on difficulty level
      let response = '';
      const suggestions: string[] = [];
      
      // Sample responses based on difficulty
      if (difficulty === 'beginner') {
        response = "That's great! Your English is clear. I noticed a few areas where we can improve.";
        suggestions.push('Try to speak a bit slower for clarity.');
        suggestions.push('Practice the "th" sound in words like "the" and "think".');
      } else if (difficulty === 'intermediate') {
        response = "Well articulated! I see you're comfortable with English. Let's refine a few points.";
        suggestions.push('Work on connecting your sentences more fluidly.');
        suggestions.push('Try using more varied vocabulary to express similar ideas.');
      } else {
        response = "Excellent speaking! Your fluency is impressive. Here are some advanced tips.";
        suggestions.push('Consider using more idiomatic expressions in your speech.');
        suggestions.push('Work on reducing any slight accent markers if you\'re aiming for native-like pronunciation.');
      }
      
      // Generate mock feedback data
      const feedback = {
        pronunciation: Math.floor(Math.random() * 30) + 70, // 70-99
        grammar: Math.floor(Math.random() * 30) + 70,
        fluency: Math.floor(Math.random() * 30) + 70,
        vocabulary: Math.floor(Math.random() * 30) + 70,
        overall: Math.floor(Math.random() * 20) + 80, // 80-99
        suggestions
      };
      
      setFeedbackData(feedback);
      setAiResponse(response);
      
      // Speak the response using speech synthesis
      speakText(response);
      
      if (onConversationComplete) {
        onConversationComplete(text, feedback.overall);
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      toast.error('Failed to process your speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAiResponse('');
      setFeedbackData(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Speak text using speech synthesis
  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95; // Slightly slower than normal
    utterance.pitch = 1;
    
    synthRef.current.speak(utterance);
  };

  // If component is not active, don't render
  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Practice Speaking</h2>
        <p className="text-gray-600 dark:text-gray-400">{promptText}</p>
      </div>
      
      {/* Visualization of sound waves when speaking */}
      <div className="relative h-24 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end space-x-1">
              {Array.from({ length: 20 }).map((_, i) => {
                const height = Math.random() * 100;
                return (
                  <div 
                    key={i} 
                    className="w-1 bg-indigo-500 dark:bg-indigo-400 rounded-t"
                    style={{ 
                      height: `${height}%`,
                      animation: `soundWave 0.5s infinite ${i * 0.05}s` 
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        )}
        {!isListening && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {transcript ? "Click to speak again" : "Click the microphone to start speaking"}
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
          </div>
        )}
      </div>
      
      {/* Transcript and response */}
      <div className="space-y-4 mb-6">
        {transcript && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">You said:</h3>
            <p className="text-gray-800 dark:text-gray-200">{transcript}</p>
          </div>
        )}
        
        {aiResponse && (
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">AI Response:</h3>
            <p className="text-gray-800 dark:text-gray-200">{aiResponse}</p>
          </div>
        )}
      </div>
      
      {/* Feedback visualization */}
      {feedbackData && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Your Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pronunciation</h4>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${feedbackData.pronunciation}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">{feedbackData.pronunciation}%</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Grammar</h4>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${feedbackData.grammar}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">{feedbackData.grammar}%</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fluency</h4>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 dark:bg-purple-500 h-2.5 rounded-full" 
                  style={{ width: `${feedbackData.fluency}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">{feedbackData.fluency}%</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vocabulary</h4>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-yellow-600 dark:bg-yellow-500 h-2.5 rounded-full" 
                  style={{ width: `${feedbackData.vocabulary}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-600 dark:text-gray-400">{feedbackData.vocabulary}%</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Overall Score</h4>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-4 rounded-full flex items-center justify-center text-xs text-white" 
                style={{ width: `${feedbackData.overall}%` }}
              >
                {feedbackData.overall}%
              </div>
            </div>
          </div>
          
          {/* Improvement suggestions */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Suggestions for Improvement:</h4>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 text-sm">
              {feedbackData.suggestions.map((suggestion, index) => (
                <li key={index} className="mb-1">{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex justify-center">
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`p-4 rounded-full ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Additional styles for animations */}
      <style>
        {`
          @keyframes soundWave {
            0%, 100% {
              height: 20%;
            }
            50% {
              height: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

// Adding the SpeechRecognition type definition for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default VoiceConversation; 