<script setup lang="ts">
import { QUploader, useDialogPluginComponent, useQuasar } from 'quasar'
import { LabelTemplateClass } from '~/classes/LabelTemplateClass'
import type { BigTemplateType, ExtraSmallTemplateType, LabelDeviceType, SmallTemplateType } from '~/types'
import SampleImageGenerator from '~/components/SampleImageGenerator.vue'

const props = withDefaults(defineProps<{
    isLegacy?: boolean
  }>(),
{
  isLegacy: true
})
defineEmits([
  ...useDialogPluginComponent.emits
])

const $q = useQuasar()
const config = useRuntimeConfig()
const imageUploadUrl = `${config.public.baseUrl}/admin/handOrder/labelTemplate/image`
const uploader = ref<null|QUploader>(null)
const token = useCookie('token')
const tokenHeader = computed(() => [{
  name: 'Authorization', value: `Bearer ${token.value}`
}]
)

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const cancelDialog = () => {
  onDialogCancel()
}
const labelTemplateData = reactive(new LabelTemplateClass())
if(props.isLegacy) {
  labelTemplateData.deviceType = '3.5/3'
}

const deviceTypeOptions:{label:string, value:LabelDeviceType}[] = props.isLegacy ? [
  { label: '3.5 / 3' + $t('DEVICE_TEMPLATE.026'), value: '3.5/3' },
  { label: '3.5 / 4' + $t('DEVICE_TEMPLATE.026'), value: '3.5/4' },
  { label: '7.5 / 4' + $t('DEVICE_TEMPLATE.026'), value: '7.5/4' }
] : [
  { label: '2.2 / 3' + $t('DEVICE_TEMPLATE.026'), value: '2.2/3' },
  { label: '3.5 / 3' + $t('DEVICE_TEMPLATE.026'), value: '3.5/3' },
  { label: '3.5 / 4' + $t('DEVICE_TEMPLATE.026'), value: '3.5/4' },
  { label: '7.5 / 4' + $t('DEVICE_TEMPLATE.026'), value: '7.5/4' }
]
const extraSmallTemplateTypeOptions:{label:string, value:ExtraSmallTemplateType}[] = [
  { label: $t('DEVICE_TEMPLATE.002'), value: 'BLACK' },
  { label: $t('DEVICE_TEMPLATE.027'), value: 'CUSTOM_EXTRA_SMALL' }
]
const smallTemplateTypeOptions:{label:string, value:SmallTemplateType}[] = [
  { label: $t('COMMON.078'), value: 'DEFAULT_SMALL' },
  { label: $t('DEVICE_TEMPLATE.002'), value: 'BLACK' },
  { label: $t('DEVICE_TEMPLATE.001'), value: 'WHITE' },
  { label: $t('DEVICE_TEMPLATE.027'), value: 'CUSTOM_SMALL' }
]
const bigTemplateTypeOptions:{label: string, value:BigTemplateType}[] = [
  { label: $t('COMMON.078'), value: 'DEFAULT' },
  { label: $t('DEVICE_TEMPLATE.004'), value: 'KIOSK' },
  { label: $t('DEVICE_TEMPLATE.005'), value: 'TABLE' },
  { label: $t('DEVICE_TEMPLATE.027'), value: 'CUSTOM' }
]
const extraSmallTemplateType:LabelDeviceType[] = ['2.2/3']
const smallTemplateType:LabelDeviceType[] = ['3.5/3', '3.5/4']

const uploadImage = () => {
  if (uploader.value?.files.length === 0) {
    $q.notify({
      message: $t('DEVICE_TEMPLATE.028'),
      color: 'negative',
      icon: 'close'
    })
    return
  }
  $q.dialog({
    title: $t('DEVICE_TEMPLATE.029'),
    message: $t('DEVICE_TEMPLATE.030'),
    ok: $t('COMMON.034'),
    cancel: $t('COMMON.005')
  }).onOk(() => {
    uploader.value?.upload()
  })
}
const isLegacyApi = () => props.isLegacy ? '' : '/new'
const startTemplatePost:QUploader['onUploaded'] = async ({ xhr }:{xhr:XMLHttpRequest}) => {
  if (xhr.status !== 200) {
    notifyRejected()
    return
  }
  labelTemplateData.filePath = xhr.response
  labelTemplateData.fileName = labelTemplateData.filePath.split('/').pop()?.split('.').shift() ?? ''

  await customFetch(`/admin/handOrder${isLegacyApi()}/labelTemplate`, {
    method: 'POST',
    body: labelTemplateData,
    onResponse (context) {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_TEMPLATE.031'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
      } else {
        $q.notify({
          message: $t('DEVICE_TEMPLATE.032'),
          color: 'negative',
          icon: 'close'
        })
      }
    }
  }).catch(() => {
    $q.notify({
      message: $t('DEVICE_TEMPLATE.032'),
      color: 'negative',
      icon: 'close'
    })
  })
}

