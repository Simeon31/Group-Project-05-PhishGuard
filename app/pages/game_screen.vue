<script setup>
import { ref, computed, onUnmounted } from 'vue';
// Import Heroicons
<<<<<<< HEAD
import { InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, PlayIcon, EyeIcon, EyeSlashIcon, XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/vue/24/solid';
=======
import { InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, PlayIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, FireIcon, ClockIcon } from '@heroicons/vue/24/solid';
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338

// We use a 'ref' to track if the game has started. 
// true = show game, false = show welcome screen.
const gameStarted = ref(false);
const dontShowAgain = ref(false);
const showHelpModal = ref(false); // Controls the help popup

// Track active menu item
const activeMenu = ref('inbox');

// Game Stats
const roundNumber = ref(1);
<<<<<<< HEAD
const lives = ref(4); // CHANGED: Set to 4 to demonstrate the "lost heart" visual
=======
const lives = ref(5);
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
const correctCount = ref(0);
const incorrectCount = ref(0);
const streak = ref(0);
const timeLeft = ref(30);
let timerInterval = null;
const feedback = ref(null); // { visible: boolean, isCorrect: boolean, message: string, title: string }
const loading = ref(false);
const error = ref(null);

// --- EMAIL DATA (Fetched from API) ---
const emails = ref([]);
const selectedEmailId = ref(null);

// Fetch scenarios from API
const fetchScenarios = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await $fetch('/api/scenarios', {
      query: {
        difficulty: roundNumber.value, // Fetch emails for current difficulty
        limit: 10
      }
    });

    if (response.success && response.data) {
      emails.value = response.data;
      if (emails.value.length > 0) {
        selectedEmailId.value = emails.value[0].id;
      }
    }
  } catch (err) {
    console.error('Failed to fetch scenarios:', err);
    error.value = 'Failed to load emails. Please try again.';
  } finally {
    loading.value = false;
  }
};

const startTimer = () => {
  stopTimer();
  timeLeft.value = 30; // Reset to 30s per email
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      stopTimer();
      // Time out counts as a mistake? Or just notify? 
      // User case: "mimics high-pressure environment". 
      // Let's treat valid timeout as a passive choice if we want to be strict, 
      // or just force a decision. For now, we'll just pause and show 'Time's Up'.
      handleDecision(null, true);
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
};

const selectEmail = (id) => {
  selectedEmailId.value = id;
  const email = emails.value.find(e => e.id === id);
  if (email) email.read = true;
  // Reset timer on new email selection
  startTimer();
  // Clear any existing feedback when switching
  feedback.value = null;
};

// Computed property to get the full object of the currently selected email
const currentEmail = computed(() => {
  return emails.value.find(e => e.id === selectedEmailId.value);
});

const handleDecision = (markedSafe, isTimeout = false) => {
  stopTimer();
  if (!currentEmail.value) return;

  const isActuallyPhishing = currentEmail.value.isPhishing;
  let success = false;
  let title = "";
  let message = "";

  if (isTimeout) {
    success = false;
    title = "Time's Up!";
    message = "You ran out of time. In high-pressure environments, hesitation can be risky, but always take a moment to verify.";
    streak.value = 0;
    incorrectCount.value++;
    lives.value--;
  } else {
    // Logic: 
    // markedSafe=true AND isPhishing=false -> CORRECT
    // markedSafe=false (Reported) AND isPhishing=true -> CORRECT
    success = (markedSafe && !isActuallyPhishing) || (!markedSafe && isActuallyPhishing);

    if (success) {
      title = "Correct!";
      message = markedSafe
        ? "Good eye. This email is safe."
        : "Well done! You spotted the phishing attempt.";
      streak.value++;
      correctCount.value++;
      // Difficulty progression: if streak % 3 == 0, maybe increase difficulty? 
      // For now, simpler implementation just tracks streak.
    } else {
      title = "Incorrect";
      message = currentEmail.value.educationalMessage || currentEmail.value.reason || "You missed the signs.";
      streak.value = 0;
      incorrectCount.value++;
      lives.value--;
    }
  }

  feedback.value = { visible: true, isCorrect: success, title, message };
};

