<script setup lang="ts">
const { user, logout } = useOidcAuth()

const handleLogout = async () => {
    await logout()

    await navigateTo('/login')
}
</script>

<template>


    <div v-if="user" class="flex h-screen overflow-hidden">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-8">
            <h2 class="text-2xl font-bold mb-4">Dashboard</h2>
            <div class="flex justify-start gap-4 items-center mb-2">
                <p class="mb-2 order-1">Welcome, <strong class="text-indigo-400">{{ user.userInfo?.nickname || 'User'
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

            <details class="mt-4 p-4 bg-gray-800 rounded-md">
                <summary class="cursor-pointer font-semibold text-gray-300">User Details</summary>
                <pre class="mt-2 text-xs overflow-auto">{{ user }}</pre>
            </details>
        </main>
    </div>
</template>