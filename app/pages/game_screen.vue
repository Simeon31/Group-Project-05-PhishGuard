<script setup>
import { ref, computed, onUnmounted } from 'vue';
// Import Heroicons
import { 
  InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, 
  CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, 
  PlayIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, 
  FireIcon, ClockIcon, XMarkIcon, QuestionMarkCircleIcon, PlusIcon 
} from '@heroicons/vue/24/solid';

// We use a 'ref' to track if the game has started. 
const gameStarted = ref(false);
const dontShowAgain = ref(false);
const showHelpModal = ref(false); // Controls the help popup
const showAttackModal = ref(false); // Controls the new Attack Type popup

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

// Game Logic State
const pendingLifeLoss = ref(false); // Tracks if a life needs to be removed after modal closes
const isProcessingDecision = ref(false); // Locks buttons to prevent double clicks

// Animation State
const exitingEmailId = ref(null);
const isExiting = ref(false);
// Track animation state for each of the 5 hearts
const heartAnimations = ref(['', '', '', '', '']); 

// Link Hover State
const hoveredLink = ref(null);

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
        redFlags: email.redFlags || [],
        timeLeft: 30, // Initialize individual timer for each email
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
  
  // Load the timer state from the current email, or default to 30
  if (currentEmail.value) {
    timeLeft.value = currentEmail.value.timeLeft;
  } else {
    timeLeft.value = 30;
  }

  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      // Save the time back to the current email object so it persists if we switch away
      if (currentEmail.value) {
        currentEmail.value.timeLeft = timeLeft.value;
      }
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
  if (isExiting.value || isProcessingDecision.value) return; // Prevent selection during animation or decision
  selectedEmailId.value = id;
  const email = emails.value.find(e => e.id === id);
  if (email) email.read = true;
  startTimer(); // This will now resume the specific email's timer
  feedback.value = null;
  hoveredLink.value = null; 
};

const currentEmail = computed(() => {
  return emails.value.find(e => e.id === selectedEmailId.value);
});

// Process body to turn plain text links into HTML anchors with dynamic logic
const processedBody = computed(() => {
  if (!currentEmail.value) return '';
  let content = currentEmail.value.body || '';

  // --- 1. Dynamic Link Generator Helper ---
  const generateContextAwareLink = () => {
    const emailParts = (currentEmail.value.sender_email || '').split('@');
    const domain = emailParts.length > 1 ? emailParts[1] : 'service.com';
    const name = domain.split('.')[0];

    if (currentEmail.value.isPhishing) {
      return `http://${name}-security-check.com/login?id=${Math.floor(Math.random() * 1000)}`;
    } else {
      return `https://www.${domain}/account`;
    }
  };

  const defaultDynamicUrl = generateContextAwareLink();

  // Unified Placeholder System
  const placeholders = [];
  const createPlaceholder = (html) => {
    const id = `___LINK_PLACEHOLDER_${placeholders.length}___`;
    placeholders.push({ id, html });
    return id;
  };

  // --- 2. Custom Links from JSON ---
  if (currentEmail.value.custom_links && Array.isArray(currentEmail.value.custom_links)) {
    const sortedLinks = [...currentEmail.value.custom_links].sort((a, b) => b.text.length - a.text.length);
    sortedLinks.forEach((linkObj) => {
      const escapedText = linkObj.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escapedText, 'g');
      if (pattern.test(content)) {
        content = content.replace(pattern, () => {
            return createPlaceholder(`<a href="${linkObj.url}" class="phish-link">${linkObj.text}</a>`);
        });
      }
    });
  }

  // --- 3. Linkify Common Action Phrases ---
  const actionPhrases = [
    "click here to re-activate", "click here immediately", "click here to claim shipment", "click to block access",
    "click here", "login now", "verify account", "update payment", "reset password", "download here",
    "download the form here", "verify payment info", "restart membership", 
    "verify your identity here", "secure your account here", "sign in with email", "unlock card now",
    "send me your cell number", "buy 5x \\$100 apple gift cards", "email me the codes", "revert changes immediately",
    "reject the request here", "check activity", "review your recent activity", "go to workday portal",
    "update bank details", "VALIDATE NOW"
  ];

  const phrasePatternStr = actionPhrases.map(p => p.replace(/ /g, '\\s+')).join('|');
  const actionPhrasePattern = new RegExp(`(?:\\[\\s*)?(${phrasePatternStr})(?:\\s*\\])?`, 'gi');

  content = content.replace(actionPhrasePattern, (match) => {
    if (match.includes('___LINK_PLACEHOLDER')) return match;
    return createPlaceholder(`<a href="${defaultDynamicUrl}" class="phish-link">${match}</a>`);
  });

  // --- 4. Linkify Raw URLs ---
  const urlPattern = /\b((?:https?:\/\/|www\.)[^\s<]+|[a-z0-9.-]+\.[a-z]{2,}\/[^\s<]*)\b/gi;
  content = content.replace(urlPattern, (match) => {
    if (match.includes('___LINK_PLACEHOLDER')) return match;
    const cleanMatch = match.replace(/[.,;!?)]+$/, '');
    const trailing = match.slice(cleanMatch.length);
    let href = cleanMatch;
    if (!href.startsWith('http') && !href.startsWith('www')) { href = 'https://' + href; } 
    else if (href.startsWith('www')) { href = 'https://' + href; }
    return createPlaceholder(`<a href="${href}" class="phish-link">${cleanMatch}</a>`) + trailing;
  });

  // --- 5. Restore ---
  placeholders.forEach(p => { content = content.split(p.id).join(p.html); });

  return content;
});

