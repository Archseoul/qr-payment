<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { getTimeFormat } from '~/utils/getTimeFormat'
import NewOrderBar from '~/components/order-popup/NewOrderBar.vue'
import MenuList from '~/components/order-popup/MenuList.vue'
import OrderInfo from '~/components/order-popup/OrderInfo.vue'
import { useOrderListStore } from '~/store/orderListStore'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useOrderPrint } from '~/composables/order/useOrderPrint'
import TimeInput from '~/components/order-popup/TimeInput.vue'
import OrderBar from '~/components/order-popup/OrderBar.vue'
import { useEstimatedTimeStore } from '~/store/estimatedTimeStore'

const { order } = storeToRefs(useOrderListStore())
const { shopInfo } = storeToRefs(useShopInfoStore())
const { estimatedTime } = storeToRefs(useEstimatedTimeStore())
const { setEstimatedTime } = useEstimatedTimeStore()
const $q = useQuasar()

const props = defineProps<{
  orderPopup: boolean
  orderFlag: string
}>()

const emit = defineEmits<(e: 'update:order-popup', value: boolean) => void>()

const visible = computed({
  get: () => props.orderPopup,
  set: (val) => {
    emit('update:order-popup', val)
  }
})

const closePopup = () => {
  visible.value = false
  if (estimatedTime.value) {
    setEstimatedTime(0)
  }
}

provide('closePopup', closePopup)

const orderPrint = () => {
  useOrderPrint(order.value, $q)
}

const shouldShowTimeInput = computed(() => {
  return order.value.delivery || (order.value.takeOut && order.value.orderStatus.status === 'PENDING')
})

</script>

<template>
  <q-dialog v-if="order.orderStatus" v-model="visible">
    <q-card class="popup-container">
      <template v-if="props.orderFlag==='newOrder'">
        <NewOrderBar @update:close-popup="closePopup" />
      </template>
      <template v-else-if="props.orderFlag==='printOrder'">
        <OrderBar @update:close-popup="closePopup">
          <span class="order-time">{{ `주문일시 ${getTimeFormat(order.insDate)}` }}</span>
          <q-btn class="print-btn" @click.stop="orderPrint">
            주문서 재출력
          </q-btn>
        </OrderBar>
      </template>
      <template v-else>
        <OrderBar @update:close-popup="closePopup">
          <span class="order-time">{{ `주문일시 ${getTimeFormat(order.insDate)}` }}</span>
        </OrderBar>
      </template>

      <q-card-section class="popup-main">
        <div v-if="order && order.orderStatus" class="menu-list-wrap">
          <MenuList />
        </div>
        <div v-if="shopInfo.requestActive || order.delivery || order.takeOut" class="order-info-wrap">
          <OrderInfo />
          <template v-if="shouldShowTimeInput">
            <TimeInput />
          </template>
        </div>
      </q-card-section>
      <q-card-actions class="popup-footer">
        <slot />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.popup-container{
  min-width: 700px;
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow:visible;

  .order-time{
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.8);
    + .q-btn{
      margin-left: 10px;
    }
  }

  .print-btn{
    font-weight: 700;
    background-color: #fff;
    color: var(--handorder-color);
    border-radius: 0;
  }

  .popup-main {
    flex: 1;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    height: 70%;

    .menu-list-wrap{
      border: 1px solid #e1e1e1;
    }

    .menu-list-wrap,
    .order-info-wrap{
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .order-info-wrap{
      position: relative;
    }
  }

  .popup-footer{
    display: flex;
    justify-content: center;
    color:#fff;
    padding-top:0;
    gap: 5px;
    > *{
      border-radius: 0;
      font-weight: 600;
    }
    .cancel-btn{
      background-color: #F55B4F;
    }
    .confirm-btn{
      background-color: var(--handorder-color);
      color: #fff;
    }
  }
}

</style>
