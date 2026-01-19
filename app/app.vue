<script setup lang="ts">
const { user } = useOidcAuth()

// Sync user to DB when logged in
watch(user, async (newUser) => {
  if (newUser && newUser.userInfo) {
    try {
      await $fetch('/api/sync_user', {
        method: 'POST',
        body: {
          email: newUser.userInfo.email,
          name: newUser.userInfo.name || newUser.userInfo.nickname,
          picture: newUser.userInfo.picture,
          sub: newUser.userInfo.sub
        }
      })
    } catch (e) {
      console.error('Failed to sync user', e)
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="h-full">
    <NuxtPage />
    <Snackbar />
  </div>
</template>
