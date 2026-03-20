<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { QInput } from 'quasar'
import { useOrderListStore } from '~/store/orderListStore'
import { useEstimatedTimeStore } from '~/store/estimatedTimeStore'

const { order } = storeToRefs(useOrderListStore())
const { estimatedTime } = storeToRefs(useEstimatedTimeStore())
const { setEstimatedTime } = useEstimatedTimeStore()

const time = computed({
  get: () => estimatedTime.value,
  set: (val) => {
    setEstimatedTime(val)
  }
})

watch(time, (value) => {
  setEstimatedTime(value)
})

const sanitizeTimeInput = (value: string | number) => {
  const sanitized = parseInt(String(value || 0), 10)
  time.value = isNaN(sanitized) ? 0 : sanitized
}

const increment = () => {
  const numericTime = parseInt(String(time.value || 0), 10)
  if (numericTime < 200) {
    time.value = numericTime + 10
  }
}

const decrement = () => {
  const numericTime = parseInt(String(time.value || 0), 10)
  if (numericTime >= 10) {
    time.value = numericTime - 10
  }
}

</script>

<template>
  <div class="time-container">
    <div v-if="order.delivery && order.orderStatus.status !=='PENDING'" class="title">
      배달 소요시간
    </div>
    <div v-else class="title">
      총 소요시간
    </div>
    <div class="content-wrap">
      <q-btn
        outline
        round
        color="primary"
        icon="remove"
        size="sm"
        :disable="order.orderStatus.status === 'CANCEL' || order.orderStatus.status === 'COMPLETE'"
        @click="decrement"
      />
      <div class="input-wrap">
        <q-input
          v-model="time"
          type="number"
          borderless
          dense
          class="input"
          placeholder="0"
          :disable="order.orderStatus.status === 'CANCEL' || order.orderStatus.status === 'COMPLETE'"
          :autofocus="false"
          @blur="sanitizeTimeInput(time)"
        />
        <span>분</span>
      </div>
      <q-btn
        round
        color="primary"
        icon="add"
        size="sm"
        :disable="order.orderStatus.status === 'CANCEL' || order.orderStatus.status === 'COMPLETE'"
        @click="increment"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.time-container{
  display: flex;
  position:absolute;
  bottom:0;
  align-items: center;
  justify-content: center;
  .title{
    letter-spacing: -1.5px;
    font-weight: 700;

  }
  .content-wrap {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 60%;
    margin-left: 10px;

    .input-wrap{
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0.5px solid #808080;
      border-radius:20px;
      margin:0 5px;

      .input{
        height: 30px;
        width: 30%;
        :deep(.q-field__native[type="number"]){
          height: 30px;
          text-align: center;
        }
      }

      span{
        font-size: 0.9em;
        font-weight: bold;
        color: var(--handorder-color);
      }
    }
  }
}

:deep(.q-field__native[type="number"])::-webkit-outer-spin-button,
:deep(.q-field__native[type="number"])::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

:deep(.q-field__native[type="number"]) {
  -moz-appearance: textfield;
}
</style>
