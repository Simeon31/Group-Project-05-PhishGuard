<script setup>
import { ref, computed, onUnmounted } from 'vue';
// Import Heroicons
import { 
  InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, 
  CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, 
  PlayIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, 
  FireIcon, ClockIcon, XMarkIcon, QuestionMarkCircleIcon, PlusIcon,
  ArrowPathIcon, LightBulbIcon
} from '@heroicons/vue/24/solid';

// We use a 'ref' to track if the game has started. 
const gameStarted = ref(false);
const dontShowAgain = ref(false);
const showHelpModal = ref(false); // Controls the help popup
const showAttackModal = ref(false); // Controls the new Attack Type popup
const showGameOverModal = ref(false); // Controls the Game Over popup
const showRoundCompleteModal = ref(false); // Controls the Round Complete popup
const showMistakesModal = ref(false); // Controls the Mistakes Review popup

// Hint State
const showHint = ref(false); 

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

// Round Logic State
const roundMistakes = ref(0); 
const roundFeedbackMessage = ref("");
const mistakes = ref([]); // Store details of wrong answers

// Game Logic State
const pendingLifeLoss = ref(false); 
const isProcessingDecision = ref(false); 
const playedScenarioIds = ref(new Set()); 

// Animation State
const exitingEmailId = ref(null);
const isExiting = ref(false);
const heartAnimations = ref(['', '', '', '', '']); 

// Link Hover State
const hoveredLink = ref(null);

// --- ROUND MESSAGES DATA ---
const roundMessages = {
  perfect: [ "Firewall integrity at 100%. Outstanding work, Agent.", "Threats neutralized.", "Perimeter secure." ],
  good: [ "Solid defense.", "Threats contained.", "Good work, but stay sharp." ],
  average: [ "We took some hits.", "That was close.", "System unstable but operational." ],
  critical: [ "CRITICAL WARNING! System integrity near zero.", "We barely survived.", "One more mistake and the network goes dark." ]
};

// --- EMAIL DATA (Fetched from API) ---
const emails = ref([]);
const selectedEmailId = ref(null);

// Fetch scenarios from API
const fetchScenarios = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await $fetch('/api/scenarios', {
      query: { difficulty: roundNumber.value, limit: 50 }
    });

    if (response.success && response.data) {
      let availableEmails = response.data.filter(e => !playedScenarioIds.value.has(e.id));
      
      if (availableEmails.length < 1 && response.data.length > 0) {
         playedScenarioIds.value.clear();
         availableEmails = response.data;
      }

      const targetCount = Math.min(4 + (roundNumber.value - 1) * 2, 12);
      const selectedEmails = availableEmails.slice(0, targetCount);
      
      emails.value = selectedEmails.map(email => ({
        ...email,
        redFlags: email.redFlags || [],
        timeLeft: 30,
      }));
      
      if (emails.value.length > 0) {
        selectedEmailId.value = emails.value[0].id;
      }
    }
  } catch (err) {
    console.error('Failed to fetch scenarios:', err);
    error.value = 'Failed to load emails.';
  } finally {
    loading.value = false;
  }
};

const startTimer = () => {
  stopTimer();
  if (lives.value <= 0) return;
  if (currentEmail.value) { timeLeft.value = currentEmail.value.timeLeft; } 
  else { timeLeft.value = 30; }

  timerInterval = setInterval(() => {
    if (lives.value <= 0) { stopTimer(); return; }

    if (timeLeft.value > 0) {
      timeLeft.value--;
      if (currentEmail.value) { currentEmail.value.timeLeft = timeLeft.value; }
    } else {
      stopTimer();
      handleDecision(null, true);
    }
  }, 1000);
};

const stopTimer = () => { if (timerInterval) clearInterval(timerInterval); };

const selectEmail = (id) => {
  if (isExiting.value || isProcessingDecision.value || lives.value <= 0) return; 
  selectedEmailId.value = id;
  const email = emails.value.find(e => e.id === id);
  if (email) email.read = true;
  
  // Reset Hint on email switch
  showHint.value = false;
  
  startTimer(); 
  feedback.value = null;
  hoveredLink.value = null; 
};

