<script setup lang="ts">
import { dayjs } from 'element-plus'
import { QForm, useDialogPluginComponent, useQuasar } from 'quasar'
import NiceVanTerms from './NiceVanTerms.vue'
import NiceVanTermsAll from './NiceVanTermsAll.vue'
import type { NiceVanContractDto, NiceVanCorpAffObj, NiceVanPartnerCodeKeyVo, ShopInfoVo } from '~/types'
import { businessKindCatOption, businessKindOption, businessTypeOption } from '~/utils/code'

// Vue PDF Viewer를 클라이언트에서만 import
const VPdfViewer = process.client ? defineAsyncComponent(() => import('@vue-pdf-viewer/viewer').then(m => m.VPdfViewer)) : null

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const props = defineProps<{
  shopInfo: ShopInfoVo,
  niceVanPartnerCodeKeyList: NiceVanPartnerCodeKeyVo[]
}>()

const $q = useQuasar()

const shopInfo = props.shopInfo

const niceVanPartnerCodeKeyList = props.niceVanPartnerCodeKeyList.map((item, index) => {
  item.index = index
  return item
})

const filteredBusinessTypeOption = ref(businessTypeOption)
const selectedBusinessTypeCatOption = ref<string>('80')

const contractDto = ref<NiceVanContractDto>({
  type: '1',
  businessNo: shopInfo.businessNumber,
  corpRegNo: '',
  businessName: shopInfo.shopName,
  merchantName: shopInfo.shopName,
  directorName: shopInfo.ownerName!,
  birthDt: shopInfo.ownerBirth!.length === 8 ? shopInfo.ownerBirth!.substring(2, 8) : shopInfo.ownerBirth!,
  zipCode: shopInfo.zipcode,
  officeAddress1: shopInfo.address1,
  officeAddress2: shopInfo.address2,
  businessKind: '8001',
  businessType: '2501',
  businessDetail: '',
  officeTelNo: shopInfo.shopPhoneNumber!,
  mobileTelNo: shopInfo.managerPhoneNumber!,
  homeTelNo: shopInfo.managerPhoneNumber!,
  staffTelNo: shopInfo.managerPhoneNumber,
  email: shopInfo.managerEmail!,
  homepage: '',
  regDate1: dayjs().format('YYYYMMDD'),
  regUser1: shopInfo.ownerName!,
  regDate2: '',
  regUser2: '',
  visaAcqCom: '',
  masterAcqCom: '',
  jcbAcqCom: '',
  kisBackupYn: 'N',
  formVersion: 'A',
  agentRegDate: dayjs().format('YYYYMMDD'),
  agentCode: '2000',
  agentBusinessNo: '8048101036',
  agentName: '주식회사 아치서울',
  agentDirectorName: '',
  agentAddr1: '',
  agentAddr2: '',
  agentUsrId: '',
  agentUsrName: '',
  agentUsrPhone: '',
  parentAgentCode: '2000',
  estInfoCollectYn: 'N',
  privacyCollectYn: 'Y',
  estInfoOfferYn: 'N',
  privacyOfferYn: 'Y',
  useAdviceMethodYn: 'N',
  useAdviceMethodTelYn: 'N',
  useAdviceMethodSmsYn: 'N',
  useAdviceMethodWrittenYn: 'N',
  useAdviceMethodEmailYn: 'N',
  businessLicenseFile: null,
  ownerIdCardFile: null,
  corpAffObj: [],

  partnerCode: '',
  catId: 0
})

const selectedPartnerCode = ref<NiceVanPartnerCodeKeyVo|null>(null)

// PDF 미리보기 관련
const showPreview = ref(false)
const previewUrl = ref<string | null>(null)
const currentPreviewType = ref<'business' | 'owner' | null>(null)
const isImageFile = ref(false)

const prettyDate = (dateString:string) => {
  return dayjs(dateString, 'YYYYMMDD').format('YYYY/MM/DD')
}

