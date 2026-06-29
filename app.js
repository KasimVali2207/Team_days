// ==========================================
// CONSTANTS & STATE
// ==========================================
const TEAM_MEMBERS = [
    'bharath', 'bobby', 'bogdan', 'bruno', 'dominique', 
    'geeta', 'joel', 'kasim', 'margaux', 'pedro', 
    'prakash', 'rohan', 'sagar', 'stefaan'
];

const DEFAULT_PASSWORD = '12345';

const MOODS = {
    caffeine: { 
        emoji: '☕', 
        title: 'Caffeine-Fueled', 
        desc: 'Hyper-productive, crushing tasks, coding at lightspeed.' 
    },
    meeting: { 
        emoji: '📋', 
        title: 'Meeting Marathon', 
        desc: 'Scrum Master heaven, developer hell. Syncing about syncs.' 
    },
    fire: { 
        emoji: '🔥', 
        title: '"Everything is Fine"', 
        desc: 'Production is burning, sprint commitments are crying. Smiling through it.' 
    },
    chillin: { 
        emoji: '⏳', 
        title: 'Waiting on Blockers', 
        desc: "Chillin' in the lobby. I would work, but my hands are tied." 
    }
};

// Predefined premium gradients for avatars
const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #a855f7)', // Indigo-Purple
    'linear-gradient(135deg, #ec4899, #f43f5e)', // Pink-Rose
    'linear-gradient(135deg, #3b82f6, #06b6d4)', // Blue-Cyan
    'linear-gradient(135deg, #10b981, #14b8a6)', // Emerald-Teal
    'linear-gradient(135deg, #f59e0b, #eab308)', // Amber-Yellow
    'linear-gradient(135deg, #8b5cf6, #d946ef)', // Violet-Fuchsia
    'linear-gradient(135deg, #f97316, #ef4444)', // Orange-Red
    'linear-gradient(135deg, #64748b, #475569)', // Slate
];

// App State
let currentUser = null;
let participatedMembers = new Set();
let userVotes = {}; // Maps username -> moodId (anonymous on dashboard, saved locally)
let selectedMoodId = null;
let pollTimerInterval = null;
let pollTimeRemaining = 120; // 2 minutes in seconds

// Quiz State
let currentQuestionIndex = 0;
let userAnswers = [];
let selectedOptionIndex = null;
let quizTimerInterval = null;
let quizTimeRemaining = 120;
let leaderboard = [];

// ==========================================
// DOM ELEMENTS
// ==========================================
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const usernameSelect = document.getElementById('username-select');
const passwordInput = document.getElementById('password-input');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const loginError = document.getElementById('login-error');
const errorText = document.getElementById('error-text');

const loggedInUserName = document.getElementById('logged-in-user-name');
const logoutBtn = document.getElementById('logout-btn');
const celebrateBtn = document.getElementById('celebrate-btn');
const resetDataBtn = document.getElementById('reset-data-btn');
const simulateVotesBtn = document.getElementById('simulate-votes-btn');

const participatedCountEl = document.getElementById('participated-count');
const participationRateEl = document.getElementById('participation-rate');
const participationProgressEl = document.getElementById('participation-progress');
const teamGrid = document.getElementById('team-grid');

// Poll Elements
const pollSection = document.getElementById('poll-section');
const pollVotingContainer = document.getElementById('poll-voting-container');
const pollVotedMessage = document.getElementById('poll-voted-message');
const moodCards = document.querySelectorAll('.mood-card');
const submitVoteBtn = document.getElementById('submit-vote-btn');
const votedCountText = document.getElementById('voted-count-text');
const votedProgressBar = document.getElementById('voted-progress-bar');

// Results Elements
const resultsSection = document.getElementById('results-section');
const resultsBarsContainer = document.getElementById('results-bars-container');
const aiLoadingContainer = document.getElementById('ai-loading-container');
const aiRoastsContainer = document.getElementById('ai-roasts-container');

