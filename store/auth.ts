import { defineStore } from 'pinia'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { AdminMemberVo } from '~/types/'

interface UserPayloadInterface {
  id: string;
  password: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authenticated: false,
    loading: false,
    userInfo: {} as AdminMemberVo
  }),
  actions: {
    async authenticateUser ({ id, password }: UserPayloadInterface) {
      // 로그인 시작 전 이전 사용자 정보 완전히 초기화
      this.authenticated = false
      this.userInfo = {} as AdminMemberVo

      // 쿠키 완전히 삭제 - Nuxt 4 방식
      const oldToken = useCookie('token', { maxAge: -1, path: '/' })
      const oldRefreshToken = useCookie('refreshToken', { maxAge: -1, path: '/' })
      const oldUserInfo = useCookie('userInfo', { maxAge: -1, path: '/' })

      oldToken.value = null
      oldRefreshToken.value = null
      oldUserInfo.value = null

      if (process.client) {
        localStorage.removeItem('auth-userInfo')
        localStorage.removeItem('auth-authenticated')
      }

      const { data, pending }: any = await useCustomFetch('/handOrder/backoffice/v2/login', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        params: {
          id,
          pw: password
        }
      })
      this.loading = pending

      if (data.value) {
        // 새 쿠키 생성 - 적절한 만료 시간 설정
        const token = useCookie('token', {
          maxAge: 60 * 60 * 24 * 7, // 7일
          path: '/',
          sameSite: 'lax'
        })
        const refreshToken = useCookie('refreshToken', {
          maxAge: 60 * 60 * 24 * 30, // 30일
          path: '/',
          sameSite: 'lax'
        })

        token.value = data?.value?.token
        refreshToken.value = data?.value?.refreshToken
        this.authenticated = data?.value?.loginResult
        return data.value?.token
      }
    },
    logUserOut () {
      // 모든 상태 초기화
      this.authenticated = false
      this.userInfo = {} as AdminMemberVo

      // 쿠키 삭제 - 서버사이드와 클라이언트 모두에서 삭제
      // maxAge: -1로 즉시 만료 처리
      const token = useCookie('token', {
        maxAge: -1,
        path: '/',
        sameSite: 'lax'
      })
      const refreshToken = useCookie('refreshToken', {
        maxAge: -1,
        path: '/',
        sameSite: 'lax'
      })
      const userInfoCookie = useCookie('userInfo', {
        maxAge: -1,
        path: '/',
        sameSite: 'strict'
      })

      // 쿠키 값을 null로 설정하여 삭제
      token.value = null
      refreshToken.value = null
      userInfoCookie.value = null

      // 클라이언트에서 추가 처리
      if (process.client) {
        // 모든 가능한 경로와 도메인에서 쿠키 삭제
        const cookies = ['token', 'refreshToken', 'userInfo']
        cookies.forEach((name) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`
          document.cookie = `${name}=; max-age=-1; path=/;`
        })

        // localStorage 완전 정리
        localStorage.removeItem('auth-userInfo')
        localStorage.removeItem('auth-authenticated')
        localStorage.clear()

        // sessionStorage도 정리
        sessionStorage.clear()
      }

      // Nuxt의 모든 데이터 캐시 초기화 (SSR 포함)
      clearNuxtData()

      // 에러 상태 초기화
      clearError()

      // 로그인 페이지로 이동 후 앱 완전 재시작
      navigateTo('/login')

      // 클라이언트에서 앱 강제 리로드하여 모든 상태 초기화
      if (process.client) {
        // Nuxt 앱 완전 재시작 (모든 캐시와 상태 초기화)
        setTimeout(() => {
          reloadNuxtApp({
            ttl: 0,
            persistState: false
          })
        }, 100)
      }
    },
    setUserInfo (member: AdminMemberVo) {
      // 쿠키와 store 모두에 저장 - Nuxt 4 방식
      const userInfoCookie = useCookie<AdminMemberVo | null>('userInfo', {
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/',
        sameSite: 'strict'
      })
      userInfoCookie.value = member
      this.userInfo = member

      // localStorage에도 명시적으로 저장 (persist 백업)
      if (process.client) {
        localStorage.setItem('auth-userInfo', JSON.stringify(member))
        localStorage.setItem('auth-authenticated', JSON.stringify(true))
      }
    },
    async getUserInfo () {
      // 먼저 store에 있는 정보 확인
      if (this.userInfo && Object.keys(this.userInfo).length > 0 && this.userInfo.userType) {
        return this.userInfo
      }

      // store가 비어있으면 쿠키에서 복원 시도
      const userInfoCookie = useCookie<AdminMemberVo | null>('userInfo')
      if (userInfoCookie.value && Object.keys(userInfoCookie.value).length > 0) {
        this.userInfo = userInfoCookie.value
        return userInfoCookie.value
      }

      // 쿠키에도 없으면 localStorage에서 복원 시도
      if (process.client) {
        const storedUserInfo = localStorage.getItem('auth-userInfo')
        if (storedUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(storedUserInfo) as AdminMemberVo
            if (parsedUserInfo && parsedUserInfo.userType) {
              this.userInfo = parsedUserInfo
              // 쿠키에도 다시 저장
              userInfoCookie.value = parsedUserInfo
              return parsedUserInfo
            }
          } catch (error) {
            // JSON 파싱 실패 시 localStorage 정리
            localStorage.removeItem('auth-userInfo')
          }
        }
      }

      return null
    },
    async authenticateDesktopUser ({ id, password }: UserPayloadInterface) {
      // 로그인 시작 전 이전 사용자 정보 완전히 초기화
      this.authenticated = false
      this.userInfo = {} as AdminMemberVo

      // 쿠키 완전히 삭제 - Nuxt 4 방식
      const oldToken = useCookie('token', { maxAge: -1, path: '/' })
      const oldRefreshToken = useCookie('refreshToken', { maxAge: -1, path: '/' })
      const oldUserInfo = useCookie('userInfo', { maxAge: -1, path: '/' })

      oldToken.value = null
      oldRefreshToken.value = null
      oldUserInfo.value = null

      if (process.client) {
        localStorage.removeItem('auth-userInfo')
        localStorage.removeItem('auth-authenticated')
      }

      const { data, pending }: any = await useCustomFetch('/handOrder/login/v2/desktop', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        params: {
          id,
          pw: password
        }
      })
      this.loading = pending

      if (data.value) {
        // 데스크톱은 장기 쿠키 사용
        const token = useCookie('token', {
          maxAge: 60 * 60 * 24 * 365, // 1년
          path: '/',
          sameSite: 'lax'
        })
        const refreshToken = useCookie('refreshToken', {
          expires: new Date('9999-12-31'),
          path: '/',
          sameSite: 'lax'
        })

        token.value = data?.value?.token
        refreshToken.value = data?.value?.refreshToken
        this.authenticated = data?.value?.loginResult
        return data.value?.token
      }
    }
  }
})