// 파일 또는 서버에서 미리보기 URL 생성
const loadPreviewUrl = async (fileType: 'business-license' | 'owner-license', file?: File): Promise<string | null> => {
  try {
    if (file) {
      // 파일 객체에서 직접 URL 생성
      console.log('파일에서 미리보기 URL 생성:', file.name, file.type)
      isImageFile.value = file.type.startsWith('image/')
      return URL.createObjectURL(file)
    }

    // 서버에서 파일 로드
    console.log('서버에서 미리보기 URL 생성:', fileType)
    const apiPath = `/admin/handOrder/shop/${shopInfo.shopCode}/${fileType}`
    const blob = await customFetch<Blob>(apiPath, {
      method: 'GET',
      responseType: 'blob',
      onResponse: (context) => {
        console.log('서버 응답:', context.response.status, context.response.headers.get('Content-Type'))
      }
    })

    if (!blob) {
      console.error('파일을 가져오지 못했습니다.')
      $q.notify({
        type: 'negative',
        message: '파일을 가져오지 못했습니다.'
      })
      return null
    }

    if (blob.size === 0) {
      console.error('빈 파일입니다.')
      $q.notify({
        type: 'negative',
        message: '빈 파일입니다.'
      })
      return null
    }

    console.log('Blob 타입:', blob.type, 'Blob 크기:', blob.size)
    isImageFile.value = blob.type.startsWith('image/')
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('미리보기 URL 생성 에러:', error)
    $q.notify({
      type: 'negative',
      message: `파일 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    })
    return null
  }
}

// 미리보기 토글 함수
const togglePreview = async (type: 'business' | 'owner') => {
  console.log('togglePreview 호출:', type, 'showPreview:', showPreview.value, 'currentType:', currentPreviewType.value)

  if (showPreview.value && currentPreviewType.value === type) {
    // 같은 타입 클릭 시 닫기
    console.log('미리보기 닫기')
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    showPreview.value = false
    currentPreviewType.value = null
    previewUrl.value = null
    return
  }

  // 이전 URL 해제
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  currentPreviewType.value = type
  showPreview.value = true

  if (type === 'business') {
    if (contractDto.value.businessLicenseFile) {
      console.log('사업자등록증 파일에서 로드:', contractDto.value.businessLicenseFile.name)
      previewUrl.value = await loadPreviewUrl('business-license', contractDto.value.businessLicenseFile)
    } else if (shopInfo.businessLicensePath) {
      console.log('사업자등록증 서버에서 로드:', shopInfo.businessLicensePath)
      previewUrl.value = await loadPreviewUrl('business-license')
    } else {
      console.log('사업자등록증 파일이 없습니다')
    }
  } else if (contractDto.value.ownerIdCardFile) {
    console.log('대표자신분증 파일에서 로드:', contractDto.value.ownerIdCardFile.name)
    previewUrl.value = await loadPreviewUrl('owner-license', contractDto.value.ownerIdCardFile)
  } else if (shopInfo.ownerLicensePath) {
    console.log('대표자신분증 서버에서 로드:', shopInfo.ownerLicensePath)
    previewUrl.value = await loadPreviewUrl('owner-license')
  } else {
    console.log('대표자신분증 파일이 없습니다')
  }
}

// 컴포넌트 언마운트 시 URL 정리
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

// 파일 경로를 File 객체로 변환하는 함수
const convertPathToFile = async (fileType: 'business-license' | 'owner-license', defaultFileName: string): Promise<File | null> => {
  try {
    let fileName = defaultFileName

    const apiPath = `/admin/handOrder/shop/${shopInfo.shopCode}/${fileType}`
    const blob = await customFetch<Blob>(apiPath, {
      method: 'GET',
      responseType: 'blob',
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `파일 로드 실패: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onResponse: (context) => {
        const contentDisposition = context.response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        if (contentDisposition) {
          fileName = decodeURIComponent(contentDisposition)
        }
      }
    })

    if (!blob) {
      return null
    }

    // File 객체 생성
    return new File([blob], fileName, { type: blob.type || 'application/pdf' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '파일 변환 중 오류가 발생했습니다.'
    })
    return null
  }
}

// 컴포넌트 마운트 시 기존 파일이 있으면 로드
onMounted(async () => {
  if (shopInfo.businessLicensePath) {
    const file = await convertPathToFile('business-license', shopInfo.businessLicenseFileName || 'business_license.pdf')
    if (file) {
      contractDto.value.businessLicenseFile = file
    }
  }

  if (shopInfo.ownerLicensePath) {
    const file = await convertPathToFile('owner-license', shopInfo.ownerLicenseFileName || 'owner_id_card.pdf')
    if (file) {
      contractDto.value.ownerIdCardFile = file
    }
  }
})

