import { Request, Response } from 'express';
import UserProgress from '../models/UserProgress';
import { mockAchievements } from '../utils/mockData';

// Helper function to check if we should reset the weekly goal
const shouldResetWeeklyGoal = (lastResetDate: Date): boolean => {
  const now = new Date();
  const daysSinceReset = (now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Reset if more than 7 days have passed or if we're in a different week
  // (considering Monday as the first day of the week)
  const lastDay = lastResetDate.getDay() || 7; // Convert Sunday (0) to 7
  const currentDay = now.getDay() || 7; // Convert Sunday (0) to 7
  
  // Reset if we've passed a Monday since the last reset
  return daysSinceReset >= 7 || (currentDay < lastDay);
};

// @desc    Get user progress
// @route   GET /api/progress
// @access  Private
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;

    // Find or create user progress
    let userProgress = await UserProgress.findOne({ user: userId });

    if (!userProgress) {
      // Create default user progress if it doesn't exist
      userProgress = await UserProgress.create({
        user: userId,
        lessonsCompleted: 0,
        practiceMinutes: 0,
        fluencyScore: 0,
        weeklyGoal: {
          current: 0,
          target: 5,
          lastResetDate: new Date() // Add lastResetDate to track when we last reset
        },
        streak: {
          current: 0,
          longest: 0,
          lastPracticeDate: new Date()
        },
        achievements: mockAchievements
      });
    } else {
      // Check if we need to reset the weekly goal counter
      // If weeklyGoal.lastResetDate doesn't exist yet, add it
      if (!userProgress.weeklyGoal.lastResetDate) {
        console.log('Setting initial lastResetDate for user', userId, 'in getUserProgress');
        userProgress.weeklyGoal.lastResetDate = new Date();
        await userProgress.save();
      } else if (shouldResetWeeklyGoal(userProgress.weeklyGoal.lastResetDate)) {
        console.log('Weekly goal reset needed in getUserProgress. Old value:', userProgress.weeklyGoal.current);
        // Reset the counter if it's a new week
        userProgress.weeklyGoal.current = 0;
        userProgress.weeklyGoal.lastResetDate = new Date();
        console.log('Weekly goal reset to 0 in getUserProgress');
        await userProgress.save();
      }
    }

    res.status(200).json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update weekly goal
// @route   PUT /api/progress/weekly-goal
// @access  Private
export const updateWeeklyGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    const { target } = req.body;

    if (!target || target < 1 || target > 7) {
      res.status(400).json({
        success: false,
        message: 'Weekly goal target must be between 1 and 7'
      });
      return;
    }

    // Find or create user progress
    let userProgress = await UserProgress.findOne({ user: userId });

    if (!userProgress) {
      userProgress = await UserProgress.create({
        user: userId,
        weeklyGoal: {
          current: 0,
          target
        },
        achievements: mockAchievements
      });
    } else {
      userProgress.weeklyGoal.target = target;
      await userProgress.save();
    }

    res.status(200).json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Record daily practice
// @route   POST /api/progress/record-practice
// @access  Private
export const recordDailyPractice = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;
    const { minutes } = req.body;

    if (!minutes || minutes < 1) {
      res.status(400).json({
        success: false,
        message: 'Practice minutes must be at least 1'
      });
      return;
    }

    // Find or create user progress
    let userProgress = await UserProgress.findOne({ user: userId });

    if (!userProgress) {
      userProgress = await UserProgress.create({
        user: userId,
        practiceMinutes: minutes,
        weeklyGoal: {
          current: 1,
          target: 5,
          lastResetDate: new Date()
        },
        streak: {
          current: 1,
          longest: 1,
          lastPracticeDate: new Date()
        },
        achievements: mockAchievements
      });
    } else {
      // Add practice minutes
      userProgress.practiceMinutes += minutes;
      
      // Check if they've already practiced today
      const lastPracticeDate = new Date(userProgress.streak.lastPracticeDate);
      const today = new Date();
      
      // If last practice was not today (comparing just the date part)
      if (
        lastPracticeDate.getFullYear() !== today.getFullYear() ||
        lastPracticeDate.getMonth() !== today.getMonth() ||
        lastPracticeDate.getDate() !== today.getDate()
      ) {
        // Check if this is consecutive day (yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (
          lastPracticeDate.getFullYear() === yesterday.getFullYear() &&
          lastPracticeDate.getMonth() === yesterday.getMonth() &&
          lastPracticeDate.getDate() === yesterday.getDate()
        ) {
          // Consecutive day, increase streak
          userProgress.streak.current += 1;
          
          // Update longest streak if current is longer
          if (userProgress.streak.current > userProgress.streak.longest) {
            userProgress.streak.longest = userProgress.streak.current;
          }
          
          // Check streak achievements
          const streakAchievements = userProgress.achievements.filter(
            a => a.type === 'streak' && !a.unlocked
          );
          
          for (const achievement of streakAchievements) {
            if (
              (achievement.id === '1' && userProgress.streak.current >= 3) ||
              (achievement.id === '2' && userProgress.streak.current >= 7) ||
              (achievement.id === '3' && userProgress.streak.current >= 30)
            ) {
              achievement.unlocked = true;
              achievement.unlockedAt = new Date();
            }
          }
        } else {
          // Not consecutive, reset streak
          userProgress.streak.current = 1;
        }
        
        // Check if we need to reset the weekly goal counter
        if (!userProgress.weeklyGoal.lastResetDate) {
          console.log('Setting initial lastResetDate for user', userId);
          userProgress.weeklyGoal.lastResetDate = new Date();
          userProgress.weeklyGoal.current = 1; // Reset to 1 since they're practicing today
        } else if (shouldResetWeeklyGoal(userProgress.weeklyGoal.lastResetDate)) {
          console.log('Weekly goal reset needed. Old value:', userProgress.weeklyGoal.current);
          // Reset the counter if it's a new week
          userProgress.weeklyGoal.current = 1; // Reset to 1 since they're practicing today
          userProgress.weeklyGoal.lastResetDate = new Date();
          console.log('Weekly goal reset to:', userProgress.weeklyGoal.current);
        } else {
          console.log('Incrementing weekly goal. Old value:', userProgress.weeklyGoal.current);
          // Increment weekly goal counter
          userProgress.weeklyGoal.current += 1;
          if (userProgress.weeklyGoal.current > 7) {
            userProgress.weeklyGoal.current = 7;
          }
          console.log('Weekly goal incremented to:', userProgress.weeklyGoal.current);
        }
        
        // Update last practice date
        userProgress.streak.lastPracticeDate = today;
      }
      
      await userProgress.save();
    }

    res.status(200).json({
      success: true,
      data: userProgress
    });
  } catch (error) {
    console.error('Error recording daily practice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user achievements
// @route   GET /api/progress/achievements
// @access  Private
export const getUserAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by auth middleware
    const userId = req.user.id;

    const userProgress = await UserProgress.findOne({ user: userId });

    if (!userProgress) {
      res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: userProgress.achievements
    });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 