// Quiz Elements
const gameArenaView = document.getElementById('game-arena-view');
const gameArenaNavBtn = document.getElementById('game-arena-nav-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const quizStartContainer = document.getElementById('quiz-start-container');
const startQuizBtn = document.getElementById('start-quiz-btn');
const quizPlayContainer = document.getElementById('quiz-play-container');
const quizQuestionCounter = document.getElementById('quiz-question-counter');
const quizProgressBarFill = document.getElementById('quiz-progress-bar-fill');
const quizQuestionText = document.getElementById('quiz-question-text');
const quizOptionsList = document.getElementById('quiz-options-list');
const nextQuestionBtn = document.getElementById('next-question-btn');
const nextBtnText = document.getElementById('next-btn-text');
const quizResultsContainer = document.getElementById('quiz-results-container');
const quizUserScore = document.getElementById('quiz-user-score');
const quizScoreEval = document.getElementById('quiz-score-eval');
const restartQuizBtn = document.getElementById('restart-quiz-btn');
const leaderboardTbody = document.getElementById('leaderboard-tbody');
const quizReviewList = document.getElementById('quiz-review-list');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getAvatarGradient(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
}

function getInitials(username) {
    if (username.length <= 2) return username.toUpperCase();
    return username.slice(0, 2).toUpperCase();
}

// Quiz Leaderboard & Timer Helpers
function initLeaderboard() {
    const stored = localStorage.getItem('team_days_leaderboard');
    if (stored) {
        leaderboard = JSON.parse(stored);
    } else {
        // Start completely empty (only active players show up)
        leaderboard = [];
        saveLeaderboard();
    }
    renderLeaderboard();
}

function saveLeaderboard() {
    localStorage.setItem('team_days_leaderboard', JSON.stringify(leaderboard));
}

function renderLeaderboard() {
    const leaderboardCard = document.querySelector('.quiz-leaderboard-section');
    if (!leaderboardTbody) return;
    leaderboardTbody.innerHTML = '';
    
    if (leaderboardCard) {
        leaderboardCard.style.display = 'block';
    }
    
    if (leaderboard.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0.5rem; font-style: italic;">
                Leaderboard empty. Take the challenge to rank! 🚀
            </td>
        `;
        leaderboardTbody.appendChild(tr);
        return;
    }
    
    // Sort descending by score, then alphabetically by name
    const sorted = [...leaderboard].sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Take top 5
    const top5 = sorted.slice(0, 5);
    
    top5.forEach((item, index) => {
        const tr = document.createElement('tr');
        if (currentUser && item.name.toLowerCase() === currentUser.toLowerCase()) {
            tr.classList.add('current-user-row');
        }
        
        let medal = index + 1;
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        tr.innerHTML = `
            <td><span class="rank-badge">${medal}</span></td>
            <td>
                <div class="leaderboard-user">
                    <div class="user-avatar-mini" style="background: ${getAvatarGradient(item.name)}">
                        ${getInitials(item.name)}
                    </div>
                    <span class="user-name-txt">${capitalize(item.name)}</span>
                </div>
            </td>
            <td><span class="score-val-txt">${item.score}/7</span></td>
        `;
        leaderboardTbody.appendChild(tr);
    });
}

function startQuestionTimer() {
    clearInterval(quizTimerInterval);
    quizTimeRemaining = 120; // 2 minutes
    updateTimerDisplay();
    
    quizTimerInterval = setInterval(() => {
        quizTimeRemaining--;
        updateTimerDisplay();
        
        if (quizTimeRemaining <= 0) {
            clearInterval(quizTimerInterval);
            // Time's up! Force advance question, marking it wrong
            nextQuestion();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(quizTimeRemaining / 60);
    const seconds = quizTimeRemaining % 60;
    const displayStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const timerEl = document.getElementById('quiz-question-timer');
    if (timerEl) {
        timerEl.textContent = displayStr;
        if (quizTimeRemaining <= 10) {
            timerEl.classList.add('timer-warning');
        } else {
            timerEl.classList.remove('timer-warning');
        }
    }
}

function saveParticipationData() {
    localStorage.setItem('team_days_participated', JSON.stringify([...participatedMembers]));
}

function loadParticipationData() {
    const data = localStorage.getItem('team_days_participated');
    if (data) {
        try {
            participatedMembers = new Set(JSON.parse(data));
        } catch (e) {
            participatedMembers = new Set();
        }
    } else {
        participatedMembers = new Set();
    }
}

function saveVotesData() {
    localStorage.setItem('team_days_votes', JSON.stringify(userVotes));
}

function loadVotesData() {
    const data = localStorage.getItem('team_days_votes');
    if (data) {
        try {
            userVotes = JSON.parse(data);
        } catch (e) {
            userVotes = {};
        }
    } else {
        userVotes = {};
    }
}

function triggerCelebrationConfetti() {
    confetti({ particleCount: 80, spread: 60, origin: { x: 0.1, y: 0.8 } });
    confetti({ particleCount: 80, spread: 60, origin: { x: 0.9, y: 0.8 } });
    setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { x: 0.5, y: 0.6 } });
    }, 200);
}

// ==========================================
// CORE LOGIC & RENDERING
// ==========================================

function renderDashboard() {
    loggedInUserName.textContent = capitalize(currentUser);

    // 1. Update Participation Stats
    const totalCount = TEAM_MEMBERS.length;
    const joinedCount = participatedMembers.size;
    const rate = Math.round((joinedCount / totalCount) * 100);

    participatedCountEl.textContent = joinedCount;
    participationRateEl.textContent = `${rate}%`;
    participationProgressEl.style.width = `${rate}%`;

    // 2. Render Team Grid
    teamGrid.innerHTML = '';
    TEAM_MEMBERS.forEach(member => {
        const hasJoined = participatedMembers.has(member);
        const hasVoted = !!userVotes[member];
        
        const card = document.createElement('div');
        card.className = `member-card glass-card ${hasJoined ? 'status-joined' : ''}`;
        
        const avatarGradient = getAvatarGradient(member);
        const initials = getInitials(member);
        const displayName = capitalize(member);
        
        card.innerHTML = `
            <div class="avatar" style="background: ${avatarGradient}">
                ${initials}
            </div>
            <span class="member-name">${displayName}</span>
            <div class="card-badges">
                <span class="badge ${hasJoined ? 'badge-joined' : 'badge-pending'}">
                    <i data-lucide="${hasJoined ? 'check-circle' : 'clock'}"></i>
                    <span>${hasJoined ? 'Joined' : 'Pending'}</span>
                </span>
                ${hasVoted ? `
                <span class="badge badge-voted">
                    <i data-lucide="vote"></i>
                    <span>Voted</span>
                </span>` : ''}
            </div>
        `;
        teamGrid.appendChild(card);
    });

    // 3. Render Poll Section
    const voteCount = Object.keys(userVotes).length;
    const hasVoted = !!userVotes[currentUser];
    const allVoted = voteCount >= totalCount;

    if (allVoted) {
        // Hide voting panels
        pollSection.classList.add('hidden');
        // Show results panel
        resultsSection.classList.remove('hidden');
        stopPollTimer();
        renderPollResults();
    } else {
        pollSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        if (hasVoted) {
            pollVotingContainer.classList.add('hidden');
            pollVotedMessage.classList.remove('hidden');
            
            const votePercent = Math.round((voteCount / totalCount) * 100);
            votedCountText.textContent = `${voteCount} / ${totalCount} voted`;
            votedProgressBar.style.width = `${votePercent}%`;

            // Update Unvoted Members List
            const unvotedMembers = TEAM_MEMBERS.filter(member => !userVotes[member]);
            const unvotedListNames = document.getElementById('unvoted-list-names');
            if (unvotedListNames) {
                unvotedListNames.textContent = unvotedMembers.map(capitalize).join(', ');
            }

            // Start Countdown Timer
            startPollTimer();
        } else {
            pollVotingContainer.classList.remove('hidden');
            pollVotedMessage.classList.add('hidden');
            // Reset selection
            selectedMoodId = null;
            moodCards.forEach(c => c.classList.remove('selected'));
            submitVoteBtn.disabled = true;
            stopPollTimer();
        }
    }

    lucide.createIcons();
}

// Timer Functions
function startPollTimer() {
    if (pollTimerInterval) return; // already running

    const timerDisplay = document.getElementById('poll-timer-display');
    const timerContainer = document.getElementById('countdown-timer-container');
    const timerLabelText = document.getElementById('timer-label-text');

    pollTimeRemaining = 120; // 2 minutes

    function updateTimerDisplay() {
        const minutes = Math.floor(pollTimeRemaining / 60);
        const seconds = pollTimeRemaining % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (pollTimeRemaining <= 0) {
            clearInterval(pollTimerInterval);
            pollTimerInterval = null;
            if (timerContainer) {
                timerContainer.classList.add('timer-expired');
            }
            if (timerLabelText) {
                timerLabelText.textContent = "Time's up! Nudge the slackers! 🔔";
            }
        } else {
            pollTimeRemaining--;
        }
    }

    updateTimerDisplay(); // run once immediately
    pollTimerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopPollTimer() {
    if (pollTimerInterval) {
        clearInterval(pollTimerInterval);
        pollTimerInterval = null;
    }
    pollTimeRemaining = 120;
    const timerDisplay = document.getElementById('poll-timer-display');
    const timerContainer = document.getElementById('countdown-timer-container');
    const timerLabelText = document.getElementById('timer-label-text');
    if (timerDisplay) {
        timerDisplay.textContent = "02:00";
    }
    if (timerContainer) {
        timerContainer.classList.remove('timer-expired');
    }
    if (timerLabelText) {
        timerLabelText.textContent = "remaining to vote";
    }
}

// Render Poll Results
function renderPollResults() {
    const totalVotes = Object.keys(userVotes).length;
    
    // Count votes per mood
    const counts = { caffeine: 0, meeting: 0, fire: 0, chillin: 0 };
    Object.values(userVotes).forEach(moodId => {
        if (counts[moodId] !== undefined) {
            counts[moodId]++;
        }
    });

    // Sort moods by vote count
    const sortedMoods = Object.keys(counts).map(moodId => ({
        id: moodId,
        count: counts[moodId],
        percentage: totalVotes > 0 ? Math.round((counts[moodId] / totalVotes) * 100) : 0,
        ...MOODS[moodId]
    })).sort((a, b) => b.count - a.count);

    // Render Stats Progress Bars
    resultsBarsContainer.innerHTML = '';
    sortedMoods.forEach((mood, index) => {
        const row = document.createElement('div');
        row.className = `poll-result-row rank-${index}`;
        row.innerHTML = `
            <div class="result-row-info">
                <span class="result-row-title">${mood.emoji} ${mood.title}</span>
                <span class="result-row-percentage">${mood.count} votes (${mood.percentage}%)</span>
            </div>
            <div class="result-bar-container">
                <div class="result-bar-fill" style="width: ${mood.percentage}%"></div>
            </div>
        `;
        resultsBarsContainer.appendChild(row);
    });

    // Load or generate AI Roasts
    loadOrGenerateAIRoasts(sortedMoods[0], sortedMoods[1]);
}

// AI Roast Loader / Generator
async function loadOrGenerateAIRoasts(top1, top2) {
    const cacheKey = `team_days_ai_roasts_${top1.id}_${top2.id}`;
    const cachedRoasts = localStorage.getItem(cacheKey);

    if (cachedRoasts) {
        try {
            const data = JSON.parse(cachedRoasts);
            displayRoasts(data, top1, top2);
            return;
        } catch (e) {
            console.error('Failed to parse cached roasts, re-generating...', e);
        }
    }

    // Show loading state
    aiLoadingContainer.classList.remove('hidden');
    aiRoastsContainer.classList.add('hidden');

    try {
        const roastsData = await fetchRoastsFromGroq(top1, top2);
        localStorage.setItem(cacheKey, JSON.stringify(roastsData));
        displayRoasts(roastsData, top1, top2);
    } catch (error) {
        console.error('Groq API Error, using funny fallback roasts:', error);
        const fallbackData = getFallbackRoasts(top1, top2);
        displayRoasts(fallbackData, top1, top2);
    }
}

// Fetch Roasts from Netlify Function
async function fetchRoastsFromGroq(top1, top2) {
    const response = await fetch('/.netlify/functions/getRoasts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ top1, top2 })
    });

    if (!response.ok) {
        throw new Error(`Netlify Function responded with status ${response.status}`);
    }

    return await response.json();
}

// Fallback Roasts in case API fails
function getFallbackRoasts(top1, top2) {
    const fallbacks = {
        caffeine: {
            roast: "Caffeine-Fueled? Of course. You guys are vibrating at a frequency high enough to phase through walls. The developers are writing code at 500 WPM, most of which compiles into syntax errors, while the Scrum Masters are furiously updating Jira tickets at lightspeed. Someone check their pulses before they try to deploy this caffeine-induced hallucination directly to production.",
            imagePrompt: "A cartoon of a developer with glowing blue eyes typing furiously on three keyboards at once, surrounded by empty coffee mugs, while a scrum master in the background holds a giant coffee pot like a trophy, digital art, high quality"
        },
        meeting: {
            roast: "Meeting Marathon. A Scrum Master's absolute dream, and a developer's worst nightmare. You guys have spent the last six hours 'syncing about syncs' and 'aligning on alignments'. We've achieved 0% code output but 100% synergy. At this point, the developers have mastered the art of nodding while crying inside, and the Scrum Master is drafting a meeting invite to discuss how the meeting went.",
            imagePrompt: "A funny cartoon showing a group of zombies sitting around a conference table looking exhausted, with a cheerful scrum master pointing at a whiteboard full of colorful sticky notes, digital art, bright colors"
        },
        fire: {
            roast: "\"Everything is Fine\" — the ultimate coping mechanism. The server is on fire, the database is throwing tantrums, and the client is calling. But here we are, smiling and sipping tea. The developers are desperately searching StackOverflow while the Scrum Master is scheduling a 'retrospective' to discuss why the building is burning down. Keep smiling, guys, maybe the fire will go out on its own.",
            imagePrompt: "A funny cartoon of a dog sitting in a room that is completely on fire, wearing a tiny party hat and drinking coffee, saying 'this is fine', digital art, vibrant"
        },
        chillin: {
            roast: "Waiting on Blockers. Ah, the sweet smell of doing absolutely nothing under the guise of 'process'. The developers are chillin' in the lobby playing video games because they are waiting on a PR approval that has been sitting there since last Tuesday. Meanwhile, the Scrum Masters are hunting down the blockers like detective sherlocks, only to realize the blocker is a manager who is currently out of office.",
            imagePrompt: "A cartoon of a developer relaxing in a beach lounge chair inside a high-tech office, wearing sunglasses, waiting for a giant hourglass to finish, digital art, funny"
        }
    };

    return {
        top1: fallbacks[top1.id] || { roast: `Roast for ${top1.title}`, imagePrompt: `A funny illustration of ${top1.title}` },
        top2: fallbacks[top2.id] || { roast: `Roast for ${top2.title}`, imagePrompt: `A funny illustration of ${top2.title}` }
    };
}

// Display the roasts and load AI images
function displayRoasts(data, top1, top2) {
    aiLoadingContainer.classList.add('hidden');
    aiRoastsContainer.classList.remove('hidden');

    // Use local uploaded images
    const image1Url = `${top1.id}.png`;
    const image2Url = `${top2.id}.png`;

    aiRoastsContainer.innerHTML = `
        <!-- Top 1 Roast -->
        <div class="roast-card gold-tier">
            <span class="rank-badge">🏆 1st Place Mood: ${top1.emoji}</span>
            <h5 class="roast-mood-title">${top1.title}</h5>
            <p class="roast-text">${data.top1.roast}</p>
            <div class="roast-image-container">
                <div class="image-loading-overlay" id="img-loader-1">
                    <div class="image-spinner"></div>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Loading Image...</span>
                </div>
                <img src="${image1Url}" alt="${top1.title} mood illustration" onload="document.getElementById('img-loader-1').classList.add('fade-out')">
            </div>
        </div>

        <!-- Top 2 Roast -->
        <div class="roast-card silver-tier">
            <span class="rank-badge">🥈 2nd Place Mood: ${top2.emoji}</span>
            <h5 class="roast-mood-title">${top2.title}</h5>
            <p class="roast-text">${data.top2.roast}</p>
            <div class="roast-image-container">
                <div class="image-loading-overlay" id="img-loader-2">
                    <div class="image-spinner"></div>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Loading Image...</span>
                </div>
                <img src="${image2Url}" alt="${top2.title} mood illustration" onload="document.getElementById('img-loader-2').classList.add('fade-out')">
            </div>
        </div>
    `;
}

// Transition between views
function showView(view) {
    if (view === 'dashboard') {
        loginView.classList.remove('active');
        setTimeout(() => {
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            setTimeout(() => {
                dashboardView.classList.add('active');
                renderDashboard();
            }, 50);
        }, 300);
    } else {
        dashboardView.classList.remove('active');
        setTimeout(() => {
            dashboardView.classList.add('hidden');
            loginView.classList.remove('hidden');
            setTimeout(() => {
                loginView.classList.add('active');
            }, 50);
        }, 300);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Handle Login Form Submit
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedUser = usernameSelect.value;
    const passwordVal = passwordInput.value;
    
    if (!selectedUser) {
        showError('Please select your name from the dropdown.');
        return;
    }
    
    if (passwordVal !== DEFAULT_PASSWORD) {
        showError('Incorrect password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    currentUser = selectedUser;
    sessionStorage.setItem('team_days_user', currentUser);
    
    participatedMembers.add(currentUser);
    saveParticipationData();
    
    loginError.classList.add('hidden');
    passwordInput.value = '';
    
    showView('dashboard');
    setTimeout(triggerCelebrationConfetti, 400);
});

function showError(message) {
    errorText.textContent = message;
    loginError.classList.remove('hidden');
}

// Toggle Password Visibility
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    lucide.createIcons();
});

// Mood Card Selection
moodCards.forEach(card => {
    card.addEventListener('click', () => {
        moodCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedMoodId = card.getAttribute('data-mood');
        submitVoteBtn.disabled = false;
    });
});

// Submit Vote Button Click
submitVoteBtn.addEventListener('click', () => {
    if (!selectedMoodId || !currentUser) return;
    
    userVotes[currentUser] = selectedMoodId;
    saveVotesData();
    
    // Ensure they are marked as participated
    participatedMembers.add(currentUser);
    saveParticipationData();

    // Minor confetti on vote submission
    confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.8 }
    });

    renderDashboard();

    // If this was the last vote, trigger full celebration
    if (Object.keys(userVotes).length >= TEAM_MEMBERS.length) {
        setTimeout(triggerCelebrationConfetti, 500);
    }
});

// Celebrate Button Click
celebrateBtn.addEventListener('click', () => {
    triggerCelebrationConfetti();
});

// Logout Button Click
logoutBtn.addEventListener('click', () => {
    // Set score of the logging out person to 0 in the leaderboard
    if (currentUser) {
        const userIdx = leaderboard.findIndex(item => item.name.toLowerCase() === currentUser.toLowerCase());
        if (userIdx !== -1) {
            leaderboard[userIdx].score = 0;
        } else {
            leaderboard.push({ name: currentUser, score: 0 });
        }
        saveLeaderboard();
        renderLeaderboard();
    }

    // Reset quiz state and session playing state
    currentQuestionIndex = 0;
    userAnswers = [];
    selectedOptionIndex = null;
    clearInterval(quizTimerInterval);
    sessionStorage.removeItem('has_played_challenge');
    
    currentUser = null;
    sessionStorage.removeItem('team_days_user');
    stopPollTimer();
    showView('login');
});

// Simulate All Votes (Testing Helper)
simulateVotesBtn.addEventListener('click', () => {
    const moodsList = Object.keys(MOODS);
    
    TEAM_MEMBERS.forEach(member => {
        // Mark everyone as participated
        participatedMembers.add(member);
        
        // Vote for a random mood if they haven't voted yet
        if (!userVotes[member]) {
            const randomMood = moodsList[Math.floor(Math.random() * moodsList.length)];
            userVotes[member] = randomMood;
        }
    });

    saveParticipationData();
    saveVotesData();
    renderDashboard();
    
    triggerCelebrationConfetti();
});

// Reset Data Button Click
resetDataBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all participation and voting data?')) {
        participatedMembers.clear();
        userVotes = {};
        
        saveParticipationData();
        saveVotesData();
        
        // Clear Game Arena state
        localStorage.removeItem('team_days_leaderboard');
        
        // Clear cached AI roasts
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('team_days_ai_roasts_')) {
                localStorage.removeItem(key);
            }
        });

        // Keep current user logged in and active
        if (currentUser) {
            participatedMembers.add(currentUser);
            saveParticipationData();
        }
        
        renderDashboard();
        
        confetti({
            particleCount: 30,
            spread: 40,
            origin: { y: 0.9 }
        });
    }
});

// ==========================================
// AI LITERACY QUIZ LOGIC
// ==========================================

const QUESTIONS = [
    {
        question: "Which of these images of Donald Trump is a Deepfake?",
        hasImages: true,
        options: [
            "q1_option1.png",
            "q1_option2.png",
            "q1_option3.png",
            "q1_option4.png"
        ],
        correctAnswer: 3,
        explanation: "The 4th image is a deepfake! Look closely at the watermark '#deepreckonings' in the corner and the unnatural lighting."
    },
    {
        question: "Which paragraph was written by a real human?",
        subtitle: "One of these was written by a real human — can you spot it?",
        options: [
            "I checked my phone because it buzzed, only to realize I had imagined the vibration.",
            "I picked up my phone after thinking it vibrated, but there wasn't a single notification waiting.",
            "I was sure my phone buzzed in my pocket, but when I looked, nothing had actually happened.",
            "I reached for my phone after feeling what seemed like a vibration, only to find the screen completely empty."
        ],
        correctAnswer: 2,
        explanation: "Option C is the human! It uses simple, conversational wording like 'I was sure my phone buzzed in my pocket' and ends slightly imperfectly with 'nothing had actually happened' (less AI-optimized). Note: In reality, there is no reliable way to identify human text with certainty from a single short paragraph, but this game uses a designated source text."
    },
    {
        question: "7, 10, 8, 11, 9, 12, ?",
        subtitle: "Very Tricky 🧠 — Find the next number in the sequence",
        options: [
            "10",
            "11",
            "12",
            "13"
        ],
        correctAnswer: 0,
        explanation: "The pattern alternates: +3, −2, +3, −2, +3... So 12 − 2 = 10! 🎉"
    },
    {
        question: "Which photo is a REAL person?",
        subtitle: "3 of these are AI-generated faces from 'This Person Does Not Exist'!",
        hasImages: true,
        options: [
            "face_q1.png",
            "face_q2.png",
            "face_q3.png",
            "face_q4.png"
        ],
        correctAnswer: 3,
        explanation: "Option D is a real photograph! The other three are AI-generated. AI faces tend to have overly perfect symmetry and unnaturally smooth skin. Real photos have natural lighting, depth-of-field, and genuine imperfections."
    },
    {
        question: "Which tweet was written by a REAL human? 🐦",
        subtitle: "AI writes like a LinkedIn post. Humans write like... humans.",
        options: [
            "Just burned my toast AGAIN because I was watching cat videos. 10/10 worth it. 🐱🔥",
            "Artificial intelligence is rapidly transforming the landscape of modern digital communication.",
            "Embracing sustainable practices contributes to long-term environmental resilience and well-being.",
            "Innovative technologies continue to disrupt traditional industries across the global economy."
        ],
        correctAnswer: 0,
        explanation: "A is the human tweet! 🎉 Humans write about relatable, silly personal moments with humor and emojis. AI tends to produce formal, buzzword-heavy, corporate-sounding sentences — like options B, C, and D!"
    },
    {
        question: "Which headline is REAL (not AI fake news)? 📰",
        subtitle: "One of these is a real, published news story. The others are AI-generated nonsense!",
        options: [
            "Government Announces Plan to Replace All Politicians with AI by 2030",
            "Scientists Discover Octopuses Dream & Their Skin Flashes Colors While They Do 🐙",
            "New Study Proves Coffee Makes You Live Exactly 7.3 Years Longer",
            "Elon Musk Buys the Moon and Renames It 'X'"
        ],
        correctAnswer: 1,
        explanation: "B is real! 🐙 Scientists genuinely observed octopuses having REM-like sleep with skin color changes — suggesting they may dream! AI fake news often sounds too perfectly outrageous (buying the moon!) or suspiciously precise (7.3 years)."
    },
    {
        question: "Which joke was written by a REAL human comedian? 😂",
        subtitle: "AI can generate jokes, but can it match human wit?",
        options: [
            "I told my wife she was drawing her eyebrows too high. She looked surprised. 😂",
            "Humor is an adaptive mechanism that leverages cognitive incongruity to elicit positive emotional responses.",
            "Comedy is statistically shown to reduce cortisol by 18% based on randomized controlled trials.",
            "Jokes function as neural pattern-interruption events that trigger dopamine reward pathways."
        ],
        correctAnswer: 0,
        explanation: "A is the real human joke! 😂 It has a clever punchline and wordplay — a hallmark of human wit. Options B, C, and D sound like an AI trying to *explain* humor using corporate/academic language instead of actually being funny!"
    }
];

function startQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    selectedOptionIndex = null;

    quizStartContainer.classList.add('hidden');
    quizResultsContainer.classList.add('hidden');
    quizPlayContainer.classList.remove('hidden');

    renderQuestion();
}

function renderQuestion() {
    selectedOptionIndex = null;
    nextQuestionBtn.disabled = true;

    const q = QUESTIONS[currentQuestionIndex];
    quizQuestionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${QUESTIONS.length}`;
    
    // Update progress bar
    const progressPercent = (currentQuestionIndex / QUESTIONS.length) * 100;
    quizProgressBarFill.style.width = `${progressPercent}%`;

    quizQuestionText.innerHTML = q.question;
    
    // Show/hide subtitle
    const subtitleEl = document.getElementById('quiz-question-subtitle');
    if (subtitleEl) {
        if (q.subtitle) {
            subtitleEl.textContent = q.subtitle;
            subtitleEl.classList.remove('hidden');
        } else {
            subtitleEl.classList.add('hidden');
        }
    }
    
    // Render options
    quizOptionsList.innerHTML = '';
    if (q.hasImages) {
        quizOptionsList.classList.add('has-images');
    } else {
        quizOptionsList.classList.remove('has-images');
    }
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        if (q.hasImages) {
            btn.classList.add('image-option');
            btn.innerHTML = `<img src="${opt}" class="option-image" alt="Option ${String.fromCharCode(65 + idx)}" />`;
            btn.addEventListener('click', () => {
                selectOption(idx);
                // Auto-advance after brief highlight
                setTimeout(() => nextQuestion(), 600);
            });
        } else {
            btn.innerHTML = `
                <span class="option-badge">${String.fromCharCode(65 + idx)}</span>
                <span class="option-text">${opt}</span>
            `;
            btn.addEventListener('click', () => selectOption(idx));
        }
        quizOptionsList.appendChild(btn);
    });

    // Button text
    if (currentQuestionIndex === QUESTIONS.length - 1) {
        nextBtnText.textContent = "Finish Challenge";
    } else {
        nextBtnText.textContent = "Next Question";
    }

    // Start 2 minutes question timer
    startQuestionTimer();
}

