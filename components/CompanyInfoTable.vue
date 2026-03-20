<script setup lang="ts">

import { QForm, useQuasar } from 'quasar'
import useDayjs from 'dayjs'
import type { CompanyVo } from '~/types'

const $q = useQuasar()
const dayjs = useDayjs

const props = withDefaults(defineProps<{
  companyCode: string,
  readonly?: boolean,
  isEditingValue: boolean
}>(), {
  readonly: false
})
const companyData = await useCustomFetch<CompanyVo>(`/admin/handOrder/company/v2/${props.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const company:Ref<CompanyVo | undefined> = companyData.data

const emits = defineEmits<{
  'update:modelValue': [value:CompanyVo | null],
  refresh: [],
  'update:isEditingValue': [isEditing: boolean]
}>()

const form = ref<QForm | null>(null)

const validate = () => {
  return form.value?.validate()
}

const isEditing = computed<boolean>({
  get: () => props.isEditingValue,
  set: value => emits('update:isEditingValue', value)
})

const updateCompanySequence = async () => {
  if (company.value && !props.readonly) {
    $q.loading.show({
      message: $t('COMMON.012')
    })
    try {
      await Promise.all([
        sendBusinessFile(),
        sendBankBookFile()
      ])
      await putCompany()
      toggleEditing()
      $q.notify({
        type: 'positive',
        message: $t('COMPANY.021')
      })
    } catch (e) {
      console.error(e)
      $q.notify({
        type: 'negative',
        message: $t('COMPANY.022')
      })
      return
    }
    $q.loading.hide()
  } else { throw new Error($t('COMMON.013')) }
}

const sendBusinessFile = async () => {
  if (businessLicenseFile.value && company.value) {
    const formData = new FormData()
    formData.append('file', businessLicenseFile.value)
    const postResult = await customFetch<string>(`/admin/handOrder/company/${props.companyCode}/business-license`, {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${$t('COMPANY.023')} ${$t('COMMON.014')}: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onRequestError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${$t('COMPANY.023')} ${ctx.error.message}`
        })
      }
    })
    company.value.businessLicensePath = postResult
    company.value.businessLicenseFileName = businessLicenseFile.value.name
  }
}
const sendBankBookFile = async () => {
  if (bankbookFile.value && company.value) {
    const formData = new FormData()
    formData.append('file', bankbookFile.value)
    const postResult = await customFetch<string>(`/admin/handOrder/company/${props.companyCode}/bank-book`, {
      method: 'POST',
      body: formData,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${$t('COMPANY.024')} ${$t('COMMON.014')}: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onRequestError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${$t('COMPANY.024')} ${ctx.error.message}`
        })
      }
    })
    company.value.bankbookPath = postResult
    company.value.bankbookFileName = bankbookFile.value.name
  }
}

const putCompany = async () => {
  if (company.value) {
    await customFetch('/admin/handOrder/company', {
      method: 'PUT',
      body: company.value,
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${$t('COMPANY.022')} ${$t('COMMON.014')}: ${ctx.response.status} ${ctx.response.statusText}`
        })
      }
    })
  }
}

const toggleEditing = () => {
  isEditing.value = !isEditing.value
}

const cancelUpdate = () => {
  toggleEditing()
  emits('refresh')
}

const businessLicenseFile = ref<File | null>(null)
const bankbookFile = ref<File | null>(null)