const currentEmail = computed(() => {
  return emails.value.find(e => e.id === selectedEmailId.value);
});

// Process body logic
const processedBody = computed(() => {
  if (!currentEmail.value) return '';
  let content = currentEmail.value.body || '';
  content = content.replace(/\n/g, '<br>');

  const generateContextAwareLink = () => {
    const emailParts = (currentEmail.value.sender_email || '').split('@');
    const domain = emailParts.length > 1 ? emailParts[1] : 'service.com';
    const name = domain.split('.')[0];
    return currentEmail.value.isPhishing ? 
      `http://${name}-security-check.com/login?id=${Math.floor(Math.random() * 1000)}` : 
      `https://www.${domain}/account`;
  };
  const defaultDynamicUrl = generateContextAwareLink();
  const placeholders = [];
  const createPlaceholder = (html) => {
    const id = `___LINK_PLACEHOLDER_${placeholders.length}___`;
    placeholders.push({ id, html });
    return id;
  };

  if (currentEmail.value.custom_links && Array.isArray(currentEmail.value.custom_links)) {
    const sortedLinks = [...currentEmail.value.custom_links].sort((a, b) => b.text.length - a.text.length);
    sortedLinks.forEach((linkObj) => {
      const escapedText = linkObj.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escapedText, 'g');
      if (pattern.test(content)) {
        content = content.replace(pattern, () => createPlaceholder(`<a href="${linkObj.url}" class="phish-link">${linkObj.text}</a>`));
      }
    });
  }

  const actionPhrases = [
    "click here to re-activate", "click here immediately", "click here to claim shipment", "click to block access",
    "click here", "login now", "verify account", "update payment", "reset password", "download here",
    "download the form here", "verify payment info", "restart membership", "validate your current login",
    "verify your identity here", "secure your account here", "sign in with email", "unlock card now",
    "send me your cell number", "buy 5x \\$100 apple gift cards", "email me the codes", "revert changes immediately",
    "reject the request here", "check activity", "review your recent activity", "go to workday portal",
    "update bank details", "VALIDATE NOW", "apply here", "Redeem Voucher Code", "secure your account now", 
    "Start Survey", "View Voided Check", "Start Course", "Increase Quota Free", "Update Billing", "Read & Sign Policy",
    "download this form", "wellsfargo.com"
  ];

  const phrasePatternStr = actionPhrases.map(p => p.replace(/ /g, '\\s+')).join('|');
  const actionPhrasePattern = new RegExp(`(?:\\[\\s*)?(${phrasePatternStr})(?:\\s*\\])?`, 'gi');
  content = content.replace(actionPhrasePattern, (match) => {
    if (match.includes('___LINK_PLACEHOLDER')) return match;
    return createPlaceholder(`<a href="${defaultDynamicUrl}" class="phish-link">${match}</a>`);
  });

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

  placeholders.forEach(p => { content = content.split(p.id).join(p.html); });
  return content;
});

const handleLinkClick = (event) => {
  const link = event.target.closest('a');
  if (link) event.preventDefault(); 
};

const triggerGameOver = () => {
  stopTimer();
  showGameOverModal.value = true;
};

// Lose life with animation
const loseLife = () => {
  if (lives.value > 0) {
    const heartIndex = lives.value - 1; 
    
    // 1. Shake immediately
    heartAnimations.value[heartIndex] = 'animate__shakeX';

    setTimeout(() => {
      // 2. Fade Out
      heartAnimations.value[heartIndex] = 'animate__fadeOut';
      
      setTimeout(() => {
        // 3. Decrement life
        lives.value--; 
        
        // Reset animation class
        heartAnimations.value[heartIndex] = ''; 

        // Check Game Over
        if (lives.value <= 0) {
          triggerGameOver();
          return;
        }

        // Low Health Logic
        if (lives.value === 1) {
            heartAnimations.value[0] = 'animate__heartBeat';
            setTimeout(() => { heartAnimations.value[0] = 'animate__pulse'; }, 1000);
        }
      }, 500); 
    }, 500); 
  }
};

