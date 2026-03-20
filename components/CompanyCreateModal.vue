<script setup lang="ts">
import { QForm, useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import type { CompanyPostDto } from '~/types'

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

defineEmits([
  ...useDialogPluginComponent.emits
])

const $q = useQuasar()
const formRef = ref<InstanceType<typeof QForm> | null>(null)

const companyPostDto = ref<CompanyPostDto>({
  companyName: '',
  managerName: '',
  managerEmail: '',
  headCompanySeq: 0
})

const cancelDialog = () => {
  onDialogCancel()
}

const postCompanySequence = async () => {
  await customFetch('/admin/handOrder/company/v2/basic', {
    method: 'POST',
    body: companyPostDto.value,
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('COMPANY.051'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
      }
    },
    onResponseError: () => {
      $q.notify({
        message: $t('COMPANY.052'),
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
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form ref="formRef" @submit="postCompanySequence">
        <q-card-section class="text-h6 text-bold">
          {{ $t('COMPANY.014') }}
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-list>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY.003') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="companyPostDto.companyName"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  maxlength="100"
                  :rules="[val => val.length > 0 || $t('COMPANY.053')]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY.004') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="companyPostDto.managerName"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  maxlength="50"
                  :rules="[val => val.length > 0 || $t('COMPANY.054')]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY.035') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="companyPostDto.managerEmail"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  maxlength="50"
                  :rules="[val => val.length > 0 || $t('COMPANY.055')]"
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
            @click="cancelDialog"
          />
          <q-btn
            :label="$t('COMMON.004')"
            color="primary"
            flat
            type="submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
