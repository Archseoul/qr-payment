import type { HoPrintLogVo } from '~/types'

export const getTotalPrice = (orderList:HoPrintLogVo[]) => {
  let totalPrice = 0
  orderList.forEach((order:HoPrintLogVo) => {
    totalPrice += order.finalPrice
  })
  return totalPrice
}
