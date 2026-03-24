<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PropType } from 'vue'
import isElectron from 'is-electron'
import type { ShopInfoVo } from '~/types'
import { useAuthStore } from '~/store/auth'
import app from '~/app.vue'
import CustomToggle from '@/components/CustomToggle.vue'
import { useQrPaymentStore } from '~/store/qrPaymentStore'

const sidebarMiniState = inject<Ref<boolean>>('sidebarMiniState', ref(true))

// Electron API 타입 선언
declare global {
  interface Window {
    electronAPI?: {
      minApp: (event: string) => void
      maxApp: (event: string) => void
      closeApp: (event: string) => void
      logoutApp: () => void
    }
  }
}

// Props 정의
const props = defineProps({
  elementHeight: {
    type: Function,
    required: true
  },
  shopInfo: {
    type: Object as PropType<ShopInfoVo | null>,
    required: false,
    default: null
  },
  showTopBar: {
    type: Boolean,
    default: false
  },
  isShopOpen: {
    type: Boolean,
    default: undefined
  },
  isFullscreen: {
    type: Boolean,
    default: false
  },
  isModal: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits([
  'update:childHeight',
  'request-minimize',
  'update:shop-status'
])

const { logUserOut } = useAuthStore(app.$pinia)

// 결제 활성화 상태 조회 (isShopOpen prop이 없을 때만 자체 조회)
let shopOpenStatus: any = null
let refreshShopOpenStatus: any = null

if (props.isShopOpen === undefined) {
  const result = await useCustomFetch<boolean>('/admin/handOrder/shop/payments/activation/status', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    key: 'payment-management-shop-open-status'
  })
  shopOpenStatus = (result as any).data
  refreshShopOpenStatus = (result as any).refresh
}

// 전역 상태 사용 (ShopStatusButtons와 동일한 상태 공유)
const route = useRoute()
const shopCode = computed(() => route.params.shopCode as string)
const globalShopOpenState = useState(`shop-open-${shopCode.value}`, () => {
  if (props.isShopOpen !== undefined) {
    return props.isShopOpen
  }
  return shopOpenStatus?.value ?? true
})

const isShopOpen = computed(() => {
  if (props.isShopOpen !== undefined) {
    return props.isShopOpen
  }
  return globalShopOpenState.value
})

if (props.isShopOpen === undefined && shopOpenStatus) {
  watch(
    shopOpenStatus,
    (newVal) => {
      if (typeof newVal === 'boolean') {
        globalShopOpenState.value = newVal
        emits('update:shop-status')
      }
    },
    { immediate: true }
  )
}

const handleShopStatusChanged = async () => {
  if (refreshShopOpenStatus) {
    await refreshShopOpenStatus()
  }

  await fetchPaymentList()
  emits('update:shop-status')
}

// 상태 타입 정의
type PaymentStatus = 'requested' | 'in_progress'| 'completed' | 'canceled' | 'failed'
type FilterTab = 'all' | 'requested'| 'in_progress' | 'completed' | 'canceled' | 'failed'

// API 응답 타입 정의
interface PaymentApiResponse {
  paymentUuid: string;
  shopSeq: number;
  shopName: string;
  tableNum: string | null;
  paymentTitle: string;
  paymentAmount: number;
  paymentMethod: string | null;
  printGroupUuid: string | null;
  paymentRequesterCode: string;
  paymentStatus: string;
  insDate: string;
  uptDate: string | null;
  pgCode: string | null;
  payMethod: string | null;
  paymentNumber?: string | null;
}

interface PaymentItem {
  uuid: string;
  tableNum: string;
  amount: number;
  title: string;
  status: PaymentStatus;
  time: string;
  insDate: string;
  requesterCode: string;
  paymentNumber?: string | null;
}

const paymentList = ref<PaymentItem[]>([])
const isLoadingPayments = ref(false)
const paymentError = ref<string | null>(null)

// SSE 연결 상태 관리
const sseConnection = ref<EventSource | null>(null)
const sseConnectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')
const sseReconnectAttempts = ref(0)
const maxReconnectAttempts = 5

const convertApiResponseToPaymentItem = (apiData: PaymentApiResponse): PaymentItem => {
  const statusMap: Record<string, PaymentStatus> = {
    PENDING: 'requested',
    IN_PROGRESS: 'in_progress',
    CANCELED: 'canceled',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const period = hours >= 12 ? '오후' : '오전'
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      return `${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`
    } catch {
      return '시간 정보 없음'
    }
  }

  return {
    uuid: apiData.paymentUuid,
    tableNum: apiData.tableNum || '-',
    amount: apiData.paymentAmount,
    title: apiData.paymentTitle,
    status: statusMap[apiData.paymentStatus] || 'requested',
    time: formatTime(apiData.insDate),
    insDate: apiData.insDate,
    requesterCode: apiData.paymentRequesterCode,
    paymentNumber: apiData.paymentNumber || null
  }
}

