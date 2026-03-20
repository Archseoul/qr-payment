<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { isEmpty, cloneDeep } from 'lodash-es'
import type { HandOrderGatewayPostDto } from '~/types'
const props = defineProps<{
  shopCode:string
}>()
defineEmits([
  ...useDialogPluginComponent.emits
])
const $q = useQuasar()
const config = useRuntimeConfig()
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const cancelDialog = () => {
  onDialogCancel()
}

const handOrderGatewayPostDto = ref<HandOrderGatewayPostDto>({
  stationCode: config.public.stationCode,
  code: '',
  name: ''
})

const postGateway = async () => {
  const postBody = cloneDeep(handOrderGatewayPostDto.value)
  await customFetch('/admin/handOrder/gateway', {
    method: 'POST',
    params: {
      shopCode: props.shopCode
    },
    body: postBody,
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('COMPANY.086'),
          color: 'positive',
          icon: 'check'
        })
      } else {
        $q.notify({
          message: `${$t('COMPANY.087')} ${_ctx.response._data.message}`,
          color: 'negative',
          icon: 'close'
        })
      }
    }
  })
}

const confirmPostGateway = () => {
  if (isEmpty(handOrderGatewayPostDto.value.code)) {
    $q.notify({
      message: $t('COMPANY.088'),
      color: 'negative'
    })
    return
  }
  if (isEmpty(handOrderGatewayPostDto.value.name)) {
    $q.notify({
      message: $t('COMPANY.089'),
      color: 'negative'
    })
    return
  }
  $q.dialog({
    title: $t('COMPANY.090'),
    message: $t('COMPANY.091'),
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await postGateway()
    onDialogOK()
    onDialogHide()
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
        {{ $t('COMPANY.092') }}
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-list>
          <q-item>
            <q-item-section>
              {{ $t('COMPANY.093') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="handOrderGatewayPostDto.code"
                dense
                outlined
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              {{ $t('COMPANY.094') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="handOrderGatewayPostDto.name"
                dense
                outlined
                :rules="[val => /^[a-zA-Z0-9]*$/.test(val) || $t('COMPANY.095')]"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          :label="$t('COMMON.005')"
          color="primary"
          flat
          @click="cancelDialog"
        />
        <q-btn
          :label="$t('COMMON.004')"
          color="primary"
          flat
          @click="confirmPostGateway"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