const restartGame = async () => {
  lives.value = 5;
  correctCount.value = 0;
  incorrectCount.value = 0;
  streak.value = 0;
  roundNumber.value = 1;
  roundMistakes.value = 0;
  mistakes.value = []; 
  heartAnimations.value = ['', '', '', '', ''];
  showGameOverModal.value = false;
  isProcessingDecision.value = false; 
  emails.value = [];
  playedScenarioIds.value.clear(); 
  
  await startGame();
};

const handleDecision = (markedSafe, isTimeout = false) => {
  if (isProcessingDecision.value || lives.value <= 0) return; 
  isProcessingDecision.value = true;

  // Close hint if open when decision is made
  showHint.value = false;

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
    roundMistakes.value++; 
    pendingLifeLoss.value = true; 
    
    mistakes.value.push({
      subject: currentEmail.value.subject,
      sender: currentEmail.value.sender,
      reason: "Time ran out.",
      educationalMessage: currentEmail.value.educationalMessage,
      type: "Timeout",
      body: currentEmail.value.body 
    });

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
      roundMistakes.value++; 
      pendingLifeLoss.value = true; 

      mistakes.value.push({
        subject: currentEmail.value.subject,
        sender: currentEmail.value.sender,
        reason: "Incorrect decision.",
        educationalMessage: currentEmail.value.educationalMessage,
        type: isActuallyPhishing ? "Missed Phish" : "False Positive",
        body: currentEmail.value.body 
      });
    }
  }

  feedback.value = { visible: true, isCorrect: success, title, message };
};