const connectToSSE = () => {
  // 이미 연결되어 있거나 연결 중이면 중복 연결 방지
  if (sseConnection.value || sseConnectionStatus.value === 'connecting') {
    return
  }

  if (!props.shopInfo?.shopCode) {
    return
  }

  try {
    sseConnectionStatus.value = 'connecting'
    const config = useRuntimeConfig()
    const tokenCookie = useCookie('token')
    const accessToken = tokenCookie.value

    if (!accessToken) {
      sseConnectionStatus.value = 'disconnected'
      return
    }

    const host = config.public.baseUrl
    const sseUrl = `${host}/sse/owner/payments/connect?token=${accessToken}`

    // EventSource 생성
    const eventSource = new EventSource(sseUrl)
    sseConnection.value = eventSource

    eventSource.onopen = () => {
      sseConnectionStatus.value = 'connected'
    }

    eventSource.addEventListener('connect', (event) => {
      if (event.data === 'connected') {
        sseConnectionStatus.value = 'connected'
        sseReconnectAttempts.value = 0 // 재연결 시도 횟수 초기화
      }
    })

    // 일반 메시지 이벤트 핸들러
    eventSource.addEventListener('message', (event) => {
      handleSSEMessage(event.data)
    })

    eventSource.addEventListener('paymentRefresh', (event) => {
      handleSSEMessage(event.data)
    })

    eventSource.onmessage = (event) => {
      handleSSEMessage(event.data)
    }

    eventSource.onerror = () => {
      sseConnectionStatus.value = 'disconnected'

      if (sseReconnectAttempts.value < maxReconnectAttempts) {
        sseReconnectAttempts.value++
        // 3초 후 재연결 시도
        setTimeout(() => {
          disconnectSSE()
          connectToSSE()
        }, 3000)
      }
    }

    eventSource.addEventListener('close', () => {
      sseConnectionStatus.value = 'disconnected'
    })
  } catch (error) {
    sseConnectionStatus.value = 'disconnected'
  }
}

// SSE 연결 해제 함수
const disconnectSSE = () => {
  if (sseConnection.value) {
    sseConnection.value.close()
    sseConnection.value = null
  }
  sseConnectionStatus.value = 'disconnected'
}

const handleSSEMessage = (data: string) => {
  if (data === 'updated') {
    fetchPaymentList()
    return
  }
  try {
    const parsedData = JSON.parse(data)
    if (parsedData.Type === 'paymentRefresh' && parsedData.Data === 'updated') { fetchPaymentList() }
    // 기존 결제 관련 데이터 처리
    else if (parsedData.type === 'payment_update' || parsedData.type === 'payment_status_change') {
      fetchPaymentList()
    }
  } catch (err) {
  }
}

const fetchPaymentList = async () => {
  isLoadingPayments.value = true
  paymentError.value = null

  try {
    const config = useRuntimeConfig()
    const baseUrl = config.public.baseUrl
    const response = await $fetch(
      `${baseUrl}/handOrder/shop/${props.shopInfo.shopCode}/owner/payments`,
      { method: 'GET' }
    )

    let paymentsArray: PaymentApiResponse[] = []
    if (Array.isArray(response)) {
      paymentsArray = response
    } else if (response && typeof response === 'object') {
      const apiResponse = response as any
      if (apiResponse.payments && Array.isArray(apiResponse.payments)) {
        paymentsArray = apiResponse.payments
      }
    }

    const filteredPayments = paymentsArray.filter(p => p.paymentMethod === 'PAYMENT_ONLY')
    paymentList.value = filteredPayments.map(convertApiResponseToPaymentItem)
  } catch (err) {
    paymentError.value = '결제 리스트를 불러오는데 실패했습니다.'
    paymentList.value = []
  } finally {
    isLoadingPayments.value = false
  }
}

// shopInfo 변경 시 1회만 실행
watch(
  () => props.shopInfo?.shopCode,
  (newCode, oldCode) => {
    if (newCode) {
      fetchPaymentList()
      if (newCode !== oldCode) {
        connectToSSE()
      }
    } else {
      paymentList.value = []
      disconnectSSE()
    }
  },
  { immediate: true }
)

// 계산기 상태
const calculatorValue = ref('0')
const showAmountLimitToast = ref(false)
const showMinAmountToast = ref(false)

// 필터 탭 상태
const activeTab = ref<FilterTab>('all')

// 모달 상태
const showCancelModal = ref(false)
const showRegisterModal = ref(false)
const showLogoutConfirm = ref(false)
const selectedPaymentIdToCancel = ref<string | null>(null)
const cancelingPaymentId = ref<string | null>(null)
const cancelModalIsPaymentCancel = ref(false) // completed 상태 여부 구분

// 재시도 모달 상태
const showRetryModal = ref(false)
const selectedPaymentIdToRetry = ref<string | null>(null)
const isRetrying = ref(false)
const showRetryResultModal = ref(false)
const retryResultMessage = ref('')

const closeModals = () => {
  showCancelModal.value = false
  showRegisterModal.value = false
  selectedPaymentIdToCancel.value = null
  cancelModalIsPaymentCancel.value = false
}

const closeLogoutModal = () => { showLogoutConfirm.value = false }

const handleLogout = () => { showLogoutConfirm.value = true }

const confirmLogout = () => {
  showLogoutConfirm.value = false
  logUserOut()
  if (isElectron()) { window.electronAPI?.logoutApp() }
}