const closeFeedback = () => {
  feedback.value = null;
  // Auto-advance or just let user pick next? 
  // Let's just restart timer if they stay on same email, 
  // OR better, marking an email as "done" would be good UX.
  // For this prototype, we just let them click another email or re-read.
  // Ideally, remove email from list or mark 'completed'.
};

const startGame = async () => {
  console.log('Game started! transitions occurring...');
  gameStarted.value = true;
  await fetchScenarios(); // Load scenarios from API
  startTimer();
};

const viewExample = () => {
  console.log('Viewing example...');
  showHelpModal.value = true;
};

const toggleDontShow = () => {
  dontShowAgain.value = !dontShowAgain.value;
};

<<<<<<< HEAD
const toggleHelpModal = () => {
  showHelpModal.value = !showHelpModal.value;
};
=======
onUnmounted(() => {
  stopTimer();
});
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
</script>

<template>
  <div class="page-container">
<<<<<<< HEAD
    
    <!-- === WELCOME SCREEN (Overlay) === -->
    <Transition name="fade" appear>
      <div v-if="!gameStarted" class="welcome-wrapper">
        <div class="welcome-card">
          
=======

    <Transition name="fade" appear>
      <div v-if="!gameStarted" class="welcome-wrapper">
        <div class="welcome-card">

          <!-- 1. Header: Logo Top Left (Centered in row) -->
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
          <div class="welcome-header-row">
            <img src="/Images/PhishGuard_Logo.png" alt="Logo" class="welcome-logo-small" />
            <div class="welcome-title-small">Welcome to phishguard</div>
          </div>

          <div class="welcome-hero">
            <h2>Spot the red flags. Stay safe.</h2>
            <p>Practice phishing detection in a simulated inbox.</p>
          </div>

          <div class="features-grid">
            <div class="feature-box">
              <span class="f-title">🧭 Decide</span>
              <span class="f-divider">|</span>
              <span class="f-desc">Accept or flag each email</span>
            </div>
            <div class="feature-box">
              <span class="f-title">💡 Learn instantly</span>
              <span class="f-divider">|</span>
              <span class="f-desc">Quick feedback after every choice</span>
            </div>
            <div class="feature-box">
              <span class="f-title">📈 Score & progress</span>
              <span class="f-divider">|</span>
              <span class="f-desc">Streaks, levels, harder attacks</span>
            </div>
          </div>

          <div class="look-for-section">
            <div class="look-for-title">Look for:</div>
            <ul class="look-for-list">
              <li>⚠️ Sender domain that looks slightly incorrect</li>
              <li>⚠️ Threatening language (e.g. “now”, “account locked”)</li>
              <li>⚠️ Mismatched links or unexpected attachments</li>
            </ul>
          </div>

          <div class="welcome-footer">
<<<<<<< HEAD
            <button 
              @click="toggleDontShow" 
              class="secondary-btn toggle-btn"
              :class="{ 'active': dontShowAgain }"
            >
