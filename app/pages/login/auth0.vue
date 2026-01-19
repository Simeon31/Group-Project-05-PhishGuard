<script setup lang="ts">
definePageMeta({
    auth: false,
})

const { loggedIn, login } = useOidcAuth()

if (loggedIn.value) {
    navigateTo('/game_screen')
} else {
    login('auth0')
}
</script>

<template>
    <div class="h-full w-full bg-gray-900 relative flex items-center justify-center">
        <div class="w-auto h-auto absolute top-4 left-4 text-white font-bold text-lg z-10 p-2">
            <h1 style="color: #C1FDFE; font: 600;">PhishGuard</h1>
        </div>

        <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
            <p class="text-white text-lg">Redirecting to Auth0...</p>
            <NuxtLink to="/login" class="mt-4 inline-block text-sm text-gray-400 hover:text-gray-300">
                ← Back to login options
            </NuxtLink>
        </div>
    </div>
</template>
