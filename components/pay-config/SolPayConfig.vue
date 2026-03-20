<script setup lang="ts">
import { computed } from 'vue'
import type { ShopInfoVo } from '~/types'

const props = defineProps<{
  modelValue: ShopInfoVo
  shopUpdate: boolean
}>()

const emits = defineEmits<{
  'update:modelValue': [ShopInfoVo]
}>()

const shopData = computed({
  get: () => props.modelValue,
  set: (value: ShopInfoVo) => emits('update:modelValue', value)
})

/** SOL Pay 사용 시 초기 데이터 생성 */
const setSolPayInitialData = () => {
  if (shopData.value.solPayInfo) {
    return
  }

  shopData.value = {
    ...shopData.value,
    solPayInfo: {
      merchantId: '',
      merchantKey: '',
      cancelPw: '',
      shopSeq: shopData.value.shopSeq,
      solPayInfoSeq: 0
    }
  }
}
</script>

<template>
  <q-card-section class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md ">
      신한 SOL Pay 설정
    </div>

    <q-checkbox
      v-model="shopData.solPayUse"
      label="사용 여부"
      outlined
      :disable="!shopUpdate"
      @update:model-value="setSolPayInitialData"
    />

    <template v-if="shopData.solPayUse && shopData.solPayInfo">
      <q-list>
        <q-item>
          <q-input
            v-model="shopData.solPayInfo.merchantId"
            label="Merchant ID"
            outlined
            dense
            class="full-width"
            :readonly="!shopUpdate"
          />
        </q-item>

        <q-item>
          <q-input
            v-model="shopData.solPayInfo.merchantKey"
            label="Merchant Key"
            outlined
            dense
            class="full-width"
            :readonly="!shopUpdate"
          />
        </q-item>

        <q-item>
          <q-input
            v-model="shopData.solPayInfo.cancelPw"
            label="취소 비밀번호"
            outlined
            dense
            class="full-width"
            :readonly="!shopUpdate"
          />
        </q-item>
      </q-list>
    </template>
  </q-card-section>
</template>

<style scoped lang="scss">
</style>
