<script setup>
import { ref, computed } from 'vue'
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/vue'

const isOpen = ref(false)
// Form state
const formData = ref({
    id: null,
    attacktypeid: '',
    difficultylevel: 1,
    sender: '',
    senderemail: '',
    initials: '',
    subject: '',
    preview: '',
    educationalmessage: '',
    hint: '',
    isphishing: true,
    externalid: '',
    attackbody: '',
    attackcontext: '',
    attackquestion: '',
    answer: '',
    custom_links: '',
    timestamp: ''
})

const isEditing = computed(() => !!formData.value.id)

function closeModal() {
    isOpen.value = false
    // Reset form after closing
    setTimeout(() => {
        formData.value = {
            id: null,
            attacktypeid: '',
            difficultylevel: 1,
            sender: '',
            senderemail: '',
            initials: '',
            subject: '',
            preview: '',
            educationalmessage: '',
            hint: '',
            isphishing: true,
            externalid: '',
            attackbody: '',
            attackcontext: '',
            attackquestion: '',
            answer: '',
            custom_links: '',
            timestamp: ''
        }
    }, 200)
}

function openModal(item = null) {
    if (item && item.id) {
        // Edit mode: populate form
        formData.value = {
            id: item.id,
            attacktypeid: item.attacktypeid,
            difficultylevel: item.difficultylevel,
            sender: item.sender,
            senderemail: item.senderemail,
            initials: item.initials,
            subject: item.subject,
            preview: item.preview,
            educationalmessage: item.educationalmessage,
            hint: item.hint,
            isphishing: item.isphishing,
            externalid: item.externalid,
            attackbody: item.attackbody,
            attackcontext: item.attackcontext,
            attackquestion: item.attackquestion,
            answer: item.answer,
            custom_links: item.custom_links,
            timestamp: item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 16) : ''
        }
    } else {
        // Add mode: reset form
        formData.value = {
            id: null,
            attacktypeid: '',
            difficultylevel: 1,
            sender: '',
            senderemail: '',
            initials: '',
            subject: '',
            preview: '',
            educationalmessage: '',
            hint: '',
            isphishing: true,
            externalid: '',
            attackbody: '',
            attackcontext: '',
            attackquestion: '',
            answer: '',
            custom_links: '',
            timestamp: ''
        }
    }
    isOpen.value = true
}

// Fetch games from API
const { data: response, refresh } = await useFetch('/api/games', {
    query: {
        limit: 10
    }
});

const games = computed(() => response.value?.data || []);

// Fetch attack types for dropdown
const { data: atResponse } = await useFetch('/api/attack_types', {
    query: { limit: 10 }
});
const attackTypes = computed(() => atResponse.value?.data || []);

const snackbar = useSnackbar()

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAttackTypeName(id) {
    const at = attackTypes.value.find(a => a.id === id);
    return at ? at.attacktype : 'Unknown';
}

async function saveGame() {
    const body = {
        ...formData.value
    }
    body.difficultylevel = Number(body.difficultylevel);

    try {
        if (isEditing.value) {
            await $fetch('/api/games', { method: 'PUT', body })
            snackbar.open('Game updated successfully', 'success')
        } else {
            await $fetch('/api/games', { method: 'POST', body })
            snackbar.open('Game created successfully', 'success')
        }
        await refresh() // Reload the list
        closeModal()
    } catch (error) {
        console.error('Failed to save:', error)
        snackbar.open('Failed to save game', 'error')
    }
}

async function deleteGame(id) {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
        await $fetch('/api/games', {
            method: 'DELETE',
            query: { id }
        })
        snackbar.open('Game deleted successfully', 'success')
        await refresh()
    } catch (error) {
        console.error('Failed to delete:', error)
        snackbar.open('Failed to delete game', 'error')
    }
}
</script>

