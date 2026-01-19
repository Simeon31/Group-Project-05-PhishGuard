<script setup>
import { ref, computed, onUnmounted } from 'vue';
// Import Heroicons
import { InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, PlayIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, FireIcon, ClockIcon, XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/vue/24/solid';

// We use a 'ref' to track if the game has started. 
// true = show game, false = show welcome screen.
const gameStarted = ref(false);
const dontShowAgain = ref(false);
const showHelpModal = ref(false); // Controls the help popup

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

// Red Flag Stats
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
    error.value = 'Failed to load emails. Please try again later.';
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
  showHelpModal.value = true;
};

const toggleDontShow = () => {
  dontShowAgain.value = !dontShowAgain.value;
};

const toggleHelpModal = () => {
  showHelpModal.value = !showHelpModal.value;
};

onUnmounted(() => {
  stopTimer();
});
// In Nuxt, basic Vue composition API (ref, computed) is auto-imported.
// We define our logic here.
</script>

<template>
  <!-- The root element of the page -->
  <div class="page-container">

    <!-- === WELCOME SCREEN (Overlay) === -->
    <Transition name="fade" appear>
      <div v-if="!gameStarted" class="welcome-wrapper">
        <div class="welcome-card">

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
              <li>⚠️ Threatening language (e.g. "now", "account locked")</li>
              <li>⚠️ Mismatched links or unexpected attachments</li>
            </ul>
          </div>

          <div class="welcome-footer">
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

      <!-- Bottom Left Guide Button -->
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

          <div v-else class="empty-state">
            <InboxIcon class="empty-icon" />
            <p>Select an email to read</p>
          </div>

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

    <div class="game-card">
      <h1>Welcome to PhishGuard Game!</h1>
      <p>Identify phishing attempts and protect your data.</p>
      <button @click="startGame">Start Game</button>
    </div>
  </div>
</template>

<style scoped>
/* .page-container acts as the full-screen wrapper.
   We use 'scoped' styles so this doesn't affect other pages in your Nuxt app.
*/
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

  /* --- BACKGROUND CONFIGURATION (NUXT) --- */
  /* '~' refers to the root folder in Nuxt. 
     Ensure your image is at: /assets/your-background-image.png 
  */
  background-image: url('Group-Project-05-PhishGuard\app\assets\css\background.png'); 
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #0a0e14; /* Fallback color */
}

.game-card {
  background: rgba(0, 0, 0, 0.7);
  padding: 40px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
  width: 90%;
  max-width: 600px;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #00e5ff;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

p {
  margin-bottom: 30px;
  font-size: 1.1rem;
  color: #ccc;
}

button {
  padding: 12px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  background: #00e5ff;
  border: none;
  border-radius: 5px;
  color: #0a0e14;
  cursor: pointer;
  transition: transform 0.2s, background 0.3s;
}

button:hover {
  background: #00b8d4;
  transform: scale(1.05);
}
</style>