const updateCardAffObj = (obj:{cardName:string, affObj: NiceVanCorpAffObj}[]) => {
  contractDto.value.corpAffObj = obj
}
const updateAffForm = (obj:QForm | null) => {
  affForm.value = obj
}
const openNiceVanTerm = (name:string|null) => {
  let comp
  if (name === 'useAdviceMethodYn') {
    comp = NiceVanTerms
  } else {
    comp = NiceVanTermsAll
  }
  $q.dialog({
    component: comp,
    componentProps: {
      shopInfo,
      name
    }
  }).onOk(() => {
    if (name === 'useAdviceMethodYn') {
      contractDto.value.useAdviceMethodYn = 'Y'
    }
  })
}

const validateData = async () => {
  let message = '등록하시겠습니까?'

  if (!selectedPartnerCode.value?.manual) {
    switch (step.value) {
      case 1:
        if (contractDto.value.estInfoCollectYn === 'N' || contractDto.value.estInfoOfferYn === 'N' || contractDto.value.useAdviceMethodYn === 'N') {
          $q.notify({
            message: '모든 약관에 동의해주세요.',
            color: 'negative',
            position: 'top'
          })
          return
        } else {
          step.value++
          return
        }

      case 2:
        contractForm.value?.validate(true).then((success) => {
          if (success) {
            if (!contractDto.value.businessLicenseFile || !contractDto.value.ownerIdCardFile) {
              $q.notify({
                type: 'negative',
                message: '사업자등록증과 대표자 신분증을 첨부해주세요.'
              })
            } else if (contractDto.value.businessLicenseFile.size + contractDto.value.ownerIdCardFile.size > 5 * 1024 * 1024) {
              $q.notify({
                type: 'negative',
                message: '파일 크기의 합이 5MB를 초과했습니다.'
              })
            } else {
              step.value++
            }
          }
        })
        return

      case 3:
        if (contractDto.value.corpAffObj.length === 0) {
          message = '카드사 가맹 정보가 없습니다. 그래도 ' + message
        } else if (shopInfo.corporate) {
          const resultVal = await affForm.value?.validate(true)
          if (!resultVal) {
            $q.notify({
              type: 'negative',
              message: '카드사 가맹 정보를 확인하세요.'
            })
            return
          }
        }
        break
    }
  } else if (contractDto.value.catId === 0) {
    $q.notify({
      message: 'CAT ID를 입력하세요.',
      color: 'negative',
      position: 'top'
    })
    return
  }

  $q.dialog({
    message,
    cancel: true
  }).onOk(async () => {
    if (selectedPartnerCode.value?.manual) {
      await manualAdd()
    } else {
      await uploadContract()
    }
  })
}
const manualAdd = async () => {
  $q.loading.show()

  await customFetch<string>(`/admin/handOrder/nicevan/merchant/manual/${shopInfo.shopSeq}`, {
    method: 'POST',
    params: {
      catId: contractDto.value.catId,
      partnerCode: selectedPartnerCode.value?.partnerCode
    },
    onResponseError: (ctx) => {
      $q.loading.hide()
      $q.notify({
        type: 'negative',
        message: `${ctx.response._data.message}`
      })
    },
    onRequestError: (ctx) => {
      $q.loading.hide()
      $q.notify({
        type: 'negative',
        message: `가맹점 등록에 실패하였습니다. ${ctx.error.message}`
      })
    }
  })

  $q.loading.hide()
  $q.notify({
    type: 'positive',
    message: '계약서 업로드에 성공하였습니다.'
  })
  onDialogOK()
}

