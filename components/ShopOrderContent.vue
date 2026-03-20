<script setup lang="ts">
import type { Ref } from 'vue'
import { useQuasar } from 'quasar'
import isElectron from 'is-electron'
import type { HoDesktopOrderVo, HoSalesVo, PrinterVo, ShopInfoVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'
import { updateMenuNames } from '~/composables/updateMenuNames'
import { priceToCurrency } from '~/composables/priceToCurrency'
import { orderCancel } from '~/composables/order/useOrderCancel'
import { useOrderListStore } from '~/store/orderListStore'
import { usePgOrderSSE } from '~/composables/usePgOrderSSE'
import OrderPopup from '~/components/OrderPopup.vue'

const route = useRoute()

const inView = ref(Array.apply(null, Array(50)).map(_ => false))
const { fetchOrderList } = useOrderListStore()
const { setOrder } = useOrderListStore()

const onIntersection = (entry:any) => {
  const index = parseInt(entry.target.dataset.id, 10)
  setTimeout(() => {
    inView.value.splice(index, 1, entry.isIntersecting)
  }, 50)
}

const orderData = await useCustomFetch<HoSalesVo[]>(`/admin/handOrder/order/v2/${route.params.shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const orderList = orderData.data

const dayjs = useDayjs()

const detailOrderPopup = ref(false)

/* const orderObj:Ref<HoSalesVo|null> = ref(null) */

const orderPopup = ref(false)

const detailOrder = (order:HoSalesVo, orderNumber:number) => {
  order.printLogGroup.orderNumber = orderNumber
  setOrder(order.printLogGroup)
  orderPopup.value = true
}

/* const closeDetailOrderPopup = () => {
  detailOrderPopup.value = false
} */

const closeDetailPopup = () => {
  orderPopup.value = false
}

const shopInfoData = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + route.params.shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const shopPrintData = await useCustomFetch<PrinterVo[]>('/admin/handOrder/shop/' + route.params.shopCode + '/printer', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const shopInfo:Ref<ShopInfoVo | null> = shopInfoData.data
const shopPrint:Ref<PrinterVo[] | null> = shopPrintData.data

const getTotalPrice = (orderList:any) => {
  let totalPrice = 0
  orderList.forEach((order:any) => {
    totalPrice += order.finalPrice
  })

  return priceToCurrency(totalPrice, shopInfo.value?.shopLanguage as string)
}

updateMenuNames(orderList.value as HoSalesVo[], shopInfo.value?.shopLanguage as string)

const $q = useQuasar()

const orderCancelClick = async (order:HoSalesVo) => {
  await orderCancel(order, $q, orderData.refresh)
}

const orderConfirm = (order:HoSalesVo) => {
  $q.dialog({
    title: $t('ORDER.020'),
    message: $t('ORDER.001'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/order/pg/${order.printLogGroup.orderStatus.orderNo}/CONFIRM`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })
    order.printLogGroup.orderStatus = { ...order.printLogGroup.orderStatus, status: 'CONFIRM' }

    if (shopInfo.value?.usePrinter) {
      const orderReceiptPrinterList = shopPrint.value?.filter((printer: PrinterVo) => printer.orderReceipt === true)
      if (orderReceiptPrinterList?.length === 0) {
        return
      }
      const printData = {
        ...order.printLogGroup,
        pgPaymentResult: order.pgPaymentResult,
        printerList: orderReceiptPrinterList
      }

      window.electronAPI.printOrder(JSON.stringify(printData))
    }

    await customFetch(`/admin/handOrder/shop/table/${order.printLogGroup.tableSeq}/${order.printLogGroup.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await orderData.refresh()
  })
}

const orderAcceptNoPrint = (order:HoSalesVo) => {
  $q.dialog({
    title: $t('ORDER.020'),
    message: $t('ORDER.001'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/order/pg/${order.printLogGroup.orderStatus.orderNo}/COMPLETE`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })
    order.printLogGroup.orderStatus = { ...order.printLogGroup.orderStatus, status: 'COMPLETE' }

    await orderData.refresh()
  })
}