const filteredPaymentList = computed(() => {
  if (activeTab.value === 'all') { return paymentList.value }
  return paymentList.value.filter(p => p.status === activeTab.value)
})

const getStatusBadge = (status: PaymentStatus) => {
  const badges = {
    requested: { label: '요청', color: '#FF8800', bgColor: '#FFEFC4' },
    in_progress: { label: '진행중', color: '#00A3FF', bgColor: '#E0F4FF' },
    completed: { label: '완료', color: '#006A4C', bgColor: '#A5F4C2' },
    canceled: { label: '결제취소', color: '#5D5D5C', bgColor: null },
    failed: { label: '결제실패', color: '#FF2735', bgColor: '#FFD4DF' }
  }
  return badges[status]
}

const handleCalculatorClick = (value: string) => {
  if (value === 'reset') {
    calculatorValue.value = '0'
  } else if (value === 'back' || value === '←') {
    calculatorValue.value = calculatorValue.value.length > 1
      ? calculatorValue.value.slice(0, -1)
      : '0'
  } else if (value === '00') {
    if (calculatorValue.value !== '0') {
      const newValue = calculatorValue.value + '00'
      if (Number(newValue) >= 100000000) {
        showAmountLimitToast.value = true
        setTimeout(() => { showAmountLimitToast.value = false }, 2000)
        return
      }
      calculatorValue.value = newValue
    }
  } else {
    const newValue = calculatorValue.value === '0' ? value : calculatorValue.value + value
    if (Number(newValue) >= 100000000) {
      showAmountLimitToast.value = true
      setTimeout(() => { showAmountLimitToast.value = false }, 2000)
      return
    }
    calculatorValue.value = newValue
  }
}

const formattedCalculatorValue = computed(() => Number(calculatorValue.value).toLocaleString())

const handleRegister = () => {
  if (!props.shopInfo) { return }
  const amount = Number(calculatorValue.value)
  if (amount < 100) {
    showMinAmountToast.value = true
    setTimeout(() => { showMinAmountToast.value = false }, 2000)
    return
  }
  if (calculatorValue.value === '0' || !calculatorValue.value) { return }
  showRegisterModal.value = true
}

const executeRegister = async () => {
  if (!props.shopInfo) { return }
  if (calculatorValue.value === '0' || !calculatorValue.value) { return }

  const config = useRuntimeConfig()
  const baseUrl = config.public.baseUrl

  try {
    await $fetch(`${baseUrl}/handOrder/order/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        paymentAmount: Number(calculatorValue.value),
        paymentMethod: 'PAYMENT_ONLY',
        paymentTitle: props.shopInfo.shopName,
        shopSeq: props.shopInfo.shopSeq
      }
    })
    await fetchPaymentList()
    calculatorValue.value = '0'
    closeModals()
  } catch (err) {
    console.error('결제 등록 중 오류 발생:', err)
  }
}

const formatCurrency = (amount: number) => amount.toLocaleString() + '원'

const handleCancelPayment = (paymentUuid: string) => {
  const payment = paymentList.value.find(p => p.uuid === paymentUuid)
  if (!payment) { return }

  cancelModalIsPaymentCancel.value = payment.status === 'completed'
  selectedPaymentIdToCancel.value = paymentUuid
  showCancelModal.value = true
}

const executeCancelPayment = async () => {
  const paymentUuid = selectedPaymentIdToCancel.value
  if (!paymentUuid) { return }

  const payment = paymentList.value.find(p => p.uuid === paymentUuid)
  if (!payment) { closeModals(); return }
  if (cancelingPaymentId.value === paymentUuid) { return }

  cancelingPaymentId.value = paymentUuid

  try {
    const config = useRuntimeConfig()
    const baseUrl = config.public.baseUrl
    await $fetch(`${baseUrl}/handOrder/payment/${paymentUuid}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { paymentUuid }
    })
    await fetchPaymentList()
    closeModals()
  } catch (err) {
    closeModals()
  } finally {
    cancelingPaymentId.value = null
  }
}

// 재시도 핸들러
const handleRetryPayment = (paymentUuid: string) => {
  selectedPaymentIdToRetry.value = paymentUuid
  showRetryModal.value = true
}

const executeRetryPayment = async () => {
  const paymentUuid = selectedPaymentIdToRetry.value
  if (!paymentUuid || isRetrying.value) { return }

  isRetrying.value = true

  try {
    const config = useRuntimeConfig()
    const baseUrl = config.public.baseUrl
    const response = await $fetch<{ paymentNumber: Number }>(
      `${baseUrl}/handOrder/payment/retry/${paymentUuid}`,
      { method: 'POST' }
    )
    showRetryModal.value = false
    retryResultMessage.value = `결제를 재요청 했습니다. (새로운 결제번호 : ${response.paymentNumber})`
    showRetryResultModal.value = true
    setTimeout(() => {
      showRetryResultModal.value = false
    }, 3000)
    await fetchPaymentList()
  } catch (err: any) {
    showRetryModal.value = false
    const status = err?.response?.status ?? err?.statusCode
    if (status === 409) {
      retryResultMessage.value = err?.data?.message ?? '이미 처리된 결제입니다.'
    } else {
      retryResultMessage.value = err?.data?.message ?? '재시도 중 오류가 발생했습니다.'
    }
    showRetryResultModal.value = true
    setTimeout(() => {
      showRetryResultModal.value = false
    }, 3000)
  } finally {
    isRetrying.value = false
    selectedPaymentIdToRetry.value = null
  }
}