function selectOption(index) {
    selectedOptionIndex = index;
    
    // Highlight selected option
    const options = quizOptionsList.querySelectorAll('.quiz-option-btn');
    options.forEach((opt, idx) => {
        if (idx === index) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });

    nextQuestionBtn.disabled = false;
}

function nextQuestion() {
    clearInterval(quizTimerInterval);
    
    const ans = selectedOptionIndex !== null ? selectedOptionIndex : -1;
    userAnswers.push(ans);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    clearInterval(quizTimerInterval);
    quizPlayContainer.classList.add('hidden');
    quizResultsContainer.classList.remove('hidden');
    
    // Set play flag for session
    sessionStorage.setItem('has_played_challenge', 'true');

    // Calculate score
    let score = 0;
    QUESTIONS.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctAnswer) {
            score++;
        }
    });

    // Save/update score for current logged in user
    if (currentUser) {
        const userEntryIndex = leaderboard.findIndex(item => item.name.toLowerCase() === currentUser.toLowerCase());
        if (userEntryIndex !== -1) {
            if (score > leaderboard[userEntryIndex].score) {
                leaderboard[userEntryIndex].score = score;
            }
        } else {
            leaderboard.push({ name: currentUser, score: score });
        }
        saveLeaderboard();
        renderLeaderboard();
    }

    // Update score display in results UI
    if (quizUserScore) {
        quizUserScore.innerHTML = `${score} <span>/ 7</span>`;
    }

    if (restartQuizBtn) {
        restartQuizBtn.classList.add('hidden');
    }

    renderReviewList();
    triggerCelebrationConfetti();
}

