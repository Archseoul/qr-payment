<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { getTotalPrice } from '~/utils/getTotalPrice'
import type { HoPrintLogGroupVo, HoSalesVo, PrinterVo } from '~/types'
import { useOrderListStore } from '~/store/orderListStore'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useEstimatedTimeStore } from '~/store/estimatedTimeStore'
import { orderUpdateStatus } from '~/composables/order/useOrderUpdateState'
import { orderCancel } from '~/composables/order/useOrderCancel'
import { intersection } from '~/utils/intersection'
import { useCheckPermissions } from '#imports'
import { useShopPrintStore } from '~/store/shopPrintStore'

const { shopInfo } = storeToRefs(useShopInfoStore())
const { orderList } = storeToRefs(useOrderListStore())
const { shopPrint } = storeToRefs(useShopPrintStore())

const { setOrder } = useOrderListStore()
const { updateModalVisible } = useEstimatedTimeStore()

const { inView, onIntersection } = intersection()

const { checkPermissions } = useCheckPermissions()

const emit = defineEmits<(e: 'update:order-detail-popup', value: boolean) => void>()
const dayjs = useDayjs()
const $q = useQuasar()

const updateOrderStatus = (order: HoPrintLogGroupVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  if ((order.delivery && !order.takeOut) || (order.takeOut && order.orderStatus.status === 'PENDING')) {
    updateModalVisible(true)
    setOrder(order)
  } else {
    orderUpdateStatus(order, $q)
  }
}

const orderCancelClick = (order: HoSalesVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  orderCancel(order, $q)
}

const cancelOrder = (state :any) => {
  return state === 'CANCEL' ? 'cancel_item' : ''
}

const classOrderType = (printLog : HoPrintLogGroupVo) => {
  if (!printLog.delivery && !printLog.takeOut) { return 'color-default' }
  if (printLog.takeOut) { return 'color-takeout' }
  return 'color-delivery'
}

const detailPopupOpen = (printLogGroup:HoPrintLogGroupVo, idx:number) => {
  printLogGroup.orderNumber = (orderList.value.length - idx)
  setOrder(printLogGroup)
  emit('update:order-detail-popup', true)
}

const displayMenuName = (menuName:string) => {
  return menuName.length > 10 ? menuName.substring(0, 10) + '...' : menuName
}

updateMenuNames(orderList.value as HoSalesVo[], shopInfo.value?.shopLanguage as string)

