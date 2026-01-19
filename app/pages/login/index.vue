<script setup lang="ts">
definePageMeta({
    auth: false,
})

const { loggedIn } = useOidcAuth()

if (loggedIn.value) {
    navigateTo('./index')
}
</script>

<template>
    <div class="h-full w-full bg-gray-900 relative flex items-center justify-center">
        <div class="w-auto h-auto absolute top-4 left-4 text-white font-bold text-lg z-10 p-2">
            <h1 style="color: #C1FDFE; font: 600;">PhishGuard</h1>
        </div>

        <div class="w-full max-w-md px-6">
            <div class="text-center mb-10">
                <img src="/Images/PhishGuard_Logo.png" alt="Logo" class="mx-auto h-10 w-auto mb-6" />
                <h2 class="text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
                <p class="mt-2 text-sm text-gray-400">Choose your preferred authentication method</p>
            </div>

            <div class="space-y-4">
                <NuxtLink to="/login/custom"
                    class="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
                    Sign in with Email
                </NuxtLink>

                <div class="relative">
                    <div class="absolute inset-0 flex items-center" aria-hidden="true">
                        <div class="w-full border-t border-gray-700"></div>
                    </div>
                    <div class="relative flex justify-center">
                        <span class="bg-gray-900 px-2 text-sm text-gray-400">Or</span>
                    </div>
                </div>

                <NuxtLink to="/login/auth0"
                    class="flex w-full justify-center rounded-md bg-gray-700 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
                    Sign in with Auth0
                </NuxtLink>
            </div>
        </div>
    </div>
</template>
