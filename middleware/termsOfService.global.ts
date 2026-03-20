import { useAuthStore } from '~/store/auth'

export default defineNuxtRouteMiddleware((to) => {
  const nuxtApp = useNuxtApp()
  const authStore = useAuthStore(nuxtApp.$pinia)

  if ((to.name !== 'login') && (!authStore.userInfo.agreed)) {
    /*    await $q.dialog({
      component: termsOfService
    }) */
  }
})
