<script setup lang="ts">
import type { QSelectProps } from 'quasar'
import { useDialogPluginComponent } from 'quasar'
import { computed } from 'vue'
import type { HandOrderProductPostDto, HoTableVo, ShopInfoVo } from '~/types'

const $q = useQuasar()
const config = useRuntimeConfig()
const props = defineProps< {
  shopInfo: ShopInfoVo,
  tableList: HoTableVo[]
}>()

defineEmits([
  ...useDialogPluginComponent.emits
])
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const cancelDialog = () => {
  onDialogCancel()
}

const tableNumArr = ref<number[]>(props.tableList && props.tableList.length > 0 ? [Number(props.tableList[0].tableNum)] : [])

const productId = ref<string>('')

const qrPostDtoArr = computed(():HandOrderProductPostDto[] => tableNumArr.value.map(tableNum => ({
  productId: `${props.shopInfo?.qrStoreCode ?? ''}_${tableNum}`,
  storeCode: props.shopInfo?.qrStoreCode ?? '',
  tableNum
})))

const postQr = async () => {
  for (const postBody of qrPostDtoArr.value) {
    await customFetch('/admin/handOrder/qr', {
      method: 'POST',
      params: {
        stationCode: config.public.stationCode,
        shopCode: props.shopInfo.shopCode
      },
      body: qrPostDtoArr.value.length === 1 && productId.value !== '' ? { ...postBody, productId: productId.value } : postBody,
      onResponse (_ctx) {
        console.log('_ctx', _ctx)
        if (_ctx.response.status === 200) {
          $q.notify({
            message: $t('DEVICE_QR.050'),
            color: 'positive',
            icon: 'check'
          })
        } else if (_ctx.response.status === 400) {
          $q.notify({
            message: `${$t('DEVICE_QR.051')} ${_ctx.response._data.message}`,
            color: 'negative',
            icon: 'close'
          })
        }
      },
      onResponseError () {
        $q.notify({
          message: `${$t('DEVICE_QR.051')} ${_ctx.response._data.message}`,
          color: 'negative',
          icon: 'close'
        })
      }

    })
  }
  onDialogOK()
  // onDialogHide()
}
const confirmPostQr = () => {
  $q.dialog({
    title: $t('DEVICE_QR.052'),
    message: $t('DEVICE_QR.053'),
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await postQr()
  })
}

const tableOptions = computed<QSelectProps['options']>(() => props!.tableList.sort((a, b) => Number(a.tableNum) - Number(b.tableNum)).map(table => ({
  label: table.tableName,
  value: Number(table.tableNum)
})))
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6 text-bold">
        {{ $t('DEVICE_QR.054') }}
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-list>
          <q-item>
            <q-item-section>
              {{ $t('DEVICE_QR.055') }}
            </q-item-section>
            <q-item-section side>
              <q-select
                v-model="tableNumArr"
                style="width: 200px"
                :options="tableOptions"
                :label="$t('DEVICE_QR.055')"
                outlined
                map-options
                emit-value
                multiple
                @update:model-value="() => {
                  if(tableNumArr.length > 1) {
                    productId = ''
                  }
                }"
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              {{ $t('DEVICE_QR.056') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="productId"
                style="width: 200px"
                :placeholder="qrPostDtoArr.map(qr=>qr.productId).concat()"
                outlined
                :readonly="qrPostDtoArr.length > 1"
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
          @click="confirmPostQr"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
