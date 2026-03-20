<script setup lang="ts">
import { computed } from 'vue'
import NiceVanContract from '../NiceVanContract.vue'
import NicePayNaverInfo from '../NicePayNaverInfo.vue'
import type { NiceVanPartnerCodeKeyVo, ShopInfoVo } from '~/types'
import { useAuthStore } from '~/store/auth'

const $q = useQuasar()
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)

const isAdmin = authStore.userInfo.userType === 'admin'

const props = defineProps<{
  modelValue: ShopInfoVo
  shopUpdate: boolean
}>()

const emits = defineEmits<{
  'update:modelValue': [ShopInfoVo]
  'reload:shop-info': []
}>()

const shopData = computed({
  get: () => props.modelValue,
  set: (value: ShopInfoVo) => emits('update:modelValue', value)
})

const { data: niceVanPartnerCodeKeyList } = await useCustomFetch<NiceVanPartnerCodeKeyVo[]>('/admin/handOrder/nicevan/partnerCode/list', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const setNiceLinkPayInitialData = () => {
  if (shopData.value.niceLinkPayInfo) {
    return
  }

  shopData.value = {
    ...shopData.value,
    niceLinkPayInfo: {
      niceLinkPaySeq: 0,
      shopSeq: shopData.value.shopSeq,
      catId: 0,
      useAppCard: false,
      useKakaoPay: false,
      useNaverPay: false,
      naverMerchantId: null,
      partnerCode: '',
      manual: false
    }
  }
}

const validateShopInfo = ():boolean => {
  const requiredInfo = [
    { label: '매장명', value: shopData.value.shopName },
    { label: '사업자번호', value: shopData.value.businessNumber },
    { label: '주소1', value: shopData.value.address1 },
    { label: '주소2', value: shopData.value.address2 },
    { label: '매장 연락처', value: shopData.value.shopPhoneNumber },
    { label: '매장 담당자 연락처', value: shopData.value.managerPhoneNumber },
    { label: '대표자명', value: shopData.value.ownerName },
    { label: '대표자 생년월일', value: shopData.value.ownerBirth },
    { label: '매장 담당자 이메일', value: shopData.value.managerEmail }
  ]
  const isMissingInfo = requiredInfo.filter((info) => {
    return !info.value || info.value.length === 0
  })
  if (isMissingInfo.length > 0) {
    $q.notify({
      type: 'negative',
      message: '계약서 등록을 위해 가맹점 정보를 모두 입력해주세요 :' +
      isMissingInfo.map((info) => {
        return ' ' + info.label
      })
    })
    return false
  }

  let validate = true
  requiredInfo.forEach((info) => {
    const label = info.label
    const val = info.value!
    switch (label) {
      case '사업자번호':
        if (val?.length !== 10) {
          $q.notify({
            type: 'negative',
            message: '사업자번호는 10자리여야 합니다.'
          })
          validate = false
        }
        break
      case '매장 연락처':
      case '매장 담당자 연락처':
        if (!/^\d+$/.test(val)) {
          $q.notify({
            type: 'negative',
            message: '매장 연락처는 숫자만 입력 가능합니다.'
          })
          validate = false
        }
        break
      case '대표자 생년월일':
        if (!/^\d{6}(\d{2})?$/.test(val)) {
          $q.notify({
            type: 'negative',
            message: '대표자 생년월일은 8자리 숫자(YYYYMMDD) 혹은 6자리 숫자(YYMMDD) 형식이어야 합니다.'
          })
          validate = false
        }
        break
      case '매장 담당자 이메일' :
        if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(val)) {
          $q.notify({
            type: 'negative',
            message: '매장 담당자 이메일 형식이 올바르지 않습니다.'
          })
          validate = false
        }
        break
      default:
        break
    }
  })
  return validate
}
const openNiceVanContract = () => {
  const validate = validateShopInfo()

  if (validate) {
    $q.dialog({
      component: NiceVanContract,
      componentProps: {
        shopInfo: shopData.value,
        niceVanPartnerCodeKeyList: niceVanPartnerCodeKeyList.value
      }
    }).onOk(() => {
      emits('reload:shop-info')
    })
  }
}

