<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="modal relative">
      <button class="close">✕</button>

      <div class="header">
        <img src="/Images/PhishGuard_Logo.png" class="logo" width="80"/>
        <h2>Welcome to <span>PhishGuard</span></h2>
      </div>

    <div class="intro">
      <h3 class="headline">Spot the red flags. Stay safe.</h3>
      <p class="sub">Practice phishing detection in a simulated inbox</p>
    </div>


      <div class="pill-list">
        <div class="pill">
          <span>🧭 Decide</span>
          <span class="desc">Accept or Flag each email</span>
        </div>
        <div class="pill">
          <span>💡 Learn instantly</span>
          <span class="desc">Quick feedback after every choice</span>
        </div>
        <div class="pill">
          <span>📊 Score & progress</span>
          <span class="desc">Streaks, levels, harder attacks</span>
        </div>
      </div>

      <div class="lookfor">
        <p class="title">Look for:</p>
        <ul>
          <li>⚠️ Sender domain that looks slightly incorrect</li>
          <li>⚠️ Threatening language (e.g. "now", "account locked")</li>
          <li>⚠️ Mismatched links or unexpected attachments</li>
        </ul>
      </div>

      <div class="footer">
        <label><input type="checkbox" /> Don’t show this again</label>
        <div class="actions">
          <button class="secondary">View Example</button>
          <button class="primary">Start Round</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 0;
  font-size: 20px
}

.header h2 {
  margin: 0;
  margin-left: 0px; /* tweak this */
}

.intro {
  text-align: center;
  margin-bottom: 28px;
}

.actions {
  display: flex;
  gap: 14px;
}
  
.modal {
  width: 720px;
  padding: 32px;
  border-radius: 18px;
  background: rgba(24, 29, 38, 0.85);
  backdrop-filter: blur(18px);
  box-shadow:
    0 0 0 1px rgba(66,142,224,.35),
    0 0 40px rgba(66,142,224,.45),
    0 0 120px rgba(6,32,212,.35);
  color: white;
}
.close {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: .7;
}
.header {
  display: flex;
  gap: 12px;
  align-items: center;
}
.header span {
  color: #428EE0;
}
.headline {
  margin-top: 16px;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(90deg,#C1FDFE,#6CB8FF,#428EE0,#0620D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.sub { opacity:.8; margin-bottom: 20px; }
.pill-list { display: grid; gap: 12px; margin-bottom: 24px; }
.pill {
  display: flex;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(90deg,rgba(1,3,60,.9),rgba(6,32,212,.35));
  border: 1px solid rgba(255,255,255,.12);
}
.desc { opacity:.85; }
.lookfor ul { padding-left: 0; list-style: none; }
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
}
.primary {
  background: linear-gradient(90deg,#428EE0,#0620D4);
  padding: 10px 18px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(66,142,224,.6);
}
.secondary {
  border: 1px solid rgba(66,142,224,.6);
  padding: 10px 18px;
  border-radius: 10px;
  color: #6CB8FF;
}
</style>