const uploadContract = async () => {
  const formData = new FormData()

  for (const key in contractDto.value) {
    const value = contractDto.value[key as keyof typeof contractDto.value]
    if (value instanceof File) {
      formData.append(key, value)
    } else if (value !== null && value !== undefined) {
      if (typeof value === 'object') {
        // 객체나 배열은 JSON 문자열로 변환
        formData.append(key, JSON.stringify(value))
      } else {
        // 문자열, 숫자 등은 그대로
        formData.append(key, value.toString())
      }
    }
  }

  $q.loading.show()

  await customFetch<string>(`/admin/handOrder/nicevan/merchant/auto/${shopInfo.shopSeq}`, {
    method: 'POST',
    body: formData,
    onResponseError: (ctx) => {
      $q.loading.hide()
      $q.notify({
        type: 'negative',
        message: `${ctx.response._data.message}`
      })
    },
    onRequestError: (ctx) => {
      $q.loading.hide()
      $q.notify({
        type: 'negative',
        message: `계약서 업로드에 실패하였습니다. ${ctx.error.message}`
      })
    }
  })

  $q.loading.hide()
  $q.notify({
    type: 'positive',
    message: '계약서 업로드에 성공하였습니다.'
  })
  onDialogOK()
}

const stepper = [1, 2, 3]
const step = ref<number>(1)

const handleStep = (next:boolean) => {
  if (next) {
    validateData()
  } else {
    step.value--
  }
}