// --- LINK HANDLING ---
const handleLinkClick = (event) => {
  const link = event.target.closest('a');
  if (link) {
    event.preventDefault(); 
  }
};

// Logic to lose a life with animation
const loseLife = () => {
  if (lives.value > 0) {
    const heartIndex = lives.value - 1; 
    
    setTimeout(() => {
      heartAnimations.value[heartIndex] = 'animate__shakeX';
      setTimeout(() => {
        heartAnimations.value[heartIndex] = 'animate__fadeOut';
        setTimeout(() => {
          lives.value--; 
          
          if (lives.value === 0) {
            showGameOverModal.value = true;
            stopTimer();
            return;
          }

          if (lives.value === 1) {
             heartAnimations.value[0] = 'animate__heartBeat';
             setTimeout(() => {
               heartAnimations.value[0] = 'animate__pulse'; 
             }, 1000);
          }
        }, 500); 
      }, 500); 
    }, 1000); 
  }
};

const restartGame = async () => {
  lives.value = 5;
  correctCount.value = 0;
  incorrectCount.value = 0;
  streak.value = 0;
  roundNumber.value = 1;
  heartAnimations.value = ['', '', '', '', ''];
  showGameOverModal.value = false;
  isProcessingDecision.value = false; // Reset lock
  emails.value = [];
  playedScenarioIds.value.clear();
  
  await startGame();
};

const handleDecision = (markedSafe, isTimeout = false) => {
  // 1. Prevent double clicks
  if (isProcessingDecision.value) return; 
  isProcessingDecision.value = true;

  stopTimer();
  if (!currentEmail.value) return;

  const isActuallyPhishing = currentEmail.value.isPhishing;
  let success = false;
  let title = "";
  let message = "";

  if (isTimeout) {
    success = false;
    title = "Time's Up!";
    message = "You ran out of time.";
    streak.value = 0;
    incorrectCount.value++;
    pendingLifeLoss.value = true; 
  } else {
    success = (markedSafe && !isActuallyPhishing) || (!markedSafe && isActuallyPhishing);

    if (success) {
      title = "Correct!";
      message = markedSafe ? "Good catch. This email is safe." : "Well done! You spotted the phishing attempt.";
      streak.value++;
      correctCount.value++;
      pendingLifeLoss.value = false;
    } else {
      title = "Incorrect";
      message = currentEmail.value.educationalMessage || "You missed the signs.";
      streak.value = 0;
      incorrectCount.value++;
      pendingLifeLoss.value = true; 
    }
  }

  feedback.value = { visible: true, isCorrect: success, title, message };
};

