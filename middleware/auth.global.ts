import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/auth'
import { nonSecurityUrl } from '~/utils/code'
import { menuAuthCheck } from '~/composables/menuAuthCheck'
import type { AdminMemberVo } from '~/types'

export default defineNuxtRouteMiddleware(async (to) => {
  // process.client 체크로 클라이언트 사이드에서만 실행
  if (import.meta.server) { return }

  const $q = useQuasar()
  const authStore = useAuthStore()
  const token = useCookie('token', {
    default: () => null,
    path: '/',
    sameSite: 'lax'
  })
  const { authenticated, userInfo } = storeToRefs(authStore)

  if (token.value) {
    authenticated.value = true

    // userInfo가 비어있거나 userType이 없으면 복원 시도
    // ✅ 단, 로그인 페이지에서 오는 경우는 제외 (로그인 페이지에서 직접 setUserInfo 호출)
    if (to?.name !== 'login' &&
        (!userInfo.value || Object.keys(userInfo.value).length === 0 || !userInfo.value.userType)) {
      // localStorage/쿠키에서 사용자 정보 복원 시도
      const restoredUserInfo = await authStore.getUserInfo()
      if (!restoredUserInfo || !restoredUserInfo.userType) {
        // 복원 실패 시 API 요청
        try {
          const { data } = await useCustomFetch<AdminMemberVo>('/admin/handOrder/user-info', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          if (data.value) {
            authStore.setUserInfo(data.value)
          } else {
            authStore.logUserOut()
            return
          }
        } catch (error) {
          // 사용자 정보 가져오기 실패 시 로그아웃 처리
          authStore.logUserOut()
          return
        }
      }
    }
  }

  if (nonSecurityUrl.some(url => to?.path.includes(url))) {
    return
  }

  // 401 에러 시 강제 새로고침 방지하고 navigateTo('/') 실행
  if (!token.value && to?.name !== 'login') {
    return navigateTo('/login')
  }

  if (token.value && to?.name === 'login') {
    return navigateTo('/')
  }

  // 현재 경로의 서브 메뉴 찾기 및 권한 체크
  const currentSubMenu = findSubMenuByPath(to?.path)

  if (currentSubMenu) {
    const auth = menuAuthCheck(currentSubMenu.subMenu.menuCode)
    const hasAllPermissions = auth.R()
    if (!hasAllPermissions) {
      $q.notify({
        color: 'negative',
        message: '접근 권한이 없습니다.',
        position: 'top',
        timeout: 2000
      })
      return navigateTo('/')
    }
  }
})