const openNiceLinkNaverUpdate = () => {
  const requiredInfo = [
    { label: '매장명', value: shopData.value.shopName },
    { label: '사업자번호', value: shopData.value.businessNumber },
    { label: '주소', value: shopData.value.address1 },
    { label: '매장 연락처', value: shopData.value.shopPhoneNumber }
  ]
  const isMissingInfo = requiredInfo.filter((info) => {
    return !info.value || info.value.length === 0
  })
  if (isMissingInfo.length > 0) {
    $q.notify({
      type: 'negative',
      message: '네이버페이 가맹점 등록을 위해 가맹점 정보를 모두 입력해주세요. : ' +
      isMissingInfo.map((info) => {
        return info.label
      })
    })
  } else {
    $q.dialog({
      component: NicePayNaverInfo,
      componentProps: {
        shopInfo: shopData.value
      }
    }).onOk((isDeleted:boolean) => {
      if (isDeleted) {
        shopData.value.niceLinkPayInfo!.useNaverPay = false
        emits('update:modelValue', shopData.value)
      }
      emits('reload:shop-info')
    })
  }
}
</script>

<template>
  <q-card-section class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md ">
      나이스 링크페이 설정
    </div>
    <q-btn
      v-if="shopData.niceLinkPayInfo === null ? true : isAdmin ? true : false"
      :label="`계약서 ${shopData.niceLinkPayInfo ? '재' : ''}등록`"
      color="primary"
      @click="openNiceVanContract"
    />

    <q-checkbox
      v-if="shopData.niceLinkPayInfo"
      v-model="shopData.nicePayUse"
      label="사용 여부"
      outlined
      :disable="!shopUpdate"
      @update:model-value="setNiceLinkPayInitialData"
    />

    <template v-if="shopData.nicePayUse && shopData.niceLinkPayInfo">
      <q-list>
        <q-item v-if="shopData.niceLinkPayInfo !== null && niceVanPartnerCodeKeyList !== null">
          {{ `(${shopData.niceLinkPayInfo.partnerCode}) ${niceVanPartnerCodeKeyList?.find(item => item.partnerCode === shopData.niceLinkPayInfo?.partnerCode && item.manual === shopData.niceLinkPayInfo?.manual)?.note}` }}
        </q-item>
        <q-item>
          <q-input
            v-model="shopData.niceLinkPayInfo.catId"
            label="CAT ID"
            outlined
            dense
            class="full-width"
            :readonly="true"
          />
        </q-item>
        <q-item>
          <q-checkbox
            v-model="shopData.niceLinkPayInfo.useAppCard"
            label="앱카드 사용 여부"
            outlined
            dense
            class="full-width"
            :disable="!shopUpdate"
          />
        </q-item>
        <q-item>
          <q-checkbox
            v-model="shopData.niceLinkPayInfo.useKakaoPay"
            label="카카오페이 사용 여부"
            outlined
            dense
            class="full-width"
            :disable="!shopUpdate"
          />
        </q-item>
        <q-item>
          <q-item-section side style="color:black">
            <q-checkbox
              v-model="shopData.niceLinkPayInfo.useNaverPay"
              label="네이버페이 사용 여부"
              outlined
              dense
              class="full-width"
              :disable="!shopUpdate || !shopData.niceLinkPayInfo.naverMerchantId"
            />
          </q-item-section>
          <q-item-section side>
            <q-btn
              label="네이버페이 가맹점 정보 관리"
              color="primary"
              class="q-ml-md"
              @click="openNiceLinkNaverUpdate"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </q-card-section>
</template>

<style scoped lang="scss">
</style>
