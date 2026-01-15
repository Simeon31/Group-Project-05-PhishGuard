<script setup>
import { ref, computed, onUnmounted } from 'vue';
// Import Heroicons
import { InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, PlayIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, FireIcon, ClockIcon } from '@heroicons/vue/24/solid';

// We use a 'ref' to track if the game has started. 
// true = show game, false = show welcome screen.
const gameStarted = ref(false);
const dontShowAgain = ref(false);

// Track active menu item
const activeMenu = ref('inbox');

// Game Stats
const roundNumber = ref(1);
const lives = ref(5);
const correctCount = ref(0);
const incorrectCount = ref(0);
const streak = ref(0);
const timeLeft = ref(30);
let timerInterval = null;
const feedback = ref(null); 
const loading = ref(false);
const error = ref(null);

// Interactive Red Flag Stats
const foundFlags = ref(new Set());
const requiredFlags = computed(() => {
  if (!currentEmail.value || !currentEmail.value.redFlags) return 0;
  return currentEmail.value.redFlags.length;
});
const missingFlagsError = ref(false);

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
        difficulty: roundNumber.value,
        limit: 10
      }
    });

    if (response.success && response.data) {
      emails.value = response.data.map(email => ({
        ...email,
        // API returns camelCase for these fields, just ensure array existence
        redFlags: email.redFlags || [],
        // Keep snake_case for sender_email as expected by template
      }));
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
  timeLeft.value = 30;
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      stopTimer();

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
  foundFlags.value.clear();
  missingFlagsError.value = false;
};

// Computed property to get the full object of the currently selected email
const currentEmail = computed(() => {
  return emails.value.find(e => e.id === selectedEmailId.value);
});

// Helper to check if header elements (Sender Name / Email) are suspicious
const isSenderNameRisky = (email) => {
  if (!email || !email.redFlags) return 'safe';
  return email.redFlags.some(flag =>
    /Sender Name|Typosquatting/i.test(flag)
  ) ? 'danger' : 'safe';
};

// Helper to check if the sender email/domain is suspicious
const isSenderEmailRisky = (email) => {
  if (!email || !email.redFlags) return 'safe';
  return email.redFlags.some(flag =>
    /Domain|Address|Email|Gmail|Hotmail|Yahoo|AOL/i.test(flag)
  ) ? 'danger' : 'safe';
};

// Handle clicking on investigate areas
const handleInvestigate = (event) => {
  const target = event.target.closest('.investigate-area');
  if (!target) return;

  const status = target.dataset.status;

  // Logic: 
  // If dangerous (red flag) -> mark found
  // If safe (false positive) -> deduct life? or just warn?

  if (status === 'danger') {
    if (!target.classList.contains('found')) {
      target.classList.add('found');
      // Create a unique key for the flag based on text content
      foundFlags.value.add(target.textContent.trim());

      // Calculate remaining flags
      const totalFlags = currentEmail.value.redFlags.length;
      const progress = foundFlags.value.size;

      // If we cleared the "missing flags" error condition, hide it
      if (progress >= totalFlags) {
        missingFlagsError.value = false;
      }
    }
  } else {
    // False positive!
    if (!target.classList.contains('clicked-safe')) {
      target.classList.add('clicked-safe');
      lives.value--; // Deduct life for false positive
      streak.value = 0; // Reset streak on mistake

      // Show brief visual feedback (optional toast)
      // For now, the red outline class 'clicked-safe' is the feedback
    }
  }
};