const closeRetryModal = () => {
  showRetryModal.value = false
  selectedPaymentIdToRetry.value = null
}

// 풀스크린·모달 두 인스턴스가 동일한 상태를 공유하도록 useState 사용
const latestRequestedUuid = useState<string | null>(`latest-requested-uuid-${shopCode.value}`, () => null)
const knownUuids = useState<string[]>(`known-uuids-${shopCode.value}`, () => [])
let knownUuidsInitialized = false

watch(paymentList, (newList) => {
  // 최초 로드: 기존 결제건 uuid를 스냅샷에 저장하고 추적하지 않음
  if (!knownUuidsInitialized) {
    const currentKnown = new Set(knownUuids.value)
    newList.forEach(p => currentKnown.add(p.uuid))
    knownUuids.value = Array.from(currentKnown)
    knownUuidsInitialized = true
    return
  }

  // 추적 중인 건의 상태가 requested/in_progress 외로 바뀌면 테두리 제거
  if (latestRequestedUuid.value !== null) {
    const tracked = newList.find(p => p.uuid === latestRequestedUuid.value)
    if (!tracked || (tracked.status !== 'requested' && tracked.status !== 'in_progress')) {
      latestRequestedUuid.value = null
    }
  }

  // 스냅샷에 없는 uuid = 신규 생성건
  const knownSet = new Set(knownUuids.value)
  const newItems = newList.filter(p => !knownSet.has(p.uuid))
  if (newItems.length > 0) {
    newItems.forEach(p => knownSet.add(p.uuid))
    knownUuids.value = Array.from(knownSet)
  }

  const activeNew = newItems
    .filter(p => p.status === 'requested' || p.status === 'in_progress')
    .sort((a, b) => b.insDate.localeCompare(a.insDate))

  if (activeNew.length > 0) latestRequestedUuid.value = activeNew[0].uuid
}, { immediate: false, deep: true })

const paymentContainer = ref<HTMLElement | undefined>(undefined)

const handleKeydown = (e: KeyboardEvent) => {
  const key = e.key

  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
    handleCalculatorClick(key)
  } else if (key === 'Backspace') {
    handleCalculatorClick('back')
  } else if (key === 'Enter') {
    if (showRetryModal.value) {
      executeRetryPayment()
    } else if (showRetryResultModal.value) {
      showRetryResultModal.value = false
    } else if (showRegisterModal.value) {
      executeRegister()
    } else if (showCancelModal.value) {
      executeCancelPayment()
    } else {
      handleRegister()
    }
  } else if (key === 'Escape') {
    handleCalculatorClick('reset')
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('click', () => { showDropdown.value = false })
  nextTick(() => {
    if (paymentContainer.value) {
      const height = props.elementHeight(paymentContainer.value)
      emits('update:childHeight', height)
    }
  })

  // 최신 매장 상태 조회
  if (process.client && refreshShopOpenStatus) {
    await refreshShopOpenStatus()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('click', () => { showDropdown.value = false })
  // 컴포넌트 해제 시 SSE 연결 정리
  disconnectSSE()
})

const qrPaymentStore = useQrPaymentStore()
const { qrPaymentEnabled, showQrConfirmModal, showPaymentToast, paymentToastMessage } = storeToRefs(qrPaymentStore)

// PAYMENT_WINDOW 전용 기능 여부
const isPaymentWindow = computed(() => props.shopInfo?.usagePurpose === 'PAYMENT_WINDOW')

// 드롭다운 상태
const showDropdown = ref(false)

const onToggleQrPayment = (newVal: boolean) => {
  if (!newVal) {
    qrPaymentEnabled.value = true
    qrPaymentStore.openConfirmModal()
  } else {
    qrPaymentStore.enablePayment()
  }
  nextTick(() => { showDropdown.value = true })
}

// 부모 컴포넌트에서 접근할 수 있도록 노출
defineExpose({
  handleShopStatusChanged,
  fetchPaymentList
})
</script>

