<script setup lang="ts">
import isElectron from 'is-electron'
import ShopTableContent from '~/components/ShopTableContent.vue'
import ShopOrderContent from '~/components/ShopOrderContent.vue'
import { dayList } from '~/utils/code'
import type { HoSalesVo } from '~/types'
import { useOrderListStore } from '~/store/orderListStore'
import { useShopInfoStore } from '~/store/shopInfoStore'
import ShopStatusButtons from '~/components/ShopStatusButtons.vue'

const route = useRoute()

const currentTab = ref('table')

// usagePurpose에 따라 탭 구성
const tabs = computed(() => {
  const usagePurpose = shopInfo.value?.usagePurpose

  if (usagePurpose === 'TABLE_ORDER') {
    // TABLE_ORDER: table, order 탭만 표시
    return [
      { key: 'table', label: 'ORDER.025', component: ShopTableContent },
      { key: 'order', label: 'SIDE_MENU.019', component: ShopOrderContent }
    ]
  } else if (usagePurpose === 'ALL') {
    return [
      { key: 'table', label: 'ORDER.025', component: ShopTableContent },
      { key: 'order', label: 'SIDE_MENU.019', component: ShopOrderContent },
      {
        key: 'payment',
        label: 'SIDE_MENU.032',
        component: resolveComponent('PaymentManagement')
      }
    ]
  } else if (usagePurpose === 'PAYMENT_WINDOW') {
    return []
  }

  // 기본값
  return [
    { key: 'table', label: 'ORDER.025', component: ShopTableContent },
    { key: 'order', label: 'SIDE_MENU.019', component: ShopOrderContent }
  ]
})

const dayjs = useDayjs()
const nowDate = dayjs().format('YYYY-MM-DD')
const nowDay = dayjs().day()

const { fetchOrderList } = useOrderListStore()
const { fetchShopInfo } = useShopInfoStore()

fetchOrderList(route.params.shopCode as string)
fetchShopInfo(route.params.shopCode as string)

const { orderList } = storeToRefs(useOrderListStore())
const { shopInfo } = storeToRefs(useShopInfoStore())

const getPendingCount = () => {
  if (!shopInfo.value?.acceptOrderButtonActive) { return 0 }
  const pendingList = orderList.value?.filter((hoSalesVo : HoSalesVo) => {
    return hoSalesVo.printLogGroup.orderStatus.status === 'PENDING'
  }) ?? []

  const confirmList = orderList.value?.filter((hoSalesVo:HoSalesVo) => {
    return hoSalesVo.printLogGroup.orderStatus.status === 'CONFIRM'
  }) ?? []

  return pendingList.length + confirmList.length
}

const contentElement = ref<HTMLElement | undefined>(undefined)

const parentHeight = ref(0)
const childHeight = ref(0)

// const scrollDown = () => {
//   if (!contentElement.value || parentHeight.value >= childHeight.value) {
//     return
//   }
//   contentElement.value.scrollTop += 50
// }

// const scrollUp = () => {
//   if (!contentElement.value || parentHeight.value >= childHeight.value) {
//     return
//   }
//   contentElement.value.scrollTop -= 50
// }

const elementHeight = (element:any) => {
  return element.offsetHeight
}

const arrowShow = ref(false)

const handleChildHeightUpdate = (newHeight: number) => {
  childHeight.value = newHeight
  parentHeight.value = elementHeight(contentElement.value)

  parentHeight.value < childHeight.value ? arrowShow.value = true : arrowShow.value = false
}

// 플로팅 버튼 및 모달 관련
const showPaymentModal = ref(false)

const togglePaymentModal = () => {
  showPaymentModal.value = !showPaymentModal.value
}

const changeTab = (tab: string) => {
  if (showPaymentModal.value) {
    showPaymentModal.value = false
  }
  currentTab.value = tab
}

const isInitialized = ref(false)
const initRetryCount = ref(0)
const MAX_RETRY = 3

// shopInfo 변경 감지하여 Electron API 호출
watchEffect(async () => {
  if (isElectron() && shopInfo.value?.usagePurpose && (window as any).electronAPI?.checkSize) {
    await (window as any).electronAPI.checkSize(shopInfo.value.usagePurpose)
  }
})

