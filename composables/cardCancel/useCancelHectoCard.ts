import { storeToRefs } from 'pinia'
import type { QVueGlobals } from 'quasar'
import type { HoSalesVo } from '~/types'
import { useShopInfoStore } from '~/store/shopInfoStore'

export const cancelHectoCard = async (order:HoSalesVo, $q:QVueGlobals) => {
  const { shopInfo } = storeToRefs(useShopInfoStore())

  if (!shopInfo.value?.hectoPaymentInfo) { return }
  await customFetch('/admin/handOrder/pg/cancel/hecto', {
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