<template>
  <div class="payment-wrapper">
    <div ref="paymentContainer" class="payment-container">
      <Transition name="payment-toast">
        <div v-if="isPaymentWindow && showPaymentToast" class="payment-status-toast">
          {{ paymentToastMessage }}
        </div>
      </Transition>
      <div class="left-section">
        <div class="filter-tabs">
          <button class="filter-tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">전체</button>
          <button class="filter-tab" :class="{ active: activeTab === 'requested' }" @click="activeTab = 'requested'">요청</button>
          <button class="filter-tab" :class="{ active: activeTab === 'in_progress' }" @click="activeTab = 'in_progress'">진행중</button>
          <button class="filter-tab" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">완료</button>
          <button class="filter-tab" :class="{ active: activeTab === 'canceled' }" @click="activeTab = 'canceled'">결제 취소</button>
          <button class="filter-tab" :class="{ active: activeTab === 'failed' }" @click="activeTab = 'failed'">결제 실패</button>
        </div>

        <div class="content-wrapper">
          <Transition name="retry-toast">
            <div v-if="showRetryResultModal" class="retry-result-toast">
              {{ retryResultMessage }}
            </div>
          </Transition>
          <div class="payment-list" :class="{ 'payment-list--modal': props.isModal }">
            <div v-for="payment in filteredPaymentList" :key="payment.uuid" class="payment-card" :class="{ 'latest-requested': payment.uuid === latestRequestedUuid, 'canceled': payment.status === 'canceled' }">
              <div class="card-header">
                <div class="table-info">
                  <span class="table-label">결제번호</span>
                  <span class="table-number">{{ payment.paymentNumber || '' }}</span>
                </div>
                <div class="status-badge" :style="{ color: getStatusBadge(payment.status).color, backgroundColor: getStatusBadge(payment.status).bgColor, border: getStatusBadge(payment.status).border }">
                  {{ getStatusBadge(payment.status).label }}
                </div>
              </div>
              <div class="card-body">
                <div class="amount" :class="{ canceled: payment.status === 'canceled' }">{{ formatCurrency(payment.amount) }}</div>
                <div class="order-info">
                  <span class="time">{{ payment.status === 'canceled' ? '' : payment.time }}</span>
                  <button
                    v-if="payment.status === 'failed'"
                    class="detail-button retry"
                    @click="handleRetryPayment(payment.uuid)"
                  >
                    재시도
                  </button>
                  <button
                    v-else-if="payment.status === 'requested'"
                    class="detail-button"
                    :class="{ loading: cancelingPaymentId === payment.uuid }"
                    :disabled="cancelingPaymentId === payment.uuid"
                    @click="handleCancelPayment(payment.uuid)"
                  >
                    <span v-if="cancelingPaymentId === payment.uuid" class="spinner" />
                    <span v-else>취소</span>
                  </button>
                  <button
                    v-else-if="payment.status === 'completed'"
                    class="detail-button"
                    :class="{ loading: cancelingPaymentId === payment.uuid }"
                    :disabled="cancelingPaymentId === payment.uuid"
                    @click="handleCancelPayment(payment.uuid)"
                  >
                    <span v-if="cancelingPaymentId === payment.uuid" class="spinner" />
                    <span v-else>결제취소</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="calculator-panel" :class="{ 'calculator-panel--hidden': !sidebarMiniState }">
        <Transition name="qr-overlay-fade">
          <div v-if="!qrPaymentEnabled && !showQrConfirmModal" class="qr-closed-overlay">
            <img src="/lock.svg" alt="lock" class="qr-lock-icon" />
            <p class="qr-closed-title">현재 결제 마감 상태입니다</p>
            <p class="qr-closed-desc">다시 이용 하려면 좌측 상단<br />메뉴바에서 모드를 활성화 하세요</p>
          </div>
        </Transition>
        <div v-if="showLogoutConfirm" class="logout-confirm-overlay" @click.self="closeLogoutModal">
          <div class="logout-confirm-modal">
            <div class="logout-confirm-title">로그아웃</div>
            <div class="logout-confirm-message">정말 로그아웃 하시겠어요?</div>
            <div class="logout-confirm-buttons">
              <button class="logout-confirm-btn logout-confirm-btn-cancel" @click="closeLogoutModal">이전으로</button>
              <button class="logout-confirm-btn logout-confirm-btn-ok" @click="confirmLogout">로그아웃</button>
            </div>
          </div>
        </div>

        <div class="calculator-card">
          <div class="calculator-header">
            <div class="calculator-title-wrapper">
              <div class="calculator-title">결제 등록</div>
            </div>
            <div v-if="showTopBar" class="calculator-header-right">
              <div v-if="isPaymentWindow" class="header-dropdown-wrap">
                <button class="header-dropdown-btn" :class="{ 'is-active': showDropdown }" @click.stop="showDropdown = !showDropdown">
                  {{ (props.shopInfo?.shopName?.length ?? 0) > 5 ? props.shopInfo?.shopName?.slice(0, 5) + '...' : props.shopInfo?.shopName }}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10.4418 12.0577C10.1977 12.3018 9.80199 12.3018 9.55792 12.0577L6.90013 9.39995C6.5064 9.00622 6.78526 8.33301 7.34207 8.33301H12.6576C13.2145 8.33301 13.4933 9.00622 13.0996 9.39995L10.4418 12.0577Z" fill="#A6A6A5"/>
                  </svg>
                </button>
                <Transition name="dropdown-fade">
                  <div v-if="showDropdown" class="header-dropdown-menu" @click.stop>
                    <div class="dropdown-item toggle-item" @click.stop>
                      <span class="dropdown-label">결제 모드 활성화</span>
                      <CustomToggle :model-value="qrPaymentEnabled" @update:model-value="onToggleQrPayment" />
                    </div>
                    <div class="dropdown-divider" />
                    <button class="dropdown-item logout-item" @click="showDropdown = false; handleLogout()">
                      로그아웃
                    </button>
                  </div>
                </Transition>
              </div>
              <button class="minimize-button" @click="$emit('request-minimize')">
                <q-icon name="remove" size="18px" />
              </button>
            </div>
          </div>

          <div class="amount-display">
            <div class="amount-label">결제 금액 입력</div>
            <div class="amount-value-wrapper">
              <div class="amount-value" :class="{ 'has-value': calculatorValue !== '0' }">
                {{ formattedCalculatorValue }}<span class="won">원</span>
              </div>
              <Transition name="toast-fade">
                <div v-if="showAmountLimitToast" class="amount-limit-toast">1억원 이상 입력할 수 없습니다.</div>
              </Transition>
              <Transition name="toast-fade">
                <div v-if="showMinAmountToast" class="amount-limit-toast">100원 이상 입력해주세요.</div>
              </Transition>
            </div>
          </div>

          <div class="calculator-grid">
            <button
              v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0, '←']"
              :key="num"
              class="calc-button"
              :class="{ special: typeof num === 'string' && num !== '00' }"
              @click="handleCalculatorClick(String(num))"
            >
              {{ num }}
            </button>
          </div>

          <div class="calculator-actions">
            <button class="action-button reset" @click="handleCalculatorClick('reset')">초기화</button>
            <button class="action-button register" @click="handleRegister">등록하기</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 취소 모달 -->
  <div v-if="showCancelModal" class="custom-modal-overlay" @click.self="closeModals">
    <div class="custom-modal-card">
      <div class="custom-modal-content">
        <div class="custom-modal-title">{{ cancelModalIsPaymentCancel ? '결제 취소' : '결제 요청 취소' }}</div>
        <div class="custom-modal-subtitle">
          <template v-if="cancelModalIsPaymentCancel">
            결제가 취소됩니다.<br />취소 이후에는 복구가 불가능합니다.
          </template>
          <template v-else>
            요청을 취소하시겠어요?<br />취소 이후에는 복구가 불가합니다.
          </template>
        </div>
      </div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn secondary" @click="closeModals">이전으로</button>
        <button class="custom-modal-btn primary" @click="executeCancelPayment">취소하기</button>
      </div>
    </div>
  </div>

  <!-- 등록 모달 -->
  <div v-if="showRegisterModal" class="custom-modal-overlay" @click.self="closeModals">
    <div class="custom-modal-card">
      <div class="custom-modal-content">
        <div class="custom-modal-title">결제 건을 등록할까요?</div>
      </div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn secondary" @click="closeModals">이전으로</button>
        <button class="custom-modal-btn primary" @click="executeRegister">등록하기</button>
      </div>
    </div>
  </div>

  <div v-if="isPaymentWindow && showQrConfirmModal" class="custom-modal-overlay">
    <div class="custom-modal-card">
      <div class="custom-modal-content">
        <div class="custom-modal-title">결제 모드 변경 안내</div>
        <div class="custom-modal-subtitle">결제 모드를 종료하면 마감 처리 됩니다.</div>
      </div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn secondary" @click="qrPaymentStore.keepPayment()">계속 진행하기</button>
        <button class="custom-modal-btn primary" @click="qrPaymentStore.disablePayment()">돌아가기</button>
      </div>
    </div>
  </div>

  <!-- 재시도 확인 모달 -->
  <div v-if="showRetryModal" class="custom-modal-overlay" @click.self="closeRetryModal">
    <div class="custom-modal-card">
      <div class="custom-modal-content">
        <div class="custom-modal-title">결제 재요청</div>
        <div class="custom-modal-subtitle">결제를 재요청 할까요?</div>
      </div>
      <div class="custom-modal-actions">
        <button class="custom-modal-btn secondary" :disabled="isRetrying" @click="closeRetryModal">취소</button>
        <button class="custom-modal-btn primary" :class="{ loading: isRetrying }" :disabled="isRetrying" @click="executeRetryPayment">
          <span v-if="isRetrying" class="btn-spinner" />
          <span v-else>재요청 하기</span>
        </button>
      </div>
    </div>
  </div>

