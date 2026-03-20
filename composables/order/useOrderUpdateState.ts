import { storeToRefs } from 'pinia'
import type { QVueGlobals } from 'quasar'
import type { HoPrintLogGroupVo } from '~/types'
import { useOrderListStore } from '~/store/orderListStore'
import { handleOrderStatus } from '~/composables/order/handleOrderStatus'
import { validateTime } from '~/utils/validationTime'
import { useEstimatedTimeStore } from '~/store/estimatedTimeStore'
import { useSetDeliveryOrTakeoutTime } from '~/composables/order/useSetDeliveryOrTakeoutTime'
import { useShopInfoStore } from '~/store/shopInfoStore'

export const orderUpdateStatus = async (order:HoPrintLogGroupVo, $q:QVueGlobals) => {
  const { orderList } = storeToRefs(useOrderListStore())
  const { shopInfo } = storeToRefs(useShopInfoStore())
  const { fetchOrderList } = useOrderListStore()
  const { estimatedTime } = storeToRefs(useEstimatedTimeStore())
  const route = useRoute()

  const confirmStoreDialog = (orderStatus: string, ok: () => Promise<boolean>) => {
    return new Promise<boolean>((resolve) => {
      $q.dialog({
        title: (() => {
          if (shopInfo.value.acceptOrderButtonActive) {
            switch (orderStatus) {
              case 'PENDING':
                return '주문 접수'
              case 'CONFIRM':
                return '조리 완료'
            }
          } else {
            return '조리 완료'
          }
        })(),
        message: (() => {
          if (shopInfo.value.acceptOrderButtonActive) {
            switch (orderStatus) {
              case 'PENDING':
                return '주문을 접수하시겠습니까?'
              case 'CONFIRM':
                return '조리 완료 처리하시겠습니까?'
            }
          } else {
            return '조리 완료 처리하시겠습니까?'
          }
        })(),
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const result = await ok()
        resolve(result)
      }).onCancel(() => {
        resolve(false)
      })
    })
  }

  const confirmDeliveryNotify = (orderStatus:string) => {
    $q.notify({
      message: orderStatus === 'CONFIRM' ? '주문이 접수 되었습니다.' : '조리 완료 처리되었습니다.',
      color: 'positive'
    })
  }

  const errorDialog = (orderStatus:string) => {
    $q.dialog(
      {
        title: '오류',
        message: (() => {
          switch (orderStatus) {
            case 'CONFIRM':
              return '이미 주문 접수된 상품입니다.'
            case 'COMPLETE':
              return '이미 조리 완료된 상품입니다.'
            case 'CANCEL':
              return '이미 주문 취소된 상품입니다.'
          }
        })(),
        cancel: false,
        persistent: true
      }
    )
  }

  const getOrderUpdate = async () => {
    await fetchOrderList(route.params.shopCode as string)
    return orderList.value?.find(obj => obj.printLogGroup.printGroupUuid === order.printGroupUuid)?.printLogGroup
  }

  //디비에 저장된 orderStatus값과 현재 orderStatus 값이 같은지 확인. 다르다면 에러
  const processOrderStatus = async () => {
    const updateOrder = await getOrderUpdate()
    if (order.orderStatus.status !== updateOrder?.orderStatus.status) {
      errorDialog(order.orderStatus.status)
      return false
    }
    await handleOrderStatus(order)
    return true
  }

// 배달 주문이 아니거나, 포장 주문인데 주문 접수 상태가 아닌경우 (배달, 포장(주문접수)는 예상 배달 시간 통신 후 접수되야 되기 때문)
  if ((!order.delivery && !order.takeOut) || (order.takeOut && order.orderStatus.status !== 'PENDING')) {
    return await confirmStoreDialog(order.orderStatus.status, processOrderStatus)
  } else {
    const validate = validateTime(estimatedTime.value, $q)
    if (!validate) { return validate }
    await useSetDeliveryOrTakeoutTime(order, estimatedTime.value)
    const result = await processOrderStatus()
    confirmDeliveryNotify(order.orderStatus.status)
    return result
  }
}
