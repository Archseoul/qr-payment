<script setup lang="ts">
import isElectron from 'is-electron'
import type { AdminMemberVo } from '~/types'
import { useAuthStore } from '~/store/auth'

const layoutToggle = ref(false)
const route = useRoute()

const fetchUserInfo = async () => {
  const authStore = useAuthStore()
  try {
    const { data } = await useCustomFetch<AdminMemberVo>('/admin/handOrder/user-info', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (data.value) {
      authStore.setUserInfo(data.value)
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
  }
}

onMounted(async () => {
  const token = useCookie('token')
  const refreshToken = useCookie('refreshToken')

  if (isElectron()) {
    if (token.value) {
      await fetchUserInfo()

      // Electron에 token과 refreshToken 모두 전달
      if (refreshToken.value) {
        const authStore = useAuthStore()
        const userInfo = authStore.userInfo
        const shopCode = userInfo?.shopInfo?.shopCode || null

        await window.electronAPI.loginApp(token.value, shopCode, refreshToken.value)
      }
    }
    layoutToggle.value = true

    /*    window.electronAPI.receiveMessage((message: string) => {
      console.log(message)
    }) */
  } else {
    if (token.value) {
      await fetchUserInfo()
    }
    layoutToggle.value = false
  }

  // SSR에서 설정된 redirect 플래그 확인
  const shouldRedirectToLogin = useState('shouldRedirectToLogin', () => false)
  if (shouldRedirectToLogin.value && !route.path.includes('login')) {
    shouldRedirectToLogin.value = false // 플래그 초기화
    navigateTo('/login')
  }
})

const { locale } = useI18n()
onMounted(() => {
  // 최초 한 번 문서 방향 설정
  document.dir = locale.value === 'ar' ? 'rtl' : 'ltr'

  // 언어 변경 감지
  watch(locale, (val) => {
    document.dir = val === 'ar' ? 'rtl' : 'ltr'
  })
})

</script>

<template>
  <div>
    <template v-if="!layoutToggle">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </template>
    <template v-else>
      <NuxtLayout v-if="!route.path.includes('login')" name="desktopapp">
        <NuxtPage />
      </NuxtLayout>
      <NuxtLayout v-else name="desktopapp-login">
        <NuxtPage />
      </NuxtLayout>
    </template>
  </div>
</template>

<style>
button {
  -webkit-app-region: no-drag;
}
</style>
