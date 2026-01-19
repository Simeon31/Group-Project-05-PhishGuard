export default defineNuxtRouteMiddleware((to) => {
    const { loggedIn } = useOidcAuth()

    const publicPaths = ['/login', '/login/custom', '/login/auth0']
    const isPublicPath = publicPaths.some(path => to.path.startsWith(path))
    const isAuthCallback = to.path.startsWith('/auth/')

    if (!isPublicPath && !isAuthCallback && !loggedIn.value) {
        return navigateTo('/login')
    }
})
