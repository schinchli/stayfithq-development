/**
 * Sample Questions Cache System for StayFit Health Companion
 * Pre-caches responses for instant delivery
 */

// Cache configuration
const CACHE_CONFIG = {
    enabled: true,
    version: '1.0.0',
    expiry: 24 * 60 * 60 * 1000, // 24 hours
    storageKey: 'stayfit_sample_questions_cache'
};

// Pre-cached sample question responses
const SAMPLE_QUESTIONS_CACHE = {
    'Show me my steps from last week': {
        response: `Based on your recent activity data, here's your weekly step summary:

**📊 Weekly Step Analysis**
• **Total Steps**: 57,729 steps
• **Daily Average**: 8,247 steps
• **Goal Progress**: 82% of 10,000 daily target
• **Most Active Day**: Thursday (11,245 steps)
• **Least Active Day**: Sunday (5,892 steps)

**💡 Insights & Recommendations**
Your step count shows good consistency throughout the week. You're averaging over 8,000 steps daily, which is excellent for cardiovascular health.

**🎯 To reach your 10,000 daily step goal:**
• Add a 15-minute walk after lunch (+1,500 steps)
• Take stairs instead of elevators (+300-500 steps)
• Park further away or get off transit one stop early (+400-600 steps)

Keep up the great work! You're maintaining an active lifestyle that supports long-term health.

Remember to consult your healthcare provider for medical advice.`,
        cached_at: new Date().toISOString(),
        guardrails_active: true,
        search_results: [
            {
                id: 'steps_week_001',
                data_type: 'steps',
                value: 57729,
                unit: 'steps',
                period: 'weekly',
                relevance: 'high'
            }
        ]
    },

    'What are my heart rate trends?': {
        response: `Here's your comprehensive heart rate analysis:

**❤️ Heart Rate Trends Analysis**
• **Resting Heart Rate**: 68 bpm (Excellent - below 70)
• **Average Heart Rate**: 72 bpm (Normal range)
• **Maximum Recorded**: 165 bpm (During exercise)
• **Heart Rate Variability**: Good (indicates healthy autonomic function)

**📈 Weekly Trends**
• **Consistency**: Your resting HR has been stable (67-70 bpm)
• **Recovery**: Good post-exercise recovery patterns
• **Sleep Impact**: Lower HR during quality sleep periods
• **Stress Response**: Appropriate elevation during activity

**🎯 Health Insights**
Your heart rate patterns indicate excellent cardiovascular health. A resting heart rate below 70 bpm suggests good fitness levels.

**💡 Recommendations**
• Continue current exercise routine - it's working well
• Monitor trends during different activities
• Consider heart rate zone training for optimization
• Maintain consistent sleep schedule for best recovery

Your cardiovascular system shows healthy patterns and good adaptation to exercise.

Remember to consult your healthcare provider for medical advice.`,
        cached_at: new Date().toISOString(),
        guardrails_active: true,
        search_results: [
            {
                id: 'hr_trends_001',
                data_type: 'heart_rate',
                value: 68,
                unit: 'bpm',
                context: 'resting',
                relevance: 'high'
            }
        ]
    },

    'How can I improve my sleep?': {
        response: `Based on your sleep data, here are personalized recommendations:

**🌙 Current Sleep Analysis**
• **Average Duration**: 7h 23m (Good - within recommended range)
• **Sleep Efficiency**: 87% (Excellent - above 85%)
• **Deep Sleep**: 1h 45m (Good quality)
• **REM Sleep**: 1h 32m (Healthy amount)

**✅ What You're Doing Well**
• Consistent 7+ hour sleep duration
• High sleep efficiency indicates good sleep quality
• Balanced sleep stages with adequate deep and REM sleep

**🎯 Areas for Improvement**
• **Sleep Consistency**: Try to maintain same bedtime/wake time daily
• **Pre-sleep Routine**: Establish 30-60 minute wind-down period
• **Environment**: Optimize temperature (65-68°F), darkness, and quiet

**💡 Specific Recommendations**
• **Screen Time**: Limit blue light 1 hour before bed
• **Caffeine**: Avoid after 2 PM for better sleep onset
• **Exercise**: Regular activity improves sleep quality (avoid 3 hours before bed)
• **Relaxation**: Try meditation, reading, or gentle stretching

**📱 Sleep Hygiene Tips**
• Keep bedroom cool, dark, and quiet
• Use blackout curtains or eye mask
• Consider white noise machine if needed
• Reserve bed for sleep only

Your sleep foundation is strong - these tweaks can optimize it further!

Remember to consult your healthcare provider for medical advice.`,
        cached_at: new Date().toISOString(),
        guardrails_active: true,
        search_results: [
            {
                id: 'sleep_analysis_001',
                data_type: 'sleep',
                value: 7.38,
                unit: 'hours',
                efficiency: 87,
                relevance: 'high'
            }
        ]
    },

    'Analyze my workout performance': {
        response: `Here's your comprehensive workout performance analysis:

**💪 Workout Performance Summary**
• **Total Sessions**: 18 workouts this month
• **Average Duration**: 42 minutes per session
• **Total Calories**: 8,450 calories burned
• **Workout Split**: Cardio (60%), Strength (40%)
• **Frequency**: 4.5 sessions per week (Excellent consistency!)

**📊 Performance Metrics**
• **Consistency Score**: 9/10 (Outstanding adherence)
• **Intensity Progression**: Steady improvement in workout intensity
• **Recovery**: Good heart rate recovery between sessions
• **Variety**: Balanced mix of cardio and strength training

**🎯 Strengths Identified**
• **Excellent Consistency**: You're maintaining 4+ workouts per week
• **Balanced Approach**: Good mix of cardio and strength training
• **Progressive Overload**: Gradual intensity increases observed
• **Recovery Management**: Appropriate rest between sessions

**💡 Optimization Recommendations**
• **Add Flexibility**: Include 1-2 yoga/stretching sessions weekly
• **Track Progressive Overload**: Monitor weight/rep increases
• **Recovery Focus**: Consider 1 active recovery day per week
• **Periodization**: Vary intensity to prevent plateaus

**🏆 Achievement Highlights**
• Maintained 4+ workout frequency for 3 consecutive weeks
• 15% improvement in average workout duration
• Consistent calorie burn indicating good effort levels

**📈 Next Steps**
• Continue current routine - it's working excellently
• Consider adding flexibility/mobility work
• Track specific performance metrics (weights, times, distances)
• Plan periodic deload weeks for recovery

Outstanding work maintaining such consistent exercise habits!

Remember to consult your healthcare provider for medical advice.`,
        cached_at: new Date().toISOString(),
        guardrails_active: true,
        search_results: [
            {
                id: 'workout_perf_001',
                data_type: 'workout',
                sessions: 18,
                duration: 42,
                calories: 8450,
                relevance: 'high'
            }
        ]
    },

    'Generate my weekly health summary': {
        response: `Here's your comprehensive weekly health summary:

**📋 Weekly Health Summary Report**

**🏃‍♂️ Activity & Movement**
• **Total Steps**: 57,729 steps (8,247 daily average)
• **Goal Achievement**: 82% of daily 10,000 step target
• **Active Minutes**: 245 minutes of moderate-vigorous activity
• **Workouts Completed**: 4 sessions (168 minutes total)

**❤️ Cardiovascular Health**
• **Resting Heart Rate**: 68 bpm (Excellent fitness indicator)
• **Average Heart Rate**: 72 bpm (Healthy range)
• **Heart Rate Variability**: Good (indicates healthy autonomic function)
• **Recovery Patterns**: Excellent post-exercise recovery

**😴 Sleep & Recovery**
• **Average Sleep Duration**: 7h 23m (Within optimal range)
• **Sleep Efficiency**: 87% (Excellent quality)
• **Deep Sleep**: 1h 45m average (Good restorative sleep)
• **Sleep Consistency**: Good bedtime routine adherence

**🎯 Key Health Insights**
• **Overall Health Score**: 8.5/10 (Excellent)
• **Consistency Rating**: 9/10 (Outstanding habits)
• **Improvement Areas**: Reaching daily step goals, sleep timing
• **Strengths**: Exercise consistency, heart health, sleep quality

**📈 Weekly Trends**
• **Most Active Day**: Thursday (11,245 steps, 45-min workout)
• **Best Sleep Night**: Tuesday (8h 15m, 89% efficiency)
• **Lowest Heart Rate**: Wednesday morning (66 bpm resting)
• **Peak Performance**: Friday workout (highest calorie burn)

**💡 Recommendations for Next Week**
• **Activity**: Add 1,500 daily steps to reach 10K goal
• **Sleep**: Maintain current excellent sleep habits
• **Exercise**: Continue 4+ weekly sessions - perfect frequency
• **Recovery**: Consider one yoga/stretching session

**🏆 Achievements This Week**
✅ Maintained 4+ workout sessions
✅ Averaged 7+ hours of quality sleep
✅ Kept resting heart rate in excellent range
✅ Consistent daily activity levels

**🎯 Focus Areas for Improvement**
• Increase daily steps by 15-20%
• Maintain sleep schedule consistency on weekends
• Add flexibility/mobility work to routine

You're maintaining excellent health habits! Keep up the outstanding work with your fitness and wellness routine.

Remember to consult your healthcare provider for medical advice.`,
        cached_at: new Date().toISOString(),
        guardrails_active: true,
        search_results: [
            {
                id: 'weekly_summary_001',
                data_type: 'comprehensive',
                period: 'weekly',
                score: 8.5,
                relevance: 'high'
            }
        ]
    }
};

