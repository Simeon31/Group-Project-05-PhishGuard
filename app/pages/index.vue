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
    </div>
</template>
