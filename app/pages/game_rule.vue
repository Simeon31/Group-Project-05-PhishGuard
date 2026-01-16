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
    attacktypeID: '',
    gamerule: '',
    timestamp: ''
})

const isEditing = computed(() => !!formData.value.id)

function closeModal() {
    isOpen.value = false
    // Reset form after closing
    setTimeout(() => {
        formData.value = { id: null, attacktypeID: '', gamerule: '', timestamp: '' }
    }, 200)
}

function openModal(item = null) {
    if (item && item.id) {
        // Edit mode
        formData.value = {
            id: item.id,
            attacktypeID: item.attacktypeid || item.attacktypeID, // Handle casing
            gamerule: item.gamerule,
            timestamp: item.timestamp ? new Date(item.timestamp).toISOString().slice(0, 16) : ''
        }
    } else {
        formData.value = { id: null, attacktypeID: '', gamerule: '', timestamp: '' }
    }
    isOpen.value = true
}

// Fetch Game Rules
const { data: rulesResponse, refresh } = await useFetch('/api/game_rules', {
    query: { limit: 50 },
    key: 'game-rules'
});
const gameRules = computed(() => rulesResponse.value?.data || []);

// Fetch Attack Types for Dropdown
const { data: attackTypesResponse } = await useFetch('/api/attack_types');
const attackTypes = computed(() => attackTypesResponse.value?.data || []);

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
    const type = attackTypes.value.find(at => at.id === id);
    return type ? type.attacktype : 'Unknown';
}

async function saveGameRule() {
    const body = {
        id: formData.value.id,
        attacktypeID: formData.value.attacktypeID,
        gamerule: formData.value.gamerule,
        timestamp: formData.value.timestamp
    }

    try {
        if (isEditing.value) {
            await $fetch('/api/game_rules', { method: 'PUT', body })
            snackbar.open('Game rule updated successfully', 'success')
        } else {
            await $fetch('/api/game_rules', { method: 'POST', body })
            snackbar.open('Game rule created successfully', 'success')
        }
        await refresh()
        closeModal()
    } catch (error) {
        console.error('Failed to save:', error)
        snackbar.open('Failed to save game rule', 'error')
    }
}

async function deleteGameRule(id) {
    if (!confirm('Are you sure you want to delete this game rule?')) return;

    try {
        await $fetch('/api/game_rules', {
            method: 'DELETE',
            query: { id }
        })
        snackbar.open('Game rule deleted successfully', 'success')
        await refresh()
    } catch (error) {
        console.error('Failed to delete:', error)
        snackbar.open('Failed to delete game rule', 'error')
    }
}
</script>

<template>
    <div class="flex h-screen bg-gray-900 text-white font-sans">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-8">
            <div class="p-4 justify-self-start">
                <h2 class="text-3xl font-bold mb-6">Game Rules</h2>
            </div>
            <div class="justify-self-end">
                <button type="button" @click="() => openModal()"
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
                                        {{ isEditing ? 'Edit' : 'Add a new' }} game rule
                                    </DialogTitle>
                                    <section class="bg-white dark:bg-gray-900" style="background-color: #181D26;">
                                        <div class="py-8 px-4 mx-auto max-w-2xl lg:py-16">
                                            <form @submit.prevent="saveGameRule">
                                                <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
                                                    <div class="sm:col-span-2">
                                                        <label for="attacktype"
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Attack
                                                            Type</label>
                                                        <select v-model="formData.attacktypeID" id="attacktype" required
                                                            class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5">
                                                            <option value="" disabled>Select attack type</option>
                                                            <option v-for="type in attackTypes" :key="type.id"
                                                                :value="type.id">
                                                                {{ type.attacktype }}
                                                            </option>
                                                        </select>
                                                    </div>
                                                    <div class="sm:col-span-2">
                                                        <label for="gamerule"
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Game
                                                            Rule</label>
                                                        <textarea v-model="formData.gamerule" id="gamerule" rows="6"
                                                            required
                                                            class="block p-2.5 w-full text-sm text-white border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                            placeholder="Enter the game rule text..."></textarea>
                                                    </div>

                                                    <div class="relative max-w-sm sm:col-span-2">
                                                        <label for="date"
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Date
                                                            and time</label>
                                                        <input v-model="formData.timestamp" type="datetime-local"
                                                            id="date"
                                                            class="block w-full text-white py-3 bg-neutral-secondary-medium border border-default-medium rounded bg-gray-700 text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
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
                            <th scope="col" class="px-6 py-3">
                                Attack Type
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Game Rule
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Date
                            </th>
                            <th scope="col" class="px-6 py-3">
                                <span class="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="rule in gameRules" :key="rule.id"
                            class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">

                            <td class="px-6 py-4">
                                {{ rule.attack_type_name || getAttackTypeName(rule.attacktypeid) }}
                            </td>

                            <td class="px-6 py-4">
                                {{ rule.gamerule }}
                            </td>

                            <td class="px-6 py-4">
                                {{ formatDate(rule.timestamp) }}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button @click="openModal(rule)"
                                    class="font-medium text-blue-500 hover:underline cursor-pointer mr-3">Edit</button>
                                <button @click="deleteGameRule(rule.id)"
                                    class="font-medium text-red-500 hover:underline cursor-pointer">Delete</button>
                            </td>
                        </tr>
                        <tr v-if="gameRules.length === 0">
                            <td colspan="4" class="px-6 py-4 text-center">No game rules found</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </main>
    </div>
</template>
