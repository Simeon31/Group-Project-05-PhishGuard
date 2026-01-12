<script setup lang="ts">
const { user, logout } = useOidcAuth()

const handleLogout = async () => {
    await logout()

    await navigateTo('/login')
}
</script>

<template>
    <div class="p-5 font-sans">
        <h2 class="text-2xl font-bold mb-4">Dashboard</h2>
        <div v-if="user">
            <div class="flex justify-start gap-4 items-center mb-2">
                <p class="mb-2 order-1">Welcome, <strong class="text-indigo-400">{{ user.userInfo?.family_name || 'User'
                }}</strong>!
                </p>
                <img :src="(user.userInfo?.picture as string)" alt="User Avatar"
                    class="w-14 h-14 order-2 rounded-full mb-4 " />
            </div>
            <p class="mb-4">You are logged in.</p>
            <button @click="handleLogout()"
                class="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-400">
                Logout
            </button>

<<<<<<< HEAD
        <Dashboard />
        <a href="./game_screen.vue">
            <button class="mt-5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Start PhishGuard Game
            </button>
        </a>
=======
            <details class="mt-4 p-4 bg-gray-800 rounded-md">
                <summary class="cursor-pointer font-semibold text-gray-300">User Details</summary>
                <pre class="mt-2 text-xs overflow-auto">{{ user }}</pre>
            </details>
        </div>
>>>>>>> e4140edfed87cf13a924e57c50c034cba5b2134d
    </div>
</template>
