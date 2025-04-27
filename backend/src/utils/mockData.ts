import { IAchievement } from '../models/UserProgress';
import { ILesson } from '../models/Lesson';

// Mock achievements
export const mockAchievements: IAchievement[] = [
  {
    id: '1',
    name: '3-Day Streak',
    description: 'Practice for 3 consecutive days',
    unlocked: false,
    type: 'streak',
    color: 'indigo'
  },
  {
    id: '2',
    name: '7-Day Streak',
    description: 'Practice for 7 consecutive days',
    unlocked: false,
    type: 'streak',
    color: 'indigo'
  },
  {
    id: '3',
    name: '30-Day Streak',
    description: 'Practice for 30 consecutive days',
    unlocked: false,
    type: 'streak',
    color: 'indigo'
  },
  {
    id: '4',
    name: 'Perfect Score',
    description: 'Complete a lesson with 100% accuracy',
    unlocked: false,
    type: 'score',
    color: 'yellow'
  },
  {
    id: '5',
    name: 'Conversation Master',
    description: 'Complete 5 conversation lessons',
    unlocked: false,
    type: 'completion',
    color: 'blue'
  },
  {
    id: '6',
    name: 'Grammar Guru',
    description: 'Complete 5 grammar lessons',
    unlocked: false,
    type: 'completion',
    color: 'green'
  },
  {
    id: '7',
    name: 'Vocabulary Virtuoso',
    description: 'Learn 100 new words',
    unlocked: false,
    type: 'completion',
    color: 'purple'
  },
  {
    id: '8',
    name: 'Practice Makes Perfect',
    description: 'Practice for 10 hours total',
    unlocked: false,
    type: 'practice',
    color: 'blue'
  }
];

// Mock lessons
export const mockLessons: Partial<ILesson>[] = [
  {
    title: 'Everyday Greetings',
    description: 'Learn common greetings and introductions for everyday situations',
    category: 'conversation',
    iconColor: 'blue',
    difficulty: 'beginner',
    estimatedTime: 15,
    xpPoints: 100,
    skills: ['Speaking', 'Listening', 'Social Etiquette'],
    content: {
      stages: [
        {
          prompt: "Hello! I'm your AI speaking partner. How are you feeling today?",
          expectedTopics: ["feelings", "mood", "day"],
          aiResponses: [
            "That's great to hear! Could you tell me about your plans for the weekend?",
            "I'm sorry to hear that. Would you like to talk about something that might cheer you up?",
            "Interesting! Could you elaborate a bit more on that?"
          ]
        },
        {
          prompt: "Let's practice describing things. Can you describe your favorite place to visit?",
          expectedTopics: ["place", "location", "visit", "favorite", "like"],
          aiResponses: [
            "That sounds like a wonderful place! What do you enjoy most about it?",
            "I'd love to visit there someday. What makes this place special to you?",
            "Great description! Is there a specific memory you have from this place?"
          ]
        },
        {
          prompt: "Now, let's try using past tense. What did you do yesterday?",
          expectedTopics: ["went", "visited", "watched", "ate", "met", "worked", "studied"],
          aiResponses: [
            "That sounds like a productive day! Did you enjoy it?",
            "Interesting! Is that something you do regularly?",
            "Tell me more about that experience. Was it what you expected?"
          ]
        }
      ],
      completion: {
        title: "Great work!",
        message: "You've completed the 'Everyday Greetings' lesson",
        keyTakeaways: [
          "You've practiced common greeting expressions",
          "You've learned how to introduce yourself formally and informally",
          "You've practiced responding to general questions about wellbeing"
        ]
      }
    },
    isActive: true
  },
  {
    title: 'Ordering at a Restaurant',
    description: 'Practice conversations you might have when dining out',
    category: 'conversation',
    iconColor: 'blue',
    difficulty: 'beginner',
    estimatedTime: 20,
    xpPoints: 120,
    skills: ['Speaking', 'Vocabulary', 'Cultural Context'],
    content: {
      stages: [
        {
          prompt: "Welcome to our restaurant! Would you like a table for how many people?",
          expectedTopics: ["people", "table", "reservation", "seat"],
          aiResponses: [
            "Perfect! Please follow me to your table. Would you like to sit by the window?",
            "I'm sorry, there will be a 30-minute wait for that many people. Would you like to wait at the bar?",
            "Excellent! Do you have any preferences for where you'd like to sit?"
          ]
        },
        {
          prompt: "Are you ready to order, or do you need a few more minutes?",
          expectedTopics: ["ready", "order", "menu", "recommendations", "special"],
          aiResponses: [
            "I'd recommend our chef's special today, which is grilled salmon with a lemon butter sauce.",
            "Take your time! I'll come back in a few minutes.",
            "Our most popular dishes are the pasta carbonara and the ribeye steak."
          ]
        },
        {
          prompt: "How would you like your steak cooked?",
          expectedTopics: ["rare", "medium", "well done", "medium rare", "medium well"],
          aiResponses: [
            "Excellent choice! Would you like any sides with that?",
            "Perfect. And would you like to order any appetizers to start?",
            "Very good. Can I get you anything to drink with your meal?"
          ]
        }
      ],
      completion: {
        title: "Well done!",
        message: "You've completed the 'Ordering at a Restaurant' lesson",
        keyTakeaways: [
          "You've learned vocabulary for ordering food",
          "You've practiced how to make special requests",
          "You've learned how to ask questions about the menu"
        ]
      }
    },
    isActive: true
  }
];

// Export function to seed initial lessons
export const getInitialLessons = (): Partial<ILesson>[] => {
  return mockLessons;
}; 