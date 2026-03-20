<script setup lang="ts">
import { pgFields, pgInitialData } from '~/constants/shop'
import type { PgCode, PgInfoVo, PgPaymentInfoVo, ShopInfoVo } from '~/types'
import { downloadFile } from '~/utils/file'

const props = defineProps<{
  modelValue: ShopInfoVo
  kcpCertFile: File | null
  kcpCancelCertFile: File | null;
  shopUpdate: boolean;
}>()
const emits = defineEmits<{
  'update:modelValue': [ShopInfoVo];
  'update:kcpCertFile': [File|null];
  'update:kcpCancelCertFile': [File|null];
}>()

const shopData = computed({
  get: () => props.modelValue,
  set: (value: ShopInfoVo) => emits('update:modelValue', value)
})

const kcpCertFile = computed({
  get: () => props.kcpCertFile,
  set: (value: File | null) => emits('update:kcpCertFile', value)
})

const kcpCancelCertFile = computed({
  get: () => props.kcpCancelCertFile,
  set: (value: File | null) => emits('update:kcpCancelCertFile', value)
})

const pgOptions = ref<Array<{ label: string; value: string|null }>>([])

const { data: pgOptonList } = await useCustomFetch<PgInfoVo[]>('/admin/handOrder/pg/list', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

pgOptions.value = pgOptonList.value?.map((pg: PgInfoVo) => ({   
  label: pg.pgName,
  value: pg.pgCodeName
})) || []

pgOptions.value = pgOptions.value.toReversed()
pgOptions.value.push({ label: '사용 안 함', value: null })
pgOptions.value = pgOptions.value.toReversed()

// /** PG사 목록 조회 후 pgOptions 업데이트 */ 401 에러 뜨면 onResponse로 빠지지 않아서 pgOptions에 할당이 안되는 문제가 있었음
// await useCustomFetch<PgInfoVo[]>('/admin/handOrder/pg/list', {
//   method: 'GET',
//   onResponse: (response) => {
//     pgOptions.value = response.response._data.map((pg: PgInfoVo) => ({
//       label: pg.pgName,
//       value: pg.pgCodeName
//     }))

//     pgOptions.value = pgOptions.value.toReversed()
//     pgOptions.value.push({ label: '사용 안 함', value: null })
//     pgOptions.value = pgOptions.value.toReversed()
//   }
// })

/** PG사 선택 시 초기 데이터 생성 */
const setPgInitialData = (pgCode: PgCode) => {
  if (!pgCode) { return }

  const paymentInfoKey = `${pgCode}PaymentInfo` as keyof typeof shopData.value
  if (shopData.value[paymentInfoKey] || pgCode === 'kovan') {
    return
  }

  shopData.value = {
    ...shopData.value,
    [paymentInfoKey]: {
      ...pgInitialData[pgCode],
      shopSeq: shopData.value.shopSeq
    }
  }
}

/** 현재 선택된 PG사의 설정 필드 목록 */
const currentPgField = computed(() => {
  const pgCode = shopData.value.pgCode
  if (!pgCode || !(pgCode in pgFields)) { return [] }
  return pgFields[pgCode]
})

/**
 * PG사 설정값 조회
 * @param pgCode - PG사 코드
 * @param fieldKey - 선택할 필드 키
 * @returns 선택된 필드의 value
 */
const getPgFieldValue = (pgCode: string, fieldKey: string): string | number => {
  const paymentInfo = shopData.value[`${pgCode}PaymentInfo` as keyof ShopInfoVo]
  if (!paymentInfo || typeof paymentInfo !== 'object') { return '' }

  const typedPaymentInfo = paymentInfo as unknown as PgPaymentInfoVo
  const value = typedPaymentInfo[fieldKey as keyof PgPaymentInfoVo]
  return value ?? ''
}

/**
 * PG사 설정값 업데이트
 * @param pgCode - 선택한 PG사 코드
 * @param fieldKey - 필드 키
 * @param value - 새로운 값
 */
const updatePgInputValue = (pgCode: string, fieldKey: string, value: string): void => {
  const paymentInfoKey = `${pgCode}PaymentInfo` as keyof ShopInfoVo
  const currentPaymentInfo = shopData.value[paymentInfoKey] as unknown as Record<string, unknown>

  if (currentPaymentInfo) {
    currentPaymentInfo[fieldKey] = value
    shopData.value = {
      ...shopData.value,
      [paymentInfoKey]: currentPaymentInfo
    }
  }
}

const $q = useQuasar()
/** 인증서 파일 다운로드 */
const downloadCertificateFile = async () => {
  await customFetch<Blob>(`/admin/handOrder/shop/${shopData.value.shopCode}/kcp-cert`, {
    method: 'GET',
    responseType: 'blob',
    onResponseError: (error) => {
      $q.notify({
        type: 'negative',
        message: `인증서 다운로드에 실패하였습니다. 상태 코드: ${error.response.status} ${error.response.statusText}`
      })
    },
    onResponse: (context) => {
      let fileName
      fileName = context.response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
      fileName = decodeURIComponent(fileName ?? '')
      downloadFile(context.response._data, fileName)
    }
  })
}

/** KCP취소용 인증서 파일 다운로드 */
const downloadCancelCertificateFile = async () => {
  await customFetch<Blob>('/admin/handOrder/shop/' + shopData.value.shopCode + '/kcp-cancel-cert', {
    method: 'GET',
    responseType: 'blob',
    onResponseError: (error) => {
      $q.notify({
        type: 'negative',
        message: `인증서 다운로드에 실패하였습니다. 상태 코드: ${error.response.status} ${error.response.statusText}`
      })
    },
    onResponse: (context) => {
      let fileName
      fileName = context.response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
      fileName = decodeURIComponent(fileName ?? '')
      downloadFile(context.response._data, fileName)
    }
  })
}
</script>

<template>
  <q-card-section class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md">
      PG사 설정
    </div>

    <!-- PG사 선택 -->
    <q-select
      v-model="shopData.pgCode"
      :options="pgOptions"
      label="PG사 선택"
      outlined
      class="q-mb-md"
      map-options
      emit-value
      :readonly="!shopUpdate"
      @update:model-value="setPgInitialData($event as PgCode)"
    />

    <template v-if="shopData.pgCode">
      <div class="text-subtitle1 text-weight-medium text-grey-7 q-mb-md">
        {{ pgOptions.find(pg => pg.value === shopData.pgCode)?.label }} 설정
      </div>

      <!-- PG사 설정 필드 목록 -->
      <q-list>
        <q-item v-for="(currentPgData) in currentPgField" :key="currentPgData.id">
          <q-input
            :model-value="getPgFieldValue(shopData.pgCode, currentPgData.fieldKey)"
            :label="currentPgData.label"
            outlined
            dense
            class="full-width"
            :readonly="!shopUpdate"
            @update:model-value="updatePgInputValue(shopData.pgCode, currentPgData.fieldKey, $event)"
          />
        </q-item>

        <!-- KCP 인증서 관련 필드 -->
        <template v-if="shopData.pgCode === 'kcp' && shopData.kcpPaymentInfo">
          <!-- KCP 인증서 파일 -->
          <q-item>
            <div class="col-6">
              <q-file
                v-if="!shopUpdate"
                :model-value="null"
                :label="shopData.kcpPaymentInfo?.certFileName || '인증서 업로드'"
                dense
                rounded
                outlined
                color="grey-5"
                :disable="!shopData.kcpPaymentInfo.certFilePath"
                @click="downloadCertificateFile"
              >
                <template v-slot:prepend>
                  <q-icon name="attachment" />
                </template>
              </q-file>

              <q-file
                v-if="shopUpdate"
                v-model="kcpCertFile"
                :label="shopData.kcpPaymentInfo?.certFileName || '인증서 파일'"
                dense
                rounded
                outlined
                color="primary"
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
          </q-item>

          <!-- KCP취소용 인증서 파일 -->
          <q-item>
            <div class="col-6">
              <q-file
                v-if="!shopUpdate"
                :model-value="null"
                :label="shopData.kcpPaymentInfo?.cancelCertName || '취소용 인증서 업로드'"
                dense
                rounded
                outlined
                color="grey-5"
                :disable="!shopData.kcpPaymentInfo.cancelCertPath"
                @click="downloadCancelCertificateFile"
              >
                <template v-slot:prepend>
                  <q-icon name="attachment" />
                </template>
              </q-file>

              <q-file
                v-if="shopUpdate"
                v-model="kcpCancelCertFile"
                :label="shopData.kcpPaymentInfo?.cancelCertName || '취소용 인증서 파일'"
                dense
                rounded
                outlined
                color="primary"
                :max-files="1"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
          </q-item>
        </template>
      </q-list>
    </template>
  </q-card-section>
</template>

<style scoped>

</style>