function renderReviewList() {
    quizReviewList.innerHTML = '';

    QUESTIONS.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const isCorrect = userAns === q.correctAnswer;

        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;

        const userOptionText = userAns === -1 
            ? '<span class="text-error" style="color: var(--error);">Timed Out / Unanswered ⏳</span>'
            : (q.hasImages ? `<img src="${q.options[userAns]}" class="review-image" />` : q.options[userAns]);
        const correctOptionText = q.hasImages ? `<img src="${q.options[q.correctAnswer]}" class="review-image" />` : q.options[q.correctAnswer];

        reviewItem.innerHTML = `
            <h5 class="review-question">Q${idx + 1}: ${q.question}</h5>
            <div class="review-answers">
                <div class="review-answer-line user-answer ${isCorrect ? '' : 'wrong'}">
                    <i data-lucide="${isCorrect ? 'check-circle-2' : 'x-circle'}" style="color: ${isCorrect ? 'var(--success)' : 'var(--error)'}; width: 16px; height: 16px;"></i>
                    <span>Your Answer: <br><strong>${userOptionText}</strong></span>
                </div>
                ${!isCorrect ? `
                <div class="review-answer-line correct-answer">
                    <i data-lucide="check-circle-2" style="color: var(--success); width: 16px; height: 16px;"></i>
                    <span>Correct Answer: <br><strong>${correctOptionText}</strong></span>
                </div>
                ` : ''}
            </div>
            <div class="review-explanation">
                <strong>Explanation:</strong> ${q.explanation}
            </div>
        `;

        quizReviewList.appendChild(reviewItem);
    });

    lucide.createIcons();
}