// 초기화 로직을 별도 함수로 분리
const initializeShopData = async () => {
  if (isInitialized.value) {
    return // 이미 초기화되었으면 중복 실행 방지
  }

  if (process.client) {
    // shopInfo가 없으면 재시도
    while (!shopInfo.value && initRetryCount.value < MAX_RETRY) {
      try {
        await fetchShopInfo(route.params.shopCode as string)
        await fetchOrderList(route.params.shopCode as string)
        if (shopInfo.value) {
          break
        }
      } catch (error) {
        console.error('Failed to fetch shop info:', error)
      }
      initRetryCount.value++
      if (initRetryCount.value < MAX_RETRY) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 0.5초 대기 후 재시도
      }
    }

    // 재시도 후에도 실패하면 에러 처리
    if (!shopInfo.value && initRetryCount.value >= MAX_RETRY) {
      console.error('Failed to load shop info after retries')
    }

    isInitialized.value = true
  }
}

// 일렉트론에서 페이지 로드 감지
const handleElectronPageLoad = async () => {
  if (isElectron() && process.client) {
    // 페이지가 로드되었을 때 초기화
    isInitialized.value = false // 일렉트론에서 재로드되면 다시 초기화
    initRetryCount.value = 0
    await nextTick()
    await initializeShopData()
  }
}

// 클라이언트에서 데이터가 없을 때 다시 가져오기
onMounted(async () => {
  await initializeShopData()

  if (process.client) {
    // 일렉트론 환경에서 페이지 재로드 감지
    if (isElectron()) {
      // visibilitychange: 일렉트론이 페이지를 다시 로드할 때 발생
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          await handleElectronPageLoad()
        }
      })

      // focus: 윈도우가 포커스를 받을 때
      window.addEventListener('focus', async () => {
        await handleElectronPageLoad()
      })

      // pageshow: 일렉트론 loadURL 후 페이지가 표시될 때
      window.addEventListener('pageshow', handleElectronPageLoad)

      // DOMContentLoaded: 일렉트론에서 loadURL 후 발생
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleElectronPageLoad)
      }

      // 추가: 일렉트론 전용 커스텀 이벤트 리스너
      window.addEventListener('electron-page-loaded', handleElectronPageLoad)
    }
  }
})

onUnmounted(() => {
  if (process.client && isElectron()) {
    document.removeEventListener('visibilitychange', handleElectronPageLoad)
    window.removeEventListener('focus', handleElectronPageLoad)
    window.removeEventListener('pageshow', handleElectronPageLoad)
    document.removeEventListener('DOMContentLoaded', handleElectronPageLoad)
    window.removeEventListener('electron-page-loaded', handleElectronPageLoad)
  }
})

</script>

<template>
  <ClientOnly>
    <!-- 로딩 중 표시 -->
    <div v-if="!shopInfo && process.client" style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <q-spinner color="primary" size="3em" />
        <p style="margin-top: 16px;">
          매장 정보를 불러오는 중...
        </p>
        <p v-if="initRetryCount > 0" style="font-size: 0.9em; color: #666;">
          재시도 중... ({{ initRetryCount }}/{{ MAX_RETRY }})
        </p>
      </div>
    </div>

    <PaymentModalWrapper
      v-else-if="shopInfo?.usagePurpose && shopInfo.usagePurpose === 'PAYMENT_WINDOW'"
      :shop-info="shopInfo"
      fullscreen
    />

    <div v-else-if="shopInfo" class="main-container">
      <div class="header">
        <div v-if="shopInfo?.usagePurpose && shopInfo.usagePurpose !== 'PAYMENT_WINDOW'" class="first-box">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-button', { 'active-tab': currentTab === tab.key }]"
            @click="changeTab(tab.key)"
          >
            {{ $t(tab.label) }}
          </button>
        </div>
        <div class="second_box">
          <!-- 결제 활성화/결제 마감 버튼 -->
          <!-- <ShopStatusButtons v-if="shopInfo?.usagePurpose && shopInfo.usagePurpose !== 'TABLE_ORDER'" :shop-code="String(route.params.shopCode)" /> -->

          <p class="title">
            {{ $t('ORDER.026') }}
            <span>{{ $t('COMMON.086', { count: getPendingCount() }) }}</span>
          </p>
          <p>
            {{ $t('ORDER.027') }} :
            <span>{{ nowDate }} {{ $t(dayList[nowDay] || 'COMMON.105') }}</span>
          </p>
        </div>
      </div>
      <div
        ref="contentElement"
        class="content full-height desktop"
        :class="{ payment: currentTab === 'payment' }"
      >
        <template v-if="currentTab === 'table' && shopInfo?.usagePurpose && shopInfo.usagePurpose !== 'PAYMENT_WINDOW'">
          <ShopTableContent
            :element-height="elementHeight"
            :shop-info="shopInfo"
            @update:child-height="handleChildHeightUpdate"
          />
        </template>
        <template v-if="currentTab === 'order' && shopInfo?.usagePurpose && shopInfo.usagePurpose !== 'PAYMENT_WINDOW'">
          <ShopOrderContent
            :element-height="elementHeight"
            :shop-info="shopInfo"
            @update:child-height="handleChildHeightUpdate"
          />
        </template>
        <template v-if="currentTab === 'payment' && shopInfo?.usagePurpose && shopInfo.usagePurpose !== 'PAYMENT_WINDOW'">
          <PaymentManagement
            :element-height="elementHeight"
            :shop-info="shopInfo"
            @update:child-height="handleChildHeightUpdate"
          />
        </template>
        <!-- <div v-if="arrowShow" class="arrow_wrap">
          <q-icon name="keyboard_arrow_up" @click="scrollUp" />
          <q-icon name="keyboard_arrow_down" @click="scrollDown" />
        </div> -->

        <button
          v-if="shopInfo?.usagePurpose === 'ALL' && (currentTab === 'table' || currentTab === 'order')"
          class="floating-button"
          @click="togglePaymentModal"
        >
          <img
            src="/public/payIcon.svg"
            alt="handorder"
            class="logo-image"
          >
          <span class="button-text">결제등록</span>
        </button>

        <div v-if="showPaymentModal" class="modal-overlay" @click="togglePaymentModal" />

        <PaymentModalWrapper
          v-if="showPaymentModal"
          :shop-info="shopInfo"
          @close="togglePaymentModal"
        />
      </div>
      <div />
    </div>
  </ClientOnly>
