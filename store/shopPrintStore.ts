import { defineStore } from 'pinia'
import type { PrinterVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'

export const useShopPrintStore = defineStore('shopPrint', {
  state: () => ({
    shopPrint: [] as PrinterVo[]
  }),
  actions: {
    async fetchShopPrint (shopCode:string) {
      try {
        const { data } = await useCustomFetch<PrinterVo[]>(`/admin/handOrder/shop/${shopCode}/printer`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (data?.value) {
          this.shopPrint = data.value
        }
      } catch (e) {
      }
    }
  }
})
