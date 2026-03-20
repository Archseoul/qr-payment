import type { UseFetchOptions } from 'nuxt/app'
import { defu } from 'defu'
import { useAuthStore } from '~/store/auth'

export async function useCustomFetch<T> (url: string, options: UseFetchOptions<T> & { disableCache?: boolean } = {}): Promise<CustomFetchResult<T>> {
  const userAuth = useCookie('token', {
    path: '/',
    sameSite: 'lax'
    // watch: false 제거 - refresh가 동작하려면 반응성 필요
  })
  const config = useRuntimeConfig()
  const { logUserOut } = useAuthStore()
  const refreshToken = useCookie<string>('refreshToken', {
    default: () => '',
    path: '/',
    sameSite: 'lax'
    // watch: false 제거 - refresh가 동작하려면 반응성 필요
  })
  const shouldRedirectToLogin = useState('shouldRedirectToLogin', () => false)

  // disableCache 옵션 추출 (기본값: true - 캐시 비활성화)
  const { disableCache = true, ...restOptions } = options

  // 쿠키 값 검증 - null, undefined, 빈 문자열 체크
  const hasValidToken = userAuth.value && userAuth.value.trim() !== ''

  // Electron 환경 감지
  const isElectron = process.client && (
    navigator.userAgent.toLowerCase().includes('electron') ||
    // @ts-ignore
    window.process?.type === 'renderer'
  )

  function redirectToLoginSSRCompatible () {
    if (process.client) {
      navigateTo('/login')
    } else {
      // SSR에서는 redirect 플래그만 설정하고 에러를 throw하지 않음
      shouldRedirectToLogin.value = true
    }
  }

  async function refreshAccessToken (): Promise<boolean> {
    try {
      const result = await $fetch<{ accessToken: string }>('/handOrder/token/refresh', {
        baseURL: config.public.baseUrl,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken.value}`
        }
      })

      if (result?.accessToken) {
        userAuth.value = result.accessToken
        return true
      } else {
        redirectToLoginSSRCompatible()
        return false
      }
    } catch (error) {
      redirectToLoginSSRCompatible()
      return false
    }
  }

  // Electron 환경에서 캐시 방지를 위한 헤더 설정
  const cacheControlHeaders = isElectron
    ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    : {}

  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.baseUrl,
    // 유효한 토큰이 있을 때만 Authorization 헤더 추가 + Electron 캐시 방지 헤더
    headers: {
      ...(hasValidToken ? { Authorization: `Bearer ${userAuth.value}` } : {}),
      ...cacheControlHeaders
    },
    // Hydration Mismatch 완전 방지 설정
    server: false, // ✅ SSR이 꺼져있으므로 server도 false로 변경
    lazy: false, // 즉시 실행
    // Electron 환경에서 캐시 비활성화
    ...(isElectron ? { cache: 'no-store' as const } : {}),
    // ✅ Nuxt 4 캐싱 제어: disableCache 옵션에 따라 고유 key 생성 및 캐시 무효화
    ...(disableCache
      ? {
          key: `${url}-${Date.now()}-${Math.random()}`,
          getCachedData: () => undefined
        }
      : {}),
    default: () => {
      return null as any
    },
    transform: (data: any) => {
      // 서버에서 받은 데이터 안전성 검증
      if (data === undefined) {
        return null as T
      }
      return data as T
    },
    onResponse (_ctx) {
      // 필요시 응답 데이터 후처리 가능
    },
    onResponseError (_ctx) {
      const errorStatus = _ctx.response?.status
      if (errorStatus === 403) {
        logUserOut()
      }
    }
  }

  const params = defu(restOptions, defaults)

  // 최초 API 요청
  const result = await useFetch(url, params)

  // ✅ 401 발생 시 자동 토큰 리프레시 + 재요청 처리
  async function handle401 (): Promise<boolean> {
    const errorStatus = result.error.value?.status || result.error.value?.statusCode
    if (errorStatus === 401) {
      const refresh = await refreshAccessToken()
      if (refresh) {
        try {
          const retryResult = await $fetch(url, {
            ...params as any,
            headers: {
              Authorization: `Bearer ${userAuth.value}`,
              ...cacheControlHeaders
            }
          })
          result.data.value = retryResult as any
          result.error.value = undefined // 에러 초기화
          return true // ✅ 토큰 갱신 및 재요청 성공
        } catch (retryError) {
          redirectToLoginSSRCompatible()
          // SSR에서는 기본값 설정
          if (!process.client && !result.data.value) {
            result.data.value = (url.includes('/list') || url.includes('breakTime') || url.includes('alertCharge') ? [] : null) as any
          }
          return false // ✅ 재요청 실패
        }
      } else {
        // 토큰 갱신 실패
        if (!process.client && !result.data.value) {
          result.data.value = (url.includes('/list') || url.includes('breakTime') || url.includes('alertCharge') ? [] : null) as any
        }
        return false // ✅ 토큰 갱신 실패
      }
    }
    return true // ✅ 401 아니면 정상
  }

  await handle401() // 최초 실행 시 401 처리

  // refresh 메서드 오버라이드 - 깜빡임 없이 데이터 갱신
  result.refresh = async (_opts) => {
    try {
      // ✅ clearNuxtData 호출 제거 - 기존 데이터 유지하면서 갱신
      // 직접 fetch를 호출하여 새 데이터 가져오기
      const newData = await $fetch(url, {
        ...params as any,
        headers: {
          ...(hasValidToken ? { Authorization: `Bearer ${userAuth.value}` } : {}),
          ...cacheControlHeaders
        }
      })

      // 새 데이터로 기존 데이터 교체 (깜빡임 없음)
      result.data.value = newData as any
      result.error.value = undefined
    } catch (error: any) {
      const errorStatus = error?.status || error?.statusCode
      console.log(errorStatus)
      // ✅ 401 에러 발생 시 토큰 갱신 후 재시도
      if (errorStatus === 401) {
        result.error.value = error
        const success = await handle401()
        if (!success) {
          // 토큰 갱신 실패 시 종료
          return
        }
        // ✅ handle401에서 이미 데이터를 갱신했으므로 종료
        return
      }

      // 다른 에러는 그대로 throw
      result.error.value = error

      // refresh 실패 시에도 undefined 방지
      if (result.data.value === undefined) {
        result.data.value = (url.includes('/list') || url.includes('breakTime') || url.includes('alertCharge') ? [] : null) as any
      }
    }

    // refresh 후에도 undefined 방지
    if (result.data.value === undefined) {
      result.data.value = (url.includes('/list') || url.includes('breakTime') || url.includes('alertCharge') ? [] : null) as any
    }
  }

  return result as CustomFetchResult<T>
}