/**
 * Initialize sample questions cache
 */
function initializeSampleQuestionsCache() {
    try {
        // Store cache in localStorage
        const cacheData = {
            version: CACHE_CONFIG.version,
            cached_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + CACHE_CONFIG.expiry).toISOString(),
            questions: SAMPLE_QUESTIONS_CACHE
        };
        
        localStorage.setItem(CACHE_CONFIG.storageKey, JSON.stringify(cacheData));
        
        console.log('✅ Sample questions cache initialized');
        console.log(`📊 Cached ${Object.keys(SAMPLE_QUESTIONS_CACHE).length} sample questions`);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize sample questions cache:', error);
        return false;
    }
}

/**
 * Get cached response for a sample question
 */
function getCachedSampleResponse(question) {
    try {
        const cacheData = JSON.parse(localStorage.getItem(CACHE_CONFIG.storageKey));
        
        if (!cacheData || !cacheData.questions) {
            console.warn('⚠️ Sample questions cache not found');
            return null;
        }
        
        // Check if cache is expired
        if (new Date() > new Date(cacheData.expires_at)) {
            console.warn('⚠️ Sample questions cache expired');
            localStorage.removeItem(CACHE_CONFIG.storageKey);
            return null;
        }
        
        const cachedResponse = cacheData.questions[question];
        if (cachedResponse) {
            console.log(`✅ Retrieved cached response for: "${question}"`);
            return {
                ...cachedResponse,
                cached: true,
                cache_hit: true
            };
        }
        
        console.log(`❌ No cached response found for: "${question}"`);
        return null;
        
    } catch (error) {
        console.error('❌ Error retrieving cached response:', error);
        return null;
    }
}

