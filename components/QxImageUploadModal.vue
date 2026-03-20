<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const props = defineProps<{
  shopCode: string
}>()

const file = ref<File | null>(null)
const imageName = ref('')
const $q = useQuasar()
const postQxImage = async () => {
  if (!file.value || !imageName.value) {
    $q.notify({
      message: $t('SHOP.128'),
      color: 'negative'
    })
    return
  }

  const formData = new FormData()
  formData.append('file', file.value)
  formData.append('imageName', imageName.value)

  await customFetch(`/admin/handOrder/shop/${props.shopCode}/qx/device/image`, {
    method: 'POST',
    body: formData,
    headers: {
      // Content-Type을 명시하지 말 것. 브라우저가 자동 설정함.
    },
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('SHOP.129'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
        onDialogHide()
      }
    },
    onResponseError () {
      $q.notify({
        message: `${$t('SHOP.130')}. ${_ctx.response._data.message}`,
        color: 'negative',
        icon: 'close'
      })
    }
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section class="text-h6 text-bold">
        {{ $t('SHOP.126') }}
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-list>
          <q-item>
            <q-item-section side class="col-6">
              <q-file
                v-model="file"
                filled
                :label="$t('SHOP.131')"
                accept="image/*"
              />
            </q-item-section>
            <q-item-section class="col-6">
              <q-input
                v-model="imageName"
                :label="$t('SHOP.132')"
                dense
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
          @click="postQxImage"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
