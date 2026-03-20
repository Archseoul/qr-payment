// composables/menuAuthCheck.ts
import { storeToRefs } from 'pinia'
import { useNuxtApp } from '#app'
import { useAuthStore } from '~/store/auth'

// [C, R, U, D] 권한을 체크하는 함수
export const menuAuthCheck = (menuCode: string) => {
  const nuxtApp = useNuxtApp()
  const authStore = useAuthStore(nuxtApp.$pinia)
  const { userInfo } = storeToRefs(authStore)
  if (userInfo.value.role === 'ROLE_ADMIN') { return { R: () => true, C: () => true, U: () => true, D: () => true, UP: () => true, DW: () => true } }
  if (userInfo.value.userType !== 'admin') { return { R: () => true, C: () => true, U: () => true, D: () => true, UP: () => true, DW: () => true } }
  if (!userInfo.value.menuAuth) { return { R: () => false, C: () => false, U: () => false, D: () => false, UP: () => false, DW: () => false } }

  return {
    R: () => hasPermission(menuCode, 1, userInfo.value.menuAuth),
    C: () => hasPermission(menuCode, 2, userInfo.value.menuAuth),
    U: () => hasPermission(menuCode, 4, userInfo.value.menuAuth),
    D: () => hasPermission(menuCode, 8, userInfo.value.menuAuth),
    UP: () => hasPermission(menuCode, 16, userInfo.value.menuAuth),
    DW: () => hasPermission(menuCode, 32, userInfo.value.menuAuth)
  }
}

const hasPermission = (menuCode: string, permission: number, menuAuth: string): boolean => {
  const authItem = menuAuth.split('|').find(auth => `${auth.slice(0, 2)}00` === menuCode)
  if (!authItem) { return false }
  const permissionCode = parseInt(authItem.slice(2), 10)
  return (permissionCode & permission) === permission
}
