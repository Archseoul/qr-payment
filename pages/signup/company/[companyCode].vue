<script setup lang="ts">
import { QInput, useQuasar } from 'quasar'
import { isEmpty } from 'lodash-es'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import useDayjs from 'dayjs'
import type { AdminMemberPostDto, SignupCompanyDto, CompanyVo } from '~/types'
import { decrypt } from '~/utils/encrypt'
import TermsOfService from '~/components/termsOfService.vue'

definePageMeta({
  layout: 'signup'
})
const route = useRoute()
const router = useRouter()

const $q = useQuasar()
const dayjs = useDayjs

const isIdAvailable = ref(false)
const idInput = ref<InstanceType<typeof QInput> | null>(null)
// const headCompanyId = ref<InstanceType<typeof QInput> | null>(null)
const signupForm = ref<any>(null)

const rawPassword = ref('')
const passwordCheck = ref('')
const agree = ref([])

// 벨리데이션 스크롤을 위한 ref
const businessLicenseFileRef = ref<HTMLElement | null>(null)
const bankBookFileRef = ref<HTMLElement | null>(null)
const termsRef = ref<HTMLElement | null>(null)

const companyCode = decrypt(route.params.companyCode as string)

const companyData = await useCustomFetch<CompanyVo>('/admin/handOrder/signup/company/' + companyCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const companyInfo = companyData.data ?? ref<CompanyVo | null>(null)

const signupInfo:Ref<{companyInfo:SignupCompanyDto, userInfo:AdminMemberPostDto}> = ref({
  companyInfo: {
    companySeq: 0,
    companyName: '',
    ownerName: '',
    companyBusinessName: '',
    businessType: '',
    businessStatus: '',
    businessNumber: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    address1: '',
    address2: '',
    businessLicensePath: '',
    businessLicenseFileName: '',
    bankbookPath: '',
    bankbookFileName: '',
    headCompanyMemberId: '',
    businessCheckYn: false,
    startDate: '',
    headCompanySeq: 0
  },
  userInfo: {
    id: '',
    password: '',
    userName: '',
    position: '',
    userType: 'company',
    phoneNumber: '',
    email: '',
    shopSeq: 0
  }
})

const companyBusinessNameYn = ref(false)

const businessLicenseFile = ref<File | null>(null)
const bankBookFile = ref<File | null>(null)

type FileType = 'businessLicenseFile' | 'bankBookFile'
const fileObject: Record<FileType, {koreanFileType:string, apiPath:string, file: Ref<File | null>}> = {
  businessLicenseFile: {
    koreanFileType: $t('COMPANY.025'),
    apiPath: '/admin/handOrder/signup/company/' + companyCode + '/business-license',
    file: businessLicenseFile
  },
  bankBookFile: {
    koreanFileType: $t('COMPANY.026'),
    apiPath: '/admin/handOrder/signup/company/' + companyCode + '/bank-book',
    file: bankBookFile
  }
}

const businessApiCheck = async () => {
  if (isEmpty(signupInfo.value.companyInfo.businessNumber)) {
    $q.notify({
      message: $t('COMPANY.099'),
      color: 'negative',
      position: 'top'
    })
    return false
  }
  if (signupInfo.value.companyInfo.businessNumber.length !== 10) {
    $q.notify({
      message: $t('COMPANY.100'),
      color: 'negative',
      position: 'top'
    })
    return false
  }

  const data = {
    b_no: [signupInfo.value.companyInfo.businessNumber]
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
    message: $t('COMPARY.103'),
    color: 'positive',
    position: 'top'
  })
}

const checkId = async () => {
  if (signupInfo.value.userInfo.id.length !== 0) {
    isIdAvailable.value = await customFetch<boolean>('/admin/handOrder/signup/member/id/check-available', {
      method: 'GET',
      params: {
        id: signupInfo.value.userInfo.id
      }
    })
    isIdAvailable.value
      ? $q.notify({
        message: $t('COMPANY.057'),
        color: 'positive',
        icon: 'check'
      })
      : $q.notify({
        message: $t('COMPANY.058'),
        color: 'negative',
        icon: 'close'
      })

    idInput.value?.validate()
  }
}

// const checkHeadCompanyId = async () => {
//   if (signupInfo.value.companyInfo.headCompanyMemberId.length !== 0) {
//     isIdValidation.value = await customFetch<boolean>('/admin/handOrder/signup/company/id/check-validation', {
//       method: 'GET',
//       params: {
//         id: signupInfo.value.companyInfo.headCompanyMemberId,
//         insTid: companyInfo.value?.insTid
//       }
//     })
//     isIdValidation.value
//       ? $q.notify({
//         message: $t('COMPANY.104'),
//         color: 'positive',
//         icon: 'check'
//       })
//       : $q.notify({
//         message: $t('COMPANY.105'),
//         color: 'negative',
//         icon: 'close'
//       })
//
//     headCompanyId.value?.validate()
//   }
// }

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

