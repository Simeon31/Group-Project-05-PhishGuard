<script setup lang="ts">
const { user } = useOidcAuth()
const snackbar = useSnackbar()

const formData = ref({
    fullName: user.value?.userInfo?.nickname || '',
    email: user.value?.userInfo?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

async function saveProfile() {

    if (formData.value.newPassword !== formData.value.confirmPassword) {
        snackbar.open('Passwords do not match', 'error')
        return
    }

    // Simulate API call
    setTimeout(() => {
        snackbar.open('Profile updated successfully', 'success')
    }, 500)
}
</script>

<template>
    <div class="flex h-screen bg-gray-900 text-white font-sans">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-8 flex flex-col items-center">

            <!-- Top Pill Header -->
            <div class="mb-16 mt-4 bg-[#111827] px-10 py-3 rounded-full border border-gray-700 shadow-lg">
                <h1 class="text-xl tracking-wider text-gray-200"><span class="text-[#5B9BD5]">Welcome to</span>
                    PHISHGUARD</h1>
            </div>

            <div class="w-full max-w-5xl pl-12">
                <!-- Section Header -->
                <div
                    class="mb-0 inline-block bg-[#050A44] px-10 py-3 rounded-t-xl border-t border-x border-gray-800/50 relative top-1 z-10">
                    <h2 class="text-lg font-medium text-white tracking-wide">Profile Settings</h2>
                </div>

                <!-- Main Card -->
                <div
                    class="bg-[#02032B] rounded-b-xl rounded-tr-xl p-12 shadow-2xl border border-gray-800 min-h-[500px]">
                    <form @submit.prevent="saveProfile">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <!-- Full Name -->
                            <div class="space-y-3">
                                <label class="text-base font-bold text-white tracking-wide">Full name</label>
                                <input v-model="formData.fullName" type="text"
                                    class="w-full bg-white text-black rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-12" />
                            </div>

                            <!-- Email -->
                            <div class="space-y-3">
                                <label class="text-base font-bold text-white tracking-wide">E-mail</label>
                                <input v-model="formData.email" type="email" disabled
                                    class="w-full bg-white text-black rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-12 opacity-90" />
                            </div>

                            <!-- Old Password -->
                            <div class="space-y-3">
                                <label class="text-base font-bold text-white tracking-wide">Old password</label>
                                <input v-model="formData.oldPassword" type="password"
                                    class="w-full bg-white text-black rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-12" />
                            </div>

                            <!-- New Password -->
                            <div class="space-y-3">
                                <label class="text-base font-bold text-white tracking-wide">New password</label>
                                <input v-model="formData.newPassword" type="password"
                                    class="w-full bg-white text-black rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-12" />
                            </div>

                            <!-- Spacer column 1 (empty) -->
                            <div class="hidden md:block"></div>

                            <!-- Confirm Password -->
                            <div class="space-y-3">
                                <label class="text-base font-bold text-white tracking-wide">Confirm password</label>
                                <input v-model="formData.confirmPassword" type="password"
                                    class="w-full bg-white text-black rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-12" />
                            </div>
                        </div>

                        <div class="flex justify-end mt-12">
                            <button type="submit" style="background-color: #C1FDFE;"
                                class="text-gray-900 font-bold py-3 px-10 rounded-md transition duration-200 shadow-lg hover:bg-white hover:scale-105">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
</template>
