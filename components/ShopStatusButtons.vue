<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PrinterVo } from '~/types'

interface Props {
  shopCode?: string
}

const props = defineProps<Props>()

// 이벤트 emit 정의
const emit = defineEmits<{
  'update:status': []
}>()

const route = useRoute()
const shopCode = computed(() => props.shopCode || route.params.shopCode as string)

// 프린터 정보 조회
const shopPrinterData = await useCustomFetch<PrinterVo[]>(`/admin/handOrder/shop/${shopCode.value}/printer`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const shopPrinter = ref<PrinterVo[] | null>((shopPrinterData as any).data?.value ?? null)

// 결제 활성화/마감 상태 조회 (초기값)
const shopOpenStatusData = await useCustomFetch<boolean>('/admin/handOrder/shop/payments/activation/status', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  key: `shop-open-status-${shopCode.value}`
})

const shopOpenStatus = (shopOpenStatusData as any).data?.value ?? false

// 전역 상태로 관리하여 여러 컴포넌트 간 동기화
const globalShopOpenState = useState(`shop-open-${shopCode.value}`, () => shopOpenStatus ?? false)

// 로컬 상태는 전역 상태와 동기화
const isShopOpen = computed({
  get: () => globalShopOpenState.value,
  set: (value) => { globalShopOpenState.value = value }
})

// 최신 상태 조회 함수
const getLatestShopStatus = async (): Promise<boolean> => {
  try {
    const result = await customFetch<boolean>('/admin/handOrder/shop/payments/activation/status', {
      method: 'GET'
    })
    // 전역 상태 업데이트
    globalShopOpenState.value = result as boolean
    return result as boolean
  } catch (error) {
    console.error('상태 조회 실패:', error)
    // 에러 시 현재 상태 유지
    return isShopOpen.value
  }
}

const isProcessing = ref(false)

// 결제 활성화 처리
const handleShopOpen = async () => {
  if (isProcessing.value) { return }

  isProcessing.value = true
  try {
    // 버튼 클릭 전 최신 상태 확인 (토큰 갱신 포함)
    const currentStatus = await getLatestShopStatus()
    isShopOpen.value = currentStatus

    // 이미 활성화된 상태라면 중복 요청 방지
    if (currentStatus === true) {
      return
    }

    await customFetch('/admin/handOrder/shop/payments/availability', {
      method: 'POST'
    })

    // 성공 시 전역 상태 업데이트
    globalShopOpenState.value = true

    // 부모 컴포넌트에 상태 변경 알림
    emit('update:status')
  } catch (error: any) {
    console.error('결제 활성화 실패:', error)
    // 에러 메시지 표시
    if (error?.data?.message) {
      alert(error.data.message)
    }
  } finally {
    isProcessing.value = false
  }
}

// 결제 마감 처리
const handleShopClose = async () => {
  if (isProcessing.value) { return }

  isProcessing.value = true
  try {
    // 버튼 클릭 전 최신 상태 확인 (토큰 갱신 포함)
    const currentStatus = await getLatestShopStatus()
    isShopOpen.value = currentStatus

    // 이미 마감된 상태라면 중복 요청 방지
    if (currentStatus === false) {
      return
    }

    await customFetch('/admin/handOrder/shop/payments/unavailability', {
      method: 'POST'
    })

    // 성공 시 전역 상태 업데이트
    globalShopOpenState.value = false

    // 부모 컴포넌트에 상태 변경 알림
    emit('update:status')

    // 마감 후 결제 요약 정보 출력
    try {
      const summary = await customFetch(
        `/handOrder/shop/${shopCode.value}/owner/payments/summary`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      const orderReceiptPrinterList = shopPrinter.value?.filter((printer: PrinterVo) => printer.orderReceipt === true) || []
      // 프린터 정보를 summary에 추가하여 전달
      const data = {
        ...(typeof summary === 'object' && summary !== null ? summary : {}),
        printerList: orderReceiptPrinterList
      }
      if (window.electronAPI && typeof (window.electronAPI as any).printPaymentSummary === 'function') {
        (window.electronAPI as any).printPaymentSummary(JSON.stringify(data))
      }
    } catch (error) {
      console.error('결제 요약 출력 실패:', error)
    }
  } catch (error: any) {
    console.error('결제 마감 실패:', error)

    // 409 에러 또는 기타 에러 시 message 출력
    if (error?.data?.message) {
      alert(error.data.message)
    }
  } finally {
    isProcessing.value = false
  }
}

onMounted(async () => {
  // 클라이언트에서 최신 상태 조회
  if (process.client) {
    await getLatestShopStatus()
  }
})
</script>

<template>
  <div class="shop-status-buttons">
    <button
      v-if="isShopOpen === false"
      class="status-button open-button"
      :disabled="isProcessing"
      @click="handleShopOpen"
    >
      <span v-if="isProcessing" class="loading-spinner" />
      <span v-else>결제 활성화</span>
    </button>
    <button
      v-if="isShopOpen === true"
      class="status-button close-button"
      :disabled="isProcessing"
      @click="handleShopClose"
    >
      <span v-if="isProcessing" class="loading-spinner" />
      <span v-else>결제 마감</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.shop-status-buttons {
  display: flex;
  gap: 8px;

  .status-button {
    min-width: 50px;
    padding: 4px 6px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: -0.3px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: "Pretendard";
    white-space: nowrap;
    background: #FF8B4A;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;

    &.close-button {
      background-color: #3B3B3B;
      color: #FFF;

      &:hover:not(:disabled) {
        color: #FFF;
        background-color: #FF8B4A;
      }
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      color: #FFF;
      background-color: #3B3B3B;
    }

    &:active:not(:disabled) {
      color: #FFF;
      background-color: #3B3B3B;
    }
  }

  .loading-spinner {
    display: inline-block;
    width: 17px;
    height: 17px;
    border: 2px solid #3B3B3B;
    border-top-color: #FFFFFF;
    border-radius: 100%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