// ==========================================
// QUIZ EVENT LISTENERS
// ==========================================

// Navigation to Game Arena (Quiz)
gameArenaNavBtn.addEventListener('click', () => {
    dashboardView.classList.remove('active');
    setTimeout(() => {
        dashboardView.classList.add('hidden');
        gameArenaView.classList.remove('hidden');
        setTimeout(() => {
            gameArenaView.classList.add('active');
            
            // Initialize/update leaderboard
            initLeaderboard();

            // Check if user has already completed the quiz in this session
            const hasCompleted = sessionStorage.getItem('has_played_challenge') === 'true';
            
            if (hasCompleted) {
                // Show results screen directly, hide others
                quizStartContainer.classList.add('hidden');
                quizPlayContainer.classList.add('hidden');
                quizResultsContainer.classList.remove('hidden');
                if (restartQuizBtn) restartQuizBtn.classList.add('hidden');
            } else {
                // Show start screen, hide others
                quizStartContainer.classList.remove('hidden');
                quizPlayContainer.classList.add('hidden');
                quizResultsContainer.classList.add('hidden');
                if (restartQuizBtn) restartQuizBtn.classList.remove('hidden');
            }
        }, 50);
    }, 300);
});

// Back to Dashboard
backToDashboardBtn.addEventListener('click', () => {
    gameArenaView.classList.remove('active');
    setTimeout(() => {
        gameArenaView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        setTimeout(() => {
            dashboardView.classList.add('active');
            renderDashboard();
        }, 50);
    }, 300);
});

