<script setup lang="ts">
import { QInput, useQuasar } from 'quasar'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import useDayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import type { AdminMemberPostDto, ShopInfoVo } from '~/types'
import { decrypt } from '~/utils/encrypt'
import TermsOfService from '~/components/termsOfService.vue'

definePageMeta({
  layout: 'signup'
})
const route = useRoute()
const router = useRouter()

const $q = useQuasar()
const dayjs = useDayjs

/* const isIdAvailable = ref(false) */
const idInput = ref<InstanceType<typeof QInput> | null>(null)
const headCompanyId = ref<InstanceType<typeof QInput> | null>(null)
const signupForm = ref<any>(null)

const isIdValidation = ref(false)

const rawPassword = ref('')
const passwordCheck = ref('')
const agree = ref([])

// 벨리데이션 스크롤을 위한 ref
const businessLicenseRef = ref<HTMLElement | null>(null)
const ownerLicenseRef = ref<HTMLElement | null>(null)
const termsRef = ref<HTMLElement | null>(null)
const bankBookRef = ref<HTMLElement | null>(null)
const corporateStampRef = ref<HTMLElement | null>(null)
const corporateRegistrationRef = ref<HTMLElement | null>(null)
const ownerConfirmationRef = ref<HTMLElement | null>(null)

const shopCode = decrypt(route.params.shopCode as string)

