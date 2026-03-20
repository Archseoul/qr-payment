<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { HoPrintLogGroupVo, HoSalesVo, PrinterVo } from '~/types'
import { useOrderListStore } from '~/store/orderListStore'
import { orderUpdateStatus } from '~/composables/order/useOrderUpdateState'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useShopPrintStore } from '~/store/shopPrintStore'

const $q = useQuasar()

const { order, newOrderList } = storeToRefs(useOrderListStore())
const { shopInfo } = storeToRefs(useShopInfoStore())
const { setNewOrderList, setOrder } = useOrderListStore()
const { shopPrint } = storeToRefs(useShopPrintStore())

const sales = newOrderList.value.find(
  (obj: HoSalesVo) => obj.printLogGroup.printGroupUuid === order.value.printGroupUuid
) as HoSalesVo | undefined

const closeNewOrderPopup = () => {
  newOrderList.value.shift()
  setNewOrderList(newOrderList.value)
  if (newOrderList.value.length > 0) { setOrder(newOrderList.value[0].printLogGroup) }
}

const updateOrderStatus = async (order : HoPrintLogGroupVo) => {
  await orderUpdateStatus(order, $q)
  await customFetch(`/admin/handOrder/order/${order.orderStatus.orderNo}/CONFIRM`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shopInfo.value)
  })

  await customFetch(`/admin/handOrder/shop/table/${order.tableSeq}/${order.printGroupUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (process.client) {
    window.dispatchEvent(new CustomEvent('order-data-refresh'))
  }
}

// 후불 주문, 결제 영수증이 나올 수 없음
const orderAccept = (order:HoSalesVo) => {
  $q.dialog({
    title: '주문 접수',
    message: '주문을 접수하시겠습니까?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/order/${order.printLogGroup.orderStatus.orderNo}/COMPLETE`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })
    order.printLogGroup.orderStatus.status = 'COMPLETE'

    await customFetch(`/admin/handOrder/order/${order.printLogGroup.orderStatus.orderNo}/COMPLETE`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })

    await customFetch(`/admin/handOrder/shop/table/${order.printLogGroup.tableSeq}/${order.printLogGroup.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

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

      if (shopInfo.value?.usePrinter) {
        window.electronAPI.printOrder(JSON.stringify(printData))
      }
    }

    closeNewOrderPopup()

    if (process.client) {
      window.dispatchEvent(new CustomEvent('order-data-refresh'))
    }
  })
}
</script>

<template>
  <template v-if="order.orderStatus.status==='CANCEL'">
    <q-btn label="취소된 주문" class="cancel-btn" @click.stop="closeNewOrderPopup" />
  </template>
  <template v-else>
    <template v-if="sales?.pgPaymentResult">
      <template v-if="shopInfo?.acceptOrderButtonActive">
        <q-btn label="닫기" class="cancel-btn" @click.stop="closeNewOrderPopup" />
        <q-btn label="주문수락" class="confirm-btn" @click.stop="updateOrderStatus(order)" />
      </template>
      <template v-else>
        <q-btn label="닫기" class="cancel-btn" @click.stop="closeNewOrderPopup" />
      </template>
    </template>
    <template v-else>
      <template v-if="shopInfo?.acceptOrderButtonActive">
        <q-btn label="닫기" class="cancel-btn" @click.stop="closeNewOrderPopup" />
        <q-btn label="주문수락" class="confirm-btn" @click.stop="orderAccept(sales as HoSalesVo)" />
      </template>
      <template v-else>
        <q-btn label="닫기" class="cancel-btn" @click.stop="closeNewOrderPopup" />
      </template>
    </template>
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

.cancel-btn{
  background-color: #BBBBBB;
}

</style>
