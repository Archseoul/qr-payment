/* eslint-disable no-console */
import type { Ref } from 'vue'

interface SSEConnectionOptions {
  shopCode: string
  onMessage: (message: string) => void
  onConnected?: () => void
  onError?: (error: Event) => void
  clearCallbacks?: boolean // 기존 콜백 전부 정리 여부
}

// 싱글톤 패턴으로 변경하여 이중 연결 방지
let sseInstance: ReturnType<typeof createSSEConnection> | null = null

function createSSEConnection () {
  let eventSource: EventSource | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  let statusCheckInterval: NodeJS.Timeout | null = null
  let retryCount = 0
  let isConnecting = false // 연결 진행 중 플래그
  let currentOptions: SSEConnectionOptions | null = null // 현재 연결 옵션 저장
  let messageCallbacks: Array<(message: string) => void> = [] // 여러 콜백 지원
  const MAX_RETRY_COUNT = 3
  const isConnected: Ref<boolean> = ref(false)
  const connectionStatus: Ref<'disconnected' | 'connecting' | 'connected' | 'error'> = ref('disconnected')
  const config = useRuntimeConfig()

  // 토큰 리프레시 함수
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const userAuth = useCookie('token')
      const refreshToken = useCookie<string>('refreshToken', { default: () => '' })

      console.log('[PG Order SSE] 토큰 리프레시 시도')

      const result = await $fetch<{ accessToken: string }>('/handOrder/token/refresh', {
        baseURL: config.public.baseUrl,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken.value}`
        }
      })

      if (result?.accessToken) {
        userAuth.value = result.accessToken
        console.log('[PG Order SSE] 토큰 리프레시 성공')
        return true
      } else {
        console.error('[PG Order SSE] 토큰 리프레시 실패 - 응답 없음')
        return false
      }
    } catch (error) {
      console.error('[PG Order SSE] 토큰 리프레시 실패:', error)
      return false
    }
  }

  // EventSource의 readyState를 주기적으로 체크
  const startStatusCheck = () => {
    stopStatusCheck()

    statusCheckInterval = setInterval(() => {
      if (!eventSource) {
        return
      }

      // EventSource.CONNECTING = 0, EventSource.OPEN = 1, EventSource.CLOSED = 2
      const state = eventSource.readyState

      if (state === EventSource.OPEN) {
        // 연결 정상
        if (!isConnected.value) {
          console.log('[PG Order SSE] 연결 상태 정상으로 복구')
          isConnected.value = true
          connectionStatus.value = 'connected'
        }
      } else if (state === EventSource.CLOSED) {
        // 연결 종료됨
        console.log('[PG Order SSE] 연결 종료 감지 (readyState: CLOSED)')
        isConnected.value = false
        connectionStatus.value = 'error'

        // 자동 재연결 시도
        if (currentOptions && !isConnecting) {
          console.log('[PG Order SSE] 3초 후 자동 재연결 시도')
          setTimeout(() => {
            if (currentOptions) {
              connect(currentOptions)
            }
          }, 3000)
        }
      } else if (state === EventSource.CONNECTING) {
        // 연결 시도 중
        if (connectionStatus.value !== 'connecting') {
          console.log('[PG Order SSE] 연결 시도 중... (readyState: CONNECTING)')
          connectionStatus.value = 'connecting'
        }
      }
    }, 5000) // 5초마다 체크
  }

  const stopStatusCheck = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
      statusCheckInterval = null
    }
  }

  const connect = (options: SSEConnectionOptions) => {
    const { shopCode, onMessage, onConnected, onError, clearCallbacks = false } = options

    // clearCallbacks가 true면 기존 콜백 전부 제거
    if (clearCallbacks) {
      console.log('[PG Order SSE] 기존 콜백 전부 제거')
      messageCallbacks = []
    }

    // 새로운 콜백 추가 (중복 제거)
    if (onMessage && !messageCallbacks.includes(onMessage)) {
      messageCallbacks.push(onMessage)
      console.log('[PG Order SSE] 메시지 콜백 추가. 총', messageCallbacks.length, '개')
    }

    // 이미 연결 중이면 콜백만 추가하고 리턴
    if (isConnecting) {
      console.log('[PG Order SSE] 이미 연결 진행 중. 콜백만 추가.')
      return
    }

    // 이미 연결되어 있으면 콜백만 추가하고 리턴
    if (isConnected.value && eventSource?.readyState === EventSource.OPEN) {
      console.log('[PG Order SSE] 이미 연결되어 있음. 콜백만 추가.')
      return
    }

    isConnecting = true
    currentOptions = options // 옵션 저장

    // 기존 연결이 있으면 완전히 종료
    disconnect(false) // reconnect 플래그 false로 전달

    try {
      connectionStatus.value = 'connecting'
      console.log('[PG Order SSE] 연결 시도:', shopCode)

      // SSE 연결 생성 - baseURL 추가
      const baseUrl = config.public.baseUrl
      const userAuth = useCookie('token')

      // 토큰을 URL 파라미터로 추가 (EventSource는 헤더를 지원하지 않음)
      const sseUrl = `${baseUrl}/order-sse/connect?shopCode=${shopCode}&token=${userAuth.value}`
      console.log('[PG Order SSE] 연결 URL:', sseUrl.replace(/token=[^&]*/, 'token=***'))

      eventSource = new EventSource(sseUrl)

      // connected 이벤트 리스너
      eventSource.addEventListener('connected', (event) => {
        console.log('[PG Order SSE] 연결 성공:', event.data)
        isConnected.value = true
        connectionStatus.value = 'connected'
        isConnecting = false // 연결 완료
        retryCount = 0 // 재시도 카운트 초기화
        startStatusCheck() // 상태 체크 시작
        if (onConnected) {
          onConnected()
        }
      })

      // pgOrder 이벤트 리스너 - 모든 콜백 실행
      eventSource.addEventListener('pgOrder', (event) => {
        console.log('[PG Order SSE] 주문 메시지 수신:', event.data)
        // 등록된 모든 콜백 실행
        messageCallbacks.forEach(callback => callback(event.data))
      })

      // heartbeat 이벤트 리스너 (백엔드에서 보내는 경우)
      eventSource.addEventListener('heartbeat', () => {
        console.log('[PG Order SSE] Heartbeat 수신')
      })

      // 일반 message 이벤트도 처리
      eventSource.onmessage = (event) => {
        console.log('[PG Order SSE] 메시지 수신:', event.data)
        // 등록된 모든 콜백 실행
        messageCallbacks.forEach(callback => callback(event.data))
      }

      // 에러 핸들러
      eventSource.onerror = (error: Event) => {
        console.error('[PG Order SSE] 연결 에러:', error)
        isConnected.value = false
        connectionStatus.value = 'error'
        isConnecting = false // 연결 실패
        stopStatusCheck() // 상태 체크 중지

        if (onError) {
          onError(error)
        }

        // readyState 확인
        const state = eventSource?.readyState
        console.log('[PG Order SSE] EventSource readyState:', state)

        // CONNECTING 상태에서 에러 발생 (인증 문제 등)
        if (state === EventSource.CONNECTING) {
          console.error('[PG Order SSE] 연결 시도 중 에러 발생')

          // 403 에러일 가능성이 있으므로 토큰 리프레시 시도
          if (retryCount < MAX_RETRY_COUNT) {
            retryCount++
            console.log(`[PG Order SSE] 토큰 리프레시 후 재시도 (${retryCount}/${MAX_RETRY_COUNT})`)

            refreshAccessToken().then((refreshSuccess) => {
              if (refreshSuccess) {
                disconnect(false)
                setTimeout(() => {
                  connect(options)
                }, 2000)
              } else {
                console.error('[PG Order SSE] 토큰 리프레시 실패. 로그인 필요.')
                disconnect(true)
                // 로그인 페이지로 리다이렉트
                if (typeof window !== 'undefined') {
                  Promise.resolve(navigateTo('/login')).catch(console.error)
                }
              }
            }).catch(console.error)
            return
          } else {
            console.error('[PG Order SSE] 최대 재시도 횟수 초과. 연결 중단.')
            disconnect(true)
            return
          }
        }

        // CLOSED 상태에서 에러 발생 (연결 끊김)
        if (state === EventSource.CLOSED) {
          console.log('[PG Order SSE] 연결 종료됨. 5초 후 재연결 시도...')
          reconnectTimeout = setTimeout(() => {
            if (currentOptions) {
              connect(currentOptions)
            }
          }, 5000)
        }
      }

      // 연결 성공 타임아웃 체크 (10초 내에 connected 이벤트가 와야 함)
      setTimeout(() => {
        if (isConnecting) {
          console.error('[PG Order SSE] 연결 타임아웃 (10초)')
          isConnecting = false
          if (eventSource?.readyState !== EventSource.OPEN) {
            disconnect(false)
            // 재시도
            if (currentOptions && retryCount < MAX_RETRY_COUNT) {
              retryCount++
              console.log(`[PG Order SSE] 타임아웃 후 재시도 (${retryCount}/${MAX_RETRY_COUNT})`)
              setTimeout(() => {
                if (currentOptions) {
                  connect(currentOptions)
                }
              }, 3000)
            }
          }
        }
      }, 10000)
    } catch (error) {
      console.error('[PG Order SSE] 연결 생성 실패:', error)
      connectionStatus.value = 'error'
      isConnecting = false
      stopStatusCheck()
    }
  }

  const disconnect = (clearOptions = true) => {
    console.log('[PG Order SSE] 연결 종료 요청')

    stopStatusCheck() // 상태 체크 중지
    isConnecting = false // 연결 진행 중 플래그 초기화

    if (clearOptions) {
      retryCount = 0 // 재시도 카운트 초기화
      currentOptions = null // 저장된 옵션 제거
      messageCallbacks = [] // 콜백 초기화
      console.log('[PG Order SSE] 콜백 초기화')
    }

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (eventSource) {
      console.log('[PG Order SSE] EventSource 닫기')
      try {
        eventSource.close()
      } catch (e) {
        console.error('[PG Order SSE] EventSource 닫기 실패:', e)
      }
      eventSource = null
      isConnected.value = false
      connectionStatus.value = 'disconnected'
    }
  }

  // 특정 콜백 제거
  const removeCallback = (callback: (message: string) => void) => {
    const index = messageCallbacks.indexOf(callback)
    if (index > -1) {
      messageCallbacks.splice(index, 1)
      console.log('[PG Order SSE] 콜백 제거. 남은 콜백:', messageCallbacks.length, '개')
    }
  }

  return {
    connect,
    disconnect: () => disconnect(true),
    removeCallback,
    isConnected: readonly(isConnected),
    connectionStatus: readonly(connectionStatus)
  }
}

export const usePgOrderSSE = () => {
  // 싱글톤 인스턴스 반환
  if (!sseInstance) {
    console.log('[PG Order SSE] 새 인스턴스 생성')
    sseInstance = createSSEConnection()
  } else {
    console.log('[PG Order SSE] 기존 인스턴스 재사용')
  }
  return sseInstance
}

// 싱글톤 인스턴스를 완전히 리셋하는 함수 (로그아웃 시 사용)
export const resetPgOrderSSE = () => {
  if (sseInstance) {
    console.log('[PG Order SSE] 인스턴스 완전히 리셋')
    sseInstance.disconnect()
    sseInstance = null
  }
}
