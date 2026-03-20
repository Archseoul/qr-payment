<script setup lang="ts">
import type { Ref } from 'vue'
import type { ShopInfoVo } from '~/types'

const shopInfo = inject<Ref<ShopInfoVo>>('shopInfo')

const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, '')
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const amount = ref(formatCurrency(String(shopInfo?.value.minimumAmount)) || '0')

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement

  if (input.value.startsWith('0') && input.value.length > 1) {
    input.value = input.value.substring(1)
  }

  amount.value = formatCurrency(input.value)

  if (shopInfo?.value) {
    const numericValue = input.value.replace(/[^\d]/g, '')
    shopInfo.value.minimumAmount = parseInt(numericValue, 10) || 0
  }
}

watch(() => shopInfo?.value.minimumAmount, () => {
  amount.value = formatCurrency(String(shopInfo?.value.minimumAmount)) || '0'
})
</script>

<template>
  <div v-if="shopInfo" class="wrap">
    <div class="header">
      <p>최소 주문 금액 설정</p>
      <span>배달 주문 시 고객의 최소 주문 금액을 설정할 수 있습니다.</span>
    </div>
    <div class="body">
      <input
        v-model="amount"
        type="text"
        autofocus
        maxlength="11"
        @input="onInput"
      >
      <span>원</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wrap{
  height: 100%;
  display: flex;
  flex-direction: column;
  .header{
    letter-spacing: -0.6px;

    p{
      font-size: 1.2em;
      font-weight: 700;
      margin: 0;
    }

    span{
      color: #AEAEAE;
      font-size: 0.8em;
    }
  }

  .body{
    padding-top: 10px;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;

    input{
      width: 50%;
      height: 25%;
      text-align: center;
      font-size: 1.2em;
      border: 1px solid #C2C2C2;
      border-radius: 5px;
      margin-right: 5px;
    }
  }
}
</style>
