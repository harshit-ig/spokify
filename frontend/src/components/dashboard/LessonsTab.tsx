import React, { useState, useEffect } from 'react';
import { useLessons } from '../../context/LessonsContext';
import { Link } from 'react-router-dom';
import { HiChevronRight } from 'react-icons/hi';
import { ImBooks } from 'react-icons/im';

// Define types needed for filters
type LessonCategory = 'all' | 'grammar' | 'vocabulary' | 'conversation' | 'reading' | 'writing' | 'listening';
type LessonLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

// Use type assertion functions to safely work with lessons from context
const getLessonCategory = (lesson: any): string => lesson.category || '';
const getLessonLevel = (lesson: any): string => lesson.difficulty || '';
const getLessonProgress = (lesson: any): number => lesson.progress || 0;

const LessonsTab: React.FC = () => {
  const { allLessons } = useLessons();
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory>('all');
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel>('all');
  const [filteredLessons, setFilteredLessons] = useState<any[]>([]);

  useEffect(() => {
    let filtered = [...allLessons];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(lesson => getLessonCategory(lesson) === selectedCategory);
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(lesson => getLessonLevel(lesson) === selectedLevel);
    }

    setFilteredLessons(filtered);
  }, [allLessons, selectedCategory, selectedLevel]);

  const categories: LessonCategory[] = ['all', 'grammar', 'vocabulary', 'conversation', 'reading', 'writing', 'listening'];
  const levels: LessonLevel[] = ['all', 'beginner', 'intermediate', 'advanced'];

  const getCategoryLabel = (category: LessonCategory) => {
    return category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getLevelLabel = (level: LessonLevel) => {
    return level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 33) return 'bg-red-500';
    if (progress < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <ImBooks className="mr-3 text-indigo-600 dark:text-indigo-400" size={24} />
          Your Lessons
        </h2>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md text-gray-700 dark:text-gray-300 mb-3 font-medium">Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md text-gray-700 dark:text-gray-300 mb-3 font-medium">Level</h3>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedLevel === level
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getLevelLabel(level)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {(selectedCategory !== 'all' || selectedLevel !== 'all') && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Lessons Grid */}
        {filteredLessons.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No lessons found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try selecting different filters or check back later for new lessons.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <Link 
                to={`/lessons/${lesson.id}`}
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col h-full"
              >
                <div className="h-40 bg-gradient-to-r from-indigo-500 to-blue-600 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold opacity-70">
                    {getCategoryLabel(getLessonCategory(lesson) as LessonCategory).charAt(0)}
                  </div>
                  <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 text-xs font-bold px-2.5 py-1 rounded-full text-indigo-800 dark:text-indigo-300 shadow-sm">
                    {getLevelLabel(getLessonLevel(lesson) as LessonLevel)}
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs font-medium rounded-full">
                      {getCategoryLabel(getLessonCategory(lesson) as LessonCategory)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {lesson.estimatedTime} min
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{lesson.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-1">{lesson.description}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress: {getLessonProgress(lesson)}%
                      </span>
                      <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                        Continue <HiChevronRight className="ml-1" />
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(getLessonProgress(lesson))}`}
                        style={{ width: `${getLessonProgress(lesson)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonsTab; 