</template>

<style scoped lang="scss">
.payment-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.qr-closed-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(1px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: "Pretendard", sans-serif;
  padding-bottom: 30%;

  .qr-lock-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .qr-closed-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1c1917;
    letter-spacing: -0.45px;
  }

  .qr-closed-desc {
    margin: 0;
    font-size: 13px;
    color: #808080;
    text-align: center;
    line-height: 1.6;
    letter-spacing: -0.33px;
  }
}

.qr-overlay-fade-enter-active,
.qr-overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.qr-overlay-fade-enter-from,
.qr-overlay-fade-leave-to {
  opacity: 0;
}

.payment-container {
  display: flex;
  flex-direction: row;
  height: 100%;
  background-color: #f5f5f5;
  position: relative;
  font-family: "Pretendard";
  transition: filter 0.3s ease, opacity 0.3s ease;
  user-select: none;
  -webkit-user-select: none;

  &.is-modal {
    .filter-tab {
      padding: 8px 12px;
      font-size: 13px;
    }

    .content-wrapper {
      padding: 12px;
    }
  }
}

.left-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.filter-tabs {
  display: flex;
  gap: 7px;
  padding: 20px 20px 0;
  background-color: #F2F4F6;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-tab {
  padding: 8px 12px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #808080;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  letter-spacing: -0.35px;
  background: transparent;
  border-bottom: 2px solid transparent;

  @media (max-width: 800px) {
    padding: 6px 10px;
    font-size: 13px;
  }

  &:hover {
    border-bottom: 2px solid #ff8b4a;
  }

  &.active {
    font-weight: 700;
    color: #3b3b3b;
    background: transparent;
    border-bottom: 2px solid #ff8b4a;
  }
}

