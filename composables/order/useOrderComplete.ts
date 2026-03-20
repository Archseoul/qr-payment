import { storeToRefs } from 'pinia'
import type { HoPrintLogGroupVo } from '~/types'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useOrderListStore } from '~/store/orderListStore'

export const orderComplete = async (order:HoPrintLogGroupVo) => {
  const { shopInfo } = storeToRefs(useShopInfoStore())
  const { fetchOrderList } = useOrderListStore()

  await customFetch(`/admin/handOrder/order/pg/${order.orderStatus.orderNo}/COMPLETE`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shopInfo.value)
  })

  await fetchOrderList(shopInfo.value?.shopCode)
  order.orderStatus.status = 'COMPLETE'
}