// --- GAME LOOP: NEXT EMAIL LOGIC ---
const closeFeedback = async () => {
  feedback.value = null;
  
  // 1. Play Lose Life Animation if needed (Waits for animation to complete)
  if (pendingLifeLoss.value) {
    loseLife();
    pendingLifeLoss.value = false;
    // Wait for delay(1s) + shake(0.5s) + fadeOut(0.5s) = 2s total
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (lives.value === 0) return; // Do not proceed if game over

  // 2. Trigger Exit Animation on the Inbox Item
  exitingEmailId.value = selectedEmailId.value;
  isExiting.value = true;

  // 3. Wait for animation to finish (0.75s)
  setTimeout(() => {
    // Remove processed email
    const index = emails.value.findIndex(e => e.id === exitingEmailId.value);
    if (index !== -1) {
      emails.value.splice(index, 1);
    }

    // Reset State
    exitingEmailId.value = null;
    isExiting.value = false;
    isProcessingDecision.value = false; // UNLOCK BUTTONS HERE
    selectedEmailId.value = null;

    // Load next email or start next round
    if (emails.value.length > 0) {
      selectEmail(emails.value[0].id);
    } else {
      // ROUND COMPLETE -> Add New Emails
      startNextRound();
    }
  }, 750); 
};

const startGame = async () => {
  console.log('Game started! transitions occurring...');
  gameStarted.value = true;
  await fetchScenarios();
  startTimer();
};

const viewExample = () => { showHelpModal.value = true; };
const toggleDontShow = () => { dontShowAgain.value = !dontShowAgain.value; };
const toggleHelpModal = () => { showHelpModal.value = !showHelpModal.value; };
const toggleAttackModal = () => { showAttackModal.value = !showAttackModal.value; };

onUnmounted(() => { stopTimer(); });
</script>

<template>
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
            <div class="feature-box"><span class="f-title">🧭 Decide</span><span class="f-divider">|</span><span class="f-desc">Accept or flag each email</span></div>
            <div class="feature-box"><span class="f-title">💡 Learn instantly</span><span class="f-divider">|</span><span class="f-desc">Quick feedback after every choice</span></div>
            <div class="feature-box"><span class="f-title">📈 Score & progress</span><span class="f-divider">|</span><span class="f-desc">Streaks, levels, harder attacks</span></div>
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
              <span v-if="dontShowAgain">☑ Don't show again</span><span v-else>☐ Don't show again</span>
            </button>
            <div class="footer-buttons">
              <button @click="viewExample" class="secondary-btn">VIEW EXAMPLE</button>
              <button @click="startGame" class="primary-btn">START ROUND</button>
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

      <!-- Repositioned Stats Container -->
      <div class="stats-container">
        <div class="round-text">ROUND {{ roundNumber }}</div>
        <div class="timer-display" :class="{ 'low-time': timeLeft <= 5 }">
          <ClockIcon class="timer-icon" />
          <span>00:{{ timeLeft < 10 ? '0' + timeLeft : timeLeft }}</span>
        </div>
        
        <!-- Lives Wrapper with Dynamic Heart Animations -->
        <div class="lives-wrapper">
          <HeartIcon 
            v-for="n in 5" 
            :key="n" 
            class="heart-icon" 
            :class="[
              { 'lost': n > lives },
              heartAnimations[n-1] 
            ]" 
          />
        </div>

        <div class="streak-wrapper" v-if="streak > 1">
          <FireIcon class="streak-icon" />
          <span>{{ streak }} Streak!</span>
        </div>
        <div class="score-wrapper">
          <div class="score-item"><CheckCircleIcon class="score-icon correct-color" /><span class="score-text">{{ correctCount }}</span></div>
          <div class="score-item"><XCircleIcon class="score-icon incorrect-color" /><span class="score-text">{{ incorrectCount }}</span></div>
        </div>
      </div>

      <!-- GUIDE BUTTON -->
      <button class="bottom-left-btn" @click="toggleHelpModal">
        <QuestionMarkCircleIcon class="btn-icon" />
        <span>GUIDE</span>
      </button>

      <!-- === MAIL INTERFACE (RIGHT SIDE) === -->
      <div class="mail-container">
        <div class="inbox-list">
          <div class="section-header">Inbox</div>
          
          <!-- TransitionGroup for animating new emails entering -->
          <TransitionGroup 
            name="email-list" 
            tag="div" 
            class="email-items-wrapper"
          >
            <div 
              v-for="email in emails" 
              :key="email.id" 
              class="email-item" 
              :class="{ 
                'selected': selectedEmailId === email.id, 
                'unread': !email.read,
                'animate-back-out': exitingEmailId === email.id /* ANIMATION APPLIED HERE */
              }" 
              @click="selectEmail(email.id)"
            >
              <div class="email-avatar">{{ email.initials }}</div>
              <div class="email-details">
                <div class="email-top-row"><span class="email-sender">{{ email.sender }}</span><span class="email-date">{{ email.date }}</span></div>
                <div class="email-subject">{{ email.subject }}</div>
                <div class="email-preview">{{ email.preview }}</div>
              </div>
            </div>
          </TransitionGroup>

        </div>

        <div class="message-preview">
          <div v-if="loading" class="empty-state"><div class="loading-spinner"></div><p>Loading scenarios...</p></div>
          <div v-else-if="error" class="empty-state"><XCircleIcon class="empty-icon error-icon" /><p>{{ error }}</p><button @click="fetchScenarios" class="primary-btn">Retry</button></div>
          
          <div v-else-if="currentEmail" class="email-content-wrapper">
            
            <!-- HEADER (Sender info only) -->
            <div class="email-header-area">
              <div class="email-meta-row">
                <div class="email-avatar large">{{ currentEmail.initials }}</div>
                <div class="sender-info">
                  <span class="sender-name">{{ currentEmail.sender }}</span>
                  <span class="sender-email">&lt;{{ currentEmail.sender_email }}&gt;</span>
                </div>
                <div class="email-timestamp">{{ currentEmail.date }}</div>
              </div>
            </div>
            
            <!-- BODY (Subject + Content) -->
            <div 
              class="email-body-area" 
              @click="handleLinkClick"
            >
              <!-- Subject Moved Here -->
              <div class="email-subject-large">{{ currentEmail.subject }}</div>
              
              <div v-html="processedBody" class="email-body-content"></div>
              
            </div>
            
            <div class="email-action-footer">
              <button 
                @click="handleDecision(true)" 
                class="action-btn safe-btn"
                :disabled="isProcessingDecision"
              >
                <ShieldCheckIcon class="btn-icon" /> Mark Safe
              </button>
              <button 
                @click="handleDecision(false)" 
                class="action-btn phish-btn"
                :disabled="isProcessingDecision"
              >
                <ExclamationTriangleIcon class="btn-icon" /> Report Phishing
              </button>
            </div>
          </div>
          <div v-else class="empty-state"><InboxIcon class="empty-icon" /><p>Select an email to read</p></div>
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

      <!-- GAME OVER MODAL -->
      <Transition name="fade">
        <div v-if="showGameOverModal" class="feedback-overlay">
          <div class="feedback-modal game-over-modal">
            <div class="modal-icon-wrapper">
              <ExclamationTriangleIcon class="modal-icon" style="color: #ef4444;" />
            </div>
            <div class="modal-title">System Compromised</div>
            <div class="modal-message">
              You ran out of trust. The attackers have breached the network.
              <br><br>
              <strong>Score: {{ correctCount }}</strong>
            </div>
            <button @click="restartGame" class="primary-btn modal-btn restart-btn">
              <ArrowPathIcon class="btn-icon inline mr-2" />
              PLAY AGAIN
            </button>
          </div>
        </div>
      </Transition>

    </div>

    <!-- === HELP/EXAMPLES MODAL === -->
    <Transition name="fade">
      <div v-if="showHelpModal" class="modal-overlay" @click.self="toggleHelpModal">
        <div class="modal-card">
          <button class="close-btn" @click="toggleHelpModal"><XMarkIcon class="close-icon" /></button>
          <h2 class="modal-title">Examples & Tips</h2>
          <div class="modal-content">
            <div class="guide-grid"><div class="guide-box"></div><div class="guide-box"></div><div class="guide-box"></div></div>
            <div class="modal-footer"><button @click="toggleHelpModal" class="primary-btn return-btn">RETURN TO GAME</button></div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style>
