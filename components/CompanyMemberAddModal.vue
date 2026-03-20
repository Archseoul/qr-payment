<script setup lang="ts">
import { QForm, QInput, useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import type { AdminMemberPostDto } from '~/types'

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

defineEmits([
  ...useDialogPluginComponent.emits
])
const adminMemberPostDto = ref<AdminMemberPostDto>({
  id: '',
  password: '',
  userName: '',
  position: '',
  userType: 'worker',
  phoneNumber: '',
  email: '',
  shopSeq: 0
})
const rawPassword = ref('')
const passwordCheck = ref('')
const cancelDialog = () => {
  onDialogCancel()
}
const $q = useQuasar()
const formRef = ref<InstanceType<typeof QForm> | null>(null)
const postAdminMember = async () => {
  await customFetch('/admin/handOrder/company/member', {
    method: 'POST',
    body: adminMemberPostDto.value,
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('COMPANY.050'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
      } else {
        $q.notify({
          message: `${$t('COMPANY.056')} ${context.response._data.message}`,
          color: 'negative',
          icon: 'close'
        })
      }
    }
  })
}

const postAdminMemberSequence = async () => {
  adminMemberPostDto.value.password = rawPassword.value

  await postAdminMember()
  onDialogOK()
}

const isIdAvailable = ref(false)
const idInput = ref<InstanceType<typeof QInput> | null>(null)
const checkId = async () => {
  if (adminMemberPostDto.value.id.length !== 0) {
    isIdAvailable.value = await customFetch<boolean>('/admin/handOrder/member/id/check-available', {
      method: 'GET',
      params: {
        id: adminMemberPostDto.value.id
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
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-form ref="formRef" @submit="postAdminMemberSequence">
        <q-card-section class="text-h6 text-bold">
          {{ $t('COMPANY.045') }}
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-list>
            <q-item>
              <q-item-section>
                {{ $t('COMMON.017') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="adminMemberPostDto.userName"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :rules="[val => val.length > 0 || $t('COMPANY.059')]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY.043') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="adminMemberPostDto.position"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  :rules="[val => val.length > 0 || $t('COMPANY.060')]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY.044') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="adminMemberPostDto.phoneNumber"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  :rules="[val => val.length > 0 || $t('COMPANY.061')]"
                  @update:model-value="(val) => { if (typeof val === 'string') adminMemberPostDto.phoneNumber = val.replace(/[^0-9]/g, '') }"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                {{ $t('COMMON.018') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  ref="idInput"
                  v-model="adminMemberPostDto.id"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  :rules="[val => val.length > 0 || $t('LOGIN.002'),
                           () => isIdAvailable || $t('COMPANY.062')]"
                  @update:model-value="(val) => { isIdAvailable = false; if (typeof val === 'string') adminMemberPostDto.id = val.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '') }"
                >
                  <template v-slot:append>
                    <q-btn
                      color="primary"
                      dense
                      flat
                      no-error-icon
                      hide-bottom-space
                      icon="search"
                      @click="checkId"
                    />
                  </template>
                </q-input>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMMON.046') }}
              </q-item-section>
              <q-item-section side style="width: 60%;">
                <q-input
                  v-model="rawPassword"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  password
                  type="password"
                  :rules="[
                    val => val && val.length > 0 || $t('LOGIN.004'),
                    val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(val) || $t('COMPANY.064')
                  ]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMMON.048') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="passwordCheck"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  type="password"
                  :rules="[val => val === rawPassword || $t('COMPANY.063')]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMMON.019') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="adminMemberPostDto.email"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  :rules="[val => val.length > 0 || $t('MEMBER.018')]"
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
