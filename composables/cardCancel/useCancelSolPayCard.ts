import type { QVueGlobals } from 'quasar'
import type { HoSalesVo } from '~/types'

export const cancelSolPayCard = async (order:HoSalesVo, $q:QVueGlobals) => {
  await customFetch('/admin/handOrder/pay/cancel/sol', {
    method: 'POST',
    params: {
      orderNo: order.printLogGroup.orderStatus.orderNo
    },
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: '카드 결제 취소가 완료되었습니다.',
          color: 'positive',
          position: 'top',
          group: false,
          icon: 'check'
        })
      }
    },
    onResponseError: (context) => {
      $q.notify({
        message: `카드 결제 취소가 실패하였습니다. ${context.response._data.message}`,
        color: 'negative',
        position: 'top',
        group: false,
        icon: 'error'
      })
    }
  })
}