=======
            <!-- "Don't show again" as a toggle button -->
            <button @click="toggleDontShow" class="secondary-btn toggle-btn" :class="{ 'active': dontShowAgain }">
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
              <span v-if="dontShowAgain">☑ Don't show again</span>
              <span v-else>☐ Don't show again</span>
            </button>

            <div class="footer-buttons">
              <button @click="viewExample" class="secondary-btn">
                VIEW EXAMPLE
              </button>
              <button @click="startGame" class="primary-btn">
                START ROUND
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <!-- === GAME UI === -->
    <div v-if="gameStarted" class="game-ui">

      <!-- === SIDEBAR & STATS (LEFT SIDE) === -->

      <div class="logo-container">
        <img src="/Images/PhishGuard_Logo.png" alt="PhishGuard Logo" class="logo-icon" />
        <span class="logo-text">PhishGuard</span>
      </div>

      <div class="sidebar-container">
        <div class="menu-item" :class="{ active: activeMenu === 'inbox' }" @click="activeMenu = 'inbox'">
          <InboxIcon class="menu-icon" />
          <span class="menu-text">Inbox</span>
        </div>
        <div class="menu-item" :class="{ active: activeMenu === 'dashboard' }" @click="activeMenu = 'dashboard'">
          <PresentationChartBarIcon class="menu-icon" />
          <span class="menu-text">Dashboard</span>
        </div>
        <div class="menu-item" :class="{ active: activeMenu === 'settings' }" @click="activeMenu = 'settings'">
          <Cog6ToothIcon class="menu-icon" />
          <span class="menu-text">Settings</span>
        </div>
      </div>

      <div class="stats-container">
        <div class="round-text">ROUND {{ roundNumber }}</div>

        <div class="timer-display" :class="{ 'low-time': timeLeft <= 5 }">
          <ClockIcon class="timer-icon" />
          <span>00:{{ timeLeft < 10 ? '0' + timeLeft : timeLeft }}</span>
        </div>

        <div class="lives-wrapper">
          <HeartIcon v-for="n in 5" :key="n" class="heart-icon" :class="{ 'lost': n > lives }" />
        </div>

        <div class="streak-wrapper" v-if="streak > 1">
          <FireIcon class="streak-icon" />
          <span>{{ streak }} Streak!</span>
        </div>

        <div class="score-wrapper">
          <div class="score-item">
            <CheckCircleIcon class="score-icon correct-color" />
            <span class="score-text">{{ correctCount }}</span>
          </div>
          <div class="score-item">
            <XCircleIcon class="score-icon incorrect-color" />
            <span class="score-text">{{ incorrectCount }}</span>
          </div>
        </div>
      </div>

      <!-- NEW: Bottom Left Guide Button (Positioned Absolute now) -->
      <button class="bottom-left-btn" @click="toggleHelpModal">
        <QuestionMarkCircleIcon class="btn-icon" />
        <span>GUIDE</span>
      </button>

      <!-- === MAIL INTERFACE (RIGHT SIDE) === -->
      <div class="mail-container">

        <!-- 1. Inbox List -->
        <div class="inbox-list">
          <div class="section-header">Inbox</div>

          <div class="email-items-wrapper">
            <div v-for="email in emails" :key="email.id" class="email-item"
              :class="{ 'selected': selectedEmailId === email.id, 'unread': !email.read }"
              @click="selectEmail(email.id)">
              <div class="email-avatar">{{ email.initials }}</div>
              <div class="email-details">
                <div class="email-top-row">
                  <span class="email-sender">{{ email.sender }}</span>
                  <span class="email-date">{{ email.date }}</span>
                </div>
                <div class="email-subject">{{ email.subject }}</div>
                <div class="email-preview">{{ email.preview }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Message Preview (Reading Pane) -->
        <div class="message-preview">
<<<<<<< HEAD
          
          <div v-if="currentEmail" class="email-content-wrapper">
=======

          <!-- Loading State -->
          <div v-if="loading" class="empty-state">
            <div class="loading-spinner"></div>
            <p>Loading scenarios...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="empty-state">
            <XCircleIcon class="empty-icon error-icon" />
            <p>{{ error }}</p>
            <button @click="fetchScenarios" class="primary-btn">Retry</button>
          </div>

          <!-- Dynamic Content -->
          <div v-else-if="currentEmail" class="email-content-wrapper">

>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
            <div class="email-header-area">
              <div class="email-subject-large">{{ currentEmail.subject }}</div>
              <div class="email-meta-row">
                <div class="email-avatar large">{{ currentEmail.initials }}</div>
                <div class="sender-info">
                  <span class="sender-name">{{ currentEmail.sender }}</span>
                  <span class="sender-email">&lt;{{ currentEmail.sender_email }}&gt;</span>
                </div>
                <div class="email-timestamp">{{ currentEmail.date }}</div>
              </div>
            </div>

            <div class="email-body-area">
              <div v-html="currentEmail.body" class="email-body-content"></div>
            </div>
<<<<<<< HEAD
=======

            <!-- ACTION FOOTER -->
            <div class="email-action-footer">
              <button @click="handleDecision(true)" class="action-btn safe-btn">
                <ShieldCheckIcon class="btn-icon" />
                Mark Safe
              </button>
              <button @click="handleDecision(false)" class="action-btn phish-btn">
                <ExclamationTriangleIcon class="btn-icon" />
                Report Phishing
              </button>
            </div>

>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
          </div>

          <div v-else class="empty-state">
            <InboxIcon class="empty-icon" />
            <p>Select an email to read</p>
          </div>

        </div>
      </div>

      <!-- FEEDBACK MODAL -->
      <Transition name="fade">
        <div v-if="feedback" class="feedback-overlay">
          <div class="feedback-modal" :class="feedback.isCorrect ? 'modal-correct' : 'modal-incorrect'">
            <div class="modal-icon-wrapper">
              <CheckCircleIcon v-if="feedback.isCorrect" class="modal-icon" />
              <XCircleIcon v-else class="modal-icon" />
            </div>
            <div class="modal-title">{{ feedback.title }}</div>
            <div class="modal-message">{{ feedback.message }}</div>
            <button @click="closeFeedback" class="primary-btn modal-btn">CONTINUE</button>
          </div>
        </div>
      </Transition>

    </div>

    <!-- === HELP/EXAMPLES MODAL === -->
    <Transition name="fade">
      <div v-if="showHelpModal" class="modal-overlay" @click.self="toggleHelpModal">
        <div class="modal-card">
          <button class="close-btn" @click="toggleHelpModal">
            <XMarkIcon class="close-icon" />
          </button>
          
          <h2 class="modal-title">Examples & Tips</h2>
          
          <div class="modal-content">
            <!-- 3 Pop-up Containers with Animation -->
            <div class="guide-grid">
              <div class="guide-box"></div>
              <div class="guide-box"></div>
              <div class="guide-box"></div>
            </div>

            <!-- Return Button -->
            <div class="modal-footer">
              <button @click="toggleHelpModal" class="primary-btn return-btn">
                RETURN TO GAME
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* --- IMPORT GOOGLE FONT (Gemunu Libre) --- */
@import url('https://fonts.googleapis.com/css2?family=Gemunu+Libre:wght@400;700&display=swap');

.page-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  /* Background setup */
  background-image: linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url('/Images/background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #0a0e14;
}

/* --- WELCOME SCREEN STYLES --- */
.welcome-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(8px);
  z-index: 50;
  background: rgba(0, 0, 0, 0.7);
}

