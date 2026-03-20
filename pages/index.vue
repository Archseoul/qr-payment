<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/auth'

const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

// 사용자 정보 복원 시도
const restoreUserInfo = async () => {
  if (!userInfo.value || Object.keys(userInfo.value).length === 0 || !userInfo.value.userType) {
    const restoredInfo = await authStore.getUserInfo()
    if (restoredInfo && restoredInfo.userType) {
      // 복원된 정보로 업데이트
      await nextTick()
    }
  }
}

// userType을 computed로 만들어서 반응형으로 처리
const isShopUser = computed(() => {
  return userInfo.value?.userType === 'shop'
})

// 컴포넌트 마운트 시 사용자 정보 복원
onMounted(async () => {
  await restoreUserInfo()
})

// userInfo 변경 감지하여 필요시 복원
watch(() => userInfo.value, async (newUserInfo) => {
  if (!newUserInfo || Object.keys(newUserInfo).length === 0 || !newUserInfo.userType) {
    await restoreUserInfo()
  }
}, { immediate: true, deep: true })
</script>

<template>
  <div
    class="main-content relative-position full-height"
    :class="{ 'shop-user': isShopUser, 'admin-user': !isShopUser }"
  >
    <!-- 매장 계정인 경우 대시보드 표시 -->
    <ShopDashboard v-if="isShopUser" />

    <!-- 관리자 계정인 경우 기본 페이지 표시 -->
    <template v-else>
      <q-img src="login_back.png" width="100%" height="100%" />
      <div class="absolute-center main-text" style="max-height:100%">
        <div class="text-center">
          <!-- <p class="sub-text">
            모바일 테이블 오더의 혁신
          </p>
          <p>모바일 메뉴주문</p>
          <p>핸드오더</p> -->
        </div>
        <q-img src="character.webp" width="500px" style="position:relative; bottom:-100px" />
      </div>
    </template>
  </div>
</template>
