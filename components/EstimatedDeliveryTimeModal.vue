<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOrderListStore } from '~/store/orderListStore'
import { useEstimatedTimeStore } from '~/store/estimatedTimeStore'
import { orderUpdateStatus } from '~/composables/order/useOrderUpdateState'

const $q = useQuasar()

const { order } = storeToRefs(useOrderListStore())
const { modalVisible } = storeToRefs(useEstimatedTimeStore())

const { estimatedTime } = storeToRefs(useEstimatedTimeStore())
const { setEstimatedTime } = useEstimatedTimeStore()
const { updateModalVisible } = useEstimatedTimeStore()

const moreTime = ref(false)

const modalShow = computed(() => {
  return modalVisible.value
})

const selectDeliveryTime = computed({
  get: () => estimatedTime.value,
  set: (val) => {
    setEstimatedTime(val)
  }
})

const deliveryTime = Array.from({ length: 20 }, (_, i) => (i + 1) * 10)

const filterDeliveryTime = computed(() =>
  moreTime.value ? deliveryTime : deliveryTime.filter(time => time <= 120))

const confirmDeliveryTime = async () => {
  if (!estimatedTime.value) {
    $q.notify({
      message: '배달 예상 시간을 입력해주세요.',
      color: 'negative',
      position: 'top'
    })
    return
  }

  updateModalVisible(false)
  await orderUpdateStatus(order.value, $q)
}

const closeModal = () => {
  updateModalVisible(false)
  setEstimatedTime(0)
}

</script>

<template>
  <q-dialog v-model="modalShow">
    <q-card class="delivery_time_popup">
      <q-card-section class="header">
        <div>
          {{ order.orderStatus.status === 'PENDING' ? '총 소요 시간' : '배달 예상 시간' }}
        </div>
        <div class="flex row justify-between items-center">
          <span class="orderType">{{ order.delivery?'배달':'포장' }}</span>
          <q-btn>
            <q-icon name="close" @click="closeModal" />
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section>
        <template v-if="!order.takeOut">
          <q-card-section class="q-py-none address">
            <div>
              <q-icon name="fmd_good" />
            </div>
            <div>{{ `${order.printLog[0]?.deliveryAddress} ${order?.printLog[0]?.deliveryDetailAddress}` }}</div>
          </q-card-section>
        </template>

        <div class="row q-pa-md">
          <div v-for="(time,idx) in filterDeliveryTime" :key="idx" class="col-3 time-wrapper">
            <q-radio
              v-model="selectDeliveryTime"
              :class="selectDeliveryTime===time&&'selectedTime'"
              class="time"
              :val="time"
              :label="String(time)"
            >
              <span>분</span>
            </q-radio>
          </div>
          <q-btn class="more_btn" @click="moreTime = !moreTime">
            {{ moreTime ? 'less ▲' : 'more ▼' }}
          </q-btn>
        </div>
        <div class="text-subtitle">
          으로 {{ order.orderStatus.status === 'PENDING' ? '총 소요 시간' : '배달 예상 시간' }}을 안내합니다.
        </div>

        <q-card-actions class="footer">
          <q-btn label="닫기" color="grey" @click="closeModal" />
          <q-btn label="확인" color="primary" @click="confirmDeliveryTime" />
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.q-dialog__inner--minimized > div{
  max-width: 55vw;
}

.delivery_time_popup {
  max-height: 80vh;
  width: 55vw;

  .header{
    background-color: var(--handorder-color);
    color: #fff;
    font-size: 1.7em;
    padding: 7px 13px;
    display: flex;
    justify-content: space-between;

  .orderType{
    padding: 2px 5px;
    background-color: #fff;
    border-radius: 3px;
    color: var(--handorder-color);
    font-size: 0.7em;
    font-weight: bold;
    margin-right: 10px;
  }
    :deep(.q-btn){
      padding: 0;
    }
  }

  .address{
    display: flex;
    align-items: center;
    font-weight: 500;

    div:nth-child(1){
      color:var(--handorder-color);
      font-size: 2em;
      transform: translateY(-0.2em);
    }

    div:nth-child(2){
      font-size: 1.3em;
      letter-spacing: -0.3px;
    }
  }

  .time-wrapper{
    display: flex;
    align-items: stretch;
    justify-content: stretch;;

    .time{
      background-color: #EEEEEE;
      padding: 15px;
      border-radius: 5px;
      width: 100%;
      margin: 5px;
      display: flex;
      justify-content: center;
      font-size: 1.5em;
      font-weight: bold;

      &:hover{
        background-color: rgba(255, 139, 74, 0.59);
        color: #fff;
      }
    }

    .selectedTime{
      background-color: var(--handorder-color);
      color: #fff;
    }
  }

  .more_btn{
    width: 100%;
    background-color: #f5f5f5;
    color: #818181;
  }

  .text-subtitle{
    text-align: center;
    font-size: 1.4em;
    font-weight: 500;
    letter-spacing: -0.2px;
  }

  .footer{
    display: flex;
    justify-content: center;
  }
}
:deep(.q-btn){
  padding: 0 15px;
  border-radius: 3px;
}

:deep(.block){
  font-size: 1.3em;
}

:deep(.q-radio__inner){
  display: none;
}
</style>
