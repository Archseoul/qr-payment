import { defineStore } from 'pinia'

export const useEstimatedTimeStore = defineStore('estimatedTime', {
  state: () => ({
    estimatedTime: 0,
    modalVisible: false
  }),
  actions: {
    setEstimatedTime (estimatedTime: number) {
      this.estimatedTime = estimatedTime
    },
    updateModalVisible (visible: boolean) {
      this.modalVisible = visible
    }
  }
})
