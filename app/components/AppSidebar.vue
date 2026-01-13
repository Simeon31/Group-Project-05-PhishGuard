<script setup lang="ts">
import { BellIcon, ChartBarIcon, PlusCircleIcon, TrophyIcon, ClipboardDocumentListIcon, ClipboardDocumentCheckIcon, QueueListIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Overview', href: '#', current: true, icon: ChartBarIcon },
  { name: 'New Attack Type', href: '#', current: false, icon: QueueListIcon },
  { name: 'New game', href: '#', current: false, icon: PlusCircleIcon },
  { name: 'Ranks', href: '#', current: false, icon: TrophyIcon },
  { name: 'Score system', href: '#', current: false, icon: ClipboardDocumentListIcon },
  { name: 'Game Rules', href: '#', current: false, icon: ClipboardDocumentCheckIcon },
  { name: 'Hints', href: '#', current: false, icon: EyeSlashIcon },
]

const { user, logout } = useOidcAuth()

const handleLogout = async () => {
  await logout()

  await navigateTo('/login')
}
</script>

<template>
  <div class="flex h-screen w-48 flex-col justify-between bg-gray-800 text-white shadow-xl">
    <div>
      <div class="flex h-14 items-center justify-left bg-gray-900 px-4">
        <img class="h-16 w-auto mb-4" src="/Images/PhishGuard_Logo.png" alt="PhishGuard" />
      </div>
      <nav class="mt-4 space-y-1 px-2">
        <a v-for="item in navigation" :key="item.name" :href="item.href"
          :class="[item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white', 'group flex items-center rounded-md px-2 py-2 text-sm font-medium']"
          :aria-current="item.current ? 'page' : undefined">
          <component :is="item.icon" class="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" style="color: #C1FDFE;" />
          {{ item.name }}
        </a>
      </nav>
    </div>

    <div v-if="user" class="border-t border-gray-700 p-4">
      <div class="flex items-center">
        <img class="h-9 w-9 rounded-full bg-gray-800 outline outline-1 outline-white/10"
          :src="(user.userInfo?.picture as string)" alt="User Avatar" />
        <div class="ml-3">
          <p class="text-sm font-medium text-white">{{ user.userInfo?.nickname }}</p>
          <a href="#" class="text-xs font-medium text-gray-400 hover:text-white">View profile</a>
        </div>
        <button type="button"
          class="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
          <span class="sr-only">View notifications</span>
          <BellIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