const handleDecision = (markedSafe, isTimeout = false) => {
  stopTimer();
  if (!currentEmail.value) return;

  const isActuallyPhishing = currentEmail.value.isPhishing;
  let success = false;
  let title = "";
  let message = "";

  // Rule 1: All red flags must be spotted if it's a phishing email
  if (isActuallyPhishing && !markedSafe && !isTimeout) {
    const totalFlags = currentEmail.value.redFlags.length;

    // block the decision (unless it's a timeout)
    if (foundFlags.value.size < totalFlags) {
      missingFlagsError.value = true;

      return;
    }
  }

  if (isTimeout) {
    success = false;
    title = "Time's Up!";
    message = "You ran out of time. In high-pressure environments, hesitation can be risky, but always take a moment to verify.";
    streak.value = 0;
    incorrectCount.value++;
    lives.value--;
  } else {
    success = (markedSafe && !isActuallyPhishing) || (!markedSafe && isActuallyPhishing);

    if (success) {
      title = "Correct!";
      message = markedSafe
        ? "Good catch. This email is safe."
        : "Well done! You spotted the phishing attempt.";
      streak.value++;
      correctCount.value++;
      
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
};

const startGame = async () => {
  console.log('Game started! transitions occurring...');
  gameStarted.value = true;
  await fetchScenarios(); 
  startTimer();
};

const viewExample = () => {
  console.log('Viewing example...');
};

const toggleDontShow = () => {
  dontShowAgain.value = !dontShowAgain.value;
};

onUnmounted(() => {
  stopTimer();
});
</script>

<template>
  <div class="page-container">

    <Transition name="fade" appear>
      <div v-if="!gameStarted" class="welcome-wrapper">
        <div class="welcome-card">

          <!-- 1. Header: Logo Top Left (Centered in row) -->
          <div class="welcome-header-row">
            <img src="/Images/PhishGuard_Logo.png" alt="Logo" class="welcome-logo-small" />
            <div class="welcome-title-small">Welcome to phishguard</div>
          </div>

          <!-- 2. Main Welcome Text -->
          <div class="welcome-hero">
            <h2>Spot the red flags. Stay safe.</h2>
            <p>Practice phishing detection in a simulated inbox.</p>
          </div>

          <!-- 3. Features Grid (Single Lines divided by |) -->
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

          <!-- 4. Look For Section -->
          <div class="look-for-section">
            <div class="look-for-title">Look for:</div>
            <ul class="look-for-list">
              <li>⚠️ Sender domain that looks slightly incorrect</li>
              <li>⚠️ Threatening language (e.g. “now”, “account locked”)</li>
              <li>⚠️ Mismatched links or unexpected attachments</li>
            </ul>
          </div>

          <!-- 5. Footer: Buttons -->
          <div class="welcome-footer">
            <!-- "Don't show again" as a toggle button -->
            <button @click="toggleDontShow" class="secondary-btn toggle-btn" :class="{ 'active': dontShowAgain }">
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
          <div v-else-if="currentEmail" class="email-content-wrapper" @click="handleInvestigate">

            <div class="email-header-area">
              <div class="email-subject-large">{{ currentEmail.subject }}</div>
              <div class="email-meta-row">
                <!-- UPDATED: Matching Avatar Icon -->
                <div class="email-avatar large">{{ currentEmail.initials }}</div>
                <div class="sender-info">
                  <span class="sender-name investigate-area" :data-status="isSenderNameRisky(currentEmail)"
                    title="Click to investigate sender name">{{ currentEmail.sender }}</span>
                  <span class="sender-email investigate-area" :data-status="isSenderEmailRisky(currentEmail)"
                    title="Click to investigate email address">&lt;{{ currentEmail.sender_email }}&gt;</span>
                </div>
                <div class="email-timestamp">{{ currentEmail.date }}</div>
              </div>
            </div>

            <div class="email-body-area">
              <div v-html="currentEmail.body" class="email-body-content" :class="{ 'blur-content': missingFlagsError }">
              </div>

              <div v-if="missingFlagsError" class="investigate-warning-overlay">
                <div class="warning-box">
                  <ExclamationTriangleIcon class="warning-icon-lg" />
                  <span>You must find all red flags before reporting!</span>
                  <span class="warning-sub">{{ foundFlags.size }} / {{ currentEmail.redFlags.length }} found</span>
                  <button @click="missingFlagsError = false" class="secondary-btn small-btn">KEEP LOOKING</button>
                </div>
              </div>
            </div>

            <!-- ACTION FOOTER -->
            <div class="email-action-footer">
              <div class="found-counter" v-if="currentEmail.redFlags.length > 0">
                <span class="label">RED FLAGS:</span>
                <span class="count" :class="{ 'all-found': foundFlags.size === currentEmail.redFlags.length }">
                  {{ foundFlags.size }} / {{ currentEmail.redFlags.length }}
                </span>
              </div>

              <button @click="handleDecision(true)" class="action-btn safe-btn">
                <ShieldCheckIcon class="btn-icon" />
                Mark Safe
              </button>
              <button @click="handleDecision(false)" class="action-btn phish-btn">
                <ExclamationTriangleIcon class="btn-icon" />
                Report Phishing
              </button>
            </div>

          </div>

          <!-- Empty State -->
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

  </div>
</template>

<style>
/* Global styles for dynamic content */
.investigate-area {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px dashed transparent;
}

.investigate-area:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.3);
}

.investigate-area.found {
  background-color: rgba(220, 38, 38, 0.2);
  border: 1px solid #ef4444;
  color: #fca5a5;
  cursor: default;
}

.investigate-area.clicked-safe {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
}

@keyframes shake {

  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.email-header-area .investigate-area {
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px dashed transparent;
  transition: all 0.2s;
  /* Ensure header text remains aligned */
  display: inline-block;
}

.email-header-area .investigate-area:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.3);
  cursor: pointer;
}
</style>

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

/* --- UPDATED WELCOME SCREEN STYLES (Refined Layout) --- */
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
  background: rgb(23, 28, 42);
  /* Reduced padding to fit better */
  padding: 30px;
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

.welcome-hero p {
  font-size: 1rem;
  color: #94a3b8;
  margin: 0;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn.active {
  background: rgba(0, 229, 255, 0.2);
  border-color: #00e5ff;
  color: #fff;
}


/* --- GAME UI STYLES --- */
.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

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
  flex: 1;
  padding: 30px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  overflow-y: auto;
  position: relative;
}

.email-body-content.blur-content {
  filter: blur(4px);
  pointer-events: none;
}

.investigate-warning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
}

.warning-box {
  background: #1e293b;
  border: 1px solid #f59e0b;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.warning-icon-lg {
  width: 48px;
  height: 48px;
  color: #f59e0b;
}

.warning-sub {
  color: #94a3b8;
  font-size: 0.9rem;
}

.small-btn {
  padding: 6px 16px;
  font-size: 0.9rem;
  margin-top: 10px;
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
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

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
  padding: 20px 30px;
  background: #0f172a;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  align-items: center;
}

.found-counter {
  margin-right: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.found-counter .label {
  font-family: 'Gemunu Libre';
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 1px;
}

.found-counter .count {
  font-family: 'Gemunu Libre';
  font-size: 1.2rem;
  font-weight: 700;
  color: #cbd5e1;
}

.found-counter .count.all-found {
  color: #4ade80;
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
</style>