const orderAccept = (order:HoSalesVo) => {
  $q.dialog({
    title: $t('ORDER.020'),
    message: $t('ORDER.002'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/order/pg/${order.printLogGroup.orderStatus.orderNo}/COMPLETE`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })
    order.printLogGroup.orderStatus = { ...order.printLogGroup.orderStatus, status: 'COMPLETE' }

    if (shopInfo.value?.usePrinter) {
      const orderReceiptPrinterList = shopPrint.value?.filter((printer: PrinterVo) => printer.orderReceipt === true)
      if (orderReceiptPrinterList?.length === 0) {
        return
      }
      const printData = {
        ...order.printLogGroup,
        pgPaymentResult: order.pgPaymentResult,
        printerList: orderReceiptPrinterList
      }

      window.electronAPI.printOrder(JSON.stringify(printData))
    }

    await customFetch(`/admin/handOrder/shop/table/${order.printLogGroup.tableSeq}/${order.printLogGroup.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await orderData.refresh()
  })
}

const cancelOrder = (state :any) => {
  const className = state === 'CANCEL' ? 'cancel_item' : ''
  return className
  // return treu / false
}

const orderElement = ref(undefined)

type ElementHeightType = (element : HTMLElement) => number

const props = defineProps({
  elementHeight: {
    type: Function as PropType<ElementHeightType>,
    required: true
  }
})

// 데이터 갱신 함수
const refreshOrderData = async () => {
  try {
    await orderData.refresh()
    if (orderList.value) {
      updateMenuNames(orderList.value as HoSalesVo[], shopInfo.value?.shopLanguage as string)
    }
  } catch (error) {
    // 에러 처리는 조용히 처리
  }
}

const orderPrint = (order: HoSalesVo | null) => {
  if (!shopPrint.value) {
    $q.notify({
      message: $t('ORDER.021'),
      color: 'negative',
      position: 'top'
    })
    return
  }
  if (!shopInfo.value?.usePrinter) {
    $q.notify({
      message: $t('ORDER.022'),
      color: 'negative',
      position: 'top'
    })
    return
  }
  const rePrintList = shopPrint.value!.filter((printer:PrinterVo) => printer.rePrint === true)
  if (order?.pgPaymentResult) {
    const printData = {
      ...order.printLogGroup,
      printerList: rePrintList,
      shopInfo: shopInfo.value,
      pgPaymentResult: order?.pgPaymentResult,
      printType: 'REPRINT'
    }
    window.electronAPI.printOrder(JSON.stringify(printData))
  } else {
    const printData = {
      ...order.printLogGroup,
      pgPaymentResult: order.pgPaymentResult,
      printerList: rePrintList
    }
    window.electronAPI.printOrder(JSON.stringify(printData))
  }
}

// SSE 연결 관리
const { connect: connectSSE, disconnect: disconnectSSE, isConnected, connectionStatus } = usePgOrderSSE()

// 주문 목록 갱신 함수
const refreshOrderList = async () => {
  refreshOrderData()
}

// 메시지 콜백 함수를 변수로 저장 (제거 시 필요)
const orderContentMessageCallback = async (message: string) => {
  // 다른 탭에서 이 탭으로 온 경우 알림 표시
  const orderPath = `/order/desktop/${shopInfo.value?.shopCode}`
  if (route.path === orderPath) {
    // 주문 접수 탭에 있을 때는 알림 없이 갱신만
    await refreshOrderList()
  }
}

// SSE 연결 시작
const startSSEConnection = () => {
  if (!shopInfo.value?.shopCode) {
    return
  }

  connectSSE({
    shopCode: shopInfo.value.shopCode,
    onMessage: orderContentMessageCallback,
    clearCallbacks: true, // 기존 콜백 전부 제거하고 새로 시작 (페이지 새로고침 대응)
    onConnected: () => {
      $q.notify({
        type: 'positive',
        message: '실시간 주문 연결 활성화',
        position: 'top',
        timeout: 2000
      })
    },
    onError: (error: Event) => {
      console.error('[ShopOrderContent] SSE 연결 에러:', error)
    }
  })
}

// SSE 토글
const toggleSSE = () => {
  if (isConnected.value) {
    disconnectSSE()
    $q.notify({
      type: 'warning',
      message: '실시간 주문 연결 종료',
      position: 'top',
      timeout: 2000
    })
  } else {
    startSSEConnection()
  }
}

// 일렉트론 페이지 로드 감지 및 초기화
const handleElectronLoad = async () => {
  if (process.client && isElectron()) {
    await refreshOrderData()
  }
}

const emits = defineEmits(['update:childHeight'])
onMounted(() => {
  if (process.client) {
    window.addEventListener('order-data-refresh', refreshOrderData)

    // 일렉트론 환경에서 페이지 로드 감지
    if (isElectron()) {
      // posCode가 handorder가 아닐 때 SSE 연결
      if (shopInfo.value?.posCode !== 'handorder') {
        if (shopInfo.value?.pg) {
          startSSEConnection()
        }
      } else {
        // visibilitychange: 일렉트론이 페이지를 다시 로드할 때
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible') {
            await handleElectronLoad()
          }
        })

        // focus: 윈도우가 포커스를 받을 때
        window.addEventListener('focus', handleElectronLoad)

        // pageshow: 일렉트론 loadURL 후 페이지가 표시될 때 (캐시에서 복원될 때도 발생)
        window.addEventListener('pageshow', handleElectronLoad)

        // load: 페이지 로드 완료 시
        if (document.readyState === 'complete') {
          handleElectronLoad()
        } else {
          window.addEventListener('load', handleElectronLoad)
        }

        // 추가: 일렉트론 전용 커스텀 이벤트 리스너
        window.addEventListener('electron-page-loaded', handleElectronLoad)
      }
    }
  }

  nextTick(() => {
    if (orderElement.value) {
      const element = props.elementHeight(orderElement.value)
      emits('update:childHeight', element)
    }
  })

  if (typeof window !== 'undefined' && (window as any).electronAPI?.receiveMessage) {
    window.electronAPI.receiveMessage(async () => {
      await fetchOrderList(route.params.shopCode as string).then((data) => {
        if (data) {
          data.refresh()
        }
      })
    })
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('order-data-refresh', refreshOrderData)

    if (isElectron()) {
      document.removeEventListener('visibilitychange', handleElectronLoad)
      window.removeEventListener('focus', handleElectronLoad)
      window.removeEventListener('pageshow', handleElectronLoad)
      window.removeEventListener('load', handleElectronLoad)
      window.removeEventListener('electron-page-loaded', handleElectronLoad)
    }
  }
  console.log('[ShopOrderContent] 컴포넌트 언마운트 - SSE 연결 종료')
  if (shopInfo.value?.posCode !== 'handorder') {
    disconnectSSE()
  }
})

