<script setup lang="ts">
import { ref } from 'vue';
import Dashboard from '../pages/dashboard.vue';

// Auth State
const { loggedIn, login, logout } = useOidcAuth()
const { loggedIn: sessionLoggedIn, fetch: fetchSession, clear: clearSession } = useUserSession()

const showCustomLogin = ref(false);
const loginForm = ref({ email: '', password: '' });
const errorMsg = ref('');
const isLoading = ref(false);

const handleAuth0Login = () => {
    login('auth0')
}

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
            await fetchSession();
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
    <div class="h-full w-full">

        <!-- Logged In View -->
        <div v-if="sessionLoggedIn || loggedIn" class="p-5 font-sans">
            <Dashboard />
            <div class="mt-5">
                <a href="./game_screen">
                    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Start PhishGuard Game
                    </button>
                </a>
            </div>
        </div>

        <!-- Login View -->
        <div v-else class="h-screen w-full bg-gray-900 relative flex flex-col justify-center items-center">
            <div class="w-auto h-auto absolute top-4 left-4 z-10 p-2">
                <h1 style="color: #C1FDFE; font: 600; font-size: 1.125rem;">PhishGuard</h1>
            </div>

            <div class="flex flex-col justify-center px-6 py-12 lg:px-8 w-full max-w-md">
                <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img src="/Images/PhishGuard_Logo.png" alt="Logo" class="mx-auto h-10 w-auto" />
                    <h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account
                    </h2>
                </div>

                <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">

                    <!-- Option Selection -->
                    <div v-if="!showCustomLogin" class="space-y-4">
                        <button @click="handleAuth0Login"
                            class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                            Login with Auth0 (Provider)
                        </button>

                        <div class="relative">
                            <div class="absolute inset-0 flex items-center" aria-hidden="true">
                                <div class="w-full border-t border-gray-700"></div>
                            </div>
                            <div class="relative flex justify-center">
                                <span class="bg-gray-900 px-2 text-sm text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <button @click="showCustomLogin = true"
                            class="flex w-full justify-center rounded-md bg-gray-700 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                            Custom App Login
                        </button>
                    </div>

                    <!-- Custom Login Form -->
                    <form v-else class="space-y-6" @submit.prevent="handleCustomLogin">

                        <div v-if="errorMsg"
                            class="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded text-sm">
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

                        <div class="flex gap-3">
                            <button type="button" @click="showCustomLogin = false"
                                class="flex w-1/3 justify-center rounded-md bg-transparent border border-gray-600 px-3 py-1.5 text-sm/6 font-semibold text-gray-300 hover:bg-white/5">
                                Back
                            </button>
                            <button type="submit" :disabled="isLoading"
                                class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 max-h-9 items-center disabled:opacity-50">
                                {{ isLoading ? 'Verifying...' : 'Sign in' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
