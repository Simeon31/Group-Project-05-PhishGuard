<script setup>
import { ref, computed } from 'vue';
// Import Heroicons
import { InboxIcon, PresentationChartBarIcon, Cog6ToothIcon, HeartIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, UserCircleIcon, PlayIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';

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

// --- EMAIL DATA ---
const emails = ref([
  {
    id: 1,
    sender: 'HR Department',
    sender_email: 'hr-updates@corporatenews.com',
    subject: 'Urgent: Verify your details',
    preview: 'Please verify your payroll information immediately...',
    body: `
      <p>Dear Employee,</p>
      <p>We have noticed a discrepancy in your payroll details for the current month. To ensure you are paid on time, please click the link below to verify your direct deposit information immediately.</p>
      <p>Failure to do so may result in payment delays.</p>
      <p><strong><a href="#" style="color:blue">Verify Payroll Information</a></strong></p>
      <p>Regards,<br>HR Team</p>
    `,
    date: '10:42 AM',
    initials: 'HR',
    read: false
  },
  {
    id: 2,
    sender: 'IT Support',
    sender_email: 'support@internal-tech.com',
    subject: 'System Maintenance',
    preview: 'Scheduled downtime for server maintenance...',
    body: `
      <p>Hello Team,</p>
      <p>This is a reminder that we will be performing scheduled server maintenance tonight from 2:00 AM to 4:00 AM.</p>
      <p>Network services may be intermittent during this time.</p>
      <p>Thank you,<br>IT Support</p>
    `,
    date: '09:15 AM',
    initials: 'IT',
    read: true
  },
  {
    id: 3,
    sender: 'CEO Office',
    sender_email: 'ceo.office@private-mail-server.net',
    subject: 'Gift Card Request',
    preview: 'Can you purchase 5x $100 gift cards for...',
    body: `
      <p>Hi,</p>
      <p>I am currently in a meeting and cannot talk on the phone. I need you to purchase 5x $100 gift cards for a client gift immediately.</p>
      <p>Please send me the codes as soon as you have them. I will reimburse you later.</p>
      <p>Sent from my iPhone</p>
    `,
    date: 'Yesterday',
    initials: 'CO',
    read: false
  },
  {
    id: 4,
    sender: 'Newsletter',
    sender_email: 'news@tech-digest.io',
    subject: 'Weekly Tech Digest',
    preview: 'Here are the top stories from this week...',
    body: `
      <h2>Weekly Tech Update</h2>
      <p>Here are the top stories you might have missed this week:</p>
      <ul>
        <li>New AI regulations announced</li>
        <li>Quantum computing breakthrough</li>
        <li>Cybersecurity trends for 2024</li>
      </ul>
      <p>Click here to read more.</p>
    `,
    date: 'Yesterday',
    initials: 'NL',
    read: true
  }
]);

const selectedEmailId = ref(1);

const selectEmail = (id) => {
  selectedEmailId.value = id;
  const email = emails.value.find(e => e.id === id);
  if (email) email.read = true;
};

// Computed property to get the full object of the currently selected email
const currentEmail = computed(() => {
  return emails.value.find(e => e.id === selectedEmailId.value);
});

const startGame = () => {
  console.log('Game started! transitions occurring...');
  gameStarted.value = true;
};

const viewExample = () => {
  console.log('Viewing example...');
};

const toggleDontShow = () => {
  dontShowAgain.value = !dontShowAgain.value;
};
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
            <button 
              @click="toggleDontShow" 
              class="secondary-btn toggle-btn"
              :class="{ 'active': dontShowAgain }"
            >
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
        <div class="lives-wrapper">
          <HeartIcon v-for="n in 5" :key="n" class="heart-icon" :class="{ 'lost': n > lives }" />
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
            <div 
              v-for="email in emails" 
              :key="email.id" 
              class="email-item"
              :class="{ 'selected': selectedEmailId === email.id, 'unread': !email.read }"
              @click="selectEmail(email.id)"
            >
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
          
          <!-- Dynamic Content -->
          <div v-if="currentEmail" class="email-content-wrapper">
            
            <div class="email-header-area">
              <div class="email-subject-large">{{ currentEmail.subject }}</div>
              <div class="email-meta-row">
                <!-- UPDATED: Matching Avatar Icon -->
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

          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <InboxIcon class="empty-icon" />
            <p>Select an email to read</p>
          </div>

        </div>
      </div>

    </div>

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

/* --- UPDATED WELCOME SCREEN STYLES (Refined Layout) --- */
.welcome-wrapper {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(8px);
  z-index: 50;
  background: rgba(0,0,0,0.7);
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
  gap: 8px; /* Slightly tighter gap */
  margin-bottom: 20px; /* Reduced margin */
  text-align: left; 
}

.feature-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 15px; /* Tighter padding */
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
  color: #00e5ff; /* Cyan Divider */
  margin: 0 10px;
  font-weight: 700;
}

.f-desc {
  font-family: 'Gemunu Libre', sans-serif;
  font-size: 1.2rem; /* Slightly larger for readability */
  color: #cbd5e1;
  white-space: nowrap;
}

