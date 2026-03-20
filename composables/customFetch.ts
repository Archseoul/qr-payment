import type { FetchOptions } from 'ofetch'
import { defu } from 'defu'
import { useAuthStore } from '~/store/auth'

export async function customFetch<T> (
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const config = useRuntimeConfig()
  const userAuth = useCookie('token', {
    path: '/',
    sameSite: 'lax'
    // watch 제거 - 일반 fetch는 watch 불필요
  })
  const refreshToken = useCookie<string>('refreshToken', {
    default: () => '',
    path: '/',
    sameSite: 'lax'
    // watch 제거 - 일반 fetch는 watch 불필요
  })
  const { logUserOut } = useAuthStore()

  // 쿠키 값 검증 - null, undefined, 빈 문자열 체크
  const hasValidToken = userAuth.value && userAuth.value.trim() !== ''

  const userOnResponseError = options.onResponseError

  delete options.onResponseError

  // 토큰 리프레시
  async function refreshAccessToken (): Promise<boolean> {
    try {
      const result = await $fetch<{ accessToken: string }>(
        '/handOrder/token/refresh',
        {
          baseURL: config.public.baseUrl,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${refreshToken.value}`
          }
        }
      )
      if (result?.accessToken) {
        userAuth.value = result.accessToken
        return true
      } else {
        logUserOut()
        navigateTo('/')
        return false
      }
    } catch (error) {
      logUserOut()
      navigateTo('/')
      return false
    }
  }

  // 기본 옵션(여기서는 onResponseError를 쓰지 않는다!)
  const defaults: FetchOptions = {
    baseURL: config.public.baseUrl,
    // 유효한 토큰이 있을 때만 Authorization 헤더 추가
    headers: hasValidToken
      ? { Authorization: `Bearer ${userAuth.value}` }
      : {}
  }

  // 옵션 병합
  const params = defu(options, defaults)
  // onResponseError가 없는 ofetch 인스턴스
  const _fetch = $fetch.create(params)

  try {
    // 첫 요청
    return await _fetch<T>(url)
  } catch (err: any) {
    // 401이라면 → 리프레시 후 재요청 시도
    const errorStatus = err?.response?.status

    if (errorStatus === 401) {
      const success = await refreshAccessToken()
      if (success) {
        // 재시도
        try {
          return await _fetch<T>(url, {
            headers: {
              Authorization: `Bearer ${userAuth.value}`
            }
          })
        } catch (retryErr: any) {
          if (userOnResponseError) {
            if (Array.isArray(userOnResponseError)) {
              userOnResponseError.forEach(fn => fn(retryErr as any))
            } else {
              userOnResponseError(retryErr as any)
            }
          }
          throw retryErr
        }
      }
    }

    if (errorStatus === 403) {
      logUserOut()
    }

    // 최종적으로 사용자 onResponseError가 있으면 실행
    if (userOnResponseError) {
      if (Array.isArray(userOnResponseError)) {
        userOnResponseError.forEach(fn => fn(err as any))
      } else {
        userOnResponseError(err as any)
      }
    }
    throw err
  }
}
