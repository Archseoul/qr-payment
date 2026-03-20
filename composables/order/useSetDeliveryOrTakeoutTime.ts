import type { HoPrintLogGroupVo } from '~/types'
import { useEstimatedTimeStore } from '~/store/estimatedTimeStore'

export const useSetDeliveryOrTakeoutTime = async (order: HoPrintLogGroupVo, time: number) => {
  const { setEstimatedTime } = useEstimatedTimeStore()

  const bodyData = JSON.stringify({ time })
  if (order.takeOut) {
    await customFetch(`/admin/handOrder/order/takeout/${order.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: bodyData
    })
  } else {
    await customFetch(`/admin/handOrder/order/delivery/${order.printGroupUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: bodyData
    })
  }
  setEstimatedTime(0)
}
