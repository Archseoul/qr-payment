<script setup lang="ts">
import type { QSelectProps } from 'quasar'
import { useQuasar } from 'quasar'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import useDayjs from 'dayjs'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { CompassShopStatusVo, HoPgPaymentMethodVo, LocaleCodeVo, ShopInfoVo } from '~/types'
import { useAuthStore } from '~/store/auth'
import { linkType, vanCode } from '~/utils/code'
import SolPayConfig from '~/components/pay-config/SolPayConfig.vue'
import NiceLinkPayConfig from '~/components/pay-config/NiceLinkPayConfig.vue'
import AlipayConfig from '~/components/pay-config/AlipayConfig.vue'

const props = defineProps<{
  shopCode: string
}>()

const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = authStore
const { checkPermissions } = useCheckPermissions()
const shopUpdate = ref(false)
const isUpdatedRefreshTime = ref(false)

const $q = useQuasar()
const dayjs = useDayjs
dayjs.extend(customParseFormat)

const tempShop: Ref<ShopInfoVo | null> = ref(null)

const route = useRoute()
const shopInfoData = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + route.params.shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const shopRefreshTimeData = await useCustomFetch<number[]>('/admin/handOrder/shop/refresh-time', {
  method: 'GET',
  params: {
    shopCode: route.params.shopCode
  },
  headers: {
    'Content-Type': 'application/json'
  }
})
const shopRefreshTime: Ref<number[] | null> = shopRefreshTimeData.data

const cancelRefreshTime = () => {
  isUpdatedRefreshTime.value = !isUpdatedRefreshTime.value
  shopRefreshTimeData.refresh()
}
const localeList: Ref<LocaleCodeVo[] | null> = ref(null)

const localeListData = async () => {
  return await customFetch<LocaleCodeVo[]>(`/admin/handOrder/locale/shop/${route.params.shopCode}`, {
    method: 'GET'
  })
}

localeListData().then((res) => {
  const addDefaultLocale = {
    localeName: '한국어',
    localeCode: 'ko'
  }
  res.unshift(addDefaultLocale as LocaleCodeVo)
  localeList.value = res
})

const localeOptions = computed(() => {
  return localeList.value?.map(locale => ({
    label: locale.localeName,
    value: locale.localeCode
  }))
})

const shop = ref<ShopInfoVo | null>(null)
shop.value = shopInfoData?.data?.value ?? null

// shop 정보 새로고침 함수
const reloadShopInfo = async () => {
  await shopInfoData.refresh()
  shop.value = shopInfoData.data.value ?? null
}

// 매출 구분을 가져옴
const pgFeeTemplateData = await useCustomFetch<HoPgPaymentMethodVo[]>('/admin/handOrder/pg/fee/template', { method: 'GET' })
const pgFeeTemplate:Ref<HoPgPaymentMethodVo[] | null | undefined> = pgFeeTemplateData.data

const pgCommissionCodeOptions:QSelectProps['options'] = computed(() => pgFeeTemplate.value?.[0]?.pgCommissionCodeList?.map((code) => {
  return {
    label: code.pgCommissionName,
    value: code.pgCommissionCode
  }
}) ?? []).value

const isCorporateOptions: QSelectProps['options'] = Object.freeze([
  { label: $t('COMMON.031'), value: true },
  { label: $t('COMMON.032'), value: false }
])

const isPickupOptions:QSelectProps['options'] = Object.freeze([
  { label: '픽업', value: true },
  { label: '서빙', value: false }
])

const assignDeviceCount = () => {
  if (shop.value && shop.value.pickup) {
    shop.value.deviceCount = 1
  }
}

const isGlobalPayTypeOptions: QSelectProps['options'] = Object.freeze([
  { label: $t('COMMON.049'), value: 'won' },
  { label: $t('COMMON.050'), value: 'usd' }
])

const businessLicenseFile = ref<File | null>(null)
const bankBookFile = ref<File | null>(null)
const contractFile = ref<File | null>(null)
const cmsFormFile = ref<File | null>(null)
const etcFileFile = ref<File | null>(null)

const bannerFile = ref<File | null>(null)
const paymentFile = ref<File | null>(null)

const customLogoFile = ref<File | null>(null)
const kcpCertFile = ref<File | null>(null)
const kcpCancelCertFile = ref<File | null>(null)

const ownerLicenseFile = ref<File | null>(null)

const update = () => {
  if (!checkPermissions(['U'])) {
    return
  }

  if (shopUpdate.value) {
    shop.value = Object.assign({}, tempShop.value)
  } else {
    tempShop.value = Object.assign({}, shop.value)
  }
  shopUpdate.value = !shopUpdate.value
}

