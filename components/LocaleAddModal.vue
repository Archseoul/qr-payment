<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { LocaleCodeVo } from '~/types'

const $q = useQuasar()
defineEmits([
  ...useDialogPluginComponent.emits
])
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const cancelDialog = () => {
  onDialogCancel()
}
const localeCodeVo = reactive<LocaleCodeVo>({
  localeCode: '',
  localeName: '',
  orderIndex: 0
})

const postLocale = async () => {
  await customFetch('/admin/handOrder/locale', {
    method: 'POST',
    body: localeCodeVo,
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('LOCALE.008'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
        onDialogHide()
      } else {
        $q.notify({
          message: `${$t('LOCALE.009')} ${_ctx.response._data.message}`,
          color: 'negative',
          icon: 'close'
        })
      }
    }
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
        {{ $t('LOCALE.010') }}
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-list>
          <q-item>
            <q-item-section>
              {{ $t('LOCALE.011') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="localeCodeVo.localeCode"
                dense
                outlined
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              {{ $t('LOCALE.012') }}
            </q-item-section>
            <q-item-section side>
              <q-input
                v-model="localeCodeVo.localeName"
                dense
                outlined
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          :label="$t('COMMON.004')"
          color="primary"
          flat
          @click="postLocale"
        />
        <q-btn
          :label="$t('COMMON.005')"
          color="grey"
          flat
          @click="cancelDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
