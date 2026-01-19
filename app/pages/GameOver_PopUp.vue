<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="modal relative">
      <button class="close">✕</button>

      <div class="header">
        <img src="/Images/PhishGuard_Logo.png" class="logo" width="80" />
        <h2>Game Over</h2>
      </div>

      <div class="intro">
        <h3 class="title">Training completed</h3>
        <p class="subtitle">
          This is an overview of how you performed in the last round.
          Review your results and keep improving your phishing detection skills.
        </p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="icon">✔️</div>
          <div class="value">7 / 10</div>
          <div class="label">Correct decisions</div>
        </div>

        <div class="stat-card">
          <div class="icon">⚠️</div>
          <div class="value">3</div>
          <div class="label">Mistakes made</div>
        </div>

        <div class="stat-card">
          <div class="icon">📈</div>
          <div class="value">70%</div>
          <div class="label">Accuracy</div>
        </div>
      </div>

      <div class="focus">
        <p class="focus-title">Focus on improving:</p>
        <ul>
          <li>⚠️ Identifying suspicious sender domains</li>
          <li>⚠️ Watch for urgency and pressure tactics</li>
          <li>⚠️ Always double-check sender domains</li>
        </ul>
      </div>

      <div class="actions">
        <button class="secondary">View mistakes</button>
        <button class="primary">Play Again</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  opacity: 0.7;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
}

.intro {
  text-align: center;
  margin: 24px 0;
}

.title {
  font-size: 1.75rem;
  font-weight: 700;
}

.subtitle {
  opacity: 0.85;
  max-width: 520px;
  margin: 6px auto 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.stat-card {
  padding: 18px;
  border-radius: 14px;
  text-align: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
}

.stat-card .icon {
  font-size: 18px;
  margin-bottom: 4px;
}

.stat-card .value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-card .label {
  opacity: 0.8;
  margin-top: 2px;
}

.focus {
  text-align: center;
  margin-top: 20px;
}

.focus-title {
  font-weight: 600;
  margin-bottom: 10px;
}

.focus ul {
  list-style: none;
  padding: 0;
  display: inline-block;
  text-align: left;
}

.focus li {
  margin-bottom: 6px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.primary {
  background: linear-gradient(90deg,#428EE0,#0620D4);
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(66,142,224,.6);
}

.secondary {
  border: 1px solid rgba(66,142,224,.6);
  padding: 10px 20px;
  border-radius: 10px;
  color: #6CB8FF;
}
</style>
