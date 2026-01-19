<script setup lang="ts">
import Dashboard from './dashboard.vue';
import Game_screen from './game_screen.vue';

const { user, logout } = useOidcAuth()

const handleLogout = async () => {
    await logout()

    await navigateTo('/login')
}
</script>

<template>
    <div class="p-5 font-sans">

        <Game_screen />
    </div>

</template>
