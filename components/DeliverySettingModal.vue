<script setup lang="ts">
import type { Ref } from 'vue'
import type { ShopInfoVo } from '~/types'
import PgSetting from '~/components/delivery-set-modal-tabs/PgSetting.vue'
import TableSetting from '~/components/delivery-set-modal-tabs/TableSetting.vue'
import MinimumAmountSetting from '~/components/delivery-set-modal-tabs/MinimumAmountSetting.vue'

const props = defineProps<{
  deliveryModalVisible: boolean
}>()

const emit = defineEmits<{
  'close:delivery-modal-visible':[];
  'update:delivery-setting': [];
}>()

const $q = useQuasar()

const visible = computed({
  get () {
    return props.deliveryModalVisible
  },
  set () {
    emit('close:delivery-modal-visible')
  }
})

const shopInfo = inject<Ref<ShopInfoVo>>('shopInfo')

const selectedTableSeqs = ref<string[] | []>([])

const updateSelectTb = (value:string[] | []) => {
  selectedTableSeqs.value = value
}

const putShopInfo = async () => {
  if (shopInfo?.value) {
    await customFetch('/admin/handOrder/shop', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: shopInfo.value,
      onResponseError: (context) => {
        $q.notify({
          type: 'negative',
          message: `매장 정보 수정에 실패하였습니다. 상태 코드: ${context.response.status} ${context.response.statusText}`
        })
      }
    })
  }
}

