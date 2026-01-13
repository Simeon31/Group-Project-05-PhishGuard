<script setup>
// In Nuxt, basic Vue composition API (ref, computed) is auto-imported.
// We define our logic here.

const startGame = () => {
  console.log('Game started!');
  // In Nuxt, you would typically navigate to the game loop here
  // navigateTo('/play') 
};
</script>

<template>
  <!-- The root element of the page -->
  <div class="page-container">
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