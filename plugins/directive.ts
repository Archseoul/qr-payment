export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('upperCase', {
    mounted (el) {
      el.value = el.value?.toLowerCase()
    }
  })
})