const closeFeedback = async () => {
  feedback.value = null;
  
  if (pendingLifeLoss.value) {
    loseLife();
    pendingLifeLoss.value = false;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  if (lives.value <= 0) return;

  if (selectedEmailId.value) playedScenarioIds.value.add(selectedEmailId.value);
  exitingEmailId.value = selectedEmailId.value;
  isExiting.value = true;

  setTimeout(async () => {
    const index = emails.value.findIndex(e => e.id === exitingEmailId.value);
    if (index !== -1) emails.value.splice(index, 1);

    exitingEmailId.value = null;
    isExiting.value = false;
    isProcessingDecision.value = false; 
    selectedEmailId.value = null;

    if (emails.value.length > 0) {
      selectEmail(emails.value[0].id);
    } else {
      if (lives.value === 1) roundFeedbackMessage.value = roundMessages.critical[0];
      else if (roundMistakes.value === 0) roundFeedbackMessage.value = roundMessages.perfect[0];
      else if (roundMistakes.value === 1) roundFeedbackMessage.value = roundMessages.good[0];
      else roundFeedbackMessage.value = roundMessages.average[0];
      
      showRoundCompleteModal.value = true;
    }
  }, 750); 
};

const proceedToNextRound = async () => {
  showRoundCompleteModal.value = false;
  roundNumber.value++;
  roundMistakes.value = 0; 
  await fetchScenarios();
  if (emails.value.length > 0) startTimer();
  else console.log("No more scenarios!");
};

const startGame = async () => {
  console.log('Game started! transitions occurring...');
  gameStarted.value = true;
  await fetchScenarios();
  startTimer();
};

const viewExample = () => { showHelpModal.value = true; };
const openMistakes = () => { showMistakesModal.value = true; };
const toggleDontShow = () => { dontShowAgain.value = !dontShowAgain.value; };
const toggleHelpModal = () => { showHelpModal.value = !showHelpModal.value; };
const toggleMistakesModal = () => { showMistakesModal.value = !showMistakesModal.value; };
const toggleAttackModal = () => { showAttackModal.value = !showAttackModal.value; };
const toggleHint = () => { showHint.value = !showHint.value; };

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

        <!-- HINT SECTION (Now at bottom of stats container) -->
        <div class="hint-wrapper">
           <button @click="toggleHint" class="hint-toggle-btn" :class="{ 'active': showHint }">
             <LightBulbIcon class="w-5 h-5" :class="showHint ? 'text-yellow-400' : 'text-gray-400'" />
             <span>HINT</span>
           </button>
           <Transition name="hint-anim">
             <div v-if="showHint" class="hint-box">
               {{ currentEmail?.hint || "No specific hint available for this email. Use your training!" }}
             </div>
           </Transition>
        </div>
      </div>

      <!-- GUIDE BUTTON -->
      <button class="bottom-left-btn guide-btn-pos" @click="toggleHelpModal">
        <QuestionMarkCircleIcon class="btn-icon" />
        <span>GUIDE</span>
      </button>

      <!-- === MAIL INTERFACE (RIGHT SIDE) === -->
      <div class="mail-container">
        <div class="inbox-list">
          <div class="section-header">Inbox</div>
          <TransitionGroup name="email-list" tag="div" class="email-items-wrapper">
            <div v-for="email in emails" :key="email.id" class="email-item" :class="{ 'selected': selectedEmailId === email.id, 'unread': !email.read, 'animate-back-out': exitingEmailId === email.id }" @click="selectEmail(email.id)">
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
            
            <div class="email-body-area" @click="handleLinkClick">
              <div class="email-subject-large">{{ currentEmail.subject }}</div>
              <div v-html="processedBody" class="email-body-content"></div>
            </div>
            
            <div class="email-action-footer">
              <button @click="handleDecision(true)" class="action-btn safe-btn" :disabled="isProcessingDecision || lives <= 0"><ShieldCheckIcon class="btn-icon" /> Mark Safe</button>
              <button @click="handleDecision(false)" class="action-btn phish-btn" :disabled="isProcessingDecision || lives <= 0"><ExclamationTriangleIcon class="btn-icon" /> Report Phishing</button>
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

      <!-- ROUND COMPLETE MODAL -->
      <Transition name="fade">
        <div v-if="showRoundCompleteModal" class="feedback-overlay">
          <div class="feedback-modal round-modal">
            <div class="modal-icon-wrapper"><ShieldCheckIcon class="modal-icon" style="color: #00e5ff;" /></div>
            <div class="modal-title" style="color: #00e5ff;">Round Complete</div>
            <div class="modal-message">{{ roundFeedbackMessage }}</div>
            <button @click="proceedToNextRound" class="primary-btn modal-btn">NEXT ROUND</button>
          </div>
        </div>
      </Transition>

      <!-- GAME OVER MODAL -->
      <Transition name="fade">
        <div v-if="showGameOverModal" class="game-over-wrapper">
          <div class="game-over-card">
            <button class="close-btn" @click="restartGame">✕</button>

            <div class="welcome-header-row">
              <img src="/Images/PhishGuard_Logo.png" class="welcome-logo-small" width="60" />
              <div class="welcome-title-small" style="color: #ef4444;">GAME OVER</div>
            </div>

            <div class="welcome-hero">
              <h2>Training completed</h2>
              <p>This is an overview of how you performed. Review your results and keep improving.</p>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">✔️</div>
                <div class="stat-value">{{ correctCount }} / {{ correctCount + incorrectCount }}</div>
                <div class="stat-label">Correct decisions</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⚠️</div>
                <div class="stat-value">{{ incorrectCount }}</div>
                <div class="stat-label">Mistakes made</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">{{ Math.round((correctCount / ((correctCount + incorrectCount) || 1)) * 100) }}%</div>
                <div class="stat-label">Accuracy</div>
              </div>
            </div>

            <div class="look-for-section">
              <div class="look-for-title">Focus on improving:</div>
              <ul class="look-for-list">
                <li>⚠️ Identifying suspicious sender domains</li>
                <li>⚠️ Watch for urgency and pressure tactics</li>
                <li>⚠️ Always double-check sender domains</li>
              </ul>
            </div>

            <div class="welcome-footer" style="justify-content: center; gap: 15px;">
              <button class="secondary-btn" @click="openMistakes" style="border-color: #00e5ff; color: #00e5ff;">View mistakes</button>
              <button class="primary-btn" @click="restartGame" style="background-color: #00e5ff; color: #0f172a;">Play Again</button>
            </div>
          </div>
        </div>
      </Transition>
      
      <!-- MISTAKES MODAL -->
      <Transition name="fade">
        <div v-if="showMistakesModal" class="modal-overlay" @click.self="toggleMistakesModal">
          <div class="modal-card mistakes-modal-content guide-modal-card">
            <button class="close-btn" @click="toggleMistakesModal"><XMarkIcon class="close-icon" /></button>
            <h2 class="modal-title" style="color: #00e5ff;">Review Mistakes</h2>
            <div class="modal-content mistakes-scroll-area">
              <div v-if="mistakes.length === 0" class="empty-mistakes"><p>No mistakes recorded! Great job.</p></div>
              <div v-else class="mistakes-list">
                <div v-for="(mistake, index) in mistakes" :key="index" class="mistake-item">
                  <div class="mistake-header">
                    <span class="mistake-type text-red-400 font-bold uppercase tracking-wide">{{ mistake.type || 'Error' }}</span>
                    <span class="mistake-sender text-gray-400 text-sm">from: {{ mistake.sender }}</span>
                  </div>
                  
                  <div class="mistake-context">
                    <h4 class="mistake-subject text-white">{{ mistake.subject }}</h4>
                    <!-- Email Body Snippet in Box -->
                    <div class="email-snippet" v-html="mistake.body"></div>
                  </div>

                  <div class="mistake-analysis">
                    <div class="analysis-header">
                       <LightBulbIcon class="w-5 h-5 text-yellow-400" />
                       <span class="text-yellow-400 font-bold">ANALYSIS</span>
                    </div>
                    <p class="mistake-reason text-gray-300">
                      {{ mistake.educationalMessage || mistake.reason }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="modal-footer mt-4">
                <button @click="toggleMistakesModal" class="primary-btn return-btn">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- GUIDE MODAL (Re-styled) -->
      <Transition name="fade">
        <div v-if="showHelpModal" class="modal-overlay" @click.self="toggleHelpModal">
          <div class="modal-card guide-modal-card">
            <button class="close-btn" @click="toggleHelpModal"><XMarkIcon class="close-icon" /></button>
            <h2 class="modal-title">Examples & Tips</h2>
            <div class="modal-content">
              <div class="guide-grid">
                <div class="guide-box"></div>
                <div class="guide-box"></div>
                <div class="guide-box"></div>
              </div>
              <div class="modal-footer"><button @click="toggleHelpModal" class="primary-btn return-btn">RETURN TO GAME</button></div>
            </div>
          </div>
        </div>
      </Transition>

  </div>
  </div>
</template>

<style>
/* Global Styles */
.email-body-content a { color: #0645AD !important; text-decoration: underline !important; cursor: pointer !important; font-weight: 500; }
.email-body-content a:hover { color: #0b0080 !important; }
.animate-back-out { animation: backOutLeft 0.75s ease-in forwards; }
.email-list-enter-active { animation: fadeInUpBig 0.8s ease-out; }
.email-list-leave-active { position: absolute; }
.animate__shakeX { animation: shakeX 0.5s ease-in-out; }
.animate__fadeOut { animation: fadeOut 0.5s ease-out forwards; }
.animate__heartBeat { animation: heartBeat 1s ease-in-out; }
.animate__pulse { animation: pulse 2s infinite; color: #dc2626 !important; }
.hint-anim-enter-active { animation: fadeInDown 0.5s ease-out forwards; }
.hint-anim-leave-active { animation: fadeOutUp 0.5s ease-in forwards; }

/* Keyframes */
@keyframes backOutLeft { 0% { transform: scale(1); opacity: 1; } 20% { transform: translateX(0px) scale(0.9); opacity: 0.9; } 100% { transform: translateX(-500px) scale(0.9); opacity: 0; } }
@keyframes fadeInUpBig { from { opacity: 0; transform: translate3d(0, 500px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes shakeX { 0%, 100% { transform: translate3d(0, 0, 0); } 10%, 30%, 50%, 70%, 90% { transform: translate3d(-5px, 0, 0); } 20%, 40%, 60%, 80% { transform: translate3d(5px, 0, 0); } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInDown { 0% { opacity: 0; transform: translate3d(0, -100px, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes fadeOutUp { from { opacity: 1; transform: translate3d(0, 0, 0); } to { opacity: 0; transform: translate3d(0, -100px, 0); } }
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
.guide-btn-pos { bottom: 30px; }
.hint-btn-pos { bottom: 90px; } /* Stacked above guide */

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
.safe-btn { background: #ecfdf5; color: #059669; border: 1px solid #10b981; }
.phish-btn { background: #fef2f2; color: #dc2626; border: 1px solid #ef4444; }

/* Game Over Modal Styling */
.game-over-wrapper {
  position: fixed; 
  inset: 0; 
  z-index: 60; 
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}
.game-over-card {
  background: rgb(23, 28, 42); 
  border: 1px solid rgba(0, 229, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: #e2e8f0;
  max-width: 700px; 
  width: 90%;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  position: relative; /* Ensure it stacks on top */
}
.game-over-card .welcome-title-small {
  color: #ef4444; /* Red for Game Over */
}
.stat-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; align-items: center; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
.stat-value { font-family: 'Gemunu Libre', sans-serif; font-size: 1.5rem; font-weight: 700; color: white; }
.stat-label { font-size: 0.9rem; color: #94a3b8; }
.restart-btn {
  background: #ef4444;
  color: white;
}
.restart-btn:hover {
  background: #dc2626;
}
.round-modal {
  background: rgb(23, 28, 42); 
  border: 1px solid rgba(0, 229, 255, 0.2);
  color: #e2e8f0;
}
.round-modal .modal-title { color: #00e5ff; }
.round-modal .modal-message { color: #cbd5e1; }

/* Mistakes Modal Specifics - DARK THEME */
.mistakes-modal-content {
  background: rgb(23, 28, 42);
  color: #e2e8f0;
  border: 1px solid rgba(0, 229, 255, 0.2);
  height: auto;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.mistakes-scroll-area {
  overflow-y: auto;
  flex: 1; /* Allow content to grow and scroll */
}

.mistake-item {
  /* Removed guide-box class in template, using standalone styles */
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(239, 68, 68, 0.3); /* Red border for error */
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 15px;
}

.mistake-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Ensure alignment */
  gap: 15px; /* Force spacing */
  margin-bottom: 5px;
}
.mistake-context {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 10px;
  margin: 10px 0;
}
.email-snippet {
  font-family: 'Segoe UI', sans-serif;
  font-size: 0.9rem;
  color: #94a3b8; /* Muted text for email content */
  background: white; /* Keep email content readable on white like in-game */
  color: #334155;
  padding: 10px;
  border-radius: 4px;
  /* Removed max-height and overflow to allow full expansion */
}
.mistake-analysis {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}
.analysis-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* HINT STYLES */
.hint-wrapper {
  margin-bottom: 15px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hint-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  color: black; /* Changed from white */
  font-family: 'Gemunu Libre';
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.hint-toggle-btn:hover { background: rgba(255, 255, 255, 0.2); }
.hint-toggle-btn.active { background: #00e5ff; color: black; border-color: #00e5ff; } /* Active text color to black */
.hint-box {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.1); /* Dark/Glass style */
  color: black; /* Changed from #e2e8f0 */
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.95rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Guide Modal (Dark Theme) */
.guide-modal-content {
  background: rgb(23, 28, 42); 
  border: 1px solid rgba(0, 229, 255, 0.2);
  color: #e2e8f0;
}
.guide-modal-content .modal-title { color: #00e5ff; border-color: rgba(255,255,255,0.1); }
.guide-box {
  background: rgba(255, 255, 255, 0.05); /* Dark background for boxes */
  border: 1px solid rgba(0, 229, 255, 0.3); /* Cyan border */
  box-shadow: none; /* Reset shadow */
}
</style>