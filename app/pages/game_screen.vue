<script>
export default {
  name: 'GameScreen',
  methods: {
    startGame() {
      // Logic to start the game
      console.log('Game started!');
    }
  }
}
</script>

<template>
  <div class="game-screen">
    <h1>Welcome to PhishGuard Game!</h1>
    <p>Identify phishing attempts and protect your data.</p>
    <button @click="startGame">Start Game</button>
  </div>
</template>