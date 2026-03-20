import { defineStore } from 'pinia'
import type { HoTableOrderVo } from '~/types'

export const useTableListStore = defineStore('tableList', {
  state: () => ({
    tableList: [] as HoTableOrderVo[]
  }),
  actions: {
    async fetchTableList (shopCode:string) {
      try {
        const { data } = await useCustomFetch<HoTableOrderVo[]>(`/admin/handOrder/shop/table/${shopCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (data?.value) { this.tableList = data.value }
      } catch (e) {
      }
    }
  }
})