</script>

<template>
  <div ref="orderElement" class="order_container">
    <div class="section-body row justify-start q-gutter-sm">
      <div v-for="(order,index) in (orderList as HoSalesVo[])?.filter(o => o.printLogGroup.orderStatus?.status != null)" :key="index" v-intersection="onIntersection" class="card-item q-pa-sm flex flex-center relative-position" :data-id="index">
        <transition name="q-transition--scale">
          <q-card v-if="inView[index]" style="width: 100%;height: 100%" :class="cancelOrder(order.printLogGroup.orderStatus.status)">
            <q-card-section v-ripple.center class="full-height" @click="detailOrder(order,orderList.length - index +1)">
              <div class="text-h6 text-bold row justify-between">
                <div class="text-handorder" :style="{ color: order.printLogGroup.orderStatus.status === 'CANCEL' ? '#9E9E9E' : ''}">
                  {{ order.printLogGroup.orderStatus.orderCode }}
                </div>
                <div>
                  {{ dayjs(order.printLogGroup.insDate).format('HH:mm') }}
                </div>
              </div>
              <div class="menu-text col-1">
                <div class="q-mb-sm">
                  {{ order.printLogGroup.tableName }}
                </div>
                <div v-for="menu in order.printLogGroup.printLog" :key="menu.printSeq" class="option-text" :style="{ color: order.printLogGroup.orderStatus.status === 'CANCEL' ? '#9E9E9E' : ''}">
                  {{ menu.menuName }} {{ $t('COMMON.058', {number: menu.quantity}) }}
                </div>
                <div class="absolute-bottom column q-my-sm q-mr-sm">
                  <div class="self-end q-mb-lg">
                    {{ $t('COMMON.079') }} : {{ getTotalPrice(order.printLogGroup.printLog) }}
                  </div>
                  <div class="order-status-box self-center q-gutter-sm">
                    <template v-if="order.pgPaymentResult">
                      <template v-if="order.printLogGroup.orderStatus.status == 'PENDING'">
                        <template v-if="shopInfo?.acceptOrderButtonActive">
                          <q-btn :label="$t('ORDER.003')" color="red" @click.stop="orderCancelClick(order)" />
                          <q-btn :label="$t('ORDER.014')" color="primary" style="width: 130px" @click.stop="orderConfirm(order)" />
                        </template>
                        <template v-else>
                          <q-btn :label="$t('ORDER.003')" color="red" @click.stop="orderCancelClick(order)" />
                          <q-btn label="조리완료" color="blue-11" style="width: 130px" @click.stop="orderAcceptNoPrint(order)" />
                        </template>
                      </template>
                      <template v-if="order.printLogGroup.orderStatus.status == 'CONFIRM'">
                        <q-btn :label="$t('ORDER.003')" color="red" @click.stop="orderCancelClick(order)" />
                        <q-btn label="조리완료" color="blue-11" style="width: 130px" @click.stop="orderAcceptNoPrint(order)" />
                      </template>
                      <template v-if="order.printLogGroup.orderStatus.status == 'COMPLETE'">
                        <q-btn :label="$t('ORDER.003')" color="red" @click.stop="orderCancelClick(order)" />
                        <q-btn :label="$t('ORDER.015')" color="grey" disable style="width:130px" />
                      </template>
                      <template v-if="order.printLogGroup.orderStatus.status == 'CANCEL'">
                        <q-btn :label="$t('ORDER.003')" color="grey" disable style="width:200px" />
                      </template>
                    </template>
                    <template v-else>
                      <template v-if="order.printLogGroup.orderStatus.status == 'PENDING'">
                        <template v-if="shopInfo?.acceptOrderButtonActive">
                          <q-btn :label="$t('ORDER.003')" color="red" @click.stop="orderCancelClick(order)" />
                          <q-btn :label="$t('ORDER.014')" color="primary" style="width: 130px" @click.stop="orderAccept(order as HoDesktopOrderVo)" />
                        </template>
                        <template v-else>
                          <q-btn :label="$t('ORDER.015')" color="grey" disable style="width:200px" />
                        </template>
                      </template>
                      <template v-if="order.printLogGroup.orderStatus.status == 'COMPLETE'">
                        <q-btn :label="$t('ORDER.015')" color="grey" disable style="width:200px" />
                      </template>
                      <template v-if="order.printLogGroup.orderStatus.status == 'CANCEL'">
                        <q-btn :label="$t('ORDER.003')" color="grey" disable style="width:200px" />
                      </template>
                    </template>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </transition>
      </div>
    </div>

    <!--    <q-dialog v-model="detailOrderPopup">
      <q-card class="detail_order_popup">
        <q-card-section style="padding-bottom:10px">
          <div class="row justify-between">
            <div class="text-h6 text-bold order_number">
              {{ orderObj?.printLogGroup.orderStatus.orderCode }}
            </div>
            <div class="text-h6 cursor-pointer close-btn">
              <q-icon name="close" @click="closeDetailOrderPopup" />
            </div>
          </div>
          <q-separator class="q-mt-sm" />
        </q-card-section>
        <q-card-section>
          <div class="menu-text col-1">
            <div>
              <div class="content">
                <div class="menu-content column">
                  <div v-for="menu in orderObj?.printLogGroup.printLog" :key="menu.printSeq" class="text_wrap q-mb-lg">
                    <div class="text-bold">
                      {{ `${menu.menuName} / ${ $t('COMMON.058', {number: menu.quantity}) } ` }}
                    </div>
                    <template v-if="menu.printLogMenuOptionList.find(option => option.optionUuid != null)">
                      <div class="q-mt-sm">
                        {{ $t('SHOP.105') }} :
                      </div>
                      <div v-for="option in menu.printLogMenuOptionList.filter(element => element.optionUuid != null)" :key="option.optionUuid" class="option-text">
                        {{ option.optionGroupName +'('+option.optionName+')' }}
                      </div>
                    </template>
                    <template v-else>
                    &lt;!&ndash;                <div>&ndash;&gt;
                    &lt;!&ndash;                  옵션 : 없음&ndash;&gt;
                    &lt;!&ndash;                </div>&ndash;&gt;
                    </template>
                  </div>
                </div>
                <div class="arrow_wrap">
                  &lt;!&ndash;                  <q-icon name="keyboard_arrow_up" />
                  <q-icon name="keyboard_arrow_down" />&ndash;&gt;
                </div>
              </div>

              <q-separator class="q-my-sm" />

              <div class="popup_footer">
                <div class="popup_price">
                  {{ $t('COMMON.059') }} : {{ getTotalPrice(orderObj?.printLogGroup.printLog) }}
                </div>
                <div class="btn_wrap">
                  <q-btn :label="$t('ORDER.023')" color="primary" @click="orderPrint(orderObj)" />
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>-->
    <OrderPopup
      :order-popup="orderPopup"
      :order-flag="'printOrder'"
      @update:order-popup="closeDetailPopup"
    />
  </div>
