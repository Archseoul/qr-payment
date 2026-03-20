import { storeToRefs } from 'pinia'
import type { HoPrintLogGroupVo } from '~/types'
import { orderComplete } from '~/composables/order/useOrderComplete'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useTableListStore } from '~/store/tableListStore'

export const orderAcceptSkip = async (order:HoPrintLogGroupVo) => {
  await orderComplete(order)
  const { shopInfo } = storeToRefs(useShopInfoStore())
  const { fetchTableList } = useTableListStore()

  await customFetch(`/admin/handOrder/shop/table/${order.tableSeq}/${order.printGroupUuid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  await fetchTableList(shopInfo.value?.shopCode)
}