.welcome-card {
<<<<<<< HEAD
  background: rgb(23, 28, 42); 
  padding: 30px; 
=======
  background: rgb(23, 28, 42);
  /* Reduced padding to fit better */
  padding: 30px;
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  color: #e2e8f0;
  text-align: center;
}

<<<<<<< HEAD
/* Header */
.welcome-header-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 5px; }
.welcome-logo-small { width: 80px; height: auto; }
.welcome-title-small { font-family: 'Gemunu Libre', sans-serif; font-size: 2.8rem; font-weight: 600; color: white; letter-spacing: 2px; text-transform: uppercase; }

/* Hero Text */
.welcome-hero { margin-bottom: 20px; }
.welcome-hero h2 { font-family: 'Segoe UI', sans-serif; font-size: 1.4rem; font-weight: 600; color: #00e5ff; margin: 0 0 5px 0; }
.welcome-hero p { font-size: 1rem; color: #94a3b8; margin: 0; }

/* Features Grid */
.features-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; text-align: left; }
.feature-box { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 15px; display: flex; align-items: center; }
.f-title { font-family: 'Gemunu Libre', sans-serif; font-size: 1.3rem; font-weight: 700; color: white; white-space: nowrap; }
.f-divider { font-family: 'Gemunu Libre', sans-serif; font-size: 1.3rem; color: #00e5ff; margin: 0 10px; font-weight: 700; }
.f-desc { font-family: 'Gemunu Libre', sans-serif; font-size: 1.2rem; color: #cbd5e1; white-space: nowrap; }

/* Look For */
.look-for-section { background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 10px 15px; margin-bottom: 20px; text-align: left; }
.look-for-title { font-weight: 700; color: #e2e8f0; margin-bottom: 5px; }
.look-for-list { list-style: none; padding: 0; margin: 0; }
.look-for-list li { font-size: 0.9rem; color: #94a3b8; margin-bottom: 3px; }

/* Footer */
.welcome-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px; }
.footer-buttons { display: flex; gap: 10px; }
=======
/* 1. Header (Centered) */
.welcome-header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 5px;
}

.welcome-logo-small {
  width: 80px;
  height: auto;
}

.welcome-title-small {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 2.8rem;
  font-weight: 600;
  color: white;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 2. Hero Text (Centered) */
.welcome-hero {
  /* Reduced margin to save vertical space */
  margin-bottom: 20px;
}

.welcome-hero h2 {
  font-family: 'Segoe UI', sans-serif;
  font-size: 1.4rem;
  font-weight: 600;
  color: #00e5ff;
  margin: 0 0 5px 0;
}
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338

/* Buttons */
.primary-btn { background: #00e5ff; color: #0f172a; padding: 10px 24px; border-radius: 6px; font-weight: 700; font-family: 'Gemunu Libre', sans-serif; letter-spacing: 1px; border: none; cursor: pointer; transition: background 0.2s; }
.primary-btn:hover { background: #00b8d4; }

<<<<<<< HEAD
.secondary-btn { background: transparent; color: #00e5ff; padding: 10px 20px; border: 1px solid #00e5ff; border-radius: 6px; font-weight: 700; font-family: 'Gemunu Libre', sans-serif; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
.secondary-btn:hover { background: rgba(0, 229, 255, 0.1); }

.toggle-btn { font-size: 0.9rem; padding: 10px 15px; display: flex; align-items: center; justify-content: center; }
.toggle-btn.active { background: rgba(0, 229, 255, 0.2); border-color: #00e5ff; color: #fff; }

.mt-3 { margin-top: 1rem; }
.small-btn { width: 100%; padding: 8px 0; font-size: 1.1rem; }

/* BOTTOM LEFT GUIDE BUTTON STYLE */
.bottom-left-btn {
  /* Changed from fixed to absolute to align with mail-container bottom */
  position: absolute; 
  bottom: 30px;
  left: 30px;
=======
/* 3. Features Grid (Stacked One Under Another - Single Line) */
.features-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* Slightly tighter gap */
  margin-bottom: 20px;
  /* Reduced margin */
  text-align: left;
}

.feature-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 15px;
  /* Tighter padding */
  display: flex;
  align-items: center;
}

/* Inline Styles for Gemunu Libre and No Wrap */
.f-title {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
}

.f-divider {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.3rem;
  color: #00e5ff;
  /* Cyan Divider */
  margin: 0 10px;
  font-weight: 700;
}

.f-desc {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.2rem;
  /* Slightly larger for readability */
  color: #cbd5e1;
  white-space: nowrap;
}

/* 4. Look For Section */
.look-for-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px 15px;
  /* Tighter padding */
  margin-bottom: 20px;
  /* Reduced margin */
  text-align: left;
}

.look-for-title {
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 5px;
}

.look-for-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.look-for-list li {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 3px;
}

/* 5. Footer */
.welcome-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 15px;
  /* Reduced padding */
}

.footer-buttons {
  display: flex;
  gap: 10px;
}

.primary-btn {
  background: #00e5ff;
  color: #0f172a;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 700;
  font-family: 'Gemunu Libre', sans-serif;
  letter-spacing: 1px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-btn:hover {
  background: #00b8d4;
}

.secondary-btn {
  background: transparent;
  color: #00e5ff;
  padding: 10px 20px;
  border: 1px solid #00e5ff;
  border-radius: 6px;
  font-weight: 700;
  font-family: 'Gemunu Libre', sans-serif;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: rgba(0, 229, 255, 0.1);
}

/* Toggle Button Style */
.toggle-btn {
  font-size: 0.9rem;
  padding: 10px 15px;
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  width: 260px; /* Matched width */
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  color: #0f172a;
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 8px;
  font-family: 'Gemunu Libre', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  z-index: 20;
}

<<<<<<< HEAD
.bottom-left-btn:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.2);
  color: #00e5ff;
=======
.toggle-btn.active {
  background: rgba(0, 229, 255, 0.2);
  border-color: #00e5ff;
  color: #fff;
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
}

.btn-icon {
  width: 24px;
  height: 24px;
}

/* --- GAME UI STYLES --- */
.game-ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

<<<<<<< HEAD
/* Sidebar Elements */
.logo-container { position: absolute; top: 30px; left: 30px; display: flex; align-items: center; gap: 5px; z-index: 10; }
.logo-icon { width: 80px; height: auto; filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.3)); }
.logo-text { font-family: 'Gemunu Libre', sans-serif; font-size: 2rem; font-weight: 700; color: black; text-shadow: none; letter-spacing: 2px; margin-top: 5px; }

.sidebar-container { position: absolute; top: 130px; left: 30px; width: 260px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; backdrop-filter: blur(8px); padding: 20px; display: flex; flex-direction: column; gap: 15px; z-index: 5; }

.stats-container { position: absolute; top: 380px; left: 30px; width: 260px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; backdrop-filter: blur(8px); padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 5; }

/* Mail Interface */
.mail-container { position: absolute; top: 30px; right: 30px; bottom: 30px; left: 320px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; backdrop-filter: blur(8px); display: flex; overflow: hidden; }

/* Inbox List */
.inbox-list { width: 35%; border-right: 1px solid rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; }
.section-header { font-family: 'Gemunu Libre', sans-serif; font-size: 1.5rem; font-weight: 700; color: #334155; padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.05); text-align: left; flex-shrink: 0; }
.email-items-wrapper { overflow-y: auto; flex-grow: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.email-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.5); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border-left: 3px solid transparent; text-align: left; }
.email-item:hover { background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.email-item.selected { background: white; border-left-color: rgb(43, 84, 192); box-shadow: 0 4px 10px rgba(43, 84, 192, 0.15); }
.email-item.unread .email-subject { font-weight: 700; color: #0f172a; }
.email-avatar { width: 40px; height: 40px; background: rgb(43, 84, 192); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; }
.email-details { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
.email-top-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
.email-sender { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.email-date { font-size: 0.75rem; color: #64748b; }
.email-subject { font-size: 0.9rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.email-preview { font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
=======
/* --- SIDEBAR ELEMENTS (LEFT) --- */
.logo-container {
  position: absolute;
  top: 30px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 10;
}

.logo-icon {
  width: 80px;
  height: auto;
  filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.3));
}

.logo-text {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: black;
  text-shadow: none;
  letter-spacing: 2px;
  margin-top: 5px;
}

.sidebar-container {
  position: absolute;
  top: 130px;
  left: 30px;
  width: 260px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 5;
}

.stats-container {
  position: absolute;
  top: 380px;
  left: 30px;
  width: 260px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  z-index: 5;
}

/* --- MAIL INTERFACE (RIGHT) --- */
.mail-container {
  position: absolute;
  top: 30px;
  right: 30px;
  bottom: 30px;
  left: 320px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  display: flex;
  overflow: hidden;
}

/* 1. Inbox List */
.inbox-list {
  width: 35%;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.section-header {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  text-align: left;
  flex-shrink: 0;
}

.email-items-wrapper {
  overflow-y: auto;
  flex-grow: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  text-align: left;
}

.email-item:hover {
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.email-item.selected {
  background: white;
  border-left-color: rgb(43, 84, 192);
  box-shadow: 0 4px 10px rgba(43, 84, 192, 0.15);
}

.email-item.unread .email-subject {
  font-weight: 700;
  color: #0f172a;
}

.email-avatar {
  width: 40px;
  height: 40px;
  background: rgb(43, 84, 192);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.email-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.email-top-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.email-sender {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.email-date {
  font-size: 0.75rem;
  color: #64748b;
}

.email-subject {
  font-size: 0.9rem;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-preview {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338

/* Message Preview */
.message-preview { width: 65%; display: flex; flex-direction: column; background: #f8fafc; }
.email-content-wrapper { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.email-header-area { padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1); background: white; text-align: left; flex-shrink: 0; }
.email-subject-large { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin-bottom: 15px; font-family: 'Segoe UI', sans-serif; text-align: left; }
.email-meta-row { display: flex; align-items: center; gap: 12px; }
.email-avatar.large { width: 50px; height: 50px; font-size: 1.2rem; }
.sender-info { display: flex; flex-direction: column; flex-grow: 1; }
.sender-name { font-weight: 700; color: #0f172a; font-size: 1rem; }
.sender-email { font-size: 0.85rem; color: #64748b; }
.email-timestamp { font-size: 0.85rem; color: #94a3b8; }
.email-body-area { padding: 30px; flex-grow: 1; overflow-y: auto; text-align: left; color: #334155; font-size: 1rem; line-height: 1.6; }
.empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #94a3b8; }
.empty-icon { width: 60px; height: 60px; margin-bottom: 10px; color: #cbd5e1; }

<<<<<<< HEAD
.round-text { font-family: 'Gemunu Libre', sans-serif; font-size: 1.8rem; font-weight: 700; color: black; letter-spacing: 1px; }
.lives-wrapper { display: flex; gap: 8px; margin-bottom: 5px; }
.heart-icon { width: 37px; height: 37px; color: #ef4444; filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3)); transition: all 0.3s ease; }
.heart-icon.lost { color: #cbd5e1; filter: none; }
.score-wrapper { display: flex; justify-content: space-around; width: 100%; padding-top: 10px; border-top: 1px solid rgba(0, 0, 0, 0.1); }
.score-item { display: flex; align-items: center; gap: 8px; }
.score-icon { width: 28px; height: 28px; }
.correct-color { color: #22c55e; }
.incorrect-color { color: #ef4444; }
.score-text { font-family: 'Gemunu Libre', sans-serif; font-size: 1.5rem; font-weight: 700; color: #334155; }
=======
/* 2. Message Preview (Right Column) */
.message-preview {
  width: 65%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  /* Very light grey for contrast */
}

/* Dynamic Email Content Styles */
.email-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  /* Ensure only body scrolls */
}

.email-header-area {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  text-align: left;
  flex-shrink: 0;
}

.email-subject-large {
  font-size: 1.8rem;
  /* Increased size */
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  font-family: 'Segoe UI', sans-serif;
  text-align: left;
  /* Ensure left align */
}

.email-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* New style for the large avatar in reading pane */
.email-avatar.large {
  width: 50px;
  height: 50px;
  font-size: 1.2rem;
}

.sender-icon-large {
  width: 40px;
  height: 40px;
  color: #cbd5e1;
}

.sender-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.sender-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 1rem;
}

.sender-email {
  font-size: 0.85rem;
  color: #64748b;
}

.email-timestamp {
  font-size: 0.85rem;
  color: #94a3b8;
}

.email-body-area {
  padding: 30px;
  flex-grow: 1;
  overflow-y: auto;
  /* Allow scrolling if email is long */
  text-align: left;
  color: #334155;
  font-size: 1rem;
  line-height: 1.6;
}

.email-body-content p {
  margin-bottom: 15px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #94a3b8;
}

.empty-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 10px;
  color: #cbd5e1;
}


/* (Sidebar & Stats Styling remains the same) */
.round-text {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: black;
  letter-spacing: 1px;
}
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338

.lives-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 5px;
}

.heart-icon {
  width: 32px;
  height: 32px;
  color: #ef4444;
  filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3));
  transition: all 0.3s ease;
}

.heart-icon.lost {
  color: #cbd5e1;
  filter: none;
}

.score-wrapper {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-icon {
  width: 28px;
  height: 28px;
}

.correct-color {
  color: #22c55e;
}

.incorrect-color {
  color: #ef4444;
}

.score-text {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4a5568;
}

.menu-item:hover {
  background: rgb(43, 84, 192);
  color: white;
}

.menu-item.active {
  background: #00e5ff;
  color: #000;
  box-shadow: 0 4px 10px rgba(0, 229, 255, 0.3);
}

.menu-icon {
  width: 24px;
  height: 24px;
}

.menu-text {
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Segoe UI', sans-serif;
}

<<<<<<< HEAD
/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-card {
  background: white;
  width: 90%;
  max-width: 1000px;
  border-radius: 12px;
  padding: 30px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: slideIn 0.3s ease;
  color: #334155;
  text-align: left;
  overflow: hidden; /* Clips animation content */
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.close-icon { width: 24px; height: 24px; }

.modal-title {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 2rem;
  color: #0f172a;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
}

/* Modal Content Grid */
.guide-grid {
  display: flex;
  gap: 40px; /* Increased separation */
  margin-bottom: 20px;
}

.guide-box {
  flex: 1;
  height: 500px; /* Increased height */
  background: #f1f5f9;
  /* Visual separation styling */
  background-color: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  opacity: 0; 
  /* UPDATED ANIMATION */
  animation: fadeInUpBig 1.5s ease forwards;
}

/* Staggered Animations */
.guide-box:nth-child(1) { animation-delay: 0.1s; }
.guide-box:nth-child(2) { animation-delay: 0.3s; }
.guide-box:nth-child(3) { animation-delay: 0.5s; }

.modal-footer {
  display: flex;
  justify-content: center;
}

.return-btn {
  width: auto;
  padding: 10px 40px;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Updated Big Animation */
@keyframes fadeInUpBig {
  from {
    opacity: 0;
    transform: translate3d(0, 500px, 0); /* Starts far below */
  }
  to {
=======
/* --- ANIMATION CLASSES --- */
.fade-enter-active,
.fade-appear-active {
  animation: fadeInDown 0.8s ease forwards;
}

@keyframes fadeInDown {
  0% {
    opacity: 0;
    transform: translate3d(0, -100px, 0);
  }

  100% {
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

<<<<<<< HEAD
/* Animation Classes */
.fade-enter-active, .fade-appear-active { animation: fadeInDown 0.8s ease forwards; }
@keyframes fadeInDown { 0% { opacity: 0; transform: translate3d(0, -100px, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }
.fade-leave-active { transition: opacity 0.8s ease, transform 0.8s ease; }
.fade-leave-to { opacity: 0; transform: scale(0.9); }
=======
.fade-leave-active {
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* --- NEW GAME STYLES --- */

/* Action Footer */
.email-action-footer {
  padding: 20px;
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.safe-btn {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #10b981;
}

.phish-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #ef4444;
}

.btn-icon {
  width: 24px;
  height: 24px;
}

/* Stats Additions */
.timer-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  padding: 5px 15px;
  border-radius: 8px;
  margin-bottom: 5px;
}

.timer-display.low-time {
  color: #ef4444;
  animation: pulse 1s infinite;
}

.timer-icon {
  width: 28px;
  height: 28px;
}

.streak-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f59e0b;
  font-weight: 700;
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.4rem;
  margin-bottom: 5px;
}

.streak-icon {
  width: 24px;
  height: 24px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}

/* Feedback Modal */
.feedback-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}

.feedback-modal {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  border: 4px solid transparent;
}

.modal-correct {
  border-color: #22c55e;
}

.modal-incorrect {
  border-color: #ef4444;
}

.modal-icon-wrapper {
  margin-bottom: 10px;
}

.modal-icon {
  width: 80px;
  height: 80px;
}

.modal-correct .modal-icon {
  color: #22c55e;
}

.modal-incorrect .modal-icon {
  color: #ef4444;
}

.modal-title {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
}

.modal-message {
  color: #475569;
  font-size: 1.1rem;
  line-height: 1.5;
}

.modal-btn {
  margin-top: 20px;
  width: 100%;
  font-size: 1.2rem;
}

/* Loading Spinner */
.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f4f6;
  border-top-color: #00e5ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: #ef4444 !important;
}
>>>>>>> 71118bbcb2d6bd481e46d6c45e9913430353c338
</style>