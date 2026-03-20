<script setup lang="ts">
import { useQuasar, useDialogPluginComponent } from 'quasar'
import { customFetch } from '#imports'
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const props = defineProps<{
  productId: string,
  shopCode:string
}>()
defineEmits([
  ...useDialogPluginComponent.emits
])
const $q = useQuasar()
const config = useRuntimeConfig()
const labelCode = ref('')

const mapLabel = async () => {
  await customFetch('/admin/handOrder/label/map', {
    method: 'POST',
    params: {
      productId: props.productId,
      labelId: labelCode.value,
      shopCode: props.shopCode,
      stationCode: config.public.stationCode
    },
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_QR.057'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
        onDialogHide()
      } else {
        $q.notify({
          message: `${$t('DEVICE_QR.058')}: ${_ctx.response._data.message}`,
          color: 'negative',
          icon: 'close'
        })
      }
    }
  })
}
const confirmMapLabel = () => {
  $q.dialog({
    title: $t('DEVICE_QR.059'),
    message: $t('DEVICE_QR.060'),
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await mapLabel()
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6 text-bold">
        {{ $t('DEVICE_QR.061') }}
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list>
          <q-item>
            <q-item-section>
              {{ $t('DEVICE_QR.062') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                :model-value="productId"
                style="width: 200px"
                label="QR ID"
                readonly
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              {{ $t('DEVICE_QR.037') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="labelCode"
                style="width: 200px"
                :label="$t('DEVICE_QR.037')"
                outlined
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions>
        <q-btn
          :label="$t('COMMON.005')"
          color="primary"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="$t('COMMON.004')"
          color="primary"
          flat
          @click="confirmMapLabel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