const updateShopInfoSequence = async () => {
  if (shop.value) {
    $q.loading.show()
    try {
      if (shop.value.customLogoUse) {
        await sendFile('customLogoFile')
      }

      await Promise.all([
        sendFile('businessLicenseFile'),
        sendFile('bankBookFile'),
        sendFile('contractFile'),
        sendFile('cmsFormFile'),
        sendFile('etcFileFile'),
        sendFile('ownerLicenseFile'),
        sendFile('paymentFile')
      ])
      if (shop.value.bannerUse) {
        await sendFile('bannerFile')
      }

      if (shop.value.pgCode === 'kcp') {
        await Promise.all([sendCertFile(), sendCancelCertFile()])
      }

      if (!shop.value.pg) {
        shop.value.pickup = false
        shop.value.paymentFileUse = false
        shop.value.paymentFileLink = ''
        shop.value.paymentFileName = ''
        shop.value.paymentFilePath = ''
      }

      await putShopInfo()
      shopUpdate.value = false
      $q.loading.hide()
      $q.dialog({
        title: $t('COMMON.051'),
        message: $t('SHOP.017'),
        persistent: true
      }).onOk(async () => {
        shopUpdate.value = false
        await shopInfoData.refresh()
      })
    } catch (e) {
      console.error(e)
      $q.notify({
        type: 'negative',
        message: $t('SHOP.018')
      })
      $q.loading.hide()
    }
  }
}

const putShopInfo = async () => {
  if (shop.value) {
    await customFetch('/admin/handOrder/v2/shop', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: shop.value,
      onResponseError: (context) => {
        $q.notify({
          type: 'negative',
          message: `${$t('SHOP.018')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
        })
      }
    })
  }
}

const refreshTimeUpdate = async () => {
  if (shop.value) {
    await customFetch('/admin/handOrder/shop/refresh-time', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: shopRefreshTime.value,
      params: {
        shopCode: shop.value.shopCode
      },
      onResponseError: (context) => {
        $q.notify({
          type: 'negative',
          message: `${$t('SHOP.019')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
        })
      },
      onResponse: () => {
        $q.notify({
          type: 'positive',
          message: $t('SHOP.020')
        })
      }
    })
    isUpdatedRefreshTime.value = false
    await shopInfoData.refresh()
  }
}

const prettyDate = (dateString: string) => {
  return dayjs(dateString, 'YYYYMMDD').format('YYYY/MM/DD')
}

