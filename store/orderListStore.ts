import { defineStore } from 'pinia'
import type { HoPrintLogGroupVo, HoSalesVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'

export const useOrderListStore = defineStore('orderList', {
  state: () => ({
    orderList: [] as HoSalesVo[],
    newOrderList: [] as HoSalesVo[],
    order: {} as HoPrintLogGroupVo
  }),

  actions: {
    async fetchOrderList (shopCode:string) {
      try {
        const data = await useCustomFetch<HoSalesVo[]>(`/admin/handOrder/order/v2/${shopCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (data?.data?.value) {
          this.orderList = data.data.value
        }
        return data
      } catch (e) {
      }
    },
    setOrder (order:HoPrintLogGroupVo) {
      this.order = order
    },
    setNewOrderList (orderList:HoSalesVo[]) {
      this.newOrderList = orderList
    },
    addNewOrder (newOrder:HoSalesVo) {
      // 기존 주문 확인
      const existingOrderIndex = this.newOrderList.findIndex(
        order => order.printLogGroup.printGroupUuid === newOrder.printLogGroup.printGroupUuid
      )

      if (existingOrderIndex === -1) {
        // 새 주문 추가 (불변성 유지)
        this.newOrderList = [...this.newOrderList, newOrder]
      } else {
        // 기존 주문 업데이트 (불변성 유지)
        this.newOrderList = [
          ...this.newOrderList.slice(0, existingOrderIndex),
          newOrder,
          ...this.newOrderList.slice(existingOrderIndex + 1)
        ]
      }
    },
    removeFirstOrder () {
      // 첫 번째 주문 제거 (불변성 유지)
      if (this.newOrderList.length > 0) {
        this.newOrderList = this.newOrderList.slice(1)
      }
    }
  }
})