/**
 * Check if a question is a sample question
 */
function isSampleQuestion(question) {
    return Object.keys(SAMPLE_QUESTIONS_CACHE).includes(question);
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    try {
        const cacheData = JSON.parse(localStorage.getItem(CACHE_CONFIG.storageKey));
        
        if (!cacheData) {
            return {
                enabled: false,
                cached_questions: 0,
                cache_size: 0,
                expires_at: null
            };
        }
        
        return {
            enabled: true,
            cached_questions: Object.keys(cacheData.questions).length,
            cache_size: JSON.stringify(cacheData).length,
            cached_at: cacheData.cached_at,
            expires_at: cacheData.expires_at,
            version: cacheData.version
        };
    } catch (error) {
        console.error('❌ Error getting cache stats:', error);
        return { enabled: false, error: error.message };
    }
}

/**
 * Clear sample questions cache
 */
function clearSampleQuestionsCache() {
    try {
        localStorage.removeItem(CACHE_CONFIG.storageKey);
        console.log('✅ Sample questions cache cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing cache:', error);
        return false;
    }
}

// Initialize cache when script loads
if (CACHE_CONFIG.enabled) {
    initializeSampleQuestionsCache();
}

// Export functions for global use
window.getCachedSampleResponse = getCachedSampleResponse;
window.isSampleQuestion = isSampleQuestion;
window.getCacheStats = getCacheStats;
window.clearSampleQuestionsCache = clearSampleQuestionsCache;

console.log('🔄 Sample Questions Cache System loaded');