type FileType = 'businessLicenseFile' | 'bankBookFile' | 'contractFile' | 'cmsFormFile' | 'etcFileFile' | 'bannerFile' | 'customLogoFile' | 'ownerLicenseFile' | 'paymentFile'
const fileObject: Record<FileType, { koreanFileType: string, apiPath: string, file: Ref<File | null> }> = {
  businessLicenseFile: {
    koreanFileType: $t('COMPANY.025'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/business-license',
    file: businessLicenseFile
  },
  bankBookFile: {
    koreanFileType: $t('COMPANY.026'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/bank-book',
    file: bankBookFile
  },
  contractFile: {
    koreanFileType: $t('COMMON.040'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/contract',
    file: contractFile
  },
  cmsFormFile: {
    koreanFileType: $t('SHOP.021'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/cms-form',
    file: cmsFormFile
  },
  etcFileFile: {
    koreanFileType: $t('SHOP.022'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/etc-file',
    file: etcFileFile
  },
  bannerFile: {
    koreanFileType: $t('SHOP.023'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/banner-file',
    file: bannerFile
  },
  customLogoFile: {
    koreanFileType: $t('SHOP.024'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/custom-logo-file',
    file: customLogoFile
  },
  ownerLicenseFile: {
    koreanFileType: $t('SHOP.025'),
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/owner-license',
    file: ownerLicenseFile
  },
  paymentFile: {
    koreanFileType: '결제 배너 이미지',
    apiPath: '/admin/handOrder/shop/' + props.shopCode + '/payment-file',
    file: paymentFile
  }
}
const getFile = async (fileType: FileType) => {
  let fileName

  const file = await customFetch<Blob>(fileObject[fileType].apiPath, {
    method: 'GET',
    responseType: 'blob',
    onResponseError: (ctx) => {
      $q.notify({
        type: 'negative',
        message: `${fileObject[fileType].koreanFileType} ${$t('COMMON.015')} ${$t('COMMON.014')}: ${ctx.response.status} ${ctx.response.statusText}`
      })
    },
    onResponse: (context) => {
      fileName = context.response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
      // url decode
      fileName = decodeURIComponent(fileName ?? '')
    }
  })

  const url = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.setAttribute('download', fileName ?? fileObject[fileType].koreanFileType)
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const sendFile = async (fileType: FileType) => {
  if (fileObject[fileType].file.value && shop.value) {
    const formData = new FormData()
    formData.append('file', fileObject[fileType].file.value!)
    const postResult = await customFetch<string>(fileObject[fileType].apiPath, {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${fileObject[fileType].koreanFileType} ${$t('COMMON.052')} ${$t('COMMON.014')}: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onRequestError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${fileObject[fileType].koreanFileType} ${$t('COMMON.052')} ${ctx.error.message}`
        })
      }
    })
    const setShopInfo: Record<FileType, () => void> = {
      businessLicenseFile: () => {
        shop.value!.businessLicensePath = postResult
        shop.value!.businessLicenseFileName = fileObject[fileType].file.value!.name
      },
      bankBookFile: () => {
        shop.value!.bankBookPath = postResult
        shop.value!.bankBookFileName = fileObject[fileType].file.value!.name
      },
      contractFile: () => {
        shop.value!.contractPath = postResult
        shop.value!.contractFileName = fileObject[fileType].file.value!.name
      },
      cmsFormFile: () => {
        shop.value!.cmsFormPath = postResult
        shop.value!.cmsFormFileName = fileObject[fileType].file.value!.name
      },
      etcFileFile: () => {
        shop.value!.etcFilePath = postResult
        shop.value!.etcFileFileName = fileObject[fileType].file.value!.name
      },
      bannerFile: () => {
        shop.value!.bannerFilePath = postResult
        shop.value!.bannerFileName = fileObject[fileType].file.value!.name
      },
      customLogoFile: () => {
        shop.value!.customLogoFilePath = postResult
        shop.value!.customLogoFileName = fileObject[fileType].file.value!.name
      },
      ownerLicenseFile: () => {
        shop.value!.ownerLicensePath = postResult
        shop.value!.ownerLicenseFileName = fileObject[fileType].file.value!.name
      },
      paymentFile: () => {
        shop.value!.paymentFilePath = postResult
        shop.value!.paymentFileName = fileObject[fileType].file.value!.name
      }
    }
    setShopInfo[fileType]()
  }
}

const sendCertFile = async () => {
  if (!shop.value?.kcpPaymentInfo || !kcpCertFile.value) {
    return
  }

  const formData = new FormData()
  formData.append('file', kcpCertFile.value)
  shop.value.kcpPaymentInfo.certFilePath = await customFetch<string>('/admin/handOrder/shop/' + props.shopCode + '/kcp-cert', {
    method: 'POST',
    body: formData,
    onResponseError: (ctx) => {
      $q.notify({ type: 'negative', message: `인증서 업로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}` })
    },
    onRequestError: (ctx) => {
      $q.notify({ type: 'negative', message: `인증서 업로드에 실패하였습니다. ${ctx.error.message}` })
    }
  })
  shop.value.kcpPaymentInfo.certFileName = kcpCertFile.value.name
}

const sendCancelCertFile = async () => {
  if (!kcpCancelCertFile.value || !shop.value?.kcpPaymentInfo) {
    return
  }

  const formData = new FormData()
  formData.append('file', kcpCancelCertFile.value)
  shop.value.kcpPaymentInfo.cancelCertPath = await customFetch<string>('/admin/handOrder/shop/' + props.shopCode + '/kcp-cancel-cert', {
    method: 'POST',
    body: formData,
    onResponseError: (ctx) => {
      $q.notify({ type: 'negative', message: `취소 인증서 업로드에 실패하였습니다. 상태 코드: ${ctx.response.status} ${ctx.response.statusText}` })
    },
    onRequestError: (ctx) => {
      $q.notify({ type: 'negative', message: `취소 인증서 업로드에 실패하였습니다. ${ctx.error.message}` })
    }
  })
  shop.value.kcpPaymentInfo.cancelCertName = kcpCancelCertFile.value.name
}

// const openShopThumbnail = () => {
//   $q.dialog({
//     component: ShopThumbnailModal,
//     componentProps: {
//       shopInfo: shop.value
//     }
//   }).onOk(async () => {
//     await shopInfoData.refresh()
//   }).onDismiss(async () => {
//     await shopInfoData.refresh()
//   })
// }
//
// const openCreateShopThumbnail = () => {
//   $q.dialog({
//     component: ShopThumbnailCreateModal,
//     componentProps: {
//       shopInfo: shop.value
//     }
//   }).onOk(async () => {
//     await shopInfoData.refresh()
//   })
// }
const checkAuthorityRequest = computed(() => userInfo.isAuthorityRequestBlocked)

// 컴패스 매장 정보
const compassShopInfo = ref<CompassShopStatusVo | null>(null)
const compassLoading = ref(false)

const fetchCompassShopInfo = async () => {
  try {
    const result = await customFetch<CompassShopStatusVo>(`/admin/handOrder/compass/shop/${props.shopCode}`, {
      method: 'GET',
      onResponseError: (ctx) => {
        if (ctx.response.status !== 404) {
          $q.notify({
            type: 'negative',
            message: `컴패스 매장 조회 실패: ${ctx.response.status} ${ctx.response.statusText}`
          })
        }
      }
    })
    compassShopInfo.value = result ?? null
  } catch {
    compassShopInfo.value = null
  }
}

await fetchCompassShopInfo()

// 컴패스 등록 버튼 표시 여부: compassShopInfo가 존재하는 경우
const isCompassShop = computed(() => compassShopInfo.value !== null)
// ACTIVE 상태이면 버튼 비활성화
const isCompassActive = computed(() => compassShopInfo.value?.status === 'ACTIVE')

const registerCompass = () => {
  if (!shop.value || compassLoading.value) { return }
  $q.dialog({
    title: '컴패스 등록',
    message: '컴패스 매장을 등록완료 처리하시겠습니까?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    compassLoading.value = true
    try {
      await customFetch(`/admin/handOrder/compass/shop/${shop.value!.shopSeq}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { status: 'ACTIVE' },
        onResponseError: (ctx) => {
          $q.notify({
            type: 'negative',
            message: `컴패스 등록 실패: ${ctx.response._data.message}`
          })
        }
      })
      await fetchCompassShopInfo()
      $q.notify({ type: 'positive', message: '컴패스 등록이 완료되었습니다.' })
    } finally {
      compassLoading.value = false
    }
    shopInfoData.refresh()
  })
}
</script>

<template>
  <q-card class="q-mb-md-lg overflow-auto full-height">
    <q-card-section>
      <q-form class="q-gutter-lg" @submit="updateShopInfoSequence">
        <q-card-actions v-if="(userInfo.userType === 'admin')&&!checkAuthorityRequest" align="right">
          <template v-if="!shopUpdate">
            <q-btn :label="$t('COMMON.035')" color="primary" class="q-mt-md float-right" @click="update" />
          </template>
          <template v-else>
            <q-btn :label="$t('COMMON.009')" color="primary" class="q-mt-md float-right " type="submit" />
            <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mt-md float-right q-mr-md" @click="update" />
          </template>
        </q-card-actions>
        <q-card-section v-if="shop">
          <div class="row q-col-gutter-sm">
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMMON.018') }} ({{ $t('COMMON.026') }})
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.shopCode"
                outlined
                input-style="text-align: center;"
                dense
                disable
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMMON.027') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.shopName"
                outlined
                input-style="text-align: center;"
                dense
                :readonly="!shopUpdate"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.028') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.shopType"
                outlined
                input-style="text-align: center;"
                dense
                :readonly="!shopUpdate"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.027') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.ownerName"
                outlined
                input-style="text-align: center;"
                dense
                :readonly="!shopUpdate"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.026') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.ownerBirth"
                outlined
                input-style="text-align: center;"
                dense
                :readonly="!shopUpdate"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.030') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.businessNumber"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.003') }}
              </div>
            </div>
            <div class="col-2">
              <q-select
                v-model="shop.corporate"
                :options="isCorporateOptions"
                emit-value
                map-options
                dense
                :readonly="!shopUpdate"
                outlined
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.017') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.address1"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.032') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.address2"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.167') }}
              </div>
            </div>
            <div class="col-9">
              <q-input
                v-model="shop.zipcode"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>

            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.009') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                outlined
                :model-value="shop.startDate ? prettyDate(shop.startDate) : null"
                :readonly="!shopUpdate"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="shop.startDate" :disable="!shopUpdate" mask="YYYYMMDD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.004') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                outlined
                :model-value="shop.installationDate ? prettyDate(shop.installationDate) : null"
                :readonly="!shopUpdate"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="shop.installationDate" :disable="!shopUpdate" mask="YYYYMMDD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.027') }}
              </div>
            </div>
            <template
              v-if="shop.posCode == 'okpos' || shop.posCode == 'smartro' || shop.posCode == 'easy' || shop.posCode === 'npos' || shop.posCode == 'first'"
            >
              <div class="col-4">
                <q-select
                  v-model="shop.posCode"
                  :options="linkType"
                  emit-value
                  map-options
                  dense
                  :readonly="!shopUpdate"
                  outlined
                />
              </div>
              <template v-if="shop.posCode=='okpos'">
                <div class="col-2">
                  <div class="fit flex justify-center items-center bg-grey-3">
                    {{ $t('SHOP.028') }}
                  </div>
                </div>
                <div class="col-4">
                  <q-input
                    v-model="shop.shopPosCode"
                    outlined
                    dense
                    :readonly="!shopUpdate"
                    input-style="text-align: center;"
                  />
                </div>
              </template>
              <template v-else>
                <div class="col-2">
                  <div class="fit flex justify-center items-center bg-grey-3">
                    {{ $t('SHOP.029') }}
                  </div>
                </div>
                <div class="col-4">
                  <q-input
                    v-model="shop.mappedStoreCode"
                    outlined
                    dense
                    :readonly="!shopUpdate"
                    input-style="text-align: center;"
                  />
                </div>
                <template v-if="shop.posCode === 'easy' || shop.posCode === 'first' || shop.posCode === 'npos'">
                  <div class="col-2">
                    <div class="fit flex justify-center items-center bg-grey-3">
                      {{ $t('SHOP.030') }}
                    </div>
                  </div>
                  <div :class="shop.posCode === 'easy' ? 'col-4':' col-10' ">
                    <q-input
                      v-model="shop.mappedHeadCode"
                      outlined
                      dense
                      :readonly="!shopUpdate"
                      input-style="text-align: center;"
                    />
                  </div>
                  <template v-if="shop.posCode === 'easy'">
                    <div class="col-2">
                      <div class="fit flex justify-center items-center bg-grey-3">
                        {{ $t('SHOP.031') }}
                      </div>
                    </div>
                    <div class="col-4">
                      <q-input
                        v-model="shop.shopPosCode"
                        outlined
                        dense
                        :readonly="!shopUpdate"
                        input-style="text-align: center;"
                      />
                    </div>
                  </template>
                </template>
              </template>
            </template>
            <template v-else>
              <div class="col-10">
                <q-select
                  v-model="shop.posCode"
                  :options="linkType"
                  emit-value
                  map-options
                  dense
                  :readonly="!shopUpdate"
                  outlined
                />
              </div>
            </template>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.030') }}
              </div>
            </div>
            <div class="col-10">
              <q-select
                v-model="shop.vanCode"
                :options="vanCode"
                emit-value
                map-options
                dense
                :readonly="!shopUpdate"
                outlined
              />
            </div>
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.020') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                v-model="shop.managerName"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.032') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                :model-value="shop.agencyId ?? $t('COMMON.053')"
                outlined
                dense
                readonly
                input-style="text-align: center;"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.021') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.managerPhoneNumber"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.022') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.managerEmail"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.023') }}
              </div>
            </div>
            <div class="col-2">
              <q-input
                v-model="shop.shopPhoneNumber"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.036') }}
              </div>
            </div>
            <div class="col-9">
              <div class="row q-col-gutter-sm">
                <div class="col-3">
                  <div class="fit flex justify-center items-center bg-grey-3">
                    {{ $t('COMPANY.037') }}
                  </div>
                </div>
                <div class="col-3">
                  <q-input
                    v-model="shop.bankName"
                    outlined
                    dense
                    :readonly="!shopUpdate"
                    input-style="text-align: center;"
                  />
                </div>
                <div class="col-3">
                  <div class="fit flex justify-center items-center bg-grey-3">
                    {{ $t('COMPANY.038') }}
                  </div>
                </div>
                <div class="col-3">
                  <q-input
                    v-model="shop.accountNumber"
                    outlined
                    dense
                    :readonly="!shopUpdate"
                    input-style="text-align: center;"
                  />
                </div>
                <div class="col-3">
                  <div class="fit flex justify-center items-center bg-grey-3">
                    {{ $t('COMPANY.039') }}
                  </div>
                </div>
                <div class="col-9">
                  <q-input
                    v-model="shop.accountHolder"
                    outlined
                    dense
                    :readonly="!shopUpdate"
                    input-style="text-align: center;"
                  />
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.024') }}
              </div>
            </div>
            <div class="col-10">
              <q-input
                v-model="shop.naverUrl"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>

            <!--            결제 방식란-->
            <template v-if="userInfo.userType === 'admin'">
              <div class="col-3">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.155') }}
                </div>
              </div>
              <div class="col-3">
                <q-radio
                  v-model="shop.pg"
                  :val="false"
                  :disable="!shopUpdate"
                >
                  <div>{{ $t('SHOP.036') }}</div>
                </q-radio>
                <q-radio
                  v-model="shop.pg"
                  :val="true"
                  :disable="!shopUpdate"
                >
                  <div>{{ $t('SHOP.156') }}</div>
                </q-radio>
              </div>
            </template>
            <template v-if="shop.pg">
              <!--              매출 구분-->
              <div class="col-3">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.157') }}
                </div>
              </div>
              <div class="col-3">
                <q-select
                  v-model="shop.pgCommissionCode"
                  emit-value
                  outlined
                  dense
                  :readonly="!shopUpdate"
                  :options="pgCommissionCodeOptions"
                  map-options
                />
              </div>

              <!--              매장 타입-->
              <div class="col-3">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.158') }}
                </div>
              </div>
              <div class="col-3">
                <q-select
                  v-model="shop.pickup"
                  emit-value
                  dense
                  :readonly="!shopUpdate"
                  :options="isPickupOptions"
                  map-options
                  outlined
                  @update:model-value="assignDeviceCount"
                />
              </div>
            </template>

            <!--            테이블 수-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.025') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                v-model.number="shop.tableCount"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
                type="number"
                :rules="[ val => val <= 200 || $t('SHOP.165')]"
              />
            </div>

            <!--            디바이스 수량-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.011') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                v-if="!shop.pickup"
                v-model.number="shop.deviceCount"
                outlined
                dense
                :readonly="!shopUpdate || shop.deviceList.length > 0"
                input-style="text-align: center;"
                type="number"
                :rules="[ val => val <= 200 || $t('SHOP.166')]"
              >
                <q-tooltip v-if="shopUpdate && shop.deviceList.length > 0" anchor="top middle" self="bottom middle">
                  {{ $t('SHOP.033') }}
                </q-tooltip>
              </q-input>
              <q-input
                v-else
                disable
                outlined
                dense
                :model-value="$t('SHOP.034')"
                input-style="text-align: center;"
              />
            </div>

            <!--            매장 타입-->
            <!--            <div class="col-3">-->
            <!--              <div class="fit flex justify-center items-center bg-grey-3">-->
            <!--                {{ $t('SHOP.035') }}-->
            <!--              </div>-->
            <!--            </div>-->
            <!--            <div class="col-3">-->
            <!--              <q-input-->
            <!--                readonly-->
            <!--                outlined-->
            <!--                dense-->
            <!--                :model-value="$t('SHOP.036')"-->
            <!--                input-style="text-align: center;"-->
            <!--              />-->
            <!--            </div>-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.026') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                v-model="shop.deviceType"
                outlined
                dense
                :readonly="!shopUpdate"
                input-style="text-align: center;"
              />
            </div>

            <!--            사업자 등록증-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.025') }}
              </div>
            </div>
            <div class="col-3">
              <div class="col-child">
                <q-chip
                  v-if="!shopUpdate && shop.businessLicensePath"
                  clickable
                  color="primary"
                  text-color="white"
                  @click="getFile('businessLicenseFile')"
                >
                  <q-icon name="attachment" />
                  <span>{{ shop.businessLicenseFileName }}</span>
                </q-chip>
                <q-chip
                  v-if="!shopUpdate&& !shop.businessLicensePath"
                  clickable
                  disable
                  color="grey-5"
                  text-color="white"
                >
                  <q-icon name="attachment" />
                  <span>{{ fileObject['businessLicenseFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
                </q-chip>
                <q-file
                  v-if="shopUpdate"
                  v-model="businessLicenseFile"
                  :label="shop.businessLicenseFileName ?? fileObject['businessLicenseFile'].koreanFileType"
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
            </div>

            <!--            통장 사본-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMMON.054') }}
              </div>
            </div>
            <div class="col-3">
              <div class="col-child">
                <q-chip
                  v-if="!shopUpdate && shop.bankBookPath"
                  clickable
                  color="primary"
                  text-color="white"
                  @click="getFile('bankBookFile')"
                >
                  <q-icon name="attachment" />
                  <span>{{ shop?.bankBookFileName }}</span>
                </q-chip>
                <q-chip v-if="!shopUpdate&& !shop.bankBookPath" clickable disable color="grey-5" text-color="white">
                  <q-icon name="attachment" />
                  <span>{{ fileObject['bankBookFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
                </q-chip>
                <q-file
                  v-if="shopUpdate"
                  v-model="bankBookFile"
                  :label="shop.bankBookFileName ?? fileObject['bankBookFile'].koreanFileType"
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
            </div>

            <!-- 계약서 -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY.040') }}
              </div>
            </div>
            <div class="col-3">
              <div class="col-child">
                <q-chip
                  v-if="!shopUpdate && shop.contractPath"
                  clickable
                  color="primary"
                  text-color="white"
                  @click="getFile('contractFile')"
                >
                  <q-icon name="attachment" />
                  <span>{{ shop.contractFileName }}</span>
                </q-chip>
                <q-chip
                  v-if="!shopUpdate&& !shop.contractPath"
                  clickable
                  disable
                  color="grey-5"
                  text-color="white"
                >
                  <q-icon name="attachment" />
                  <span>{{ fileObject['contractFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
                </q-chip>
                <q-file
                  v-if="shopUpdate"
                  v-model="contractFile"
                  :label="shop.contractFileName ?? fileObject['contractFile'].koreanFileType"
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
            </div>

            <!-- CMS 신청서 -->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.037') }}
              </div>
            </div>
            <div class="col-3">
              <div class="col-child">
                <q-chip
                  v-if="!shopUpdate && shop.cmsFormPath"
                  clickable
                  color="primary"
                  text-color="white"
                  @click="getFile('cmsFormFile')"
                >
                  <q-icon name="attachment" />
                  <span>{{ shop.cmsFormFileName }}</span>
                </q-chip>
                <q-chip v-if="!shopUpdate&& !shop.cmsFormPath" clickable disable color="grey-5" text-color="white">
                  <q-icon name="attachment" />
                  <span>{{ fileObject['cmsFormFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
                </q-chip>
                <q-file
                  v-if="shopUpdate"
                  v-model="cmsFormFile"
                  :label="shop.cmsFormFileName ?? fileObject['cmsFormFile'].koreanFileType"
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
            </div>

            <!--    대표자 신분증 -->
            <template v-if="userInfo.userType === 'admin'">
              <div class="col-3">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.038') }}
                </div>
              </div>
              <div class="col-3">
                <div class="col-child">
                  <q-chip
                    v-if="!shopUpdate && shop.ownerLicensePath"
                    clickable
                    color="primary"
                    text-color="white"
                    @click="getFile('ownerLicenseFile')"
                  >
                    <q-icon name="attachment" />
                    <span>{{ shop.ownerLicenseFileName }}</span>
                  </q-chip>
                  <q-chip v-if="!shopUpdate&& !shop.ownerLicensePath" clickable disable color="grey-5" text-color="white">
                    <q-icon name="attachment" />
                    <span>{{ fileObject['ownerLicenseFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
                  </q-chip>
                  <q-file
                    v-if="shopUpdate"
                    v-model="ownerLicenseFile"
                    :label="shop.ownerLicenseFileName ?? fileObject['ownerLicenseFile'].koreanFileType"
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
              </div>
            </template>

            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.028') }}
              </div>
            </div>
            <div class="col-3">
              <q-select
                v-model="shop.globalPayType"
                :options="isGlobalPayTypeOptions"
                emit-value
                map-options
                dense
                :readonly="!shopUpdate"
                outlined
              />
            </div>
            <!--여기-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.027') }}
              </div>
            </div>
            <div class="col-3">
              <q-select
                v-model="shop.shopLanguage"
                :options="localeOptions"
                emit-value
                map-options
                dense
                :readonly="!shopUpdate"
                outlined
              />
            </div>

            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.022') }}
              </div>
            </div>
            <div class="col-3">
              <div class="col-child">
                <q-chip
                  v-if="!shopUpdate && shop.etcFilePath"
                  clickable
                  color="primary"
                  text-color="white"
                  @click="getFile('etcFileFile')"
                >
                  <q-icon name="attachment" />
                  <span>{{ shop.etcFileFileName }}</span>
                </q-chip>
                <q-chip v-if="!shopUpdate&& !shop.etcFilePath" clickable disable color="grey-5" text-color="white">
                  <q-icon name="attachment" />
                  <span>{{ fileObject['etcFileFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
                </q-chip>
                <q-file
                  v-if="shopUpdate"
                  v-model="etcFileFile"
                  :label="shop.etcFileFileName ?? fileObject['etcFileFile'].koreanFileType"
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
            </div>

            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.018') }}
              </div>
            </div>
            <div class="col-3">
              <q-input
                v-model="shop.etcNote"
                outlined
                dense
                :readonly="!shopUpdate"
              />
            </div>

            <!--            정렬 맞추는 용 div-->
            <div class="col-6" />

            <div v-if="userInfo.userType != 'shop'" class="col-6">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('COMPANY_REPORT.012') }}
              </div>
            </div>
            <div class="col-6">
              <q-input
                v-model.number="shop.monthlyFare"
                outlined
                dense
                :readonly="!shopUpdate"
                type="number"
                :suffix="$t('COMMON.049')"
              />
            </div>

            <div class="col-2">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.039') }}
              </div>
            </div>
            <div class="col-4">
              <q-select
                v-model="shopRefreshTime"
                :options="Array.from({ length: 25 }, (_, i) => {
                  return {
                    label: i === 0 ? $t('COMMON.055') : $t('COMMON.056', { hour: i - 1 }),
                    value: i === 0 ? null : i - 1
                  }
                })"
                emit-value
                map-options
                dense
                multiple
                :max-values="userInfo.userType === 'admin' ? 24 : 1"
                :readonly="!isUpdatedRefreshTime"
                outlined
              />
            </div>
            <div v-if="(userInfo.userType != 'shop')&&!checkAuthorityRequest" class="col-2">
              <q-btn
                v-if="!isUpdatedRefreshTime"
                :label="$t('SHOP.040')"
                color="primary"
                @click="isUpdatedRefreshTime = !isUpdatedRefreshTime"
              />
              <template v-else>
                <q-btn :label="$t('COMMON.009')" color="primary" @click="refreshTimeUpdate" />
                <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-ml-sm" @click="cancelRefreshTime" />
              </template>
            </div>
            <div v-else class="col-2" />
            <div class="col-4" />
            <template v-if="userInfo.userType == 'admin'">
              <div class="col-2">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.041') }}
                </div>
              </div>
              <div class="col-2">
                <q-checkbox
                  v-model="shop.bannerUse"
                  color="primary"
                  :disable="!shopUpdate"
                />
              </div>
              <div class="col-2">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.042') }}
                </div>
              </div>
              <div class="col-2">
                <div class="col-child">
                  <q-chip
                    v-if="!shopUpdate && shop.bannerFilePath"
                    clickable
                    color="primary"
                    text-color="white"
                    @click="getFile('bannerFile')"
                  >
                    <q-icon name="attachment" />
                    <span>{{ shop.bannerFileName }}</span>
                  </q-chip>
                  <q-chip v-if="!shopUpdate&& !shop.bannerFilePath" clickable disable color="grey-5" text-color="white">
                    <q-icon name="attachment" />
                    <span>{{ $t('SHOP.023') }}({{ $t('COMMON.016') }})</span>
                  </q-chip>
                  <q-file
                    v-if="shopUpdate"
                    v-model="bannerFile"
                    :label="shop.bannerFileName ?? $t('SHOP.023')"
                    dense
                    rounded
                    outlined
                    color="primary"
                    :max-files="1"
                    accept="image/*"
                    max-file-size="2097152"
                  >
                    <template v-slot:prepend>
                      <q-icon name="attach_file" />
                    </template>
                  </q-file>
                </div>
              </div>
              <div class="col-2">
                <div class="fit flex justify-center items-center bg-grey-3">
                  {{ $t('SHOP.043') }}
                </div>
              </div>
              <div class="col-2">
                <q-input
                  v-model="shop.bannerLink"
                  outlined
                  dense
                  :readonly="!shopUpdate"
                  input-style="text-align: center;"
                />
              </div>
            </template>

            <!--            결제 배너-->
            <template v-if="authStore.userInfo.userType == 'admin' && shop.pg">
              <div class="col-2">
                <div class="fit flex justify-center items-center bg-grey-3">
                  결제 배너 사용여부
                </div>
              </div>
              <div class="col-2">
                <q-checkbox
                  v-model="shop.paymentFileUse"
                  color="primary"
                  :disable="!shopUpdate"
                />
              </div>
              <div class="col-2">
                <div class="fit flex justify-center items-center bg-grey-3">
                  결제 배너 이미지
                </div>
              </div>
              <div class="col-2">
                <div class="col-child">
                  <q-chip
                    v-if="!shopUpdate && shop.paymentFilePath"
                    clickable
                    color="primary"
                    text-color="white"
                    @click="getFile('paymentFile')"
                  >
                    <q-icon name="attachment" />
                    <span>{{ shop.paymentFileName }}</span>
                  </q-chip>
                  <q-chip v-if="!shopUpdate&& !shop.paymentFilePath" clickable disable color="grey-5" text-color="white">
                    <q-icon name="attachment" />
                    <span>배너 이미지 (업로드 필요)</span>
                  </q-chip>
                  <q-file
                    v-if="shopUpdate"
                    v-model="paymentFile"
                    :label="shop.paymentFileName ?? '배너 이미지'"
                    dense
                    rounded
                    outlined
                    color="primary"
                    :max-files="1"
                    accept="image/*"
                    max-file-size="2097152"
                  >
                    <template v-slot:prepend>
                      <q-icon name="attach_file" />
                    </template>
                  </q-file>
                </div>
              </div>
              <div class="col-2">
                <div class="fit flex justify-center items-center bg-grey-3">
                  결제 배너 링크
                </div>
              </div>
              <div class="col-2">
                <q-input
                  v-model="shop.paymentFileLink"
                  outlined
                  dense
                  :readonly="!shopUpdate"
                  input-style="text-align: center;"
                />
              </div>
            </template>

            <!--            커스텀 이미지-->
            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.044') }}
              </div>
            </div>

            <div class="col-3">
              <q-checkbox
                v-model="shop.customLogoUse"
                color="primary"
                :disable="!shopUpdate"
              />
            </div>

            <div class="col-3">
              <div class="fit flex justify-center items-center bg-grey-3">
                {{ $t('SHOP.024') }}
              </div>
            </div>

            <div class="col-3">
              <q-chip
                v-if="!shopUpdate && shop.customLogoFilePath"
                clickable
                color="primary"
                text-color="white"
                @click="getFile('customLogoFile')"
              >
                <q-icon name="attachment" />
                <span>{{ shop.customLogoFileName }}</span>
              </q-chip>
              <q-chip v-if="!shopUpdate&& !shop.customLogoFilePath" clickable disable color="grey-5" text-color="white">
                <q-icon name="attachment" />
                <span>{{ $t('SHOP.045') }}({{ $t('COMMON.016') }})</span>
              </q-chip>
              <q-file
                v-if="shopUpdate"
                v-model="customLogoFile"
                :label="shop.customLogoFileName ?? $t('SHOP.024')"
                dense
                rounded
                outlined
                color="primary"
                :max-files="1"
                accept="image/*"
                max-file-size="2097152"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
            <!--            <div class="col-12">-->
            <!--              <q-btn label="매장 사진 보기" color="primary" class="q-mr-sm" @click="openShopThumbnail" />-->
            <!--              <q-btn label="매장 사진업로드" color="primary" @click="openCreateShopThumbnail" />-->
            <!--            </div>-->
          </div>
          <q-card-section>
            <div class="col-12">
              <div class="col-5">
                <q-card>
                  <q-separator />
                  <q-card-section class="text-h6 text-bold">
                    {{ $t('SHOP.046') }}
                  </q-card-section>
                  <q-separator />
                  <q-card-section>
                    <ShopDevice
                      :shop-seq="shop!.shopSeq"
                      :shop-code="shopCode"
                      :shop-info="shop!"
                      :is-editable="shopUpdate"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>

          <!--          결제수단 설정-->
          <template v-if="shop.pg">
            <FoldableCard :title="$t('SHOP.163')">
              <PgConfig
                v-model="shop"
                v-model:kcp-cert-file="kcpCertFile"
                v-model:kcp-cancel-cert-file="kcpCancelCertFile"
                :shop-update="shopUpdate"
              />
              <q-separator />
              <SolPayConfig v-model="shop" :shop-update="shopUpdate" />

              <q-separator />
              <NiceLinkPayConfig v-model="shop" :shop-update="shopUpdate" @reload:shop-info="reloadShopInfo" />
              <q-separator />
              <AlipayConfig v-model="shop" :shop-update="shopUpdate" />
              <q-separator />
              <!-- 컴패스 등록 버튼 -->
              <template v-if="isCompassShop && userInfo.userType === 'admin'">
                <q-card-section>
                  <div>
                    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md ">
                      컴패스 연동
                    </div>
                    <div class="col-auto">
                      <q-btn
                        :label="isCompassActive ? '컴패스 등록 완료' : '컴패스 등록'"
                        :color="isCompassActive ? 'positive' : 'primary'"
                        :disable="isCompassActive || compassLoading"
                        :loading="compassLoading"
                        @click="registerCompass"
                      />
                    </div>
                  </div>
                </q-card-section>
              </template>
            </FoldableCard>
          </template>

          <!--          모바일 포스 디바이스 설정-->
          <FoldableCard v-if="shop.posCode === 'mobilepos' && shop.pg" :title="$t('SHOP.164')">
            <MobilePosConfig v-model="shop" />
          </FoldableCard>

          <q-card-section>
            <div class="col-12">
              <div class="col-5">
                <q-card>
                  <q-separator />
                  <q-card-section class="text-h6 text-bold">
                    Qbile X Mini {{ $t('SHOP.047') }}
                  </q-card-section>
                  <q-separator />
                  <q-card-section>
                    <QxImage
                      :shop-seq="shop!.shopSeq"
                      :shop-code="shopCode"
                      :shop-info="shop!"
                      :is-editable="shopUpdate"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card-section>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">

</style>