// Start Quiz Button
startQuizBtn.addEventListener('click', startQuiz);

// Next Question Button
nextQuestionBtn.addEventListener('click', nextQuestion);

// Play Again Button
restartQuizBtn.addEventListener('click', startQuiz);

// Clear Leaderboard Button
const clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn');
if (clearLeaderboardBtn) {
    clearLeaderboardBtn.addEventListener('click', () => {
        localStorage.removeItem('team_days_leaderboard');
        initLeaderboard();
        confetti({ particleCount: 30, spread: 45 });
    });
}

// ==========================================
// APP INITIALIZATION
// ==========================================
function init() {
    lucide.createIcons();
    loadParticipationData();
    loadVotesData();
    initLeaderboard();
    
    const savedUser = sessionStorage.getItem('team_days_user');
    if (savedUser && TEAM_MEMBERS.includes(savedUser)) {
        currentUser = savedUser;
        participatedMembers.add(currentUser);
        saveParticipationData();
        
        loginView.classList.remove('active');
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        dashboardView.classList.add('active');
        renderDashboard();
    }
}

document.addEventListener('DOMContentLoaded', init);

// ==========================================
// FUN WITH AI (OPINION WHEEL)
// ==========================================
const funAiNavBtn = document.getElementById('fun-ai-nav-btn');
const funAiBackBtn = document.getElementById('fun-ai-back-btn');
const funAiView = document.getElementById('fun-ai-view');

const wheelCanvas = document.getElementById('wheel-canvas');
const spinBtn = document.getElementById('spin-btn');
const wheelResultCard = document.getElementById('wheel-result-card');
const wheelResultName = document.getElementById('wheel-result-name');

let isSpinning = false;
let currentAngle = 0;

// Tab Navigation
if (funAiNavBtn) {
    funAiNavBtn.addEventListener('click', () => {
        dashboardView.classList.remove('active');
        setTimeout(() => {
            dashboardView.classList.add('hidden');
            funAiView.classList.remove('hidden');
            setTimeout(() => {
                funAiView.classList.add('active');
                initWheel();
            }, 50);
        }, 300);
    });
}

if (funAiBackBtn) {
    funAiBackBtn.addEventListener('click', () => {
        funAiView.classList.remove('active');
        setTimeout(() => {
            funAiView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            setTimeout(() => {
                dashboardView.classList.add('active');
                renderDashboard();
            }, 50);
        }, 300);
    });
}

