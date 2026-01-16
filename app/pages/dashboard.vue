<script setup lang="ts">
import { UsersIcon, DocumentTextIcon } from '@heroicons/vue/24/solid'

const { user, logout } = useOidcAuth()

// Fetch stats
const { data: stats } = await useFetch('/api/stats');
const counts = computed(() => stats.value?.counts || { users: 0, scenarios: 0 });

const handleLogout = async () => {
    await logout()

    await navigateTo('/login')
}
</script>

<template>


    <div v-if="user" class="flex h-screen overflow-hidden bg-gray-900">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-10 text-white">
            <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
            <div class="flex justify-start gap-4 items-center mb-6">
                <p class="mb-2 order-1">Welcome, <strong class="text-[#C1FDFE]">{{ user.userInfo?.nickname || 'User'
                        }}</strong>!
                </p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Registered Users Card -->
                <div
                    class="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg flex items-center justify-between">
                    <div>
                        <h3 class="text-gray-400 text-sm font-medium uppercase tracking-wider">Registered Users</h3>
                        <p class="text-3xl font-bold text-white mt-2">{{ counts.users }}</p>
                    </div>
                    <div class="p-3 bg-indigo-500/20 rounded-full">
                        <UsersIcon class="h-8 w-8 text-indigo-400" />
                    </div>
                </div>

                <!-- Game Scenarios Card -->
                <div
                    class="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg flex items-center justify-between">
                    <div>
                        <h3 class="text-gray-400 text-sm font-medium uppercase tracking-wider">Game Scenarios</h3>
                        <p class="text-3xl font-bold text-white mt-2">{{ counts.scenarios }}</p>
                    </div>
                    <div class="p-3 bg-teal-500/20 rounded-full">
                        <DocumentTextIcon class="h-8 w-8 text-teal-400" />
                    </div>
                </div>
            </div>

            <p class="mb-4 text-gray-400">You are logged in.</p>
            <button @click="handleLogout()"
                class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors">
                Logout
            </button>

            <details class="mt-4 p-4 bg-gray-800 rounded-md">
                <summary class="cursor-pointer font-semibold text-gray-300">User Details</summary>
                <pre class="mt-2 text-xs overflow-auto">{{ user }}</pre>
            </details>
        </main>
    </div>
</template>