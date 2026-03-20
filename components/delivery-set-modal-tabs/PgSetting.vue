<script setup lang="ts">
import type { QSelectProps } from 'quasar'
import type { Ref } from 'vue'
import type { PgCode, PgInfoVo, ShopInfoVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'
import DeliveryPgInfoInsertBox from '~/components/DeliveryPgInfoInsertBox.vue'

const shopInfo = inject<Ref<ShopInfoVo>>('shopInfo')
const shop = computed(() => shopInfo?.value ?? null)

const pgList:Ref<PgInfoVo[] | null> = ref(null)

const pgListOptions = computed<QSelectProps['options']>(() => {
  const options = pgList.value?.map(pg => ({
    label: pg.pgName,
    value: pg.pgCodeName
  })) ?? []

  return [
    { label: '선택 안함', value: null },
    ...options
  ]
})

const assignPgInfo = (pgCode: PgCode) => {
  const pgCodeMapper:Record<PgCode, () => void> = {
    hecto: () => {
      if (!shop.value) { return }
      if (!shop.value.hectoPaymentInfo) {
        shop.value.hectoPaymentInfo = {
          hectoPaymentInfoSeq: 0,
          mid: '',
          shopSeq: shop.value!.shopSeq,
          privacyKey: '',
          hashKey: '',
          tid: ''
        }
      }
    },
    kis: () => {
      if (!shop.value) { return }
      if (!shop.value.kisPaymentInfo) {
        shop.value!.kisPaymentInfo = {
          kisPaymentInfoSeq: 0,
          shopSeq: shop.value!.shopSeq,
          mid: '',
          merchantKey: '',
          tid: ''
        }
      }
    },
    kovan: () => {
    },
    smartro: () => {
      if (!shop.value) { return }
      if (!shop.value.smartroPaymentInfo) {
        shop.value.smartroPaymentInfo = {
          smartroPaymentInfoSeq: 0,
          shopSeq: shop.value!.shopSeq,
          mid: '',
          merchantKey: '',
          tid: '',
          cancelPassword: ''
        }
      }
    },
    nice: () => {
      if (!shop.value) { return }
      if (!shop.value.nicePaymentInfo) {
        shop.value.nicePaymentInfo = {
          nicePaymentInfoSeq: 0,
          shopSeq: shop.value!.shopSeq,
          mid: '',
          merchantKey: '',
          tid: ''
        }
      }
    },
    kcp: () => {
      if (!shop.value) { return }
      if (!shop.value.kcpPaymentInfo) {
        shop.value.kcpPaymentInfo = {
          kcpPaymentInfoSeq: 0,
          shopSeq: shop.value!.shopSeq,
          siteCd: '',
          certFilePath: '',
          certFileName: '',
          kcpCertInfo: '',
          cancelCertPath: '',
          cancelCertName: '',
          certPassword: ''
        }
      }
    }
  }
  pgCodeMapper[pgCode]()
}

onMounted(async () => {
  const { data } = await useCustomFetch<PgInfoVo[]>('/admin/handOrder/pg/list', {
    method: 'GET'
  })
  pgList.value = data.value
})
</script>

<template>
  <div v-if="shopInfo" class="wrap">
    <div class="header">
      <p>PG 설정</p>
      <span>배달 주문의 피지사를 설정할 수 있습니다.</span>
    </div>
    <div class="body">
      <div class="inner-body">
        <div class="input-wrap">
          <div class="flex justify-center items-center bg-grey-3">
            사용 PG
          </div>
          <div>
            <q-select
              v-model="shopInfo.deliveryPgCode"
              :options="pgListOptions"
              emit-value
              map-options
              dense
              outlined
              @update:model-value="assignPgInfo"
            />
          </div>
        </div>

        <DeliveryPgInfoInsertBox v-model="shopInfo" />
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.wrap{
  display: flex;
  flex-direction: row;
  height: 100%;

  .header{
    letter-spacing: -0.6px;
    width: 100%;
    height: 20%;
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
    height: 80%;
    width: 100%;
    overflow-y: auto;

    .inner-body{
      padding-top: 10px;
      .input-wrap {
        display: flex;
        margin-bottom: 10px;
        div:nth-child(1){
          width: 25%;
        }
        div:nth-child(2){
          flex-grow: 1;
        }
      }
    }
  }
}
</style>
