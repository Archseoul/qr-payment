import { defineStore } from 'pinia'

export const useQrPaymentStore = defineStore('qrPayment', {
  state: () => ({
    qrPaymentEnabled: true,
    showQrConfirmModal: false,
    showPaymentToast: false,
    paymentToastMessage: ''
  }),
  actions: {
    openConfirmModal () {
      this.showQrConfirmModal = true
    },
    keepPayment () {
      // "계속 진행하기" → 비활성화 확정
      this.showQrConfirmModal = false
      this.qrPaymentEnabled = false
      this.showPaymentToast = true
      this.paymentToastMessage = '결제 기능이 비활성화 되었습니다.'
      setTimeout(() => { this.showPaymentToast = false }, 2500)
    },
    disablePayment () {
      // "돌아가기" → 모달 닫고 활성화 상태로 원복
      this.showQrConfirmModal = false
      this.qrPaymentEnabled = true
    },
    enablePayment () {
      this.qrPaymentEnabled = true
      this.showPaymentToast = true
      this.paymentToastMessage = '결제 기능이 활성화 되었습니다.'
      setTimeout(() => { this.showPaymentToast = false }, 2500)
    }
  }
})
