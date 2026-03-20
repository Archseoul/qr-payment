<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOrderListStore } from '~/store/orderListStore'
const { order } = storeToRefs(useOrderListStore())

const emit = defineEmits(['update:close-popup'])

</script>

<template>
  <q-card-section class="bar-wrap">
    <div class="popup-info">
      <span>{{ order.orderStatus.orderCode }}</span>
      <span v-if="!order.delivery && !order.takeOut" class="store">매장</span>
      <span v-else-if="order.takeOut" class="takeOut">포장</span>
      <span v-else class="delivery">배달</span>
    </div>
    <div class="popup-actions">
      <slot />
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
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: var(--handorder-color);
  color: #fff;

  .popup-info{
    font-weight: 700;
    span:first-child{
      font-size: 1.4rem;
      margin-right: 15px;
    }

    span:last-child{
      font-size: 1.1rem;
      padding: 2px 7px;
      border-radius: 5px;
    }

    .store{
      background-color: #fff;
      color: var(--handorder-color);
    }

    .takeOut{
      background-color: #1FD215;
      color: #fff;
    }

    .delivery{
      background-color: #4B66ED;
      color: #fff;
    }
  }

  .popup-actions{
    display: flex;
    align-items: center;

    .close-btn{
      display: flex;
      font-size: 1.6em;
      cursor: pointer;
      margin-left: 10px;
    }
  }
}

</style>
