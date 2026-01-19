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
const snackbar = useSnackbar()

// Form state
const formData = ref({
    id: null,
    phishingscenarioid: '',
    warningsign: '',
    timestamp: ''
})

const isEditing = computed(() => !!formData.value.id)

function closeModal() {
    isOpen.value = false
    // Reset form after closing
    setTimeout(() => {
        formData.value = { id: null, phishingscenarioid: '', warningsign: '', timestamp: '' }
    }, 200)
}

function openModal(item = null) {
    if (item && item.id) {
        // Edit mode
        formData.value = {
            id: item.id,
            phishingscenarioid: item.phishingscenarioid,
            warningsign: item.warningsign,
            timestamp: item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 16) : ''
        }
    } else {
        formData.value = { id: null, phishingscenarioid: '', warningsign: '', timestamp: '' }
    }
    isOpen.value = true
}

// Fetch Hints
const { data: hintsResponse, refresh } = await useFetch('/api/hints', {
    query: { limit: 10 },
    key: 'hints'
});
const hints = computed(() => hintsResponse.value?.data || []);

// Scenarios for Dropdown
const { data: scenariosResponse } = await useFetch('/api/scenarios', {
    query: { limit: 100 }
});
const scenarios = computed(() => scenariosResponse.value?.scenarios || scenariosResponse.value?.data || []);

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

function getScenarioName(id) {
    const scenario = scenarios.value.find(s => s.id === id);
    return scenario ? scenario.subject : 'Unknown Scenario';
}

async function saveHint() {
    const body = {
        id: formData.value.id,
        phishingscenarioid: formData.value.phishingscenarioid,
        warningsign: formData.value.warningsign
    }

    try {
        if (isEditing.value) {
            await $fetch('/api/hints', { method: 'PUT', body })
            snackbar.open('Hint updated successfully', 'success')
        } else {
            await $fetch('/api/hints', { method: 'POST', body })
            snackbar.open('Hint created successfully', 'success')
        }
        await refresh()
        closeModal()
    } catch (error) {
        console.error('Failed to save:', error)
        snackbar.open('Failed to save hint', 'error')
    }
}

async function deleteHint(id) {
    if (!confirm('Are you sure you want to delete this hint?')) return;

    try {
        await $fetch('/api/hints', {
            method: 'DELETE',
            query: { id }
        })
        snackbar.open('Hint deleted successfully', 'success')
        await refresh()
    } catch (error) {
        console.error('Failed to delete:', error)
        snackbar.open('Failed to delete hint', 'error')
    }
}
</script>

<template>
    <div class="flex h-screen bg-gray-900 text-white font-sans">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-8">
            <div class="p-4 justify-self-start">
                <h2 class="text-3xl font-bold mb-6">Hints Management</h2>
            </div>
            <div class="justify-self-end">
                <button type="button" @click="openModal"
                    class="rounded-md cursor-pointer bg-gray-700 px-4 mb-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                    style="color: #C1FDFE;">
                    + Add
                </button>
            </div>

            <TransitionRoot appear :show="isOpen" as="template">
                <Dialog as="div" @close="closeModal" class="relative z-10">
                    <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0"
                        enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100"
                        leave-to="opacity-0">
                        <div class="fixed inset-0 bg-black/25" />
                    </TransitionChild>

                    <div class="fixed inset-0 overflow-y-auto">
                        <div class="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95"
                                enter-to="opacity-100 scale-100" leave="duration-200 ease-in"
                                leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
                                <DialogPanel
                                    class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                                    style="background-color: #181D26;">
                                    <DialogTitle as="h3" class="leading-6 text-xl font-bold text-white dark:text-white">
                                        {{ isEditing ? 'Edit' : 'Add a new' }} Hint
                                    </DialogTitle>
                                    <section class="bg-white dark:bg-gray-900" style="background-color: #181D26;">
                                        <div class="py-8 px-4 mx-auto max-w-2xl lg:py-16">
                                            <form @submit.prevent="saveHint">
                                                <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">

                                                    <!-- Scenario Dropdown -->
                                                    <div class="sm:col-span-2">
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Scenario</label>
                                                        <select v-model="formData.phishingscenarioid" required
                                                            class="border border-gray-300 text-white text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                            style="background-color: #374151;">
                                                            <option disabled value="">Select a Scenario</option>
                                                            <option v-for="s in scenarios" :key="s.id" :value="s.id">
                                                                {{ s.subject }}
                                                            </option>
                                                        </select>
                                                    </div>

                                                    <!-- Warning Sign -->
                                                    <div class="sm:col-span-2">
                                                        <label
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Warning
                                                            Sign (Hint)</label>
                                                        <textarea v-model="formData.warningsign" required rows="4"
                                                            class="block p-2.5 w-full text-sm text-white border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                            placeholder="Enter the hint text"></textarea>
                                                    </div>

                                                </div>
                                                <div class="mt-4 justify-between flex">
                                                    <button type="submit"
                                                        class="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-bold hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                        style="color: #C1FDFE;">
                                                        {{ isEditing ? 'Save' : 'Add' }}
                                                    </button>
                                                    <button type="button"
                                                        class="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white hover:bg-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                        @click="closeModal">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
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
                            <th scope="col" class="px-6 py-3">ID</th>
                            <th scope="col" class="px-6 py-3">Scenario</th>
                            <th scope="col" class="px-6 py-3">Warning Sign</th>
                            <th scope="col" class="px-6 py-3">Created At</th>
                            <th scope="col" class="px-6 py-3">
                                <span class="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="hint in hints" :key="hint.id"
                            class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">

                            <td class="px-6 py-4 font-mono">#{{ hint.id }}</td>

                            <td class="px-6 py-4 text-white">
                                {{ getScenarioName(hint.phishingscenarioid) }}
                            </td>

                            <td class="px-6 py-4">
                                {{ hint.warningsign }}
                            </td>

                            <td class="px-6 py-4">
                                {{ formatDate(hint.timestamp) }}
                            </td>

                            <td class="px-6 py-4 text-right">
                                <button @click="openModal(hint)"
                                    class="font-medium text-blue-500 hover:underline cursor-pointer mr-3">Edit</button>
                                <button @click="deleteHint(hint.id)"
                                    class="font-medium text-red-500 hover:underline cursor-pointer">Delete</button>
                            </td>
                        </tr>
                        <tr v-if="hints.length === 0">
                            <td colspan="5" class="px-6 py-4 text-center">
                                No hints found.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </main>
    </div>
</template>
