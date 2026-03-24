<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { ShopInfoVo } from '~/types'

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

interface Props {
  shopInfo: ShopInfoVo | null
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullscreen: false
})

const emit = defineEmits(['close'])

const windowWidth = ref<number>(0)

// 매장 개점 상태 조회 (초기값)
const { data: shopOpenStatus, refresh: refreshShopOpenStatus } = await useCustomFetch<boolean>('/admin/handOrder/shop/payments/activation/status', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  key: 'payment-modal-shop-open-status'
})

// 전역 상태 사용 (ShopStatusButtons와 동일한 상태 공유)
const route = useRoute()
const shopCode = computed(() => route.params.shopCode as string)
const globalShopOpenState = useState(`shop-open-${shopCode.value}`, () => shopOpenStatus.value ?? true)

const isShopOpen = computed(() => globalShopOpenState.value)

// shopOpenStatus 변경 감지 (초기 조회값을 전역 상태에 반영)
watch(
  shopOpenStatus,
  (newVal) => {
    if (typeof newVal === 'boolean') {
      globalShopOpenState.value = newVal
    }
  },
  { immediate: true }
)

// PaymentManagement 컴포넌트 참조
const paymentManagementRef = ref<any>(null)

// 매장 상태 변경 후 재조회
const handleShopStatusChanged = async () => {
  await refreshShopOpenStatus()

  // PaymentManagement의 fetchPaymentList만 직접 호출 (무한 루프 방지)
  if (paymentManagementRef.value && typeof paymentManagementRef.value.fetchPaymentList === 'function') {
    await paymentManagementRef.value.fetchPaymentList()
  }
}

const updateWindowWidth = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
  }
}

onMounted(async () => {
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth)

  // 최신 매장 상태 조회
  if (process.client) {
    await refreshShopOpenStatus()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const elementHeight = (element: any) => {
  return element?.offsetHeight || 0
}

const handleClose = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.minApp('min-app')
  }
  emit('close')
}
</script>

<template>
  <div class="payment-wrapper">
    <!-- 기존 결제 화면 -->
    <div :class="props.fullscreen ? 'payment-fullscreen' : 'payment-modal'">
      <ClientOnly>
        <PaymentManagement
          v-if="shopInfo"
          ref="paymentManagementRef"
          :element-height="elementHeight"
          :shop-info="shopInfo"
          :show-top-bar="windowWidth < 900"
          :is-shop-open="isShopOpen"
          :is-modal="!props.fullscreen"
          @request-minimize="handleClose"
        />
        <div v-else class="loading-modal">
          <div class="loading-content">
            <div class="loading-spinner" />
            <p>상점 정보를 불러오는 중...</p>
          </div>
        </div>
        <template v-slot:fallback>
          <div class="loading-modal">
            <div class="loading-content">
              <div class="loading-spinner" />
              <p>결제 관리 화면을 불러오는 중...</p>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped lang="scss">
.payment-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.payment-modal {
  position: fixed;
  bottom: 80px;
  right: 127px;
  width: 760px;
  height: 520px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 99;
  overflow: hidden;
}

.payment-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: #ffffff;
  overflow: hidden;

  & > .shop-closed-overlay {
    position: absolute;
  }
}

.loading-modal {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 16px;
}

.loading-content {
  text-align: center;
  color: #666;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e0e0e0;
    border-top: 3px solid #ff8b4a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
