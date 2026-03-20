<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { HoPrintLogVo } from '~/types'

import { useOrderListStore } from '~/store/orderListStore'

const { order } = storeToRefs(useOrderListStore())

const getTotalPrice = (menuList:HoPrintLogVo[]) => {
  let totalPrice = 0
  menuList.forEach((order:HoPrintLogVo) => {
    totalPrice += order.finalPrice
  })
  return totalPrice
}

const getTotalQuantity = (menuList:HoPrintLogVo[]) => {
  let totalQuantity = 0
  menuList.forEach((order:HoPrintLogVo) => {
    totalQuantity += order.quantity
  })
  return totalQuantity
}

</script>

<template>
  <div class="title">
    <span>주문상품</span>
    <div v-if="order.orderStatus.status==='CANCEL'" :style="{ color: 'red' }">
      취소된 주문
    </div>
  </div>
  <div class="sub-title">
    <span class="column-menu">상품</span>
    <span class="column-quantity">개수</span>
    <span class="column-price">가격</span>
  </div>
  <div class="content" :class="order.orderStatus.status==='CANCEL'?'cancel-order':''">
    <div v-for="menu in order.printLog" :key="menu.menuSeq" class="row-align">
      <div class="column-menu q-mb-sm">
        <span>{{ menu.menuName }}</span>
        <div>
          <div v-for="option in menu.printLogMenuOptionList" :key="option.optionUuid" class="option-wrap flex q-pl-md">
            <span>ㄴ</span>
            <div>
              <span>{{ `${option.optionGroupName}(${option.optionName})` }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="column-quantity">
        {{ menu.quantity }}
      </div>
      <div class="column-price">
        {{ menu.menuPrice }}
        <div v-for="option in menu.printLogMenuOptionList" :key="option.optionUuid" class="option-wrap">
          <span>{{ option.optionPrice.toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="total-price" :class="order.orderStatus.status==='CANCEL'?'cancel-order':''">
    <div class="column-menu">
      총 금액
    </div>
    <div class="column-quantity">
      {{ getTotalQuantity(order.printLog).toLocaleString() }}
    </div>
    <div class="column-price">
      {{ `${getTotalPrice(order.printLog).toLocaleString()}원` }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.title{
  font-weight: 700;
  font-size:1.2em;
  padding: 5px;
  border-bottom: 1px solid #e1e1e1;
  letter-spacing: -1.5px;
  display: flex;
  justify-content: space-between;
}

.sub-title{
  display: flex;
  padding: 5px 10px;
  font-size: 0.8em;
  background-color: #f5f5f5;
  color: #818181;
  font-weight: 600;
}

.content{
  overflow-y: auto;
  padding: 5px 10px;
  font-size: 0.9em;
  height: 100%;

  .row-align{
    display: flex;
  }
}

.column-menu{
  width:60%;
  >span{
    font-weight: 700;
  }
}

.cancel-order{
  >*{
    text-decoration:line-through;
  }
}

.column-quantity {
  width:20%;
  text-align: center;
}

.column-price {
  text-align: end;
  width:30%;
}

.option-wrap{
  color: #8c8c8c;
  font-size: 0.9em;
  flex-wrap: nowrap;
}

.total-price{
  display: flex;
  background-color: #f5f5f5;
  padding: 5px 10px;
  font-weight: 700;
  border-top: 1px solid #e1e1e1;
}

div::-webkit-scrollbar {
  width: 8px;
}

div::-webkit-scrollbar-thumb {
  background-color: #5d5d5d;
  border-radius: 2px;
}

div::-webkit-scrollbar-track {
  background-color: #cccccc;
}
</style>