</template>

<style scoped lang="scss">
:root {
  --handorder-color: #ff8b4a;
}

.main-container {
  background-color: #e2e2e2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;

  .header {
    min-height: 60px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    font-family: "Pretendard";
    background: #D4D4D3;
    // border-bottom: 2px solid #E5E5E5;

    .first-box {
      display: flex;
      align-items: center;

      .tab-button {
        padding: 10px 30px;
        min-width: 130px;
        border: none;
        cursor: pointer;
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.35px;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        background-color: #BABAB9;

        &.active-tab {
          color: #3B3B3B;
          background-color: #FFFFFF;
          border: 1px solid #BABAB9;
          border-bottom: none;
        }

        &:first-child {
          margin: 5px 10px 0px 30px;
        }

        &:nth-child(2) {
          margin: 5px 10px 0px 0px;
        }

        &:last-child {
          margin: 5px 30px 0px 0px;
        }
      }
    }

    > .second_box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-right: 20px;
      position: absolute;
      top: 20px;
      min-height: 27px;
      right: 0;

      .shop-status-buttons {
        margin-right: 10px;
      }

      .title {
        color: #808080;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: -0.3px;
      }

      > p {
        margin:0;
        padding: 0px 10px;
        font-weight: bold;

        span{
          margin-left: 4px;
        }
      }

      > p:last-child {
        border-left: 2px solid #A6A6A5;
      }

      > p:nth-child(1) {
        span {
          font-weight: 700 !important;
          font-size: 14px !important;
          color:var(--handorder-color);
        }
      }
    }
  }
  .content {
    background-color: #F5F5F4;
    overflow: auto;
    padding: 10px;

    &.payment {
      padding: 0;
    }

    .arrow_wrap {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 5%;
      height: 85%;
      font-size: 2.5rem;
      position: fixed;
      top: 110px;
      right: 0;
      z-index: 1;
      margin-right: 15px;

      :hover {
        color: #fff;
        background-color: rgba(0,0,0,0.5);
        border-radius: 50%;
      }

      > .q-icon {
        cursor: pointer;
      }
    }
  }
}

.floating-button {
  position: fixed;
  z-index: 100;
  bottom: 80px;
  right: 60px;
  width: 60px;
  height: 60px;
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 16px;
  padding: 8px;
  background-color: #FF7727;
  border: 2px solid #FFA16D;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-family: "Pretendard";

  .logo-image {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .button-text {
    color: #FFFFFF;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.25px;
    line-height: 1;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 98;
  backdrop-filter: blur(2px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