// Draw the static wheel
function initWheel() {
    if (!wheelCanvas) return;
    drawWheel(0);
    wheelResultCard.classList.add('hidden');
    isSpinning = false;
}

function drawWheel(angleOffset) {
    const ctx = wheelCanvas.getContext('2d');
    const size = wheelCanvas.width;
    const center = size / 2;
    const radius = center - 10;
    const numSectors = TEAM_MEMBERS.length;
    const sectorAngle = (Math.PI * 2) / numSectors;

    ctx.clearRect(0, 0, size, size);

    // Color Palette
    const colors = [
        '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', 
        '#f43f5e', '#ef4444', '#f97316', '#f59e0b', 
        '#eab308', '#84cc16', '#10b981', '#06b6d4', 
        '#3b82f6', '#4f46e5'
    ];

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angleOffset);

    for (let i = 0; i < numSectors; i++) {
        const startAngle = i * sectorAngle;
        const endAngle = startAngle + sectorAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e1e38';
        ctx.stroke();

        // Draw Member Name
        ctx.save();
        ctx.rotate(startAngle + sectorAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        // Capitalize name
        const name = capitalize(TEAM_MEMBERS[i]);
        ctx.fillText(name, radius - 20, 4);
        ctx.restore();
    }

    // Draw outer boundary ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    ctx.restore();
}

// Spin Animation
if (spinBtn) {
    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        isSpinning = true;
        wheelResultCard.classList.add('hidden');

        const numSectors = TEAM_MEMBERS.length;
        const targetIndex = Math.floor(Math.random() * numSectors);
        const sectorAngle = 360 / numSectors;
        
        // Calculate stop angle (aligned with the pointer at top, i.e. 270 degrees)
        let stopAngle = 270 - (targetIndex * sectorAngle) - (sectorAngle / 2);
        stopAngle = stopAngle % 360;
        if (stopAngle < 0) stopAngle += 360;
        
        let degreesToRotate = stopAngle - currentAngle;
        if (degreesToRotate < 0) degreesToRotate += 360;
        
        const totalSpins = 4; // Number of full spins
        const finalAngle = currentAngle + (totalSpins * 360) + degreesToRotate;

        const duration = 4000; // 4 seconds
        const startTime = performance.now();
        const startAngleVal = currentAngle;

        // Cubic-bezier easeOut approximation
        function easeOut(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function animateWheel(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentAngleVal = startAngleVal + (finalAngle - startAngleVal) * easeOut(progress);
            // Convert to radians for drawing
            drawWheel((currentAngleVal * Math.PI) / 180);

            if (progress < 1) {
                requestAnimationFrame(animateWheel);
            } else {
                currentAngle = finalAngle % 360;
                isSpinning = false;
                
                // Show result name
                const winnerName = TEAM_MEMBERS[targetIndex];
                wheelResultName.textContent = capitalize(winnerName);
                wheelResultCard.classList.remove('hidden');

                // Confetti!
                confetti({
                    particleCount: 60,
                    spread: 50,
                    origin: { y: 0.8 }
                });
            }
        }

        requestAnimationFrame(animateWheel);
    });
}

// ==========================================
// TABS NAVIGATION (WHEEL VS DICE)
// ==========================================
const tabWheel = document.getElementById('fun-ai-tab-wheel');
const tabDice = document.getElementById('fun-ai-tab-dice');
const wheelContent = document.getElementById('fun-ai-wheel-content');
const diceContent = document.getElementById('fun-ai-dice-content');

if (tabWheel && tabDice) {
    tabWheel.addEventListener('click', () => {
        tabWheel.classList.add('btn-primary');
        tabWheel.classList.remove('btn-secondary');
        tabDice.classList.add('btn-secondary');
        tabDice.classList.remove('btn-primary');
        
        wheelContent.classList.remove('hidden');
        diceContent.classList.add('hidden');
    });

    tabDice.addEventListener('click', () => {
        tabDice.classList.add('btn-primary');
        tabDice.classList.remove('btn-secondary');
        tabWheel.classList.add('btn-secondary');
        tabWheel.classList.remove('btn-primary');
        
        diceContent.classList.remove('hidden');
        wheelContent.classList.add('hidden');
        
        initDiceGame();
    });
}

// ==========================================
// DICE GAME ENGINE
// ==========================================
const rollDiceBtn = document.getElementById('roll-dice-btn');
const diceCube = document.getElementById('dice-cube');
const aiDicePredText = document.getElementById('ai-dice-prediction-text');
const diceResultAlert = document.getElementById('dice-result-alert');
const diceLeaderboardTbody = document.getElementById('dice-leaderboard-tbody');
const predictBtns = document.querySelectorAll('.predict-btn');

let selectedDicePrediction = null;
let isRolling = false;
let diceLeaderboard = [];

// Initialize game
function initDiceGame() {
    selectedDicePrediction = null;
    isRolling = false;
    
    // Clear selection UI
    predictBtns.forEach(btn => btn.classList.remove('active'));
    if (rollDiceBtn) rollDiceBtn.disabled = true;
    
    if (diceResultAlert) {
        diceResultAlert.classList.add('hidden');
    }
    if (aiDicePredText) {
        aiDicePredText.textContent = 'Waiting...';
    }
    
    // Load leaderboard
    initDiceLeaderboard();
}

function initDiceLeaderboard() {
    const stored = localStorage.getItem('team_days_dice_leaderboard');
    if (stored) {
        diceLeaderboard = JSON.parse(stored);
    } else {
        // Start completely empty (only active rolls show up)
        diceLeaderboard = [];
        saveDiceLeaderboard();
    }
    renderDiceLeaderboard();
}

function saveDiceLeaderboard() {
    localStorage.setItem('team_days_dice_leaderboard', JSON.stringify(diceLeaderboard));
}

