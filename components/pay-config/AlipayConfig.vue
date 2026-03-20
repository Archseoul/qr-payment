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

const useYn = ref(false)

/** Alipay 사용 시 초기 데이터 생성 */
const setAlipayInitialData = () => {
  if (shopData.value.alipayPaymentInfo) {
    shopData.value.alipayPaymentInfo.useYn = useYn.value
    return
  }

  shopData.value = {
    ...shopData.value,
    alipayPaymentInfo: {
      mid: '',
      merchantKey: '',
      useYn: false,
      shopSeq: shopData.value.shopSeq,
      alipayPaymentInfoSeq: 0
    }
  }
}

onBeforeMount(() => {
  if (shopData.value.alipayPaymentInfo) {
    useYn.value = shopData.value.alipayPaymentInfo.useYn
  }
})
</script>

<template>
  <q-card-section class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md ">
      알리페이 설정
    </div>

    <q-checkbox
      v-model="useYn"
      label="사용 여부"
      outlined
      :disable="!shopUpdate"
      @update:model-value="setAlipayInitialData"
    />

    <template v-if="shopData.alipayPaymentInfo && useYn">
      <q-list>
        <q-item>
          <q-input
            v-model="shopData.alipayPaymentInfo.mid"
            label="MID"
            outlined
            dense
            class="full-width"
            :readonly="!shopUpdate"
          />
        </q-item>

        <q-item>
          <q-input
            v-model="shopData.alipayPaymentInfo.merchantKey"
            label="Merchant Key"
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
