<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOrderListStore } from '~/store/orderListStore'
import {getTimeFormat} from "~/utils/getTimeFormat";
const { newOrderList, order } = storeToRefs(useOrderListStore())

const emit = defineEmits(['update:close-popup'])

</script>

<template>
  <q-card-section class="bar-wrap">
    <div v-if="newOrderList.length > 1" class="new-circle">
      <div class="new-text">
        New
      </div>
      <div class="count-item">
        {{ newOrderList.length }}
      </div>
    </div>
    <div class="popup-info">
      <span>신규 주문</span>
      <span v-if="order.takeOut">(포장)</span>
      <span v-else-if="order.delivery">(배달)</span>
      <span v-else>{{ `(${order.tableNum}번 테이블)` }}</span>
    </div>
    <div class="popup-actions">
      <div class="order-time">
        <span>주문일시</span>
        <span>{{ getTimeFormat(order.insDate) }}</span>
      </div>
      <div class="close-btn">
        <q-icon name="close" @click="emit('update:close-popup')" />
      </div>
    </div>
  </q-card-section>
</template>

<style scoped lang="scss">
.bar-wrap {
  cursor: default;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: var(--handorder-color);
  color: #fff;
  position: relative;

  .new-circle{
    font-weight: 700;
    text-align: center;
    position: absolute;
    right: -20px;
    top: -50px;
    color:var(--handorder-color);
    font-size: 1.3em;

    >.count-item{
      background-color: #fff;
      padding: 5px;
      border-radius: 50%;
    }

  }

  .popup-info{
    font-size: 1.4em;
    font-weight: 700;
    display: flex;
    gap: 5px;
  }

  .popup-actions{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    position: absolute;
    right:10px;

    .order-time{
      display: flex;
      gap: 5px;
      font-size: 0.9em;
      color: rgba(255, 255, 255, 0.8);
    }

    .close-btn{
      display: flex;
      font-size: 1.6em;
      cursor: pointer;
    }
  }
}
</style>
