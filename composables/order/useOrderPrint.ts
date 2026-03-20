import { storeToRefs } from 'pinia'
import type { QVueGlobals } from 'quasar'
import type { HoPrintLogGroupVo, PrinterVo } from '~/types'
import { useOrderListStore } from '~/store/orderListStore'
import { useShopPrintStore } from '~/store/shopPrintStore'
import { useShopInfoStore } from '~/store/shopInfoStore'

export const useOrderPrint = (order : HoPrintLogGroupVo, $q:QVueGlobals) => {
  const { orderList } = storeToRefs(useOrderListStore())
  const { shopPrint } = storeToRefs(useShopPrintStore())
  const { shopInfo } = storeToRefs(useShopInfoStore())

  const printDataObject = orderList.value.find( orderValue => orderValue.printLogGroup.printGroupUuid === order.printGroupUuid)

  if (shopPrint.value?.length === 0) {
    $q.notify({
      message: '프린터가 등록되지 않았습니다.',
      color: 'negative',
      position: 'top'
    })
    return
  }
  if (!shopInfo.value?.usePrinter) {
    $q.notify({
      message: '프린터 사용을 활성화 해주세요',
      color: 'negative',
      position: 'top'
    })
    return
  }
  const rePrintList = shopPrint.value.filter((printer:PrinterVo) => printer.rePrint)
  const printData = {
    ...printDataObject?.printLogGroup,
    printerList: rePrintList,
    shopInfo: shopInfo.value,
    pgPaymentResult: printDataObject?.pgPaymentResult,
    printType: 'REPRINT'
  }
  window.electronAPI.printOrder(JSON.stringify(printData))
}
