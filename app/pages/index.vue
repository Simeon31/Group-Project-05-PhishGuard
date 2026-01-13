<script setup lang="ts">
import Dashboard from './dashboard.vue';

const { user, logout } = useOidcAuth()

const handleLogout = async () => {
    await logout()

    await navigateTo('/login')
}
</script>

<template>
    <div class="p-5 font-sans">
       

        <Dashboard />
        <a href="./game_screen.vue">
            <button class="mt-5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Start PhishGuard Game
            </button>
        </a>
    </div>
  
</template>