<template>
    <div class="flex h-screen bg-gray-900 text-white font-sans">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-8">
            <div class="p-4 justify-self-start">
                <h2 class="text-3xl font-bold mb-6">Games (Phishing Scenarios)</h2>
            </div>
            <div class="justify-self-end">
                <button type="button" @click="openModal"
                    class="rounded-md cursor-pointer bg-gray-700 px-4 mb-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                    style="color: #C1FDFE;">
                    + Add New Game
                </button>
            </div>
            <TransitionRoot appear :show="isOpen" as="template">
                <Dialog as="div" @close="!closeModal" class="relative z-10 w-full">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0"
                        enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100"
                        leave-to="opacity-0">
                        <div class="fixed inset-0 bg-black/25" />
                    </TransitionChild>

                    <div class="fixed inset-0 overflow-y-auto w-full">
                        <div class="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                                enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                                leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                                <DialogPanel
                                    class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                                    style="background-color: #181D26;">
                                    <DialogTitle as="h3" class="leading-6 text-xl font-bold text-white dark:text-white">
                                        {{ isEditing ? 'Edit' : 'Add a new' }}
                                        Game Scenario
                                    </DialogTitle>
                                    <section class="bg-white dark:bg-gray-900 mt-4" style="background-color: #181D26;">
                                        <form @submit.prevent="saveGame">
                                            <div class="grid gap-4 sm:grid-cols-2 sm:gap-6 bg-gray-800 p-4 rounded-lg">
                                                <!-- Left Column -->
                                                <div class="space-y-4">
                                                    <div>
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white">External
                                                            ID</label>
                                                        <input v-model="formData.externalid" type="text" required
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white">Subject</label>
                                                        <input v-model="formData.subject" type="text"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label class="block mb-2 text-sm font-medium text-white">Sender
                                                            Name</label>
                                                        <input v-model="formData.sender" type="text"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label class="block mb-2 text-sm font-medium text-white">Sender
                                                            Email</label>
                                                        <input v-model="formData.senderemail" type="email"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label class="block mb-2 text-sm font-medium text-white">Date
                                                            and time</label>
                                                        <input v-model="formData.timestamp" type="datetime-local"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white">Difficulty
                                                            Level</label>
                                                        <input v-model="formData.difficultylevel" type="number" min="1"
                                                            max="10"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label class="block mb-2 text-sm font-medium text-white">Attack
                                                            Type</label>
                                                        <select v-model="formData.attacktypeid"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                            <option value="" disabled>Select Attack Type</option>
                                                            <option v-for="at in attackTypes" :key="at.id"
                                                                :value="at.id">{{ at.attacktype }}</option>
                                                        </select>
                                                    </div>
                                                    <div class="flex items-center">
                                                        <input id="isphishing" type="checkbox"
                                                            v-model="formData.isphishing"
                                                            class="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2">
                                                        <label for="isphishing"
                                                            class="ml-2 text-sm font-medium text-white">Is
                                                            Phishing?</label>
                                                    </div>
                                                </div>

                                                <!-- Right Column -->
                                                <div class="space-y-4">
                                                    <div>
                                                        <label class="block mb-2 text-sm font-medium text-white">Attack
                                                            Body (HTML)</label>
                                                        <textarea v-model="formData.attackbody" rows="4"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white">Educational
                                                            Message</label>
                                                        <textarea v-model="formData.educationalmessage" rows="3"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></textarea>
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white">Hint</label>
                                                        <input v-model="formData.hint" type="text"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label class="block mb-2 text-sm font-medium text-white">Preview
                                                            Text</label>
                                                        <input v-model="formData.preview" type="text"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                    <div>
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white">Initials</label>
                                                        <input v-model="formData.initials" type="text"
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="mt-6 flex justify-end gap-3">
                                                <button type="button" @click="closeModal"
                                                    class="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 focus:ring-4 focus:ring-gray-600">
                                                    Cancel
                                                </button>
                                                <button type="submit"
                                                    class="px-4 py-2 text-sm font-medium text-black bg-cyan-200 rounded-lg hover:bg-cyan-300 focus:ring-4 focus:ring-cyan-300"
                                                    style="background-color: #C1FDFE;">
                                                    {{ isEditing ? 'Save Changes' : 'Create Game' }}
                                                </button>
                                            </div>
                                        </form>
                                    </section>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </TransitionRoot>

            <div class="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-700">
                <table class="w-full text-sm text-left text-gray-400">
                    <thead class="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">Subject</th>
                            <th scope="col" class="px-6 py-3">Sender</th>
                            <th scope="col" class="px-6 py-3">Attack Type</th>
                            <th scope="col" class="px-6 py-3">Level</th>
                            <th scope="col" class="px-6 py-3">Created At</th>
                            <th scope="col" class="px-6 py-3"><span class="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="game in games" :key="game.id"
                            class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                            <td class="px-6 py-4 font-medium text-white">{{ game.subject }}</td>
                            <td class="px-6 py-4">{{ game.sender }}</td>
                            <td class="px-6 py-4">{{ game.attack_type_name }}
                            </td>
                            <td class="px-6 py-4">{{ game.difficultylevel }}</td>
                            <td class="px-6 py-4">{{ formatDate(game.timestamp) }}</td>
                            <td class="px-6 py-4 text-right">
                                <button @click="openModal(game)"
                                    class="font-medium text-blue-500 hover:underline cursor-pointer mr-3">Edit</button>
                                <button @click="deleteGame(game.id)"
                                    class="font-medium text-red-500 hover:underline cursor-pointer">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </main>
    </div>
</template>
