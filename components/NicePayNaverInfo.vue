<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import type { NicePayNaverInfoDto, ShopInfoVo } from '~/types'

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const props = defineProps<{
  shopInfo: ShopInfoVo
}>()

// const emits = defineEmits<{
//   'update:use-naver-yn' : []
// }>()

const $q = useQuasar()

const shopInfo = props.shopInfo

const naverInfo = ref<NicePayNaverInfoDto>({
  storeName: shopInfo.shopName,
  businessNo: shopInfo.businessNumber,
  storeAddress: shopInfo.address1 + ' ' + shopInfo.address2,
  phone: shopInfo.shopPhoneNumber || '',

  businessType: '',
  zipCode: '',
  changeType: shopInfo.niceLinkPayInfo?.naverMerchantId ? '3' : '1',
  businessTypeCode: ''
})

const selectedBusinessTypeCatOption = ref<string>('')

const postNaverMerchantInfo = async () => {
  $q.loading.show()

  await customFetch<string>(`/handOrder/nicepay/naver/${shopInfo.shopCode}`, {
    method: 'POST',
    body: naverInfo.value,
    onResponseError: (ctx) => {
      $q.loading.hide()
      $q.notify({
        type: 'negative',
        message: `네이버페이 가맹점 정보 ${naverInfo.value.changeType === '1' ? '등록' : naverInfo.value.changeType === '2' ? '삭제' : '수정'}에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
      })
    },
    onRequestError: (ctx) => {
      $q.loading.hide()
      $q.notify({
        type: 'negative',
        message: `네이버페이 가맹점 정보 ${naverInfo.value.changeType === '1' ? '등록' : naverInfo.value.changeType === '2' ? '삭제' : '수정'}에 실패하였습니다. ${ctx.error.message}`
      })
    }

  })

  $q.loading.hide()
  $q.notify({
    type: 'positive',
    message: `네이버페이 가맹점 정보 ${naverInfo.value.changeType === '1' ? '등록' : naverInfo.value.changeType === '2' ? '삭제' : '수정'}에 성공하였습니다.`
  })
  if (naverInfo.value.changeType === '2') {
    onDialogOK(true)
  } else {
    onDialogOK()
  }
}

const deleteNaverMerchantInfo = () => {
  $q.dialog({
    title: '네이버페이 가맹점 삭제 확인',
    message: '정말 삭제하시겠습니까?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    naverInfo.value.changeType = '2'
    await postNaverMerchantInfo()
  })
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    :auto-close="false"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6 text-bold">
        네이버페이 가맹점 정보
      </q-card-section>
      <q-separator />
      <q-form @submit="postNaverMerchantInfo">
        <q-card-section>
          <q-list>
            <q-item>
              <q-item-section side>
                사업자번호
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="naverInfo.businessNo"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :readonly="true"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section side>
                가맹점 이름
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="naverInfo.storeName"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :readonly="true"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section side>
                전화번호
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="naverInfo.phone"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :readonly="true"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                주소
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="naverInfo.storeAddress"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :readonly="true"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                우편번호
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="naverInfo.zipCode"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :rules="[
                    (val:string) => val.length > 0 || '우편번호를 입력해주세요.',
                    (val:string) => (val.length === 5 || val.length === 6) || '우편번호는 5자리 혹은 6자리로 입력해주세요.'
                  ]"
                  maxlength="6"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section side>
                업태
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="selectedBusinessTypeCatOption"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  map-options
                  emit-value
                  :options="businessKindCatOption"
                  @update:model-value="(val:string) => {
                    if(val !== '') {
                      naverInfo.businessTypeCode = ''
                    }
                  }"
                />
              </q-item-section>
              <q-item-section>
                <q-select
                  v-model="naverInfo.businessTypeCode"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  map-options
                  emit-value
                  :options="businessKindOption.filter(
                    (item) => selectedBusinessTypeCatOption !== '' && item.value !== ''?
                      item.value.startsWith(selectedBusinessTypeCatOption) : true)"
                  :rules="[(val:string) => val.length > 0 || '업태를 선택해주세요.']"
                  @update:model-value="(val:string) => {
                    if(val !== '') {
                      naverInfo.businessType = businessKindOption.find(
                        (item) => item.value === val)?.label || ''
                    } else {
                      naverInfo.businessType = ''
                    }
                  }"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-btn
            color="primary"
            :label="`${shopInfo.niceLinkPayInfo?.naverMerchantId ? '수정' : '등록'}`"
            class="float-right q-mb-md"
            type="submit"
          />

          <q-btn
            v-if="shopInfo.niceLinkPayInfo?.naverMerchantId"
            color="red-5"
            label="삭제"
            class="float-right q-mb-md"
            style="margin-right:5px"
            @click="deleteNaverMerchantInfo"
          />
          <q-btn
            color="grey-5"
            label="닫기"
            class="q-mb-md"
            @click="onDialogHide"
          />
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