.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  background: #E5E5E5;
  position: relative;
}

.retry-result-toast {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(0, 0, 0, 0.70);
  color: #fff;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.33px;
  line-height: 1.5;
  pointer-events: none;
  text-align: center;
}

.retry-toast-enter-active,
.retry-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.retry-toast-enter-from,
.retry-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.payment-list {
  height: 100%;
  display: grid;
  gap: 16px;
  align-content: start;
  overflow-y: auto;
  padding-right: 10px;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));

  // 아이뮤즈 뮤패드 8인치 (800px 세로, 1280px 가로) — 카드 3열
  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  // 아이패드 미니 세로모드 / 아이뮤즈 세로모드 (800px 이하) — 카드 2열
  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  // 700px 이하 — 카드 1열
  @media (max-width: 700px) {
    grid-template-columns: repeat(1, 1fr);
    gap: 10px;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #bdbdbd;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
}

.payment-card {
  background: white;

  @media (max-width: 800px) {
    padding: 10px 10px 8px;

    .table-info { font-size: 13px; }
    .status-badge { font-size: 10px; padding: 3px 5px; }
    .card-body .amount { font-size: 14px; }
    .card-body .order-info .time { font-size: 11px; }
    .card-body .order-info .detail-button { font-size: 10px; padding: 3px 6px; }
  }

  &.canceled {
    background: #F2F4F6;
  }
  border-radius: 12px;
  padding: 12px 12px 10px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, border 0.2s;
  height: fit-content;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  &.latest-requested {
    border: 2px solid #FF8B4A;
    box-shadow: 0 4px 12px rgba(255, 139, 74, 0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #E5E5E5;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: -0.35px;
  font-size: 15px;

  .table-label {
    color: #808080;
    font-weight: 500;
  }

  .table-number {
    font-weight: 700;
    color: #3B3B3B;
  }
}

.status-badge {
  padding: 4px 6px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
}

.card-body {
  .payment-title {
    font-size: 14px;
    font-weight: 600;
    color: #3B3B3B;
    margin-bottom: 6px;
    letter-spacing: -0.35px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .amount {
    font-size: 16px;
    font-weight: 700;
    color: #0D0A09;
    margin-bottom: 8px;
    letter-spacing: -0.4px;
    &.canceled {
      text-decoration: line-through;
      color: #5d5d5c;
    }
  }

  .order-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 32px;

    .time {
      font-size: 13px;
      color: #808080;
      letter-spacing: -0.3px;
    }

    .detail-button {
      padding: 4px 8px;
      border: 2px solid #E5E5E5;
      background: #F5F5F4;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      color: #808080;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
        border-color: #bdbdbd;
      }
      &.loading {
        cursor: not-allowed;
        opacity: 0.7;
      }
      &:disabled {
        cursor: not-allowed;
      }

      .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #E5E5E5;
        border-top-color: #808080;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  }
}

.calculator-panel {
  width: 300px;
  background: #ffffff;
  height: 100%;
  overflow-y: auto;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.3s ease, padding 0.3s ease, opacity 0.3s ease;

  // 아이뮤즈 가로모드 (1280px)
  @media (max-width: 1280px) {
    width: 270px;
    padding: 16px 18px;
  }

  // 아이패드 미니 세로 / 아이뮤즈 세로 (800px)
  @media (max-width: 800px) {
    width: 240px;
    padding: 14px 14px;
  }

  &--hidden {
    width: 0;
    padding: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
  }
}

.logout-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  border-radius: inherit;
}

.logout-confirm-modal {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  width: 245px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.logout-confirm-title {
  font-size: 18px;
  font-weight: 700;
  color: #1c1917;
  margin-bottom: 10px;
}

.logout-confirm-message {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.4;
}

.logout-confirm-buttons {
  display: flex;
  gap: 10px;
}

.logout-confirm-btn {
  flex: 1;
  height: 42px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.logout-confirm-btn-cancel {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  color: #5d5d5c;

  &:hover {
    background: #f5f5f5;
  }
}

.logout-confirm-btn-ok {
  background: #ff8b4a;
  color: #fff;

  &:hover {
    background: #f07a35;
  }
  &:active {
    transform: scale(0.96);
  }
}

.calculator-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calculator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 300;
}

.calculator-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.calculator-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #3b3b3b;
  letter-spacing: -0.4px;
}

.sse-status {
  display: flex;
  align-items: center;
  gap: 6px;

  .sse-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }

  .sse-text {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: -0.275px;
    transition: color 0.3s ease;
  }

  &.connected {
    .sse-indicator {
      background-color: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
    }
    .sse-text {
      color: #22c55e;
    }
  }

  &.connecting {
    .sse-indicator {
      background-color: #f59e0b;
      animation: pulse 1.5s infinite;
    }
    .sse-text {
      color: #f59e0b;
    }
  }

  &.disconnected {
    .sse-indicator {
      background-color: #ef4444;
    }
    .sse-text {
      color: #ef4444;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.calculator-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-shop-name {
  padding: 4px;
  display: flex;
  align-items: center;
  font-size: 9px;
  font-weight: 500;
  color: #808080;
  border-radius: 6px;
  background: #F5F5F4;
  letter-spacing: -0.225px;

  .header-icon {
    color: #A6A6A5;
  }
}

.header-dropdown-wrap {
  position: relative;
  z-index: 300;
}

.header-dropdown-btn {
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 2px 0 10px;
  background: #FFFFFF;
  border: 1.5px solid #E5E5E5;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #A6A6A5;
  cursor: pointer;
  letter-spacing: -0.28px;
  white-space: nowrap;

  &:hover { background: #EBEBEA; }
  &:active { transform: scale(0.97); }
  &.is-active {
    background: #F2F4F6;
    color: #808080;
  }
}

.header-dropdown-menu {
  z-index: 9999;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 181px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  z-index: 500;
  font-family: "Pretendard";
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 14px;
  min-height: 44px;
  font-size: 13px;
  font-weight: 500;
  color: #1C1917;
  letter-spacing: -0.33px;
  background: none;
  border: none;
  cursor: default;

  &.toggle-item {
    justify-content: space-between;
  }

  &.logout-item {
    color: #808080;
    cursor: pointer;
    justify-content: flex-start;
    background: #F5F5F4;
  }
}

.dropdown-label {
  font-size: 13px;
  font-weight: 500;
  color: #1C1917;
  letter-spacing: -0.33px;
}

.dropdown-divider {
  height: 1px;
  background: #F2F4F6;
  margin: 0;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.minimize-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #fff;
  border: 1.5px solid #c8c8c8;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s;

  :deep(.q-icon) {
    color: #5d5d5c;
  }

  &:hover {
    background: #f5f5f5;
  }

  &:active {
    transform: scale(0.93);
  }
}

.amount-display {
  margin: 26px 0 20px 0;
  border-bottom: 2px solid #e5e5e5;

  .amount-label {
    font-size: 14px;
    font-weight: 500;
    color: #5d5d5c;
    margin-bottom: 8px;
  }

  .amount-value-wrapper {
    position: relative;
  }

  .amount-value {
    font-family: "SUIT Variable";
    font-size: 32px;
    font-weight: 400;
    line-height: 40px;
    color: #d4d4d3;
    text-align: right;
    letter-spacing: 0.96px;

    &.has-value {
      color: #1c1917;
      font-weight: 600;
    }

    .won {
      font-size: 14px;
      font-weight: 500;
      margin-left: 4px;
      color: #5d5d5c;
    }
  }

  .amount-limit-toast {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-36%, -50%);
    background: rgba(59, 59, 59, 0.80);
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    z-index: 10;
    letter-spacing: -0.35px;
    box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.24);
  }
}

.calculator-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 16px;
}

.calc-button {
  aspect-ratio: 1.3;
  border: none;
  background: #ffffff;
  font-size: 20px;
  font-weight: 700;
  color: #1c1917;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;

  &.special {
    color: #808080;
  }

  &:hover {
    background: #E5E5E5;
  }

  &:active {
    transform: scale(0.95);
  }
}

.calculator-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: -0.35px;

  &.reset {
    flex: 0.25;
    color: #5D5D5C;
    background: #FFFFFF;
    border: 1px solid #babab9;

    &:hover {
      background: #E5E5E5;
    }
  }

  &.register {
    flex: 0.75;
    background: #3B3B3B;
    color: #FFFFFF;

    &:hover {
      background: #5D5D5C;
    }
  }

  &:active {
    transform: scale(1.01);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}

.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(1px);
}

