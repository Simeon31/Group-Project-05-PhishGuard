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
            <p class="mb-2">Welcome, <strong class="text-indigo-400">{{ user.userName }}</strong>!</p>
            <p class="mb-4">You are logged in.</p>
            <button @click="handleLogout()"
                class="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-400">
                Logout
            </button>

            <details class="mt-4 p-4 bg-gray-800 rounded-md">
                <summary class="cursor-pointer font-semibold text-gray-300">User Details</summary>
                <pre class="mt-2 text-xs overflow-auto">{{ user }}</pre>
            </details>
        </div>
    </div>
</template>