// 후불 주문, 결제 영수증이 나올 수 없음
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
    order.printLogGroup.orderStatus.status = 'COMPLETE'

    if (shopInfo.value?.usePrinter) {
      const orderReceiptPrinterList = shopPrint.value?.filter((printer: PrinterVo) => printer.orderReceipt)

      const printData = {
        shopInfo: shopInfo.value,
        printerList: shopPrint.value,
        ...order.printLogGroup,
        pgPaymentResult: order.pgPaymentResult,
        printType: 'ORDERRECEIPT'
      }

      printData.printerList = orderReceiptPrinterList || []
      if (printData.printerList.length === 0) {
        return
      }

      window.electronAPI.printOrder(JSON.stringify(printData))
    }

    await customFetch(`/admin/handOrder/shop/table/${order.printLogGroup.tableSeq}/${order.printLogGroup.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })
}

</script>

<template>
  <div v-for="(order,index) in (orderList as HoSalesVo[])" :key="index" v-intersection="onIntersection" class="card-item q-pa-sm flex flex-center relative-position" :data-id="index">
    <transition name="q-transition--scale">
      <q-card v-if="inView[index]" style="width: 100%;height: 100%" :class="cancelOrder(order.printLogGroup.orderStatus.status)">
        <q-card-section v-ripple.center class="full-height" @click="detailPopupOpen(order.printLogGroup, index)">
          <div class="text-h6 text-bold row justify-between">
            <div :class="classOrderType(order.printLogGroup)" :style="{ color: order.printLogGroup.orderStatus.status === 'CANCEL' ? '#9E9E9E' : ''}">
              {{ order.printLogGroup.orderStatus.orderCode }}
            </div>
            <div class="order-type">
              <span v-if="!order.printLogGroup.delivery && !order.printLogGroup.takeOut" class="store">
                <div>
                  {{ order.printLogGroup.tableName }}
                  <span :class="order.pgPaymentResult ? 'payment-badge prepay' : 'payment-badge postpay'">
                    {{ order.pgPaymentResult ? '선불' : '후불' }}
                  </span>
                </div>
              </span>
              <span v-else-if="order.printLogGroup.takeOut" class="takeOut">포장</span>
              <span v-else class="delivery">배달</span>
            </div>
          </div>
          <div>
            <div class="order-date">
              <span>
                {{ dayjs(order.printLogGroup.insDate).format('HH:mm') }}
              </span>
            </div>
            <div class="manu-name" :style="{ color: order.printLogGroup.orderStatus.status === 'CANCEL' ? '#9E9E9E' : ''}">
              <span v-if="order.printLogGroup.printLog.length > 1">
                {{ `[ ${displayMenuName(order.printLogGroup.printLog[0]!.menuName)} 외 ${order.printLogGroup.printLog.length - 1}개 ]` }}
              </span>
              <span v-else>
                {{ `[ ${displayMenuName(order.printLogGroup.printLog[0]!.menuName)} ]` }}
              </span>
            </div>

            <div class="absolute-bottom column q-my-sm q-mr-sm">
              <div class="q-mb-md q-ml-md total-price">
                총 결제 금액 {{ getTotalPrice(order.printLogGroup.printLog).toLocaleString() }}
              </div>

              <div class="order-status-box self-center q-gutter-sm">
                <template v-if="order.printLogGroup.orderStatus.status == 'PENDING'">
                  <template v-if="order.pgPaymentResult">
                    <!--                    선불-->
                    <template v-if="shopInfo?.acceptOrderButtonActive">
                      <q-btn
                        label="주문 취소"
                        color="red"
                        @click.stop="orderCancelClick(order)"
                      />
                      <q-btn
                        label="주문 수락"
                        color="primary"
                        style="width: 130px"
                        @click.stop="updateOrderStatus(order.printLogGroup)"
                      />
                    </template>
                    <template v-else>
                      <q-btn label="주문 취소" color="red" @click.stop="orderCancelClick(order)" />
                      <q-btn label="조리 완료" color="blue-11" style="width:130px" @click.stop="updateOrderStatus(order.printLogGroup)" />
                    </template>
                  </template>
                  <template v-else>
                    <!--                    후불-->
                    <template v-if="shopInfo?.acceptOrderButtonActive">
                      <q-btn
                        label="주문 취소"
                        color="red"
                        @click.stop="orderCancelClick(order)"
                      />
                      <q-btn
                        label="주문 수락"
                        color="primary"
                        style="width: 130px"
                        @click.stop="orderAccept(order)"
                      />
                    </template>
                    <template v-else>
                      <q-btn label="접수 완료" color="grey" disable />
                    </template>
                  </template>
                </template>

                <template v-if="order.printLogGroup.orderStatus.status == 'CONFIRM'">
                  <q-btn label="주문 취소" color="red" @click.stop="orderCancelClick(order)" />
                  <q-btn label="조리 완료" color="blue-11" style="width:130px" @click.stop="updateOrderStatus(order.printLogGroup)" />
                </template>
                <template v-if="(order.printLogGroup.orderStatus.status == 'COMPLETE')||(order.printLogGroup.orderStatus.status == 'SUCCESS')">
                  <q-btn v-if="order.pgPaymentResult" label="주문 취소" color="red" @click.stop="orderCancelClick(order)" />
                  <q-btn label="접수 완료" color="grey" disable style="width:130px" />
                </template>
                <template v-if="order.printLogGroup.orderStatus.status == 'CANCEL'">
                  <q-btn label="취소된 주문" color="grey" disable style="width:200px" />
                </template>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </transition>
  </div>
</template>

<style scoped lang="scss">
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

    .cancel_item{
      .order-type {
        .takeOut,
        .delivery {
          color: #A8A8A8;
          border: 3px solid #A8A8A8;

          &:before{
            border: 1px solid #A8A8A8;
          }
        }

        .store{
          color: #A8A8A8;
          font-size: 0.8em;
        }
      }
    }

    .card-item{
      width: 290px;
      height: 290px;
      cursor:pointer;

      .order-type:not(:has(.store)) {
        position:absolute;
        right: 10px;
        top: 10px;

        > span:not(.store) {
          font-size: 0.7em;
          display: inline-block;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          text-align: center;
          line-height: 45px;
          position:relative;
        }
      }

        .store{
          color: var(--handorder-color);
          font-size: 0.8em;
        }
        .takeOut{
          color: #24af1c;
          border: 3px solid #24af1c;
        }
        .delivery{
          border: 3px solid #4B66ED;
          color:#4B66ED;
        }

      .order-date{
        margin-top:10px;
        display: flex;
        flex-direction: column;

        >span{
          font-size: 1.5em;
          font-weight: 600;
          transform:translateY(-7px);
        }
      }

      .manu-name{
        font-weight: 600;
        color: #676767;
        font-size: 0.9em;
      }
    }

    .total-price{
      letter-spacing: -0.5px;
    }
  }

  .payment-badge {
    display: inline-block;
    font-size: 0.75em;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    vertical-align: middle;
    letter-spacing: 0;
    line-height: 1.4;

    &.prepay {
      background-color: #e8f4ff;
      color: #1976d2;
      border: 1px solid #1976d2;
    }

    &.postpay {
      background-color: #fff3e0;
      color: #e65100;
      border: 1px solid #e65100;
    }
  }

  .color-takeout{
    color: #24af1c;
  }

  .color-delivery{
    color: #4B66ED;
  }

  .color-default{
    color:var(--handorder-color);
  }

  .q-btn--rectangle {
    border-radius: 3px;
  }

</style>