const notifyRejected = () => {
  $q.notify({
    message: $t('DEVICE_TEMPLATE.033'),
    color: 'negative',
    icon: 'close'
  })
}

const setImageName:QUploader['onAdded'] = (files) => {
  labelTemplateData.imageName = files[0].name
}

const sampleImgSrc = computed(() => {
  if (!uploader.value || (uploader.value.files.length === 0)) { return '' }
  return URL.createObjectURL(uploader.value?.files[0])
})
const isDefault = computed(() => {
  if (labelTemplateData.deviceType === '7.5/4') {
    return labelTemplateData.bigTemplateType === 'DEFAULT'
  } else if(labelTemplateData.deviceType === '2.2/3'){
    return false
  } else { return labelTemplateData.smallTemplateType === 'DEFAULT_SMALL' }
})
const checkIsDefaultAndUploadImage = async () => {
  if (!isDefault.value) {
    uploadImage()
  } else {
    labelTemplateData.fileName = 'DEFAULT'
    labelTemplateData.imageName = 'DEFAULT'
    await customFetch(`/admin/handOrder${isLegacyApi()}/labelTemplate`, {
      method: 'POST',
      body: labelTemplateData,
      onResponse (context) {
        if (context.response.status === 200) {
          $q.notify({
            message: $t('DEVICE_TEMPLATE.031'),
            color: 'positive',
            icon: 'check'
          })
          onDialogOK()
        } else {
          $q.notify({
            message: $t('DEVICE_TEMPLATE.032'),
            color: 'negative',
            icon: 'close'
          })
        }
      }
    }).catch(() => {
      $q.notify({
        message: $t('DEVICE_TEMPLATE.032'),
        color: 'negative',
        icon: 'close'
      })
    })
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin q-pa-sm" style="max-width: unset; width: max-content">
      <q-form @submit="checkIsDefaultAndUploadImage">
        <q-list>
          <q-item>
            <q-item-section class="col-3">
              <q-item-label class="text-bold">
                {{ $t('DEVICE_TEMPLATE.034') }}
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-option-group v-model="labelTemplateData.deviceType" :options="deviceTypeOptions" inline />
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item v-if="extraSmallTemplateType.includes(labelTemplateData.deviceType)">
            <q-item-section class="col-3">
              <q-item-label class="text-bold">
                {{ $t('DEVICE_TEMPLATE.035') }}
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-option-group v-model="labelTemplateData.extraSmallTemplateType" :options="extraSmallTemplateTypeOptions" inline />
            </q-item-section>
          </q-item>
          <q-item v-else-if="smallTemplateType.includes(labelTemplateData.deviceType)">
            <q-item-section class="col-3">
              <q-item-label class="text-bold">
                {{ $t('DEVICE_TEMPLATE.035') }}
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-option-group v-model="labelTemplateData.smallTemplateType" :options="smallTemplateTypeOptions" inline />
            </q-item-section>
          </q-item>
          <q-item v-else>
            <q-item-section class="col-3">
              <q-item-label class="text-bold">
                {{ $t('DEVICE_TEMPLATE.035') }}
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-option-group v-model="labelTemplateData.bigTemplateType" :options="bigTemplateTypeOptions" inline />
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item>
            <q-item-section class="col-3">
              <q-item-label class="text-bold">
                {{ $t('DEVICE_TEMPLATE.036') }}
              </q-item-label>
            </q-item-section>
            <q-item-section>
              <q-input
                v-model="labelTemplateData.templateName"
                class="full-width"
                dense
                outlined
                :rules="[val => !!val || $t('DEVICE_TEMPLATE.037'),
                         val => val.length <= 20 || $t('DEVICE_TEMPLATE.038', { count: 20 })]"
              />
            </q-item-section>
          </q-item>
          <q-separator />
          <template
            v-if="!smallTemplateType.includes(labelTemplateData.deviceType)
              &&(['KIOSK','TABLE'].includes(labelTemplateData.bigTemplateType??''))"
          >
            <q-item>
              <q-item-section class="col-8">
                <q-item-label class="text-bold">
                  {{ $t('DEVICE_TEMPLATE.039') }}
                </q-item-label>
                <q-list>
                  <q-item>
                    <q-item-section class="col-3">
                      <q-item-label>
                        {{ $t('DEVICE_TEMPLATE.040') }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-input
                        v-if="labelTemplateData.bigTemplateType==='KIOSK'"
                        v-model="labelTemplateData.textTop"
                        class="full-width"
                        dense
                        outlined
                        :rules="[val => val.length <=15 ||$t('DEVICE_TEMPLATE.041', { count: 15 })]"
                      />
                      <q-input
                        v-else
                        v-model="labelTemplateData.textTop"
                        class="full-width"
                        dense
                        outlined
                        :rules="[val => val.length <=20 ||$t('DEVICE_TEMPLATE.041', { count: 20 })]"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section class="col-3">
                      <q-item-label>
                        {{ $t('DEVICE_TEMPLATE.042') }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-input
                        v-if="labelTemplateData.bigTemplateType==='KIOSK'"
                        v-model="labelTemplateData.textBottom"
                        class="full-width"
                        dense
                        outlined
                        :rules="[val => val.length <=20 ||$t('DEVICE_TEMPLATE.041', { count: 20 })]"
                      />
                      <q-input
                        v-else
                        v-model="labelTemplateData.textBottom"
                        class="full-width"
                        dense
                        outlined
                        :rules="[val => val.length <=15 ||$t('DEVICE_TEMPLATE.041', { count: 15 })]"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-item-section>
              <q-item-section />
            </q-item>
          </template>
          <q-item>
            <q-item-section>
              <q-item-label class="text-bold">
                {{ $t('DEVICE_TEMPLATE.043') }}
              </q-item-label>
              <q-uploader
                ref="uploader"
                :url="imageUploadUrl"
                :label="$t('DEVICE_TEMPLATE.044')"
                accept=".png"
                :max-files="1"
                :headers="tokenHeader"
                field-name="file"
                with-credentials
                hide-upload-btn
                :max-file-size="2097152"
                :disable="isDefault"
                @rejected="notifyRejected"
                @added="setImageName"
                @uploaded="startTemplatePost"
              />
              <div v-if="labelTemplateData.deviceType === '2.2/3'" class="q-ma-md">
                [{{ $t('DEVICE_TEMPLATE.045') }}]
                <q-list dense>
                  <q-item class="text-red">
                    • {{ $t('DEVICE_TEMPLATE.046') }}
                  </q-item>
                  <q-item>• {{ $t('DEVICE_TEMPLATE.047') }}</q-item>
                  <q-item>• {{ $t('DEVICE_TEMPLATE.048') }}: 104*212</q-item>
                  <q-item>• ({{ $t('DEVICE_TEMPLATE.049') }})</q-item>
                </q-list>
              </div>
              <div v-else-if="smallTemplateType.includes(labelTemplateData.deviceType)" class="q-ma-md">
                [{{ $t('DEVICE_TEMPLATE.045') }}]
                <q-list dense>
                  <q-item class="text-red">
                    • {{ $t('DEVICE_TEMPLATE.046') }}
                  </q-item>
                  <q-item>• {{ $t('DEVICE_TEMPLATE.047') }}</q-item>
                  <q-item>• {{ $t('DEVICE_TEMPLATE.048') }}: 180*384</q-item>
                  <q-item>• ({{ $t('DEVICE_TEMPLATE.049') }})</q-item>
                </q-list>
              </div>
              <div v-else class="q-ma-md">
                [{{ $t('DEVICE_TEMPLATE.045') }}]
                <q-list dense>
                  <q-item>
                    • {{ $t('DEVICE_TEMPLATE.050') }}
                  </q-item>
                  <q-item>• {{ $t('DEVICE_TEMPLATE.047') }}</q-item>
                  <q-item class="text-red">
                    • {{ $t('DEVICE_TEMPLATE.046') }}
                  </q-item>
                  <q-item>• ({{ $t('DEVICE_TEMPLATE.049') }})</q-item>
                </q-list>
              </div>
            </q-item-section>
            <q-item-section class="row items-center justify-center">
              <SampleImageGenerator
                :show="!!labelTemplateData.imageName||isDefault"
                :sample-img-src="sampleImgSrc"
                :label-device-type="labelTemplateData.deviceType"
                :extra-small-template-type="labelTemplateData.extraSmallTemplateType"
                :small-template-type="labelTemplateData.smallTemplateType"
                :big-template-type="labelTemplateData.bigTemplateType"
                :upper-text="labelTemplateData.textTop"
                :lower-text="labelTemplateData.textBottom"
              />
              <div class="q-mt-lg">
                • {{ $t('DEVICE_TEMPLATE.052') }}
              </div>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="center">
          <q-btn :label="$t('COMMON.034')" color="primary" type="submit" />
          <q-btn :label="$t('COMMON.005')" color="grey" @click="cancelDialog" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