/* 4. Look For Section */
.look-for-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px 15px; /* Tighter padding */
  margin-bottom: 20px; /* Reduced margin */
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
  padding-top: 15px; /* Reduced padding */
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
  position: absolute; top: 30px; left: 30px; display: flex; align-items: center; gap: 5px; z-index: 10;
}
.logo-icon { width: 80px; height: auto; filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.3)); }
.logo-text { font-family: 'Gemunu Libre', sans-serif; font-size: 2rem; font-weight: 700; color: black; text-shadow: none; letter-spacing: 2px; margin-top: 5px; }

.sidebar-container {
  position: absolute; top: 130px; left: 30px; width: 260px;
  background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); 
  border-radius: 12px; backdrop-filter: blur(8px); padding: 20px;
  display: flex; flex-direction: column; gap: 15px; z-index: 5;
}

.stats-container {
  position: absolute; top: 380px; left: 30px; width: 260px;
  background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 12px; backdrop-filter: blur(8px); padding: 20px;
  display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 5;
}

/* --- MAIL INTERFACE (RIGHT) --- */
.mail-container {
  position: absolute; top: 30px; right: 30px; bottom: 30px; left: 320px;
  background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 12px; backdrop-filter: blur(8px); display: flex; overflow: hidden; 
}

/* 1. Inbox List */
.inbox-list {
  width: 35%; border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex; flex-direction: column;
}
.section-header {
  font-family: 'Gemunu Libre', sans-serif; font-size: 1.5rem; font-weight: 700; color: #334155;
  padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.05); text-align: left; flex-shrink: 0;
}
.email-items-wrapper {
  overflow-y: auto; flex-grow: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px;
}
.email-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: rgba(255, 255, 255, 0.5); border-radius: 8px; cursor: pointer;
  transition: all 0.2s ease; border-left: 3px solid transparent; text-align: left;
}
.email-item:hover { background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.email-item.selected { background: white; border-left-color: rgb(43, 84, 192); box-shadow: 0 4px 10px rgba(43, 84, 192, 0.15); }
.email-item.unread .email-subject { font-weight: 700; color: #0f172a; }
.email-avatar {
  width: 40px; height: 40px; background: rgb(43, 84, 192); color: white; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0;
}
.email-details { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
.email-top-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
.email-sender { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.email-date { font-size: 0.75rem; color: #64748b; }
.email-subject { font-size: 0.9rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.email-preview { font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }


/* 2. Message Preview (Right Column) */
.message-preview {
  width: 65%;
  display: flex;
  flex-direction: column;
  background: #f8fafc; /* Very light grey for contrast */
}

/* Dynamic Email Content Styles */
.email-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* Ensure only body scrolls */
}

.email-header-area {
  padding: 20px;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  background: white;
  text-align: left;
  flex-shrink: 0;
}

.email-subject-large {
  font-size: 1.8rem; /* Increased size */
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  font-family: 'Segoe UI', sans-serif;
  text-align: left; /* Ensure left align */
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
  width: 40px; height: 40px; color: #cbd5e1;
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
  overflow-y: auto; /* Allow scrolling if email is long */
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
  width: 60px; height: 60px; margin-bottom: 10px; color: #cbd5e1;
}


/* (Sidebar & Stats Styling remains the same) */
.round-text { font-family: 'Gemunu Libre', sans-serif; font-size: 1.8rem; font-weight: 700; color: black; letter-spacing: 1px; }
.lives-wrapper { display: flex; gap: 8px; margin-bottom: 5px; }
.heart-icon { width: 32px; height: 32px; color: #ef4444; filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3)); transition: all 0.3s ease; }
.heart-icon.lost { color: #cbd5e1; filter: none; }
.score-wrapper { display: flex; justify-content: space-around; width: 100%; padding-top: 10px; border-top: 1px solid rgba(0, 0, 0, 0.1); }
.score-item { display: flex; align-items: center; gap: 8px; }
.score-icon { width: 28px; height: 28px; }
.correct-color { color: #22c55e; }
.incorrect-color { color: #ef4444; }
.score-text { font-family: 'Gemunu Libre', sans-serif; font-size: 1.5rem; font-weight: 700; color: #334155; }

.menu-item { display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; color: #4a5568; }
.menu-item:hover { background: rgb(43, 84, 192); color: white; }
.menu-item.active { background: #00e5ff; color: #000; box-shadow: 0 4px 10px rgba(0, 229, 255, 0.3); }
.menu-icon { width: 24px; height: 24px; }
.menu-text { font-size: 1.1rem; font-weight: 600; font-family: 'Segoe UI', sans-serif; }

/* --- ANIMATION CLASSES --- */
.fade-enter-active, .fade-appear-active { animation: fadeInDown 0.8s ease forwards; }
@keyframes fadeInDown { 0% { opacity: 0; transform: translate3d(0, -100px, 0); } 100% { opacity: 1; transform: translate3d(0, 0, 0); } }
.fade-leave-active { transition: opacity 0.8s ease, transform 0.8s ease; }
.fade-leave-to { opacity: 0; transform: scale(0.9); }
</style>