/* FIX: Force link styling for v-html content globally */
.email-body-content a {
  color: #0645AD !important;
  text-decoration: underline !important;
  cursor: pointer !important;
  font-weight: 500;
}
.email-body-content a:hover {
  color: #0b0080 !important;
}

/* BackOutLeft Animation (Exit) */
@keyframes backOutLeft {
  0% { transform: scale(1); opacity: 1; }
  20% { transform: translateX(0px) scale(0.9); opacity: 0.9; }
  100% { transform: translateX(-500px) scale(0.9); opacity: 0; }
}
.animate-back-out {
  animation: backOutLeft 0.75s ease-in forwards;
}

/* FadeInUpBig Animation (Enter) */
@keyframes fadeInUpBig {
  from { opacity: 0; transform: translate3d(0, 500px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
.email-list-enter-active {
  animation: fadeInUpBig 0.8s ease-out;
}
/* Ensure absolute position during leave transitions */
.email-list-leave-active {
  position: absolute; 
}

/* HEART ANIMATIONS */
@keyframes shakeX {
  0%, 100% { transform: translate3d(0, 0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate3d(-5px, 0, 0); }
  20%, 40%, 60%, 80% { transform: translate3d(5px, 0, 0); }
}
.animate__shakeX { animation: shakeX 0.5s ease-in-out; }

@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
.animate__fadeOut { animation: fadeOut 0.5s ease-out forwards; }

@keyframes heartBeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}
.animate__heartBeat { animation: heartBeat 1s ease-in-out; }

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.animate__pulse { animation: pulse 2s infinite; color: #dc2626 !important; }
</style>

<style scoped>
/* ... Styles ... */
@import url('https://fonts.googleapis.com/css2?family=Gemunu+Libre:wght@400;700&display=swap');
.page-container { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; text-align: center; color: white; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-image: linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), url('/Images/background.png'); background-size: cover; background-position: center; background-repeat: no-repeat; background-color: #0a0e14; }

/* ... Welcome Screen Styles ... */
.welcome-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(8px); z-index: 50; background: rgba(0,0,0,0.7); }
.welcome-card { background: rgb(23, 28, 42); padding: 30px; border-radius: 12px; border: 1px solid rgba(0, 229, 255, 0.2); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); width: 90%; max-width: 700px; display: flex; flex-direction: column; color: #e2e8f0; text-align: center; }
.welcome-header-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 5px; }
.welcome-logo-small { width: 80px; height: auto; }
.welcome-title-small { font-family: 'Gemunu Libre', sans-serif; font-size: 2.8rem; font-weight: 600; color: white; letter-spacing: 2px; text-transform: uppercase; }
.welcome-hero { margin-bottom: 20px; }
.welcome-hero h2 { font-family: 'Segoe UI', sans-serif; font-size: 1.4rem; font-weight: 600; color: #00e5ff; margin: 0 0 5px 0; }
.welcome-hero p { font-size: 1rem; color: #94a3b8; margin: 0; }
.features-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; text-align: left; }
.feature-box { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px 15px; display: flex; align-items: center; }
.f-title { font-family: 'Gemunu Libre', sans-serif; font-size: 1.3rem; font-weight: 700; color: white; white-space: nowrap; }
.f-divider { font-family: 'Gemunu Libre', sans-serif; font-size: 1.3rem; color: #00e5ff; margin: 0 10px; font-weight: 700; }
.f-desc { font-family: 'Gemunu Libre', sans-serif; font-size: 1.2rem; color: #cbd5e1; white-space: nowrap; }
.look-for-section { background: rgba(0, 0, 0, 0.2); border-radius: 8px; padding: 10px 15px; margin-bottom: 20px; text-align: left; }
.look-for-title { font-weight: 700; color: #e2e8f0; margin-bottom: 5px; }
.look-for-list { list-style: none; padding: 0; margin: 0; }
.look-for-list li { font-size: 0.9rem; color: #94a3b8; margin-bottom: 3px; }
.welcome-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px; }
.footer-buttons { display: flex; gap: 10px; }
.primary-btn { background: #00e5ff; color: #0f172a; padding: 10px 24px; border-radius: 6px; font-weight: 700; font-family: 'Gemunu Libre', sans-serif; letter-spacing: 1px; border: none; cursor: pointer; transition: background 0.2s; }
.primary-btn:hover { background: #00b8d4; }
.secondary-btn { background: transparent; color: #00e5ff; padding: 10px 20px; border: 1px solid #00e5ff; border-radius: 6px; font-weight: 700; font-family: 'Gemunu Libre', sans-serif; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; }
.secondary-btn:hover { background: rgba(0, 229, 255, 0.1); }
.toggle-btn { font-size: 0.9rem; padding: 10px 15px; display: flex; align-items: center; justify-content: center; }
.toggle-btn.active { background: rgba(0, 229, 255, 0.2); border-color: #00e5ff; color: #fff; }
.mt-3 { margin-top: 1rem; }
.small-btn { width: 100%; padding: 8px 0; font-size: 1.1rem; }

/* BOTTOM LEFT GUIDE BUTTON */
.bottom-left-btn { position: absolute; bottom: 30px; left: 30px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 20px; width: 260px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(8px); color: #0f172a; border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 8px; font-family: 'Gemunu Libre', sans-serif; font-weight: 700; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; z-index: 20; }
.bottom-left-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2); color: #00e5ff; }
.btn-icon { width: 24px; height: 24px; }

/* ... Game UI Styles ... */
.game-ui { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.logo-container { position: absolute; top: 30px; left: 30px; display: flex; align-items: center; gap: 5px; z-index: 10; }
.logo-icon { width: 80px; height: auto; filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.3)); }
.logo-text { font-family: 'Gemunu Libre', sans-serif; font-size: 2rem; font-weight: 700; color: black; text-shadow: none; letter-spacing: 2px; margin-top: 5px; }

/* STATS CONTAINER */
.stats-container { position: absolute; top: 130px; left: 30px; width: 260px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; backdrop-filter: blur(8px); padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 5; }

/* Mail Interface */
.mail-container { position: absolute; top: 30px; right: 30px; bottom: 30px; left: 320px; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; backdrop-filter: blur(8px); display: flex; overflow: hidden; }
.inbox-list { width: 35%; border-right: 1px solid rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; }
.section-header { font-family: 'Gemunu Libre', sans-serif; font-size: 1.5rem; font-weight: 700; color: #334155; padding: 20px; height: 90px; display: flex; align-items: center; border-bottom: 1px solid rgba(0, 0, 0, 0.05); text-align: left; flex-shrink: 0; box-sizing: border-box; }
.email-items-wrapper { overflow-y: auto; flex-grow: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.email-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.5); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border-left: 3px solid transparent; text-align: left; position: relative; }
.email-item:hover { background: white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); }
.email-item.selected { background: white; border-left-color: rgb(43, 84, 192); box-shadow: 0 4px 10px rgba(43, 84, 192, 0.15); }
.email-item.unread .email-subject { font-weight: 700; color: #0f172a; }
.email-avatar { width: 40px; height: 40px; background: rgb(43, 84, 192); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; }
.email-details { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
.email-top-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
.email-sender { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.email-date { font-size: 0.75rem; color: #64748b; }
.email-subject { font-size: 0.9rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.email-preview { font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.message-preview { width: 65%; display: flex; flex-direction: column; background: #FFFFFF; position: relative; overflow: hidden; }
.email-content-wrapper { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

/* HEADER ALIGNMENT */
.email-header-area { padding: 30px 30px 20px 30px; border-bottom: 1px solid rgba(0, 0, 0, 0.1); background: white; text-align: left; flex-shrink: 0; height: 90px; display: flex; align-items: center; box-sizing: border-box; }
.email-subject-large { font-size: 1.8rem; font-weight: 700; color: #1e293b; margin-bottom: 20px; font-family: 'Segoe UI', sans-serif; text-align: left; line-height: 1.2; display: block; }
.email-meta-row { display: flex; align-items: center; gap: 15px; width: 100%; }
.email-avatar.large { width: 50px; height: 50px; font-size: 1.2rem; flex-shrink: 0; }
.sender-info { display: flex; flex-direction: column; flex-grow: 1; justify-content: center; }
.sender-name { font-weight: 700; color: #0f172a; font-size: 1rem; line-height: 1.2; }
.sender-email { font-size: 0.85rem; color: #64748b; line-height: 1.2; margin-top: 2px; }
.email-timestamp { font-size: 0.85rem; color: #94a3b8; align-self: flex-start; margin-top: 5px; }

/* BODY ALIGNMENT */
.email-body-area { flex: 1; padding: 30px; background: #FFFFFF; color: #334155; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 1rem; line-height: 1.6; overflow-y: auto; position: relative; text-align: left; }
:deep(.email-body-content > *) { margin-left: 0; margin-right: 0; padding-left: 0; }
:deep(.email-body-content p) { margin-bottom: 15px; margin-top: 0; }
:deep(.email-body-content ul), :deep(.email-body-content ol) { margin-left: 20px; padding-left: 0; }

.email-body-content.blur-content { filter: blur(4px); pointer-events: none; }
.email-body-content p { margin-bottom: 15px; }
.empty-state { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #94a3b8; }
.empty-icon { width: 60px; height: 60px; margin-bottom: 10px; color: #cbd5e1; }
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
.timer-display { display: flex; align-items: center; gap: 8px; font-family: 'Gemunu Libre', sans-serif; font-size: 2rem; font-weight: 700; color: #334155; background: #f1f5f9; padding: 5px 15px; border-radius: 8px; margin-bottom: 5px; }
.timer-display.low-time { color: #ef4444; animation: pulse 1s infinite; }
.timer-icon { width: 28px; height: 28px; }
.streak-wrapper { display: flex; align-items: center; gap: 5px; color: #f59e0b; font-weight: 700; font-family: 'Gemunu Libre', sans-serif; font-size: 1.4rem; margin-bottom: 5px; }
.streak-icon { width: 24px; height: 24px; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.feedback-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; justify-content: center; align-items: center; }
/* UPDATED MODAL STYLING FOR VISIBILITY */
.feedback-modal { background: white; padding: 40px; border-radius: 16px; text-align: center; width: 90%; max-width: 450px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; align-items: center; gap: 15px; border: 4px solid transparent; color: #000; }
.modal-title { font-family: 'Gemunu Libre', sans-serif; font-size: 2rem; color: #000; margin-bottom: 0px; border-bottom: none; padding-bottom: 0; }
.modal-message { color: #000; font-size: 1rem; }
.modal-correct { border-color: #22c55e; }
.modal-incorrect { border-color: #ef4444; }
.modal-icon-wrapper { margin-bottom: 10px; }
.modal-icon { width: 80px; height: 80px; }
.modal-correct .modal-icon { color: #22c55e; }
.modal-incorrect .modal-icon { color: #ef4444; }
.modal-btn { margin-top: 20px; width: 100%; font-size: 1.2rem; }
.loading-spinner { width: 50px; height: 50px; border: 5px solid #f3f4f6; border-top-color: #00e5ff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { color: #ef4444 !important; }

/* MODAL STYLES */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal-card { background: white; width: 90%; max-width: 1000px; border-radius: 12px; padding: 30px; position: relative; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); animation: slideIn 0.3s ease; color: #334155; text-align: left; overflow: hidden; }
.close-btn { position: absolute; top: 15px; right: 15px; background: none; border: none; cursor: pointer; color: #64748b; padding: 5px; border-radius: 50%; transition: all 0.2s; }
.close-btn:hover { background: #f1f5f9; color: #ef4444; }
.close-icon { width: 24px; height: 24px; }
/* .modal-title already defined above but scoped differently in previous block, ensuring compatibility */
.guide-grid { display: flex; gap: 40px; margin-bottom: 20px; }
.guide-box { flex: 1; height: 500px; background: #f1f5f9; background-color: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px; opacity: 0; animation: fadeInUpBig 1.5s ease forwards; }
.guide-box:nth-child(1) { animation-delay: 0.1s; }
.guide-box:nth-child(2) { animation-delay: 0.3s; }
.guide-box:nth-child(3) { animation-delay: 0.5s; }
.modal-footer { display: flex; justify-content: center; }
.return-btn { width: auto; padding: 10px 40px; }
@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUpBig { from { opacity: 0; transform: translate3d(0, 500px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
.fade-enter-active, .fade-appear-active { animation: fadeInDown 0.8s ease forwards; }
@keyframes fadeInDown { 0% { opacity: 0; transform: translate3d(0, -100px, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }
.fade-leave-active { transition: opacity 0.8s ease, transform 0.8s ease; }
.fade-leave-to { opacity: 0; transform: scale(0.9); }
.email-action-footer { 
  padding: 20px 30px; 
  background: #FFFFFF; /* Changed */
  border-top: 1px solid #e2e8f0; /* Lighter border for white bg */
  display: flex; 
  justify-content: flex-end; 
  gap: 15px; 
  align-items: center; 
}
.found-counter { margin-right: auto; display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.05); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1); }
.found-counter .label { font-family: 'Gemunu Libre'; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
.found-counter .count { font-family: 'Gemunu Libre'; font-size: 1.2rem; font-weight: 700; color: #cbd5e1; }
.found-counter .count.all-found { color: #4ade80; }
.action-btn { display: flex; align-items: center; gap: 10px; padding: 12px 24px; border: none; border-radius: 8px; font-family: 'Gemunu Libre', sans-serif; font-size: 1.2rem; font-weight: 700; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.safe-btn { background: #ecfdf5; color: #059669; border: 1px solid #10b981; }
.phish-btn { background: #fef2f2; color: #dc2626; border: 1px solid #ef4444; }

/* Game Over Modal Styling */
.game-over-modal {
  border-color: #ef4444;
  background: #1f2937; /* Darker background for game over */
  color: white;
}
.game-over-modal .modal-title {
  color: #ef4444;
}
.game-over-modal .modal-message {
  color: #e5e7eb;
}
.restart-btn {
  background: #ef4444;
  color: white;
}
.restart-btn:hover {
  background: #dc2626;
}
</style>