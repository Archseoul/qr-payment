<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)
const router = useRouter()

onMounted(async () => {
  // 사용자 정보 복원
  if (!userInfo.value || Object.keys(userInfo.value).length === 0 || !userInfo.value.userType) {
    await authStore.getUserInfo()
    await nextTick()
  }

  // shopCode 기반으로 QR 결제 페이지로 리디렉트
  const shopCode = userInfo.value?.shopInfo?.shopCode || null
  if (shopCode) {
    await router.replace(`/order/desktop/${shopCode}`)
  } else {
    await router.replace('/login')
  }
})
</script>

<template>
  <div class="flex justify-center items-center" style="height: 100vh">
    <q-spinner color="primary" size="3em" />
  </div>
</template>
