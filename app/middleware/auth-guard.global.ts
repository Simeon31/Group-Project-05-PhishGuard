export default defineNuxtRouteMiddleware((to) => {
    const { loggedIn } = useOidcAuth()

    if (to.path !== '/login' && !loggedIn.value) {
        return navigateTo('/login')
    }
})