const putDeliveryTableInfo = async () => {
  await customFetch(`/admin/handOrder/delivery/table/${shopInfo?.value.shopSeq}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: selectedTableSeqs.value,
    onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
      $q.notify({
        type: 'negative',
        message: `테이블 정보 수정에 실패하였습니다. 상태 코드: ${context.response.status} ${context.response.statusText}`
      })
    }
  })
}

const kcpCertFile = ref<File | null>(null)
const kcpCancelCertFile = ref<File | null>(null)

provide('kcpCertFile', kcpCertFile)
provide('kcpCancelCertFile', kcpCancelCertFile)

const sendCertFile = async () => {
  if (kcpCertFile.value && shopInfo?.value.kcpPaymentInfo) {
    const formData = new FormData()
    formData.append('file', kcpCertFile.value)

    shopInfo.value.kcpPaymentInfo.certFilePath = await customFetch<string>('/admin/handOrder/shop/' + shopInfo.value.shopCode + '/kcp-cert', {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `인증서 업로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onRequestError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `인증서 업로드에 실패하였습니다. ${ctx.error.message}`
        })
      }
    })
    shopInfo.value.kcpPaymentInfo.certFileName = kcpCertFile.value.name
  }
}
const sendCancelCertFile = async () => {
  if (kcpCancelCertFile.value && shopInfo?.value.kcpPaymentInfo) {
    const formData = new FormData()
    formData.append('file', kcpCancelCertFile.value)
    shopInfo.value.kcpPaymentInfo.cancelCertPath = await customFetch<string>('/admin/handOrder/shop/' + shopInfo.value.shopCode + '/kcp-cancel-cert', {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `취소 인증서 업로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onRequestError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `취소 인증서 업로드에 실패하였습니다. ${ctx.error.message}`
        })
      }
    })
    shopInfo.value.kcpPaymentInfo.cancelCertName = kcpCancelCertFile.value.name
  }
}

const fetch = async () => {
  await putShopInfo()
  await putDeliveryTableInfo()
  emit('update:delivery-setting')
}

const submit = async () => {
  if (shopInfo?.value) {
    $q.loading.show()

    try {
      // if (!shopInfo?.value.isDeliveryUse) {
      //   shopInfo.value.deliveryPgCode = null
      //   shopInfo.value.minimumAmount = 0
      //   selectedTableSeqs.value = []
      //
      //   await fetch()
      //   $q.loading.hide()
      //
      //   return
      // }

      if (selectedTableSeqs.value.length !== 0 && shopInfo?.value.deliveryPgCode === null) {
        $q.loading.hide()
        $q.notify({
          type: 'negative',
          message: 'PG를 선택해주세요.'
        })
        return
      }

      const pgValidations: Record<string, () => boolean> = {
        hecto: () => !!(shopInfo.value.hectoPaymentInfo?.hashKey && shopInfo.value.hectoPaymentInfo?.mid && shopInfo.value.hectoPaymentInfo?.privacyKey),
        kis: () => !!(shopInfo.value.kisPaymentInfo?.merchantKey && shopInfo.value.kisPaymentInfo?.mid),
        smartro: () => !!(shopInfo.value.smartroPaymentInfo?.cancelPassword && shopInfo.value.smartroPaymentInfo?.mid && shopInfo.value.smartroPaymentInfo?.merchantKey),
        nice: () => !!(shopInfo.value.nicePaymentInfo?.mid && shopInfo.value.nicePaymentInfo?.merchantKey),
        kcp: () => !!(shopInfo.value.kcpPaymentInfo?.siteCd && shopInfo.value.kcpPaymentInfo?.certPassword &&
            (kcpCertFile.value || shopInfo.value.kcpPaymentInfo?.certFileName) &&
            (kcpCancelCertFile.value || shopInfo.value.kcpPaymentInfo?.cancelCertName))
      }

      // PG 검증 함수 실행
      const pgCode = shopInfo?.value.deliveryPgCode
      if (pgCode && pgValidations[pgCode] && !pgValidations[pgCode]()) {
        $q.loading.hide()
        $q.notify({
          type: 'negative',
          message: 'PG 정보를 입력해주세요.'
        })
        return
      }

      // if (shopInfo?.value.deliveryPgCode && selectedTableSeqs.value.length === 0) {
      //   $q.loading.hide()
      //   $q.notify({
      //     type: 'negative',
      //     message: '최소 한 개 이상의 테이블을 선택해주세요.'
      //   })
      //   return
      // }

      await Promise.all([
        sendCertFile(),
        sendCancelCertFile()
      ])

      // if (!shopInfo.value?.acceptOrderButtonActive) {
      //   shopInfo.value.acceptOrderButtonActive = true
      //   $q.notify({
      //     type: 'info',
      //     message: '배달을 활성화하여 주문 수락이 활성화 됩니다.'
      //   })
      // }

      await fetch()

      $q.loading.hide()

      $q.notify({
        type: 'positive',
        message: '배달 설정이 완료되었습니다.'
      })
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: '매장 정보 수정에 실패하였습니다.'
      })
      $q.loading.hide()
    }
  }
}
</script>

<template>
  <q-dialog v-model="visible">
    <q-card v-if="shopInfo" class="modal-wrap">
      <div class="bg-primary flex justify-end">
        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          @click="visible = false"
        />
      </div>
      <div class="q-py-xs q-px-md">
        <q-card-section class="flex q-py-none justify-end toggle-wrap">
          <template v-if="shopInfo.posCode==='lynk' && shopInfo.mappedStoreCode !== null">
            <div>
              <div :class="shopInfo.isDeliveryUse ? 'green' : 'red'" />
            </div>
            <div class="flex items-center">
              <p class="text-bold q-ma-none text-h6">
                {{ shopInfo.isDeliveryUse ? '배달 개점 상태' : '배달 마감 상태' }}
              </p>
            </div>
          </template>
          <template v-else>
            <div>
              <q-toggle v-model="shopInfo.isDeliveryUse" size="md" />
            </div>
            <div class="flex items-center">
              <p class="text-bold q-ma-none text-h6">
                배달 활성화
              </p>
            </div>
          </template>
        </q-card-section>
        <q-card-section class="q-pt-none content-wrap">
          <el-tabs
            class="tab"
            type="border-card"
          >
            <el-tab-pane label="PG">
              <PgSetting />
            </el-tab-pane>
            <el-tab-pane label="배달 테이블">
              <TableSetting @update:selected-table-seqs="updateSelectTb" />
            </el-tab-pane>
            <el-tab-pane label="최소 주문 금액">
              <MinimumAmountSetting />
            </el-tab-pane>
          </el-tabs>
        </q-card-section>
      </div>
      <q-card-actions align="center" class="q-pt-none">
        <q-btn label="설정 저장" color="primary" dense @click="submit" />
        <q-btn label="닫기" color="grey" dense @click="visible = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.modal-wrap{
  width: 40vw;
  height: 62vh;
  display: flex;
  flex-direction: column;

  >div:nth-child(1){
    height: 8%;
  }

  >div:nth-child(2){
    height: 82%;
    .toggle-wrap{
      height: 10%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
    }
    .content-wrap{
      height: 90%;
    }
  }

  >div:nth-child(3){
    height: 10%;
  }
}

.tab{
  height: 100%;
}

:deep(.el-tabs__content){
  height: calc(100% - 40px);
}

:deep(.el-tab-pane){
  height: 100%;
}

:deep(.el-tabs--border-card>.el-tabs__header .el-tabs__item.is-active) {
  color: black;
}

:deep(.el-tabs--border-card>.el-tabs__header .el-tabs__item:not(.is-disabled):hover){
  color:  #909399;
}

.q-dialog__inner--minimized > div {
  max-width: none;
}

.q-btn--rectangle{
  border-radius: 0;
}

.green{
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #02ca12;
}

.red{
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: orangered;
}
</style>
