<script setup lang="ts">
import { QUploader, useDialogPluginComponent, useQuasar } from 'quasar'
import type { ShopInfoVo } from '~/types'
const config = useRuntimeConfig()
const token = useCookie('token')
const { baseUrl } = config.public

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const props = defineProps<{
  shopInfo: ShopInfoVo
}>()

const $q = useQuasar()

const getUrl = () => {
  return `${baseUrl}/admin/handOrder/shop/thumbnail?shopCode=${props.shopInfo.shopCode}`
}

const imageUpload:any = ref(null)

const imageRejected = () => {
  $q.notify({
    message: $t('SHOP.062'),
    color: 'negative'
  })
}

const getAuthToken = () => {
  return [{
    name: 'Authorization', value: `Bearer ${token.value}`
  }]
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
        {{ $t('SHOP.014') }}
      </q-card-section>
      <q-card-section>
        <q-card>
          <q-card-section>
            <q-uploader
              ref="imageUpload"
              :url="getUrl"
              :label="$t('SHOP.141')"
              multiple
              batch
              style="max-width: 300px"
              accept=".jpg, image/*"
              :headers="getAuthToken"
              field-name="file"
              with-credentials
              @rejected="imageRejected"
            />
          </q-card-section>
        </q-card>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-btn
          color="grey-5"
          :label="$t('COMMON.094')"
          class="float-right q-mb-md"
          @click="onDialogOK"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
