import { storeToRefs } from 'pinia'
import { orderAccept } from '~/composables/order/useOrderAccept'
import { orderComplete } from '~/composables/order/useOrderComplete'
import { orderAcceptSkip } from '~/composables/order/orderAcceptSkip'
import type { HoPrintLogGroupVo } from '~/types'
import { useShopInfoStore } from '~/store/shopInfoStore'

export const handleOrderStatus = async (order :HoPrintLogGroupVo) => {
  const { shopInfo } = storeToRefs(useShopInfoStore())

  if (shopInfo.value.acceptOrderButtonActive) {
    switch (order.orderStatus.status) {
      case 'PENDING' :
        await orderAccept(order)
        break
      case 'CONFIRM' :
        await orderComplete(order)
        break
    }
  } else {
    await orderAcceptSkip(order)
  }
}
