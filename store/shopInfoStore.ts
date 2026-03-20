import { defineStore } from 'pinia'
import type { ShopInfoVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'

export const useShopInfoStore = defineStore('shopInfo', {
  state: () => ({
    shopInfo: {} as ShopInfoVo
  }),
  actions: {
    async fetchShopInfo (shopCode:string) {
      try {
        const { data } = await useCustomFetch<ShopInfoVo>(`/admin/handOrder/shop/${shopCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (data?.value) { this.shopInfo = data.value }
      } catch (e) {
      }
    }
  }
})
