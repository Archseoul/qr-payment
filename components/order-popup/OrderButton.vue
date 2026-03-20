<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type {HoDesktopOrderVo, HoPrintLogGroupVo, HoSalesVo, PrinterVo} from '~/types'
import { orderCancel } from '~/composables/order/useOrderCancel'
import { useOrderListStore } from '~/store/orderListStore'
import { orderUpdateStatus } from '~/composables/order/useOrderUpdateState'
import { useShopInfoStore } from '~/store/shopInfoStore'
import {useShopPrintStore} from "~/store/shopPrintStore";

const $q = useQuasar()

const { orderList, order } = storeToRefs(useOrderListStore())
const { shopInfo } = storeToRefs(useShopInfoStore())
const {shopPrint} = storeToRefs(useShopPrintStore())
const closePopup = inject<() => void>('closePopup')
const { checkPermissions } = useCheckPermissions()

const orderObj = computed(()=>orderList.value.find((obj: HoSalesVo) => obj.printLogGroup.printGroupUuid === order.value.printGroupUuid) as HoSalesVo)


const orderCancelClick = () => {
  orderCancel(orderObj.value, $q)
}

const updatePreOrderStatus = async (order : HoPrintLogGroupVo) => {
  if (!checkPermissions(['U'])) {
    return
  }

  const result = await orderUpdateStatus(order, $q)

  if (closePopup && result) {
    closePopup()
  }
}

//후불 주문, 결제 영수증이 나올 수 없음
const orderAccept = () => {
  $q.dialog({
    title: '주문 접수',
    message: '주문을 접수하시겠습니까?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/order/${order.value.orderStatus.orderNo}/COMPLETE`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })
    order.value.orderStatus.status = 'COMPLETE'

    if (shopInfo.value?.usePrinter) {
      const orderReceiptPrinterList = shopPrint.value?.filter((printer: PrinterVo) => printer.orderReceipt)

      const printData = {
        shopInfo: shopInfo.value,
        printerList: shopPrint.value,
        ...order.value,
        pgPaymentResult: orderObj?.value.pgPaymentResult,
        printType : ''
      }

      printData.printerList = orderReceiptPrinterList || []
      if (printData.printerList.length === 0) {
        return
      }

      window.electronAPI.printOrder(JSON.stringify(printData))
    }

    await customFetch(`/admin/handOrder/shop/table/${order.value.tableSeq}/${order.value.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })
}

</script>

<template v-if="order && order.printGroupUuid && orderObj">
  <template v-if="order.orderStatus.status==='PENDING'">
<!--    선불의 경우-->
    <template v-if="orderObj.pgPaymentResult">

      <template v-if="shopInfo.acceptOrderButtonActive">
        <q-btn label="주문취소" class="cancel-btn" @click.stop="orderCancelClick()" />
        <q-btn label="주문수락" class="confirm-btn" @click.stop="updatePreOrderStatus(order)" />
      </template>
      <template v-else>
        <q-btn label="주문 취소" class="cancel-btn" @click.stop="orderCancelClick()" />
        <q-btn label="조리 완료" class="complete-btn" @click.stop="updatePreOrderStatus(order)" />
      </template>


    </template>
    <template v-else>
      <!--    후불의 경우-->

      <template v-if="shopInfo.acceptOrderButtonActive">
        <q-btn label="주문취소" class="cancel-btn" @click.stop="orderCancelClick()" />
        <q-btn label="주문수락" class="confirm-btn" @click.stop="orderAccept()" />
      </template>
      <template v-else>
        <q-btn label="접수 완료" color="grey" disable  />
      </template>

    </template>


  </template >

  <template v-if="order.orderStatus.status==='CONFIRM'">
    <q-btn label="주문취소" class="cancel-btn" @click.stop="orderCancelClick()" />
    <q-btn label="조리완료" class="complete-btn" @click.stop="updatePreOrderStatus(order)" />
  </template>
  <template v-if="order.orderStatus.status==='COMPLETE' || (order.orderStatus.status == 'SUCCESS')" >
    <q-btn label="주문취소" class="cancel-btn" @click.stop="orderCancelClick()" v-if="orderObj.pgPaymentResult"/>
    <q-btn label="접수완료" class="disabled-btn" />
  </template>
  <template v-if="order.orderStatus.status==='CANCEL'">
    <q-btn label="취소된 주문" class="disabled-btn" disable />
  </template>
</template>

<style scoped lang="scss">
*{
  color: #fff;
  border-radius: 0;
}

.confirm-btn{
  background-color: #FF8B4AFF;
}

.complete-btn{
  background-color: #82B1FF;
}

.cancel-btn{
  background-color: #F55B4F;
}

.disabled-btn{
  background-color: #BBBBBB;
}
</style>