.custom-modal-card {
  min-width: 270px;
  max-width: 400px;
  border-radius: 8px;
  padding: 18px 16px;
  background-color: #FFF;
  font-family: "Pretendard";
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.custom-modal-content {
  margin-bottom: 16px;
}

.custom-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1917;
  margin-bottom: 8px;
  text-align: center;
  letter-spacing: -0.4px;
}

.custom-modal-subtitle {
  font-size: 13px;
  color: #5D5D5C;
  text-align: center;
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: -0.3px;
}

.custom-modal-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.custom-modal-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  letter-spacing: -0.35px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.secondary {
    color: #5D5D5C;
    background-color: #F5F5F4;
    &:hover { background-color: #E5E5E5; }
  }

  &.primary {
    background-color: #FF8B4A;
    color: #FFF;
    &:hover { background-color: #FF6D17; }
  }

  &.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:disabled {
    cursor: not-allowed;
  }
  &:active {
    transform: scale(0.98);
  }

  .btn-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}

.payment-status-toast {
  position: absolute;
  bottom: 20px;
  left: 28%;
  transform: translateX(-50%);
  z-index: 400;
  background: rgba(59, 59, 59, 0.88);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: -0.35px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.payment-toast-enter-active,
.payment-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.payment-toast-enter-from,
.payment-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