</template>

<style scoped lang="scss">
:root{
  --handorder-color: #ff8b4a;
}

.order_container{
  width: 95%;
  .section-body{
    width: 100%;

    margin: auto;
    .cancel_item{
      color: #9E9E9E;
      position: relative;

      >:before{
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.1);
        z-index: 1;
        border-radius: inherit;
      }
    }

    .card-item{
      width: 290px;
      height: 290px;
      cursor:pointer;

      .q-card {
        border-radius: 12px;
        overflow: hidden;
        font-family: "Pretendard";
        box-shadow: 0px 1px 4px rgb(12 12 13 / 10%), 0px 1px 4px rgb(12 12 13 / 5%);
      }

    }

    .option-text{
      font-size: 12px;
      color: #757575;
      padding-left:10px;
    }
  }
}

.detail_order_popup{
  min-width:400px;
  min-height: 500px;

  .order_number{
    color: var(--handorder-color);
  }

  .close-btn{
    &:hover{
      color: #9E9E9E;
    }
  }

  .content{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: 300px;
    overflow-y:auto;

    .menu-content{

      .text_wrap{
      }
    }

    .arrow_wrap{
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      font-size: 30px;

      >*{
        cursor: pointer;

        &:hover{
          color: white;
          background-color: rgba(0,0,0,0.5);
          border-radius: 50%;
        }
      }
    }
  }
  .popup_footer{
    display: flex;
    flex-direction: column;
    justify-content: center;

    .popup_price{
      font-size: 1.05rem;
      font-weight: 700;
    }

    .btn_wrap{
      text-align: center;
      margin-top: 10px;

      button{
        margin: 10px auto;
        width: 70%;
        height: 40px;
        background-color: #BDBDBD;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
    }
  }
}
</style>
