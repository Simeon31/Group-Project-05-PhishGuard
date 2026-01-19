<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/vue/24/solid'

const { show, message, type, close } = useSnackbar()

const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon
}

const colors = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
}

const iconColors = {
    success: 'text-gray-700',
    error: 'text-rose-700',
    info: 'text-gray-700'
}
</script>

<template>
    <div aria-live="assertive"
        class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50">
        <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
            <Transition enter-active-class="transform ease-out duration-300 transition"
                enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
                leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
                leave-to-class="opacity-0">
                <div v-if="show"
                    class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-green-300 dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-100 dark:border-gray-700">
                    <div class="p-4">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <component :is="icons[type]" class="h-6 w-6" :class="iconColors[type]"
                                    aria-hidden="true" />
                            </div>
                            <div class="ml-3 w-0 flex-1 pt-0.5">
                                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {{ type.charAt(0).toUpperCase() + type.slice(1) }}
                                </p>
                                <p class="mt-1 text-sm text-gray-900 dark:text-gray-400">
                                    {{ message }}
                                </p>
                            </div>
                            <div class="ml-4 flex flex-shrink-0">
                                <button type="button" @click="close"
                                    class="inline-flex rounded-md bg-gray-700 dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                    <span class="sr-only">Close</span>
                                    <XMarkIcon class="h-5 w-5 text-white" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>