const shopData = await useCustomFetch<ShopInfoVo>('/admin/handOrder/signup/shop/' + shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const companyMemberId = ref('')

const shopInfoData = shopData.data

const specialTermsOfServiceData = await useCustomFetch('/admin/handOrder/signup/temp/shop/' + shopCode, {
  method: 'GET'
})

const isSpecialTermsOfService = specialTermsOfServiceData.data

const termsOfServiceList = isSpecialTermsOfService.value
  ? [
      { label: $t('COMPANY.126'), value: '1', fileName: '/text/shop/termsOfService_1.md' },
      { label: $t('COMPANY.127'), value: '2', fileName: '/text/shop/termsOfService_2.md' },
      { label: $t('COMPANY.128'), value: '3', fileName: '/text/shop/termsOfService_4.md' },
      { label: $t('COMPANY.132'), value: '4', fileName: '/text/shop/termsOfService_5.md' }
    ]
  : [
      { label: $t('COMPANY.126'), value: '1', fileName: '/text/shop/termsOfService_1.md' },
      { label: $t('COMPANY.127'), value: '2', fileName: '/text/shop/termsOfService_2.md' },
      { label: $t('COMPANY.128'), value: '3', fileName: '/text/shop/termsOfService_3.md' }
    ]

const signupInfo:Ref<{shopInfo:ShopInfoVo, userInfo:AdminMemberPostDto}> = ref({
  shopInfo: {
    ...shopInfoData.value!
  },
  userInfo: {
    id: '',
    password: '',
    userName: '',
    position: '',
    userType: 'shop',
    phoneNumber: '',
    email: '',
    shopSeq: 0,
    isPg: false
  }
})

const shopBusinessNameYn = ref(false)

const businessLicenseFile = ref<File | null>(null)
const bankBookFile = ref<File | null>(null)
const contractFile = ref<File | null>(null)
const cmsFormFile = ref<File | null>(null)
const etcFileFile = ref<File | null>(null)
const ownerLicenseFile = ref<File | null>(null)
const ownerStampFile = ref<File | null>(null)
const corporateStampFile = ref<File | null>(null)
const corporateRegistrationFile = ref<File | null>(null)
const ownerConfirmationFile = ref<File | null>(null)
const useStampFile = ref<File | null>(null)

type FileType = 'businessLicenseFile' | 'bankBookFile' | 'contractFile' | 'cmsFormFile' | 'etcFileFile' | 'ownerLicenseFile' | 'ownerStampFile' | 'corporateStampFile' | 'corporateRegistrationFile' | 'ownerConfirmationFile' | 'useStampFile'

const fileObject: Record<FileType, {koreanFileType:string, apiPath:string, file: Ref<File | null>}> = {
  businessLicenseFile: {
    koreanFileType: $t('COMPANY.025'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/business-license',
    file: businessLicenseFile
  },
  bankBookFile: {
    koreanFileType: $t('COMPANY.026'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/bank-book',
    file: bankBookFile
  },
  contractFile: {
    koreanFileType: $t('COMPANY.040'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/contract',
    file: contractFile
  },
  cmsFormFile: {
    koreanFileType: $t('SHOP.021'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/cms-form',
    file: cmsFormFile
  },
  etcFileFile: {
    koreanFileType: $t('SHOP.022'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/etc-file',
    file: etcFileFile
  },
  ownerLicenseFile: {
    koreanFileType: $t('SHOP.025'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/owner-license',
    file: ownerLicenseFile
  },
  ownerStampFile: {
    koreanFileType: $t('SHOP.144'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/owner-stamp',
    file: ownerStampFile
  },
  corporateStampFile: {
    koreanFileType: $t('SHOP.146'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/corporate-stamp',
    file: corporateStampFile
  },
  corporateRegistrationFile: {
    koreanFileType: $t('SHOP.147'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/corporate-registration',
    file: corporateRegistrationFile
  },
  ownerConfirmationFile: {
    koreanFileType: $t('SHOP.148'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/owner-confirmation',
    file: ownerConfirmationFile
  },
  useStampFile: {
    koreanFileType: $t('SHOP.149'),
    apiPath: '/admin/handOrder/signup/shop/file/' + shopCode + '/use-stamp',
    file: useStampFile
  }
}

const businessApiCheck = async () => {
  if (isEmpty(signupInfo.value.shopInfo.businessNumber)) {
    $q.notify({
      message: $t('COMPANY.099'),
      color: 'negative',
      position: 'top'
    })
    return false
  }
  if (signupInfo.value.shopInfo.businessNumber.length !== 10) {
    $q.notify({
      message: $t('COMPANY.100'),
      color: 'negative',
      position: 'top'
    })
    return false
  }

  const data = {
    b_no: [signupInfo.value.shopInfo.businessNumber]
  }
  const checkResult:any = await useCustomFetch('/admin/handOrder/signup/businessNumberCheck', {
    method: 'POST',
    body: data
  })

  if (checkResult.data.value === 'FIND_USER') {
    $q.notify({
      message: $t('COMPANY.101'),
      color: 'negative',
      position: 'top'
    })
    return false
  }

  if (checkResult.data.value.match_cnt === undefined) {
    $q.notify({
      message: $t('COMPANY.102'),
      color: 'negative',
      position: 'top'
    })
    return false
  }

  $q.notify({
    message: $t('COMPANY.103'),
    color: 'positive',
    position: 'top'
  })
}

const checkHeadShopId = async () => {
  if (companyMemberId.value.length !== 0) {
    isIdValidation.value = await customFetch<boolean>('/admin/handOrder/signup/shop/id/check-validation', {
      method: 'GET',
      params: {
        id: companyMemberId.value,
        agencyUuid: shopInfoData.value?.agencyUuid
      }
    })
    isIdValidation.value
      ? $q.notify({
        message: $t('COMPANY.104'),
        color: 'positive',
        icon: 'check'
      })
      : $q.notify({
        message: $t('COMPANY.105'),
        color: 'negative',
        icon: 'close'
      })

    headCompanyId.value?.validate()
  }
}

// 벨리데이션 실패 요소로 스크롤하는 함수
const scrollToElement = (element: HTMLElement | null) => {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// q-form의 첫 번째 에러 필드로 스크롤
const scrollToFirstError = () => {
  setTimeout(() => {
    const errorElement = document.querySelector('.q-field--error')
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

const createSignupInfoSequence = async () => {
  // q-form validation 체크
  const isFormValid = await signupForm.value?.validate()
  if (!isFormValid) {
    await nextTick()
    scrollToFirstError()
    return
  }

  if (!businessLicenseFile.value) {
    scrollToElement(businessLicenseRef.value)
    $q.notify({
      message: $t('COMPANY.133'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  if (!ownerLicenseFile.value) {
    scrollToElement(ownerLicenseRef.value)
    $q.notify({
      message: $t('COMPANY.134'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  if (shopInfoData.value) {
    /*    $q.loading.show() */
    if (agree.value.length < termsOfServiceList.length) {
      scrollToElement(termsRef.value)
      $q.notify({
        message: $t('COMPANY.106'),
        color: 'negative',
        position: 'top'
      })
      return
    }

    if (signupInfo.value.shopInfo.pg && !bankBookFile.value) {
      scrollToElement(bankBookRef.value)
      $q.notify({
        message: $t('SHOP.154'),
        color: 'negative',
        position: 'top'
      })
      return
    }

    if (signupInfo.value.shopInfo.corporate && !corporateStampFile.value && signupInfo.value.shopInfo.pg) {
      scrollToElement(corporateStampRef.value)
      $q.notify({
        message: $t('SHOP.150'),
        color: 'negative',
        position: 'top'
      })
      return
    }

    if (signupInfo.value.shopInfo.corporate && !corporateRegistrationFile.value && signupInfo.value.shopInfo.pg) {
      scrollToElement(corporateRegistrationRef.value)
      $q.notify({
        message: $t('SHOP.151'),
        color: 'negative',
        position: 'top'
      })
      return
    }

    if (signupInfo.value.shopInfo.corporate && !ownerConfirmationFile.value && signupInfo.value.shopInfo.pg) {
      scrollToElement(ownerConfirmationRef.value)
      $q.notify({
        message: $t('SHOP.152'),
        color: 'negative',
        position: 'top'
      })
      return
    }

    try {
      await Promise.all([
        sendFile('businessLicenseFile'),
        sendFile('bankBookFile'),
        sendFile('contractFile'),
        sendFile('cmsFormFile'),
        sendFile('etcFileFile'),
        sendFile('ownerLicenseFile')
      ])
      if (shopInfoData.value.corporate && signupInfo.value.shopInfo.pg) {
        await Promise.all([
          sendFile('corporateStampFile'),
          sendFile('corporateRegistrationFile'),
          sendFile('ownerConfirmationFile'),
          sendFile('useStampFile')
        ])
      }
      await postSignupInfo()
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: $t('COMPANY.107')
      })
    }
  }
}

const postSignupInfo = async () => {
  signupInfo.value.userInfo.password = rawPassword.value

  signupInfo.value.shopInfo.agencyId = companyMemberId.value
  signupInfo.value.shopInfo.startDate = dayjs().format('YYYYMMDD')

  signupInfo.value.userInfo.id = shopInfoData.value!.shopCode
  signupInfo.value.userInfo.userName = shopInfoData.value!.shopName
  signupInfo.value.userInfo.phoneNumber = signupInfo.value.shopInfo.managerPhoneNumber!
  signupInfo.value.userInfo.email = shopInfoData.value!.managerEmail!
  signupInfo.value.userInfo.shopSeq = shopInfoData.value!.shopSeq

  if (!shopBusinessNameYn.value) { signupInfo.value.shopInfo.shopBusinessName = null }

  await customFetch(`/admin/handOrder/signup/shop/v2/${shopCode}`, {
    method: 'POST',
    body: signupInfo.value,
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.loading.hide()

        $q.dialog({
          title: $t('COMPANY.108'),
          message: $t('COMPANY.109'),
          ok: {
            label: $t('COMMON.004'),
            color: 'primary',
            unelevated: true
          }
        }).onOk(() => {
          router.push('/login')
        })
      } else {
        $q.notify({
          message: `${$t('COMPANY.110')} ${context.response._data.message}`,
          color: 'negative',
          icon: 'close'
        })
      }
    }
  })
}

const sendFile = async (fileType: FileType) => {
  if (fileObject[fileType].file.value && signupInfo.value.shopInfo) {
    const formData = new FormData()
    formData.append('file', fileObject[fileType].file.value!)
    const postResult = await customFetch<string>(fileObject[fileType].apiPath, {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${fileObject[fileType].koreanFileType} ${$t('COMMON.052')}. ${$t('COMMON.014')}: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onRequestError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${fileObject[fileType].koreanFileType} ${$t('COMMON.052')} ${ctx.error.message}`
        })
      }
    })
    const setSignupInfo:Record<FileType, () => void> = {
      businessLicenseFile: () => {
        signupInfo.value.shopInfo!.businessLicensePath = postResult
        signupInfo.value.shopInfo!.businessLicenseFileName = fileObject[fileType].file.value!.name
      },
      bankBookFile: () => {
        signupInfo.value.shopInfo!.bankBookPath = postResult
        signupInfo.value.shopInfo!.bankBookFileName = fileObject[fileType].file.value!.name
      },
      contractFile: () => {
        signupInfo.value.shopInfo!.contractPath = postResult
        signupInfo.value.shopInfo!.contractFileName = fileObject[fileType].file.value!.name
      },
      cmsFormFile: () => {
        signupInfo.value.shopInfo!.cmsFormPath = postResult
        signupInfo.value.shopInfo!.cmsFormFileName = fileObject[fileType].file.value!.name
      },
      etcFileFile: () => {
        signupInfo.value.shopInfo!.etcFilePath = postResult
        signupInfo.value.shopInfo!.etcFileFileName = fileObject[fileType].file.value!.name
      },
      ownerLicenseFile: () => {
        signupInfo.value.shopInfo!.ownerLicensePath = postResult
        signupInfo.value.shopInfo!.ownerLicenseFileName = fileObject[fileType].file.value!.name
      },
      ownerStampFile: () => {
        signupInfo.value.shopInfo!.ownerStampPath = postResult
        signupInfo.value.shopInfo!.ownerStampFileName = fileObject[fileType].file.value!.name
      },
      corporateStampFile: () => {
        signupInfo.value.shopInfo!.corporateStampPath = postResult
        signupInfo.value.shopInfo!.corporateStampFileName = fileObject[fileType].file.value!.name
      },
      corporateRegistrationFile: () => {
        signupInfo.value.shopInfo!.corporateRegistrationPath = postResult
        signupInfo.value.shopInfo!.corporateRegistrationFileName = fileObject[fileType].file.value!.name
      },
      ownerConfirmationFile: () => {
        signupInfo.value.shopInfo!.ownerConfirmationPath = postResult
        signupInfo.value.shopInfo!.ownerConfirmationFileName = fileObject[fileType].file.value!.name
      },
      useStampFile: () => {
        signupInfo.value.shopInfo!.useStampPath = postResult
        signupInfo.value.shopInfo!.useStampFileName = fileObject[fileType].file.value!.name
      }
    }
    setSignupInfo[fileType]()
  }
}

const notSigninCheck = async () => {
  const { data: isCompanyMember } = await useCustomFetch<boolean>(`/admin/handOrder/signup/shop/${shopCode}/member-check`, {
    method: 'GET'
  })

  if (isCompanyMember.value) {
    $q.dialog({
      title: $t('COMPANY.135'),
      message: `${$t('COMPANY.135')} ${$t('COMPANY.112')}`,
      ok: {
        label: $t('COMMON.004'),
        color: 'primary',
        unelevated: true
      }
    }).onOk(() => {
      router.push('/login')
    })
  }
}
notSigninCheck()

const onTermsOfServicePopup = (value:string) => {
  $q.dialog({
    component: TermsOfService,
    componentProps: {
      file: value
    }
  })
}

// q-form validation-error 이벤트 핸들러
const onValidationError = (ref: any) => {
  if (ref) {
    const element = ref.$el || ref
    if (element && element.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  } else {
    scrollToFirstError()
  }
}
</script>

<template>
  <div class="row wrap justify-center items-start content-start max-height-100vh">
    <div class="col-11 col-sm-11 col-md-8 col-lg-6 col-xl-5 self-center box-style max-height-100vh">
      <div>
        <div class="text-h6 text-center q-my-lg text-bold">
          {{ $t('COMPANY.136') }}
        </div>
        <q-separator class="q-my-lg" />
        <div class="row justify-center full-height">
          <q-form ref="signupForm" class="col-10 formbox full-height" @submit="createSignupInfoSequence" @validation-error="onValidationError">
            <div class="row justify-center items-center q-col-gutter-lg wrap q-mb-lg">
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.030') }}
                  <q-icon name="error" class="text-orange cursor-pointer" style="font-size:18px">
                    <q-popup-proxy :offset="[10, 10]">
                      <q-banner class="">
                        <template v-slot:avatar>
                          <q-icon name="warning" class="text-orange" />
                        </template>
                        <span class="text-red">＊</span>{{ $t('COMPANY.114', { email: 'info@handorder.co.kr' }) }}
                      </q-banner>
                    </q-popup-proxy>
                  </q-icon>
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <div class="col-8 col-sm-9 col-child q-pr-sm">
                  <q-input
                    v-model="signupInfo.shopInfo.businessNumber"
                    mask="#"
                    reverse-fill-mask
                    :placeholder="$t('COMPANY.115')"
                    outlined
                    maxlength="10"
                    input-class="input-class"
                    no-error-icon
                    :rules="[val => val && val.length > 0 || $t('COMPANY.099')]"
                    hide-bottom-space
                    :autofocus="false"
                  />
                </div>
                <div class="col-4 col-sm-3">
                  <q-btn color="primary" :label="$t('COMPANY.116')" @click="businessApiCheck" />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.117') }}
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <div class="col-12">
                  <div class="col-child">
                    <q-input v-model="shopInfoData.shopName" outlined input-class="input-class" disable :autofocus="false" />
                  </div>
                </div>
                <div class="col-12">
                  <q-checkbox v-model="shopBusinessNameYn" :label="$t('COMPANY.118')" />
                </div>
                <div class="col-12">
                  <div class="col-child">
                    <q-input
                      v-model="signupInfo.shopInfo.shopBusinessName"
                      :placeholder="$t('COMPANY.117')"
                      outlined
                      input-class="input-class"
                      :disable="!shopBusinessNameYn"
                      :autofocus="false"
                    />
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.027') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.shopInfo.ownerName"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.119')"
                    no-error-icon
                    :rules="[val => val && val.length > 0 || $t('COMPANY.119')]"
                    hide-bottom-space
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.016') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.shopInfo.ownerBirth"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.137')"
                    no-error-icon
                    :rules="[val => val && val.length > 0 || $t('COMPANY.137')]"
                    hide-bottom-space
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.017') }}
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <div class="col-child col-8 q-mb-md">
                  <q-input
                    v-model="signupInfo.shopInfo.address1"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY_REPORT.017')"
                    no-error-icon
                    :rules="[val => val && val.length > 0 || $t('MEMBER.021')]"
                    hide-bottom-space
                    :autofocus="false"
                  />
                </div>
                <div class="col-12 col-child">
                  <q-input v-model="signupInfo.shopInfo.address2" outlined input-class="input-class" :placeholder="$t('COMPANY.032')" :autofocus="false" />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.138') }}
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <div class="col-8 col-child q-pr-sm">
                  <q-input
                    ref="idInput"
                    v-model="shopInfoData.shopCode"
                    :placeholder="$t('LOGIN.002')"
                    outlined
                    input-class="input-class"
                    no-error-icon
                    hide-bottom-space
                    disable
                    :autofocus="false"
                    @update:model-value="(val) => { if (typeof val === 'string') signupInfo.userInfo.id = val.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '') }"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('LOGIN.003') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="rawPassword"
                    outlined
                    input-class="input-class"
                    type="password"
                    :placeholder="$t('LOGIN.004')"
                    no-error-icon
                    password
                    :rules="[
                      val => val && val.length > 0 || $t('LOGIN.004'),
                      val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(val) || $t('COMPANY.064')
                    ]"
                    hide-bottom-space
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMMON.048') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="passwordCheck"
                    outlined
                    input-class="input-class"
                    type="password"
                    no-error-icon
                    :placeholder="$t('LOGIN.004')"
                    password
                    :rules="[val => val === rawPassword || $t('COMPANY.063')]"
                    hide-bottom-space
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.023') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.shopInfo.shopPhoneNumber"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.139')"
                    :rules="[val => val && val.length > 0 || $t('COMPANY.139')]"
                    hide-bottom-space
                    no-error-icon
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.020') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="shopInfoData.managerName"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.054')"
                    disable
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.022') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="shopInfoData.managerEmail"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.055')"
                    disable
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.021') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.shopInfo.managerPhoneNumber"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('SHOP.135')"
                    :rules="[val => val && val.length > 0 || $t('SHOP.135')]"
                    hide-bottom-space
                    no-error-icon
                    disable
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('COMPANY.038') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child row">
                  <div class="col-4">
                    <q-select
                      v-model="signupInfo.shopInfo.bankName"
                      :options="['국민은행', '신한은행', '우리은행', '하나은행', '기업은행', '농협', '외환은행', 'SC제일은행', '씨티은행', '대구은행', '부산은행', '경남은행', '광주은행', '전북은행', '제주은행', '새마을금고', '신협', '우체국', '기타']"
                      outlined
                      input-class="input-class"
                      class="q-pr-md"
                    />
                  </div>
                  <div class="col-8">
                    <q-input
                      v-model="signupInfo.shopInfo.accountHolder"
                      outlined
                      input-class="input-class"
                      :placeholder="$t('COMPANY.140')"
                      hide-bottom-space
                      no-error-icon
                      :autofocus="false"
                    />
                  </div>
                  <div class="col-12 q-mt-sm">
                    <q-input
                      v-model="signupInfo.shopInfo.accountNumber"
                      outlined
                      input-class="input-class"
                      :placeholder="$t('COMPANY.141')"
                      hide-bottom-space
                      no-error-icon
                      :autofocus="false"
                    />
                  </div>
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('COMPANY_REPORT.024') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.shopInfo.naverUrl"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.142')"
                    hide-bottom-space
                    no-error-icon
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('COMPANY.028') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.shopInfo.shopType"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.121')"
                    hide-bottom-space
                    no-error-icon
                    :autofocus="false"
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY_REPORT.025') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <!--  number 타입에 무조건 0이라도 들어가면 좋겠는데                -->
                  <q-input
                    v-model="signupInfo.shopInfo.tableCount"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.143')"
                    hide-bottom-space
                    no-error-icon
                    mask="#"
                    fill-mask="0"
                    unmasked-value
                    reverse-fill-mask
                    :rules="[ val => val <= 200 || '테이블은 200개 이하로 입력해주세요.']"
                    :autofocus="false"
                  />
                </div>
              </div>
              <!-- 선불, 후불 선택란 -->
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('SHOP.155') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <q-radio
                  v-model="signupInfo.shopInfo.pg"
                  :val="false"
                >
                  <div>{{ $t('SHOP.036') }}</div>
                </q-radio>
                <q-radio
                  v-model="signupInfo.shopInfo.pg"
                  :val="true"
                >
                  <div>{{ $t('SHOP.156') }}</div>
                </q-radio>
              </div>
              <div class="col-12 col-sm-3 label">
                <div ref="businessLicenseRef" class="col-child red-asterisk">
                  {{ $t('COMPANY.025') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="businessLicenseFile"
                    :label="signupInfo.shopInfo.businessLicenseFileName ?? fileObject['businessLicenseFile'].koreanFileType"
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
              <div class="col-12 col-sm-3 label">
                <div ref="bankBookRef" class="col-child" :class="{ 'red-asterisk' : signupInfo.shopInfo.pg }">
                  {{ $t('COMPANY.026') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="bankBookFile"
                    :label="signupInfo.shopInfo.bankbookFileName ?? fileObject['bankBookFile'].koreanFileType"
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
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('COMPANY.145') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="contractFile"
                    :label="signupInfo.shopInfo.contractFileName ?? fileObject['contractFile'].koreanFileType"
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

              <!-- CMS 신청서-->
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('SHOP.021') }}
                </div>
              </div>

              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="cmsFormFile"
                    :label="signupInfo.shopInfo.cmsFormFileName ?? fileObject['cmsFormFile'].koreanFileType"
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

              <!-- 선불 신분증-->

              <div class="col-12 col-sm-3 row">
                <div ref="ownerLicenseRef" class="col-child red-asterisk">
                  {{ $t('COMPANY.146') }}
                </div>
              </div>
              <div class="col-12 col-sm-3 row">
                <div class="col-child">
                  <q-file
                    v-model="ownerLicenseFile"
                    :label="signupInfo.shopInfo.ownerLicenseFileName ?? fileObject['ownerLicenseFile'].koreanFileType"
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
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('SHOP.145') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="ownerStampFile"
                    :label="signupInfo.shopInfo.ownerStampFileName ?? fileObject['ownerStampFile'].koreanFileType"
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

              <template v-if="signupInfo.shopInfo.corporate && signupInfo.shopInfo.pg">
                <div class="col-12 col-sm-3 label">
                  <div ref="corporateStampRef" class="col-child red-asterisk">
                    {{ $t('SHOP.146') }}
                  </div>
                </div>
                <div class="col-12 col-sm-3">
                  <div class="col-child">
                    <q-file
                      v-model="corporateStampFile"
                      :label="signupInfo.shopInfo.corporateStampFileName ?? fileObject['corporateStampFile'].koreanFileType"
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
                <div class="col-12 col-sm-3 label">
                  <div ref="corporateRegistrationRef" class="col-child red-asterisk">
                    {{ $t('SHOP.147') }}
                  </div>
                </div>
                <div class="col-12 col-sm-3">
                  <div class="col-child">
                    <q-file
                      v-model="corporateRegistrationFile"
                      :label="signupInfo.shopInfo.corporateRegistrationFileName ?? fileObject['corporateRegistrationFile'].koreanFileType"
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
                <div class="col-12 col-sm-3 label">
                  <div ref="ownerConfirmationRef" class="col-child red-asterisk">
                    {{ $t('SHOP.148') }}
                  </div>
                </div>
                <div class="col-12 col-sm-3">
                  <div class="col-child">
                    <q-file
                      v-model="ownerConfirmationFile"
                      :label="signupInfo.shopInfo.ownerConfirmationFileName ?? fileObject['ownerConfirmationFile'].koreanFileType"
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
                <div class="col-12 col-sm-3 label">
                  <div class="col-child">
                    {{ $t('SHOP.149') }}
                  </div>
                </div>
                <div class="col-12 col-sm-3">
                  <div class="col-child">
                    <q-file
                      v-model="useStampFile"
                      :label="signupInfo.shopInfo.useStampFileName ?? fileObject['useStampFile'].koreanFileType"
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

              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('SHOP.032') }}
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <div class="col-8 col-child q-pr-sm">
                  <q-input
                    ref="headCompanyId"
                    v-model="companyMemberId"
                    outlined
                    input-class="input-class"
                    :rules="[val => val && val.length > 0 || $t('COMPANY.124'), ()=> isIdValidation || $t('COMPANY.130')]"
                    hide-bottom-space
                    no-error-icon
                    :autofocus="false"
                    @update:model-value="isIdValidation = false"
                  />
                </div>
                <div class="col-4">
                  <q-btn color="primary" :label="$t('COMPANY.116')" @click="checkHeadShopId" />
                </div>
              </div>

              <!-- 기타 기재란 -->
              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('COMPANY_REPORT.018') }}
                </div>
              </div>

              <div class="col-12 col-sm-9">
                <q-input
                  v-model="signupInfo.shopInfo.etcNote"
                  outlined
                  input-class="input-class"
                  hide-bottom-space
                  no-error-icon
                  autogrow
                  counter
                  maxlength="1000"
                  :autofocus="false"
                />
              </div>

              <div class="col-12 col-sm-3 label">
                <div class="col-child">
                  {{ $t('SHOP.022') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-file
                    v-model="etcFileFile"
                    :label="signupInfo.shopInfo.etcFileFileName ?? fileObject['etcFileFile'].koreanFileType"
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

              <div class="col-12">
                <q-separator class="q-my-lg" />
              </div>
              <div class="col-12 col-sm-3 label">
                <div ref="termsRef" class="col-child red-asterisk">
                  {{ $t('COMPANY.125') }}
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <q-option-group
                  v-model="agree"
                  type="checkbox"
                  :options="termsOfServiceList"
                  class="full-width custom-agree"
                >
                  <template v-slot:label="opt">
                    <div class="row justify-between items-center agree-label" @click.stop>
                      <span>{{ opt.label }}</span>
                      <span class="cursor-pointer" @click.stop="onTermsOfServicePopup(opt.fileName)">{{ $t('COMPANY.131') }} <q-icon name="arrow_forward_ios" /> </span>
                    </div>
                  </template>
                </q-option-group>
              </div>
              <div class="col-12 col-sm-3 label flex justify-center">
                <q-btn :label="$t('COMPANY.129')" color="primary" class="q-mt-md float-right" type="submit" />
              </div>
            </div>
          </q-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.box-style{
  border: 2px dashed #ff8b4a;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.1);
  .formbox{
    $row-height: 40px;
    .row{
      :deep(.col-child .q-field__control) {
        height: $row-height;
        min-height: $row-height;
      }
      :deep(.col-child .q-field__marginal){
        height: $row-height;
        min-height: $row-height;
      }
      :deep(.col-child .q-field--auto-height .q-field__native){
        height: $row-height;
        min-height: $row-height;
      }
    }
    .red-asterisk{
      &::before{
        content: '*';
        color: red;
      }
    }
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
  }
}
</style>