const contractForm = ref<QForm | null>(null)
const affForm = ref<QForm | null>(null)
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :auto-close="false"
    persistent
    @hide="onDialogHide"
  >
    <!-- max-width도 shopPreview여부로 활성화   -->
    <q-card class="q-dialog-plugin" :style="`width: ${showPreview ? '1400px' : '800px'}; ${showPreview ? 'max-width: 95vw' : ''};`">
      <q-card-section class="text-h6 text-bold">
        NICE VAN 가맹점 등록
      </q-card-section>
      <q-separator />
      <q-card-section style="max-height: 80vh; overflow-y: auto;">
        <div class="row q-col-gutter-md">
          <!-- 좌측: 입력 폼 -->
          <div :class="showPreview ? 'col-7' : 'col-12'">
            <q-list>
              <q-select
                v-model="selectedPartnerCode"
                label="매장 유형"
                :options="niceVanPartnerCodeKeyList"
                :option-label="(item:NiceVanPartnerCodeKeyVo) => item.partnerCode !== undefined ? `(${item.partnerCode}) ${item.note}` : ''"
                map-options
                :rules="[
                  (val:string) => val !== undefined || '매장 유형을 선택하세요.',
                ]"

                @update:model-value="(option:NiceVanPartnerCodeKeyVo) => {
                  contractDto.partnerCode = option.partnerCode
                  if(option.manual) {
                    step = 3
                  } else {
                    step = 1
                  }
                }"
              />

              <template v-if="contractDto.partnerCode !== ''">
                <template v-if="!selectedPartnerCode?.manual">
                  <q-stepper
                    ref="stepper"
                    v-model="step"
                    color="primary"
                    animated
                  >
                    <q-step
                      :name="1"
                      title="약관동의"
                      icon="assignment"
                      :done="step > 1"
                    >
                      <q-item>
                        <q-item-section side>
                          개인정보 수집 이용 동의 (필수)
                        </q-item-section>
                        <q-item-section>
                          <q-checkbox
                            v-model="contractDto.estInfoCollectYn"
                            dense
                            outlined
                            no-error-icon
                            hide-bottom-space
                            true-value="Y"
                            false-value="N"
                            :rules="[(val:string) => val.length > 0 || '개인정보 수집 이용 동의가 필요합니다.']"
                          />
                        </q-item-section>
                        <q-item-section side>
                          <span class="cursor-pointer q-mr-md" @click="() => openNiceVanTerm('')">약관보기 <q-icon name="arrow_forward_ios" /> </span>
                        </q-item-section>
                      </q-item>

                      <q-item>
                        <q-item-section side>
                          개인(신용)정보 제공 동의 (필수)
                        </q-item-section>
                        <q-item-section>
                          <q-checkbox
                            v-model="contractDto.estInfoOfferYn"
                            dense
                            outlined
                            no-error-icon
                            hide-bottom-space
                            true-value="Y"
                            false-value="N"
                            :rules="[(val:string) => val.length > 0 || '개인(신용)정보 제공 동의가 필요합니다.']"
                          />
                        </q-item-section>
                      </q-item>

                      <q-item>
                        <q-item-section side>
                          NICE VAN 서비스 이용 동의 (필수)
                        </q-item-section>
                        <q-item-section>
                          <q-item-section>
                            <q-checkbox
                              v-model="contractDto.useAdviceMethodYn"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              true-value="Y"
                              false-value="N"
                              :rules="[(val:string) => val.length > 0 || 'NICE VAN 서비스 이용 동의가 필요합니다.']"
                              @update:model-value="(val:string) => {
                                if(val === 'Y') {
                                  contractDto.useAdviceMethodYn = 'N'
                                  openNiceVanTerm('useAdviceMethodYn')
                                }
                              }"
                            />
                          </q-item-section>
                        </q-item-section>
                        <q-item-section side>
                          <span class="cursor-pointer q-mr-md" @click="() => openNiceVanTerm('useAdviceMethodYn')">약관보기 <q-icon name="arrow_forward_ios" /> </span>
                        </q-item-section>
                      </q-item>

                      <q-item
                        v-if="contractDto.useAdviceMethodYn === 'Y'
                        //&& termsAgreement.includes('3')
                        "
                      >
                        <q-item-section side>
                          서비스 이용 권유방법
                        </q-item-section>
                        <q-item-section>
                          <q-checkbox
                            v-model="contractDto.useAdviceMethodTelYn"
                            dense
                            outlined
                            no-error-icon
                            hide-bottom-space
                            label="전화"
                            true-value="Y"
                            false-value="N"
                          />
                          <q-checkbox
                            v-model="contractDto.useAdviceMethodSmsYn"
                            dense
                            outlined
                            no-error-icon
                            hide-bottom-space
                            label="SMS"
                            true-value="Y"
                            false-value="N"
                          />
                          <q-checkbox
                            v-model="contractDto.useAdviceMethodWrittenYn"
                            dense
                            outlined
                            no-error-icon
                            hide-bottom-space
                            label="서면"
                            true-value="Y"
                            false-value="N"
                          />
                          <q-checkbox
                            v-model="contractDto.useAdviceMethodEmailYn"
                            dense
                            outlined
                            no-error-icon
                            hide-bottom-space
                            label="Email"
                            true-value="Y"
                            false-value="N"
                          />
                        </q-item-section>
                      </q-item>
                    </q-step>
                    <q-step
                      :name="2"
                      title="계약서 작성"
                      icon="two"
                      :done="step > 2"
                    >
                      <q-form
                        ref="contractForm"
                        greedy
                      >
                        <q-item>
                          <q-item-section side>
                            사업자번호
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.businessNo"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              maxlength="10"
                              :readonly="true"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item v-if="shopInfo.corporate">
                          <q-item-section side>
                            법인등록번호
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.corpRegNo"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              maxlength="13"
                              :rules="[
                                (val:string) => /^\d+$/.test(val) || '법인등록번호는 숫자만 입력해주세요.',
                                (val:string) => val.length === 13 || '법인등록번호는 13자리로 입력해주세요.'
                              ]"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            상호명
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.businessName"
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
                            간판상호명
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.merchantName"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              maxlength="100"
                              :rules="[(val:string) => val.length > 0 || '간판상호명을 입력해주세요.']"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            대표자명
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.directorName"
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
                            생년월일
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.birthDt"
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
                              v-model="contractDto.zipCode"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              maxlength="6"
                              :rules="[
                                (val:string) => val.length > 0 || '우편번호를 입력해주세요.',
                                (val:string) => /^\d+$/.test(val) || '우편번호는 숫자만 입력해주세요.',
                                (val:string) => (val.length === 5 || val.length === 6 ) || '우편번호는 5자리 혹은 6자리로 입력해주세요.',
                              ]"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            사업장주소1
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.officeAddress1"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              :readonly="true"
                              maxlength="100"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            사업장주소2
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.officeAddress2"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              :readonly="true"
                              maxlength="100"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            업태(종목)
                          </q-item-section>
                          <q-item-section>
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
                                  contractDto.businessKind = ''
                                }
                              }"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-select
                              v-model="contractDto.businessKind"
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
                                  contractDto.businessKind = businessKindOption.find(
                                    (item) => item.value === val)?.label || ''
                                } else {
                                  contractDto.businessKind = ''
                                }
                              }"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            업종
                          </q-item-section>
                          <q-item-section>
                            <q-select
                              v-model="contractDto.businessType"
                              use-input
                              hide-selected
                              fill-input
                              input-debounce="0"
                              :options="filteredBusinessTypeOption"
                              map-options
                              emit-value
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              @filter="(val:string, filterFn:Function) => {
                                filterFn(() => {
                                  filteredBusinessTypeOption = businessTypeOption.filter(v => v.label.toLowerCase().includes(val.toLowerCase()))
                                })
                              }"
                            >
                              <template v-slot:no-option>
                                <q-item>
                                  <q-item-section class="text-grey">
                                    검색 결과 없음
                                  </q-item-section>
                                </q-item>
                              </template>
                            </q-select>
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            취급품목
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.businessDetail"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              :rules="[(val:string) => val.length > 0 || '취급품목을 입력해주세요.']"
                              maxlength="30"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            사업장연락처
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.officeTelNo"
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
                            휴대전화번호
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.mobileTelNo"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              :rules="[(val:string) => val.length > 0 || '휴대전화번호를 입력해주세요.']"
                              :readonly="true"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            자택전화번호
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.homeTelNo"
                              dense
                              outlined
                              no-error-icon
                              hide-bottom-space
                              :rules="[(val:string) => val.length > 0 || '자택전화번호를 입력해주세요.', (val:string) => /^\d+$/.test(val) || '자택전화번호는 숫자만 입력해주세요.']"
                              maxlength="15"
                            />
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            Email 주소
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.email"
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
                            신청일
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              outlined
                              dense
                              :model-value="prettyDate(contractDto.regDate1)"
                            >
                              <template v-slot:append>
                                <q-icon name="event" class="cursor-pointer">
                                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                    <q-date v-model="contractDto.regDate1" mask="YYYYMMDD">
                                      <div class="row items-center justify-end">
                                        <q-btn v-close-popup label="Close" color="primary" flat />
                                      </div>
                                    </q-date>
                                  </q-popup-proxy>
                                </q-icon>
                              </template>
                            </q-input>
                          </q-item-section>
                        </q-item>
                        <q-item>
                          <q-item-section side>
                            신청자(대표자)
                          </q-item-section>
                          <q-item-section>
                            <q-input
                              v-model="contractDto.regUser1"
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
                            사업자 등록증
                          </q-item-section>
                          <q-item-section>
                            <q-file
                              v-model="contractDto.businessLicenseFile"
                              label="사업자 등록증"
                              dense
                              rounded
                              outlined
                              color="primary"
                              :max-files="1"
                              accept="application/pdf,image/*"
                            >
                              <template v-slot:prepend>
                                <q-icon name="attach_file" />
                              </template>
                            </q-file>
                          </q-item-section>
                          <q-item-section side>
                            <q-btn
                              dense
                              flat
                              color="primary"
                              icon="visibility"
                              label="미리보기"
                              :disable="!contractDto.businessLicenseFile && !shopInfo.businessLicensePath"
                              @click="togglePreview('business')"
                            />
                          </q-item-section>
                        </q-item>

                        <q-item>
                          <q-item-section side>
                            대표자 신분증
                          </q-item-section>
                          <q-item-section>
                            <q-file
                              v-model="contractDto.ownerIdCardFile"
                              label="대표자 신분증"
                              dense
                              rounded
                              outlined
                              color="primary"
                              :max-files="1"
                              accept="application/pdf,image/*"
                            >
                              <template v-slot:prepend>
                                <q-icon name="attach_file" />
                              </template>
                            </q-file>
                          </q-item-section>
                          <q-item-section side>
                            <q-btn
                              dense
                              flat
                              color="primary"
                              icon="visibility"
                              label="미리보기"
                              :disable="!contractDto.ownerIdCardFile && !shopInfo.ownerLicensePath"
                              @click="togglePreview('owner')"
                            />
                          </q-item-section>
                        </q-item>
                      </q-form>
                    </q-step>
                    <q-step
                      :name="3"
                      title="카드사 가맹정보 확인"
                      icon="card"
                      :done="step > 3"
                    >
                      <q-item width="100%">
                        <NiceVanCorpCardInfo
                          :corp-aff-obj="contractDto.corpAffObj"
                          :shop-seq="shopInfo.shopSeq"
                          :is-corp="!!shopInfo.corporate"
                          :aff-form="affForm"
                          @update:corp-aff-obj="updateCardAffObj"
                          @update:aff-form="updateAffForm"
                        />
                      </q-item>
                    </q-step>
                    <!-- <q-item>
            <q-item-section side>
              위임 신청일
            </q-item-section>
            <q-item-section>
              <q-input
                outlined
                dense
                :model-value="prettyDate(contractDto.agentRegDate)"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="contractDto.agentRegDate" mask="YYYYMMDD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </q-item-section>
          </q-item> -->

                    <!-- <q-separator />
            <div class="col-12 col-sm-9 row justify-between">
              <q-option-group
                v-model="termsAgreement"
                type="checkbox"
                :options="[
                  { label: '개인정보 수집 이용 동의', value: '1', name:'/text/shop/niceVanTerms' },
                  { label: '개인(신용)정보 제공 동의', value: '2', name:'estInfoOfferYn' },
                  { label: 'NICE VAN 서비스 이용 동의 여부', value: '3', name:'useAdviceMethodYn' }
                ]"
                class="full-width custom-agree"
              >
                <template v-slot:label="opt">
                  <div class="row justify-between items-center agree-label" @click.stop>
                    <span>{{ opt.label }} </span>
                    <span v-if="opt.value !== '2'" class="cursor-pointer" @click.stop="openNiceVanTerm(opt.name)">약관보기 <q-icon name="arrow_forward_ios" /> </span>
                  </div>
                </template>
              </q-option-group>
            </div> -->
                  </q-stepper>
                </template>
                <template v-else>
                  <q-item>
                    <q-item-section side>
                      CAT ID
                    </q-item-section>
                    <q-item-section>
                      <q-input
                        v-model="contractDto.catId"
                        dense
                        outlined
                        no-error-icon
                        hide-bottom-space
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </template>
            </q-list>
          </div>

          <!-- 우측: PDF 미리보기 -->
          <div v-if="showPreview" class="col-5">
            <q-card flat bordered>
              <q-card-section class="bg-primary text-white">
                <div class="text-h6">
                  {{ currentPreviewType === 'business' ? '사업자 등록증' : '대표자 신분증' }} 미리보기
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section class="q-pa-none" style="height: calc(80vh - 100px); overflow: auto;">
                <template v-if="previewUrl">
                  <!-- 이미지 파일인 경우 -->
                  <div v-if="isImageFile" class="flex flex-center q-pa-md" style="height: 100%;">
                    <img :src="previewUrl" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="미리보기">
                  </div>
                  <!-- PDF 파일인 경우 -->
                  <component
                    :is="VPdfViewer"
                    v-else-if="VPdfViewer"
                    :src="previewUrl"
                    style="height: 100%;"
                  />
                  <div v-else class="flex flex-center" style="height: 100%;">
                    <q-spinner color="primary" size="3em" />
                  </div>
                </template>
                <div v-else class="flex flex-center" style="height: 100%;">
                  <q-spinner color="primary" size="3em" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="selectedPartnerCode != null">
          <q-btn
            color="primary"
            :label="step < 3 ? '다음' : '등록'"
            class="float-right q-mb-md"
            @click="handleStep(true)"
          />
          <q-btn
            v-if="!selectedPartnerCode.manual && step > 1"
            label="이전"
            color="grey-5"
            class="float-right q-mb-md"
            style="margin-right:5px"
            @click="handleStep(false)"
          />
        </div>
        <q-btn
          color="grey-5"
          label="닫기"
          @click="onDialogHide"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.custom-agree{
  :deep(.q-checkbox),
  :deep(.q-checkbox .q-checkbox__label)
  {
    width: 100%;
  }
  .agree-label{
    cursor:default;
  }
}
</style>
<style lang="scss">
.vpv-pages-container-wrapper{
  .vpv-pages-inner-container {
    position: absolute;
    display: block;
    background-color: #ffffff;
    z-index: 999;
  }
}
</style>