type FileType = 'businessLicenseFile' | 'bankbookFile'
const fileObject: Record<FileType, {koreanFileType:string, apiPath:string, file: Ref<File | null>}> = {
  businessLicenseFile: {
    koreanFileType: $t('COMPANY.025'),
    apiPath: '/admin/handOrder/company/' + company.value!.companyCode + '/business-license',
    file: businessLicenseFile
  },
  bankbookFile: {
    koreanFileType: $t('COMPANY.026'),
    apiPath: '/admin/handOrder/company/' + company.value!.companyCode + '/bank-book',
    file: bankbookFile
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

const prettyDate = (dateString:string) => {
  return dayjs(dateString, 'YYYYMMDD').format('YYYY/MM/DD')
}

defineExpose({ updateCompanySequence, toggleEditing, cancelUpdate, validate })

</script>

<template>
  <q-card flat>
    <q-card-section>
      <q-form v-if="company" ref="form" class="formbox">
        <div class="row justify-center items-center q-col-gutter-sm">
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.002') }}
            </div>
          </div>
          <div class="col-2 text-center">
            <div class="col-child">
              <q-input v-model="company.companyCode" outlined readonly input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.003') }}
            </div>
          </div>
          <div class="col-2 text-center">
            <div class="col-child">
              <q-input v-model="company.companyName" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.027') }}
            </div>
          </div>
          <div class="col-2 text-center">
            <div class="col-child">
              <q-input v-model="company.ownerName" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.028') }}
            </div>
          </div>
          <div class="col-2 text-center">
            <div class="col-child">
              <q-input v-model="company.businessType" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.029') }}
            </div>
          </div>
          <div class="col-2 text-center">
            <div class="col-child">
              <q-input v-model="company.businessStatus" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.030') }}
            </div>
          </div>
          <div class="col-2 text-center">
            <div class="col-child">
              <q-input v-model="company.businessNumber" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.031') }}
            </div>
          </div>
          <div class="col-10 text-center">
            <div class="col-child">
              <q-input v-model="company.address1" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.032') }}
            </div>
          </div>
          <div class="col-10 text-center">
            <div class="col-child">
              <q-input v-model="company.address2" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-3 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.033') }}
            </div>
          </div>
          <div class="col-3 text-center">
            <div class="col-child">
              <q-input
                v-model="company.startDate"
                outlined
                :model-value="company.startDate ? prettyDate(company.startDate) : null"
                :readonly="!isEditing"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="company.startDate" :disable="!isEditing" mask="YYYYMMDD" minimal>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
          <div class="col-3 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.004') }}
            </div>
          </div>
          <div class="col-3 text-center">
            <div class="col-child">
              <q-input v-model="company.managerName" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-3 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.034') }}
            </div>
          </div>
          <div class="col-3 text-center">
            <div class="col-child">
              <q-input v-model="company.managerPhone" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-3 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.035') }}
            </div>
          </div>
          <div class="col-3 text-center">
            <div class="col-child">
              <q-input v-model="company.managerEmail" outlined :readonly="!isEditing" input-class="input-class" />
            </div>
          </div>
          <div class="col-3 text-center label">
            <div class="col-child-2">
              {{ $t('COMPANY.036') }}
            </div>
          </div>
          <div class="col-9 text-center">
            <div class="row q-col-gutter-sm">
              <div class="col-2 text-center label">
                <div class="col-child">
                  {{ $t('COMPANY.037') }}
                </div>
              </div>
              <div class="col-2">
                <div class="col-child">
                  <q-input v-model="company.bankName" outlined :readonly="!isEditing" input-class="input-class" />
                </div>
              </div>
              <div class="col-4 text-center label">
                <div class="col-child">
                  {{ $t('COMPANY.038') }}
                </div>
              </div>
              <div class="col-4">
                <div class="col-child">
                  <q-input v-model="company.accountNumber" outlined :readonly="!isEditing" input-class="input-class" />
                </div>
              </div>
              <div class="col-2 text-center label">
                <div class="col-child">
                  {{ $t('COMPANY.039') }}
                </div>
              </div>
              <div class="col-10">
                <div class="col-child">
                  <q-input v-model="company.accountHolder" outlined :readonly="!isEditing" input-class="input-class" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-3 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.025') }}
            </div>
          </div>
          <div class="col-3">
            <div class="col-child">
              <q-chip
                v-if="!isEditing && company.businessLicensePath"
                clickable
                color="primary"
                text-color="white"
                @click="getFile('businessLicenseFile')"
              >
                <q-icon name="attachment" />
                <span>{{ company.businessLicenseFileName }}</span>
              </q-chip>
              <q-chip
                v-if="!isEditing&& !company.businessLicensePath"
                clickable
                disable
                color="grey-5"
                text-color="white"
              >
                <q-icon name="attachment" />
                <span>{{ fileObject['businessLicenseFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
              </q-chip>
              <q-file
                v-if="isEditing"
                v-model="businessLicenseFile"
                :label="company.businessLicenseFileName ?? fileObject['businessLicenseFile'].koreanFileType"
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
          <div class="col-3 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.026') }}
            </div>
          </div>
          <div class="col-3">
            <div class="col-child">
              <q-chip
                v-if="!isEditing && company.bankbookPath"
                clickable
                color="primary"
                text-color="white"
                @click="getFile('bankbookFile')"
              >
                <q-icon name="attachment" />
                <span>{{ company.bankbookFileName }}</span>
              </q-chip>
              <q-chip v-if="!isEditing&& !company.bankbookPath" clickable disable color="grey-5" text-color="white">
                <q-icon name="attachment" />
                <span>{{ fileObject['bankbookFile'].koreanFileType }}({{ $t('COMMON.016') }})</span>
              </q-chip>
              <q-file
                v-if="isEditing"
                v-model="bankbookFile"
                :label="company.bankbookFileName ?? fileObject['bankbookFile'].koreanFileType"
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
          <div class="col-2 text-center label">
            <div class="col-child">
              {{ $t('COMPANY.041') }}
            </div>
          </div>
          <div class="col-10 text-center">
            <div class="col-child">
              <q-input v-model="company.headCompanyName" outlined readonly input-class="input-class" />
            </div>
          </div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.formbox{
  $row-height: 40px;
  .row{
    .label{
      .col-child{
        background-color: #f2f2f2;
        border-radius: 5px;
        height: $row-height;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .col-child-2{
        background-color: #f2f2f2;
        border-radius: 5px;
        height: $row-height * 2;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .col-child-3{
        background-color: #f2f2f2;
        border-radius: 5px;
        height: $row-height * 3;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    :deep(.col-child .q-field__control) {
      height: $row-height;
      min-height: $row-height;
    }
    :deep(.col-child .q-field__marginal) {
      height: $row-height;
      min-height: $row-height;
    }
  }
}
</style>
