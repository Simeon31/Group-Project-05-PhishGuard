<script setup lang="ts">
import { ref, watch } from 'vue';

definePageMeta({
    auth: false,
})

const { loggedIn } = useOidcAuth()
const loginForm = ref({ email: '', password: '' });
const errorMsg = ref('');
const isLoading = ref(false);

const handleRedirect = () => {
    navigateTo('/game_screen')
}

if (loggedIn.value) {
    handleRedirect()
}

watch(loggedIn, (newLoggedIn) => {
    if (newLoggedIn) {
        handleRedirect()
    }
})

const handleCustomLogin = async () => {
    errorMsg.value = '';
    isLoading.value = true;

    try {
        const result = await $fetch('/api/auth/custom-login', {
            method: 'POST',
            body: {
                email: loginForm.value.email,
                password: loginForm.value.password
            }
        });

        if (result.success) {
            handleRedirect()
        }
    } catch (err: any) {
        console.error(err);
        errorMsg.value = err.data?.message || 'Login failed';
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="h-full w-full bg-gray-900 relative">
        <div class="w-auto h-auto absolute top-4 left-4 text-white font-bold text-lg z-10 p-2">
            <h1 style="color: #C1FDFE; font: 600;">PhishGuard</h1>
        </div>
        <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                <img src="/Images/PhishGuard_Logo.png" alt="Logo" class="mx-auto h-10 w-auto" />
                <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in with Email</h2>
            </div>

            <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form class="space-y-6" @submit.prevent="handleCustomLogin">

                    <div v-if="errorMsg" class="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded text-sm">
                        {{ errorMsg }}
                    </div>

                    <div>
                        <label for="email" class="block text-sm/6 font-medium text-gray-100">Email address</label>
                        <div class="mt-2">
                            <input v-model="loginForm.email" id="email" type="email" autocomplete="email" required
                                class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between">
                            <label for="password" class="block text-sm/6 font-medium text-gray-100">Password</label>
                        </div>
                        <div class="mt-2">
                            <input v-model="loginForm.password" id="password" type="password"
                                autocomplete="current-password" required
                                class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
                        </div>
                    </div>

                    <div>
                        <button type="submit" :disabled="isLoading"
                            class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 items-center disabled:opacity-50">
                            {{ isLoading ? 'Verifying...' : 'Sign in' }}
                        </button>
                    </div>

                    <div class="text-center">
                        <NuxtLink to="/login" class="text-sm text-gray-400 hover:text-gray-300">
                            ← Back to login options
                        </NuxtLink>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
