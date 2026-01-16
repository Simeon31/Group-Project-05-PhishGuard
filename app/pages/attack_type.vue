<script setup>
import { ref } from 'vue'
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
    DialogTitle,
} from '@headlessui/vue'

const isOpen = ref(false)

function closeModal() {
    isOpen.value = false
}
function openModal() {
    isOpen.value = true
}
</script>

<template>
    <div class="flex h-screen bg-gray-900 text-white font-sans">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto p-8">
            <div class="p-4 justify-self-start">
                <h2 class="text-3xl font-bold mb-6">Attack Type</h2>
            </div>
            <div class="justify-self-end">
                <button type="button" @click="openModal"
                    class="rounded-md cursor-pointer bg-gray-700 px-4 mb-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
                    style="color: #C1FDFE;">
                    + Add
                </button>
            </div>
            <TransitionRoot appear :show="isOpen" as="template">
                <Dialog as="div" @close="!closeModal" class="relative z-10">
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
                                        Add a new
                                        attack type
                                    </DialogTitle>
                                    <section class="bg-white dark:bg-gray-900" style="background-color: #181D26;">
                                        <div class="py-8 px-4 mx-auto max-w-2xl lg:py-16">
                                            <form action="#">
                                                <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
                                                    <div class="sm:col-span-2">
                                                        <label for="name"
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Attack
                                                            name</label>
                                                        <input type="text" name="name" id="name"
                                                            class="border border-gray-300 text-white text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                            placeholder="Type attack name" required="">
                                                    </div>
                                                    <div class="sm:col-span-2">
                                                        <label for="description"
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Description</label>
                                                        <textarea id="description" rows="8"
                                                            class="block p-2.5 w-full text-sm text-white border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                            placeholder="Your description here"></textarea>
                                                    </div>

                                                    <div class="relative max-w-sm">
                                                        <label for="date"
                                                            class="block mb-2 text-sm font-medium text-white dark:text-white">Date
                                                            and time</label>
                                                        <input type="datetime-local" name="datetime-local" id="date"
                                                            class="block w-full text-white py-3 bg-neutral-secondary-medium border border-default-medium rounded bg-gray-700 text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body"
                                                            placeholder="Select date">
                                                    </div>
                                                </div>
                                                <div class="mt-4 justify-between flex">
                                                    <button type="submit"
                                                        class="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-bold hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                        style="color: #C1FDFE;">
                                                        Add
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
                                Product name
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Color
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Category
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Price
                            </th>
                            <th scope="col" class="px-6 py-3">
                                <span class="sr-only">Edit</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                            <th scope="row" class="px-6 py-4 font-medium text-white whitespace-nowrap">
                                Apple MacBook Pro 17"
                            </th>
                            <td class="px-6 py-4">
                                Silver
                            </td>
                            <td class="px-6 py-4">
                                Laptop
                            </td>
                            <td class="px-6 py-4">
                                $2999
                            </td>
                            <td class="px-6 py-4 text-right">
                                <a href="#" class="font-medium text-blue-500 hover:underline">Edit</a>
                            </td>
                        </tr>
                        <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                            <th scope="row" class="px-6 py-4 font-medium text-white whitespace-nowrap">
                                Microsoft Surface Pro
                            </th>
                            <td class="px-6 py-4">
                                White
                            </td>
                            <td class="px-6 py-4">
                                Laptop PC
                            </td>
                            <td class="px-6 py-4">
                                $1999
                            </td>
                            <td class="px-6 py-4 text-right">
                                <a href="#" class="font-medium text-blue-500 hover:underline">Edit</a>
                            </td>
                        </tr>
                        <tr class="bg-gray-800 hover:bg-gray-600">
                            <th scope="row" class="px-6 py-4 font-medium text-white whitespace-nowrap">
                                Magic Mouse 2
                            </th>
                            <td class="px-6 py-4">
                                Black
                            </td>
                            <td class="px-6 py-4">
                                Accessories
                            </td>
                            <td class="px-6 py-4">
                                $99
                            </td>
                            <td class="px-6 py-4 text-right">
                                <a href="#" class="font-medium text-blue-500 hover:underline">Edit</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </main>
    </div>
</template>