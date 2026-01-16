<script setup lang="ts">
import { BellIcon, ChartBarIcon, PlusCircleIcon, TrophyIcon, ClipboardDocumentListIcon, ClipboardDocumentCheckIcon, QueueListIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

const route = useRoute()

const navigation = computed(() => [
  { name: 'Overview', href: './dashboard', current: route.path === '/dashboard', icon: ChartBarIcon },
  { name: 'New Attack Type', href: './attack_type', current: route.path === '/attack_type', icon: QueueListIcon },
  { name: 'New game', href: '#', current: false, icon: PlusCircleIcon },
  { name: 'Ranks', href: '#', current: false, icon: TrophyIcon },
  { name: 'Score system', href: '#', current: false, icon: ClipboardDocumentListIcon },
  { name: 'Game Rules', href: '#', current: false, icon: ClipboardDocumentCheckIcon },
  { name: 'Hints', href: '#', current: false, icon: EyeSlashIcon },
])

const { user, logout } = useOidcAuth()

const handleLogout = async () => {
  await logout()

  await navigateTo('/login')
}
</script>

<template>
  <div class="flex h-full w-48 flex-col justify-between bg-gray-800 text-white shadow-xl">
    <div>
      <div class="flex h-14 items-center justify-left bg-gray-900 px-4">
        <img class="h-16 w-auto mb-2" src="/Images/PhishGuard_Logo.png" alt="PhishGuard" />
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
      <Menu as="div" class="relative">
        <MenuButton
          class="flex w-full items-center justify-center gap-2 text-sm font-medium text-white cursor-pointer focus:outline-none">
          <span>{{ user.userInfo?.nickname }}</span>
          <img class="h-9 w-9 rounded-full bg-gray-800 outline outline-1 outline-white/10"
            :src="(user.userInfo?.picture as string)" alt="User Avatar" />
        </MenuButton>

        <transition enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95">
          <MenuItems
            class="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 origin-bottom rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none outline outline-1 outline-white/10">
            <MenuItem v-slot="{ active }">
            <a href="#" :class="[active ? 'bg-gray-700' : '', 'block px-4 py-2 text-sm text-gray-300']">View
              profile</a>
            </MenuItem>
            <MenuItem v-slot="{ active }">
            <a href="#" @click.prevent="handleLogout"
              :class="[active ? 'bg-gray-700' : '', 'block px-4 py-2 text-sm text-gray-300']">Logout</a>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </div>

  </div>
</template>