function renderDiceLeaderboard() {
    if (!diceLeaderboardTbody) return;
    diceLeaderboardTbody.innerHTML = '';
    
    if (diceLeaderboard.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0.5rem; font-style: italic;">
                Leaderboard empty. Start rolling! 🎲
            </td>
        `;
        diceLeaderboardTbody.appendChild(tr);
        return;
    }
    
    // Sort by accuracy percentage (correct/total), descending
    const sorted = [...diceLeaderboard].sort((a, b) => {
        const rateA = a.total > 0 ? a.correct / a.total : 0;
        const rateB = b.total > 0 ? b.correct / b.total : 0;
        if (rateB !== rateA) {
            return rateB - rateA;
        }
        return b.correct - a.correct;
    });
    
    sorted.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        // Highlight active user or AI row
        if (item.isAI) {
            tr.style.background = 'rgba(236, 72, 153, 0.15)';
            tr.style.borderLeft = '3px solid #ec4899';
        } else if (currentUser && item.name.toLowerCase() === currentUser.toLowerCase()) {
            tr.classList.add('current-user-row');
        }
        
        let medal = index + 1;
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        const displayLabel = item.isAI ? `🤖 <strong>${item.name}</strong>` : capitalize(item.name);
        
        tr.innerHTML = `
            <td><span class="rank-badge">${medal}</span></td>
            <td>${displayLabel}</td>
            <td style="text-align: right;"><span class="score-val-txt">${item.correct}</span> / ${item.total} (${Math.round((item.correct / item.total) * 100)}%)</td>
        `;
        diceLeaderboardTbody.appendChild(tr);
    });
}

// Predict button clicks
predictBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isRolling) return;
        
        predictBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDicePrediction = parseInt(btn.getAttribute('data-val'));
        
        if (rollDiceBtn) rollDiceBtn.disabled = false;
    });
});

// Roll Dice handler
if (rollDiceBtn) {
    rollDiceBtn.addEventListener('click', () => {
        if (isRolling || selectedDicePrediction === null) return;
        isRolling = true;
        rollDiceBtn.disabled = true;
        
        if (diceResultAlert) {
            diceResultAlert.classList.add('hidden');
        }
        
        // 1. Generate AI Prediction
        const aiPrediction = Math.floor(Math.random() * 6) + 1;
        if (aiDicePredText) {
            aiDicePredText.textContent = aiPrediction;
        }
        
        // 2. Pick actual roll result
        const actualResult = Math.floor(Math.random() * 6) + 1;
        
        // Rotation degrees for each face
        const faceRotations = {
            1: { x: 0, y: 0 },
            2: { x: 0, y: -90 },
            3: { x: 0, y: -180 },
            4: { x: 0, y: 90 },
            5: { x: -90, y: 0 },
            6: { x: 90, y: 0 }
        };
        
        // Add random extra spins for roll effect
        const targetRot = faceRotations[actualResult];
        const extraX = (Math.floor(Math.random() * 3) + 3) * 360;
        const extraY = (Math.floor(Math.random() * 3) + 3) * 360;
        
        const finalX = targetRot.x + extraX;
        const finalY = targetRot.y + extraY;
        
        // Apply CSS 3D Transform rotation
        if (diceCube) {
            diceCube.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
        }
        
        // 3. Wait for animation to finish
        setTimeout(() => {
            isRolling = false;
            
            const userCorrect = selectedDicePrediction === actualResult;
            const aiCorrect = aiPrediction === actualResult;
            
            // Update User Score in leaderboard
            if (currentUser) {
                let userEntry = diceLeaderboard.find(item => item.name.toLowerCase() === currentUser.toLowerCase());
                if (!userEntry) {
                    userEntry = { name: currentUser, correct: 0, total: 0, isAI: false };
                    diceLeaderboard.push(userEntry);
                }
                userEntry.total += 1;
                if (userCorrect) userEntry.correct += 1;
            }
            
            // Update AI Score in leaderboard
            let aiEntry = diceLeaderboard.find(item => item.isAI);
            if (!aiEntry) {
                aiEntry = { name: 'AI (Grok)', correct: 0, total: 0, isAI: true };
                diceLeaderboard.push(aiEntry);
            }
            aiEntry.total += 1;
            if (aiCorrect) aiEntry.correct += 1;
            
            saveDiceLeaderboard();
            renderDiceLeaderboard();
            
            // Display Alert
            if (diceResultAlert) {
                diceResultAlert.classList.remove('hidden');
                
                let resultMessage = `🎲 The dice rolled: <strong>${actualResult}</strong>!<br>`;
                
                if (userCorrect && aiCorrect) {
                    resultMessage += `🎉 Double Win! Both you and AI predicted correctly!`;
                    diceResultAlert.style.background = 'rgba(16, 185, 129, 0.15)';
                    diceResultAlert.style.border = '1px solid var(--success)';
                    diceResultAlert.style.color = '#fff';
                    confetti({ particleCount: 50, spread: 60 });
                } else if (userCorrect) {
                    resultMessage += `🥳 You Win! AI predicted ${aiPrediction} and lost!`;
                    diceResultAlert.style.background = 'rgba(16, 185, 129, 0.15)';
                    diceResultAlert.style.border = '1px solid var(--success)';
                    diceResultAlert.style.color = '#fff';
                    confetti({ particleCount: 40, spread: 50 });
                } else if (aiCorrect) {
                    resultMessage += `🤖 AI Wins! AI predicted correctly but you predicted ${selectedDicePrediction}.`;
                    diceResultAlert.style.background = 'rgba(239, 68, 68, 0.15)';
                    diceResultAlert.style.border = '1px solid var(--error)';
                    diceResultAlert.style.color = '#fff';
                } else {
                    resultMessage += `😅 No one won! You predicted ${selectedDicePrediction}, AI predicted ${aiPrediction}. Try again!`;
                    diceResultAlert.style.background = 'rgba(255, 255, 255, 0.05)';
                    diceResultAlert.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    diceResultAlert.style.color = 'var(--text-secondary)';
                }
                
                diceResultAlert.innerHTML = resultMessage;
            }
            
            rollDiceBtn.disabled = false;
        }, 1500);
    });
}

// Clear Dice Leaderboard
const clearDiceLeaderboardBtn = document.getElementById('clear-dice-leaderboard-btn');
if (clearDiceLeaderboardBtn) {
    clearDiceLeaderboardBtn.addEventListener('click', () => {
        localStorage.removeItem('team_days_dice_leaderboard');
        initDiceLeaderboard();
        confetti({ particleCount: 30, spread: 45 });
    });
}

// Real-time Leaderboard Synchronizer (Across multiple browser tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'team_days_leaderboard') {
        const stored = localStorage.getItem('team_days_leaderboard');
        if (stored) {
            leaderboard = JSON.parse(stored);
        } else {
            leaderboard = [];
        }
        renderLeaderboard();
    }
    if (e.key === 'team_days_dice_leaderboard') {
        const stored = localStorage.getItem('team_days_dice_leaderboard');
        if (stored) {
            diceLeaderboard = JSON.parse(stored);
        } else {
            diceLeaderboard = [];
        }
        renderDiceLeaderboard();
    }
});