const createSignupInfoSequence = async () => {
  // q-form validation 체크
  const isFormValid = await signupForm.value?.validate()

  if (!isFormValid) {
    scrollToFirstError()
    return
  }

  if (!businessLicenseFile.value) {
    scrollToElement(businessLicenseFileRef.value)
    $q.notify({
      message: $t('COMPANY.133'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  if (!bankBookFile.value) {
    scrollToElement(bankBookFileRef.value)
    $q.notify({
      message: $t('COMPANY.134'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  if (companyInfo.value) {
    if (agree.value.length < 3) {
      scrollToElement(termsRef.value)
      $q.notify({
        message: $t('COMPANY.106'),
        color: 'negative',
        position: 'top'
      })
      return
    }
    try {
      await Promise.all([
        sendFile('businessLicenseFile'),
        sendFile('bankBookFile')
      ])
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

  signupInfo.value.companyInfo.companySeq = companyInfo.value!.companySeq
  signupInfo.value.companyInfo.companyName = companyInfo.value!.companyName
  signupInfo.value.companyInfo.managerEmail = companyInfo.value!.managerEmail
  signupInfo.value.companyInfo.managerName = companyInfo.value!.managerName
  signupInfo.value.companyInfo.headCompanySeq = companyInfo.value!.headCompanySeq
  signupInfo.value.companyInfo.startDate = dayjs().format('YYYYMMDD')

  signupInfo.value.userInfo.userName = companyInfo.value!.managerName
  signupInfo.value.userInfo.phoneNumber = signupInfo.value.companyInfo.managerPhone
  signupInfo.value.userInfo.email = companyInfo.value!.managerEmail
  if (!companyBusinessNameYn.value) { signupInfo.value.companyInfo.companyBusinessName = null }

  await customFetch(`/admin/handOrder/signup/company/v2/${companyCode}`, {
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
  if (fileObject[fileType].file.value && signupInfo.value.companyInfo) {
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
    const setSignupInfo:Record<FileType, () => void> = {
      businessLicenseFile: () => {
        signupInfo.value.companyInfo!.businessLicensePath = postResult
        signupInfo.value.companyInfo!.businessLicenseFileName = fileObject[fileType].file.value!.name
      },
      bankBookFile: () => {
        signupInfo.value.companyInfo!.bankbookPath = postResult
        signupInfo.value.companyInfo!.bankbookFileName = fileObject[fileType].file.value!.name
      }
    }
    setSignupInfo[fileType]()
  }
}

const notSigninCheck = async () => {
  const { data: isCompanyMember } = await useCustomFetch<boolean>(`/admin/handOrder/signup/company/${companyCode}/v2/member-check`, {
    method: 'GET'
  })

  if (isCompanyMember.value) {
    $q.dialog({
      title: $t('COMPANY.111'),
      message: `${$t('COMPANY.111')} ${$t('COMPANY.112')}`,
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
</script>

<template>
  <div class="row wrap justify-center items-start content-start max-height-100vh">
    <div class="col-11 col-sm-11 col-md-8 col-lg-6 col-xl-5 self-center box-style max-height-100vh">
      <div>
        <div class="text-h6 text-center q-my-lg text-bold">
          {{ $t('COMPANY.113') }}
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
                    v-model="signupInfo.companyInfo.businessNumber"
                    mask="#"
                    reverse-fill-mask
                    :placeholder="$t('COMPANY.115')"
                    outlined
                    maxlength="10"
                    input-class="input-class"
                    no-error-icon
                    :rules="[val => val.length > 0 || $t('COMPANY.099')]"
                    hide-bottom-space
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
                    <q-input v-model="companyInfo.companyName" outlined input-class="input-class" disable />
                  </div>
                </div>
                <div class="col-12">
                  <q-checkbox v-model="companyBusinessNameYn" :label="$t('COMPANY.118')" />
                </div>
                <div class="col-12">
                  <div class="col-child">
                    <q-input v-model="signupInfo.companyInfo.companyBusinessName" :placeholder="$t('COMPANY.117')" outlined input-class="input-class" :disable="!companyBusinessNameYn" />
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
                    v-model="signupInfo.companyInfo.ownerName"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.119')"
                    no-error-icon
                    :rules="[val => val.length > 0 || $t('COMPANY.119')]"
                    hide-bottom-space
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
                    v-model="signupInfo.companyInfo.address1"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('MEMBER.021')"
                    no-error-icon
                    :rules="[val => val.length > 0 || $t('MEMBER.021')]"
                    hide-bottom-space
                  />
                </div>

                <div class="col-12 col-child">
                  <q-input v-model="signupInfo.companyInfo.address2" outlined input-class="input-class" :placeholder="$t('COMPANY.032')" />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMMON.018') }}
                </div>
              </div>
              <div class="col-12 col-sm-9 row">
                <div class="col-8 col-child q-pr-sm">
                  <q-input
                    ref="idInput"
                    v-model="signupInfo.userInfo.id"
                    :placeholder="$t('LOGIN.002')"
                    outlined
                    input-class="input-class"
                    no-error-icon
                    hide-bottom-space
                    :rules="[val => val.length > 0 || $t('LOGIN.002'),
                             () => isIdAvailable || $t('COMPANY.062')]"
                    @update:model-value="(val) => { isIdAvailable = false; if (typeof val === 'string') signupInfo.userInfo.id = val.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '') }"
                  />
                </div>
                <div class="col-4 col-child">
                  <q-btn color="primary" :label="$t('COMPANY.120')" @click="checkId" />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMMON.046') }}
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
                    :rules="[val => val.length > 0 || $t('LOGIN.004'),
                             val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(val) || $t('COMPANY.064')
                    ]"
                    hide-bottom-space
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
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.004') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input v-model="companyInfo.managerName" outlined input-class="input-class" :placeholder="$t('COMPANY.054')" disable />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.035') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input v-model="companyInfo.managerEmail" outlined input-class="input-class" :placeholder="$t('COMPANY.055')" disable />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.034') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.companyInfo.managerPhone"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('SHOP.135')"
                    :rules="[val => val.length > 0 || $t('SHOP.135')]"
                    hide-bottom-space
                    no-error-icon
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.028') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.companyInfo.businessType"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.121')"
                    :rules="[val => val.length > 0 || $t('COMPANY.121')]"
                    hide-bottom-space
                    no-error-icon
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div class="col-child red-asterisk">
                  {{ $t('COMPANY.029') }}
                </div>
              </div>
              <div class="col-12 col-sm-9">
                <div class="col-child">
                  <q-input
                    v-model="signupInfo.companyInfo.businessStatus"
                    outlined
                    input-class="input-class"
                    :placeholder="$t('COMPANY.122')"
                    :rules="[val => val.length > 0 || $t('COMPANY.122')]"
                    hide-bottom-space
                    no-error-icon
                  />
                </div>
              </div>
              <div class="col-12 col-sm-3 label">
                <div ref="businessLicenseFileRef" class="col-child red-asterisk">
                  {{ $t('COMPANY.025') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="businessLicenseFile"
                    :label="signupInfo.companyInfo.businessLicenseFileName ?? fileObject['businessLicenseFile'].koreanFileType"
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
                <div ref="bankBookFileRef" class="col-child red-asterisk">
                  {{ $t('COMPANY.026') }}
                </div>
              </div>
              <div class="col-12 col-sm-3">
                <div class="col-child">
                  <q-file
                    v-model="bankBookFile"
                    :label="signupInfo.companyInfo.bankbookFileName ?? fileObject['bankBookFile'].koreanFileType"
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
              <!--              <div class="col-12 col-sm-3 label">-->
              <!--                <div class="col-child red-asterisk">-->
              <!--                  {{ $t('COMPANY.123') }}-->
              <!--                </div>-->
              <!--              </div>-->
              <!--              <div class="col-12 col-sm-9 row">-->
              <!--                <div class="col-8 col-child q-pr-sm">-->
              <!--                  <q-input-->
              <!--                    ref="headCompanyId"-->
              <!--                    v-model="signupInfo.companyInfo.headCompanyMemberId"-->
              <!--                    outlined-->
              <!--                    input-class="input-class"-->
              <!--                    :rules="[val => val.length > 0 || $t('COMPANY.124'), ()=> isIdValidation || $t('COMPANY.130')]"-->
              <!--                    hide-bottom-space-->
              <!--                    no-error-icon-->
              <!--                    @update:model-value="isIdValidation = false"-->
              <!--                  />-->
              <!--                </div>-->
              <!--                <div class="col-4">-->
              <!--                  <q-btn color="primary" :label="$t('COMPANY.116')" @click="checkHeadCompanyId" />-->
              <!--                </div>-->
              <!--              </div>-->
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
                  :options="[
                    { label: $t('COMPANY.126'), value: '1', fileName:'/text/company/termsOfService_1.md' },
                    { label: $t('COMPANY.127'), value: '2',fileName:'/text/company/termsOfService_2.md' },
                    { label: $t('COMPANY.128'), value: '3',fileName:'/text/company/termsOfService_3.md' }
                  ]"
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
              <div class="col-12 col-sm-3 label">
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
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
  .formbox{
    $row-height: 40px;
    .row{
      :deep(.col-child .q-field__control) {
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
