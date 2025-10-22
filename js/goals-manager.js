// Health Goals Manager with Nova Sonic Voice Integration
class HealthGoalsManager {
    constructor() {
        this.goals = this.loadGoals();
        this.initVoiceSupport();
        this.startDailyReminders();
    }

    loadGoals() {
        const defaultGoals = {
            steps: 10000,
            water: 8,
            sleep: 8,
            workouts: 4
        };
        return JSON.parse(localStorage.getItem('healthGoals')) || defaultGoals;
    }

    saveGoals() {
        localStorage.setItem('healthGoals', JSON.stringify(this.goals));
    }

    initVoiceSupport() {
        // Check for speech synthesis support
        this.speechSupported = 'speechSynthesis' in window;
        this.recognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        
        if (this.speechSupported) {
            this.synth = window.speechSynthesis;
            this.voice = null;
            this.loadNovaVoice();
        }

        if (this.recognitionSupported) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
        }
    }

    loadNovaVoice() {
        const voices = this.synth.getVoices();
        // Try to find Nova or similar high-quality voice
        this.voice = voices.find(v => 
            v.name.includes('Nova') || 
            v.name.includes('Samantha') || 
            v.name.includes('Karen') ||
            v.name.includes('Zira')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    speak(text, priority = 'normal') {
        if (!this.speechSupported) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        if (priority === 'urgent') {
            this.synth.cancel(); // Stop current speech for urgent messages
        }
        
        this.synth.speak(utterance);
    }

    setGoal(type, value) {
        this.goals[type] = parseInt(value);
        this.saveGoals();
        this.speak(`Goal updated! Your new ${type} goal is ${value} ${this.getUnit(type)} per ${this.getPeriod(type)}.`);
    }

    getUnit(type) {
        const units = {
            steps: 'steps',
            water: 'glasses',
            sleep: 'hours',
            workouts: 'workouts'
        };
        return units[type] || '';
    }

    getPeriod(type) {
        return type === 'workouts' ? 'week' : 'day';
    }

    checkProgress() {
        const today = new Date().toDateString();
        const progress = JSON.parse(localStorage.getItem('dailyProgress')) || {};
        const todayProgress = progress[today] || { steps: 0, water: 0, sleep: 0, workouts: 0 };
        
        return todayProgress;
    }

    updateProgress(type, value) {
        const today = new Date().toDateString();
        const progress = JSON.parse(localStorage.getItem('dailyProgress')) || {};
        if (!progress[today]) progress[today] = { steps: 0, water: 0, sleep: 0, workouts: 0 };
        
        progress[today][type] = parseInt(value);
        localStorage.setItem('dailyProgress', JSON.stringify(progress));
        
        this.checkGoalCompletion(type, progress[today][type]);
    }

    checkGoalCompletion(type, current) {
        const goal = this.goals[type];
        const percentage = Math.round((current / goal) * 100);
        
        if (current >= goal) {
            this.speak(`Congratulations! You've reached your ${type} goal of ${goal} ${this.getUnit(type)}!`, 'urgent');
        } else if (percentage >= 80) {
            this.speak(`Great progress! You're at ${percentage}% of your ${type} goal. Keep going!`);
        }
    }

    sendReminder(type) {
        const progress = this.checkProgress();
        const goal = this.goals[type];
        const current = progress[type] || 0;
        const remaining = goal - current;
        
        if (remaining > 0) {
            const messages = {
                steps: `Time to move! You need ${remaining} more steps to reach your daily goal of ${goal} steps.`,
                water: `Stay hydrated! You need ${remaining} more glasses of water to reach your goal of ${goal} glasses today.`,
                sleep: `Don't forget about sleep! You should aim for ${goal} hours of sleep tonight.`,
                workouts: `Workout reminder! You have ${remaining} workouts remaining this week to reach your goal of ${goal} workouts.`
            };
            
            this.speak(messages[type], 'urgent');
            this.showVisualReminder(type, remaining);
        }
    }

    showVisualReminder(type, remaining) {
        const reminder = document.createElement('div');
        reminder.className = 'goal-reminder alert alert-warning';
        reminder.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-bell me-2"></i>
                <div>
                    <strong>Goal Reminder:</strong> ${remaining} more ${this.getUnit(type)} needed for your ${type} goal!
                </div>
                <button class="btn btn-sm btn-outline-primary ms-auto" onclick="healthGoals.dismissReminder(this)">
                    Got it!
                </button>
            </div>
        `;
        
        const container = document.getElementById('chatMessages') || document.body;
        container.appendChild(reminder);
        
        setTimeout(() => reminder.remove(), 10000);
    }

    dismissReminder(element) {
        element.closest('.goal-reminder').remove();
    }

    startDailyReminders() {
        // Check every hour for goal progress
        setInterval(() => {
            const hour = new Date().getHours();
            
            // Remind about steps at 2 PM, 5 PM, 8 PM
            if ([14, 17, 20].includes(hour)) {
                this.sendReminder('steps');
            }
            
            // Remind about water at 12 PM, 3 PM, 6 PM
            if ([12, 15, 18].includes(hour)) {
                this.sendReminder('water');
            }
            
            // Remind about sleep at 10 PM
            if (hour === 22) {
                this.sendReminder('sleep');
            }
        }, 3600000); // Check every hour
    }

    processVoiceCommand(command) {
        const cmd = command.toLowerCase();
        
        if (cmd.includes('set') && cmd.includes('goal')) {
            if (cmd.includes('steps')) {
                const steps = cmd.match(/(\d+)/)?.[1];
                if (steps) this.setGoal('steps', steps);
            } else if (cmd.includes('water') || cmd.includes('glasses')) {
                const glasses = cmd.match(/(\d+)/)?.[1];
                if (glasses) this.setGoal('water', glasses);
            } else if (cmd.includes('sleep')) {
                const hours = cmd.match(/(\d+)/)?.[1];
                if (hours) this.setGoal('sleep', hours);
            } else if (cmd.includes('workout')) {
                const workouts = cmd.match(/(\d+)/)?.[1];
                if (workouts) this.setGoal('workouts', workouts);
            }
        } else if (cmd.includes('progress') || cmd.includes('status')) {
            this.reportProgress();
        } else if (cmd.includes('remind') || cmd.includes('reminder')) {
            this.speak("I'll remind you about your health goals throughout the day!");
        }
    }

    reportProgress() {
        const progress = this.checkProgress();
        const report = `Here's your progress today: ${progress.steps} steps out of ${this.goals.steps}, ${progress.water} glasses of water out of ${this.goals.water}, and ${progress.workouts} workouts this week out of ${this.goals.workouts}.`;
        this.speak(report);
    }

    startListening() {
        if (!this.recognitionSupported) {
            this.speak("Sorry, voice recognition is not supported in your browser.");
            return;
        }

        this.recognition.start();
        this.speak("I'm listening. You can set goals or ask about your progress.");
        
        this.recognition.onresult = (event) => {
            const command = event.results[0][0].transcript;
            console.log('Voice command:', command);
            this.processVoiceCommand(command);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.speak("Sorry, I didn't catch that. Please try again.");
        };
    }
}

// Initialize goals manager
window.healthGoals = new HealthGoalsManager();

// Load voices when available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        window.healthGoals.loadNovaVoice();
    };
}

console.log('✅ Health Goals Manager with Nova Sonic Voice loaded');
