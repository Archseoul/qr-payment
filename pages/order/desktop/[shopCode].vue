<script setup lang="ts">
import { useOrderListStore } from '~/store/orderListStore'
import { useShopInfoStore } from '~/store/shopInfoStore'

const route = useRoute()

const { fetchOrderList } = useOrderListStore()
const { fetchShopInfo } = useShopInfoStore()

fetchOrderList(route.params.shopCode as string)
fetchShopInfo(route.params.shopCode as string)

const { shopInfo } = storeToRefs(useShopInfoStore())

const contentElement = ref<HTMLElement | undefined>(undefined)
const parentHeight = ref(0)
const childHeight = ref(0)

const elementHeight = (element: any) => {
  return element.offsetHeight
}

const handleChildHeightUpdate = (newHeight: number) => {
  childHeight.value = newHeight
  if (contentElement.value) {
    parentHeight.value = elementHeight(contentElement.value)
  }
}

const isInitialized = ref(false)
const initRetryCount = ref(0)
const MAX_RETRY = 3

const initializeShopData = async () => {
  if (isInitialized.value) { return }

  if (process.client) {
    while (!shopInfo.value && initRetryCount.value < MAX_RETRY) {
      try {
        await fetchShopInfo(route.params.shopCode as string)
        await fetchOrderList(route.params.shopCode as string)
        if (shopInfo.value) { break }
      } catch (error) {
        console.error('Failed to fetch shop info:', error)
      }
      initRetryCount.value++
      if (initRetryCount.value < MAX_RETRY) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (!shopInfo.value && initRetryCount.value >= MAX_RETRY) {
      console.error('Failed to load shop info after retries')
    }

    isInitialized.value = true
  }
}

onMounted(async () => {
  await initializeShopData()
})
</script>

<template>
  <ClientOnly>
    <!-- 로딩 -->
    <div v-if="!shopInfo && process.client" class="loading-wrap">
      <q-spinner color="primary" size="3em" />
      <p>매장 정보를 불러오는 중...</p>
      <p v-if="initRetryCount > 0" class="retry-text">
        재시도 중... ({{ initRetryCount }}/{{ MAX_RETRY }})
      </p>
    </div>

    <!-- QR 결제 -->
    <div v-else-if="shopInfo" ref="contentElement" class="qr-payment-content">
      <PaymentManagement
        :element-height="elementHeight"
        :shop-info="shopInfo"
        @update:child-height="handleChildHeightUpdate"
      />
    </div>
  </ClientOnly>
</template>

<style scoped lang="scss">
.loading-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;

  p { margin-top: 16px; }
  .retry-text { font-size: 0.9em; color: #666; }
}

.qr-payment-content {
  width: 100%;
  height: 100vh;
  overflow: auto;
  background-color: #F5F5F4;
}
</style>
