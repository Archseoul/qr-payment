import { defineStore } from 'pinia'

export const useUtilStore = defineStore('util', {
  state: () => ({
    pageOffset: 0
  }),
  actions: {
    setOffset (offset: number) {
      this.pageOffset = offset
    }
  }
})
