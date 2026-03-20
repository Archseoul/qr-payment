import { storeToRefs } from 'pinia'
import type {HoPrintLogGroupVo, HoSalesVo, PrinterVo} from '~/types'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useOrderListStore } from '~/store/orderListStore'
import { useShopPrintStore } from '~/store/shopPrintStore'
import { useTableListStore } from '~/store/tableListStore'

export const orderAccept = async (order:HoPrintLogGroupVo) => {
  const { shopInfo } = storeToRefs(useShopInfoStore())
  const { orderList, newOrderList } = storeToRefs(useOrderListStore())
  const { shopPrint } = storeToRefs(useShopPrintStore())

  const { fetchOrderList, setNewOrderList, setOrder } = useOrderListStore()
  const { fetchTableList } = useTableListStore()

  const sales = orderList.value.find(
      (obj: HoSalesVo) => obj.printLogGroup.printGroupUuid === order.printGroupUuid
  ) as HoSalesVo | undefined;

  await customFetch(`/admin/handOrder/order/pg/${order.orderStatus.orderNo}/CONFIRM`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shopInfo.value)
    })


  if (newOrderList.value.length > 0) {
    newOrderList.value.shift()
    setNewOrderList(newOrderList.value)
    if (newOrderList.value[0]) {
      setOrder(newOrderList.value[0].printLogGroup)
    }
  }

  await fetchOrderList(shopInfo.value?.shopCode)

  order.orderStatus.status = 'CONFIRM'

  if (shopInfo.value?.usePrinter) {

    const orderReceiptPrinterList = shopPrint.value?.filter((printer: PrinterVo) => printer.orderReceipt)

    const printData = {
      ...(sales?.printLogGroup ?? order),
      printerList: orderReceiptPrinterList || [],
      shopInfo: shopInfo.value,
      pgPaymentResult: sales?.pgPaymentResult,
      printType: 'ORDERRECEIPT'
    }

    window.electronAPI.printOrder(JSON.stringify(printData))
  }

  await customFetch(`/admin/handOrder/shop/table/${order.tableSeq}/${order.printGroupUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  await fetchTableList(shopInfo.value?.shopCode)
}
