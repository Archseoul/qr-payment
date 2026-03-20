import { storeToRefs } from 'pinia'
import type { QVueGlobals } from 'quasar'
import type { HoSalesVo, PayCode, PgCode } from '~/types'
import { cancelHectoCard } from '~/composables/cardCancel/useCancelHectoCard'
import { cancelKisCard } from '~/composables/cardCancel/useCancelKisCard'
import { cancelSmartroCard } from '~/composables/cardCancel/useCancelSmartroCard'
import { cancelNiceCard } from '~/composables/cardCancel/useCancelNiceCard'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { cancelKcpCard } from '~/composables/cardCancel/useCancelKcpCard'
import { cancelMainPayCard } from '~/composables/cardCancel/useCancelMainPayCard'
import { cancelSolPayCard } from '~/composables/cardCancel/useCancelSolPayCard'
import { cancelNicePayCard } from '~/composables/cardCancel/useCancelNicePayCard'
import { cancelCompassPoint } from '~/composables/cardCancel/useCancelCompassPoint'

export const orderCancel = (order:HoSalesVo, $q:QVueGlobals, refresh?: () => Promise<void>) => {
  const { shopInfo } = storeToRefs(useShopInfoStore())

  const updateOrderStatusToCancel = async () => {
    await customFetch(`/admin/handOrder/order/${order.printLogGroup.orderStatus.orderNo}/CANCEL`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  const pgUpdateOrderStatusToCancel = async (notifyOnCancel?: string) => {
    await customFetch(
        `/admin/handOrder/order/pg/${order.printLogGroup.orderStatus.orderNo}/CANCEL${notifyOnCancel ? `?notifyOnCancel=${notifyOnCancel}` : ''}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(shopInfo.value)
        }
    )
  }

  return $q.dialog({
    title: '주문 취소',
    message: '주문을 취소하시겠습니까?',
    cancel: true,
    persistent: true,
    color: 'red'
  }).onOk(async () => {
    if (!order.pgPaymentResult) {
      await updateOrderStatusToCancel()
      order.printLogGroup.orderStatus = { ...order.printLogGroup.orderStatus, status: 'CANCEL' }
      if (refresh) {
        await refresh()
      }
      return
    }

    try {
      $q.loading.show()
      const cancelMapper:Record<PgCode | PayCode, (order:HoSalesVo, $q:QVueGlobals) => Promise<void>> = {
        hecto: cancelHectoCard,
        kis: cancelKisCard,
        kovan: async () => {},
        smartro: cancelSmartroCard,
        nice: cancelNiceCard,
        kcp: cancelKcpCard,
        mainpay: cancelMainPayCard,
        sol: cancelSolPayCard,
        nicepay: cancelNicePayCard,
        compass: cancelCompassPoint
      }
      await cancelMapper[order.pgPaymentResult.pgType](order, $q)
      await pgUpdateOrderStatusToCancel()
    } catch (e) {
      $q.loading.hide()
      $q.notify({
        message: '카드 결제 취소는 실패했지만 주문 상태는 취소처리 됩니다. 카드 취소는 관리자에게 문의해주세요.',
        color: 'negative',
        position: 'top',
        group: false,
        icon: 'error'
      })

      if (shopInfo.value.cancelOrderAlarm) {
        $q.dialog({
          title: '',
          message: '카드 결제 취소에 실패하였습니다, 고객에게 주문 취소 알림톡을 보내시겠습니까?',
          cancel: true,
          persistent: true
        }).onOk(() => {
          pgUpdateOrderStatusToCancel('Y')
        }).onCancel(() => {
          pgUpdateOrderStatusToCancel('N')
        })
      }
    }

    order.printLogGroup.orderStatus = { ...order.printLogGroup.orderStatus, status: 'CANCEL' }
    $q.loading.hide()

    if (refresh) {
      await refresh()
    }
  })
}
