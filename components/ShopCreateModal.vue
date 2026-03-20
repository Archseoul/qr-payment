<script setup lang="ts">
import { QForm, QInput, QSelect, useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import ShopDeviceModal from './ShopDeviceModal.vue'
import { linkType, vanCode } from '~/utils/code'
import type { ShopPostDto } from '~/types'

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

defineEmits([
  ...useDialogPluginComponent.emits
])

const $q = useQuasar()
const formRef = ref<InstanceType<typeof QForm> | null>(null)

const shopPostDto = ref<ShopPostDto>({
  shopName: '',
  managerName: '',
  managerEmail: '',
  managerPhoneNumber: '',
  corporate: false,
  deviceCount: 0,
  linkType: 'handorder',
  posCode: '',
  vanCode: '',
  shopPosCode: '',
  mappedStoreCode: '',
  deviceList: []
})

const cancelDialog = () => {
  onDialogCancel()
}

const postShopSequence = async () => {
  await customFetch('/admin/handOrder/shop/v2/basic', {
    method: 'POST',
    body: shopPostDto.value,
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('SHOP.133'),
          color: 'positive',
          icon: 'check'
        })
        onDialogOK()
      }
    },
    onResponseError: (context) => {
      $q.notify({
        message: `${$t('SHOP.134')}. ${context.response._data.message}`,
        color: 'negative',
        icon: 'close'
      })
    }
  })
}

const openDeviceModal = () => {
  $q.dialog({
    component: ShopDeviceModal,
    componentProps: {
      shopSeq: 0,
      shopCode: '',
      shopInfo: shopPostDto.value,
      isEditable: true
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
      <q-form ref="formRef" @submit="postShopSequence">
        <q-card-section class="text-h6 text-bold">
          {{ $t('SHOP.009') }}
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-list>
            <q-item>
              <q-item-section>
                {{ $t('COMMON.027') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="shopPostDto.shopName"
                  dense
                  outlined
                  no-error-icon
                  hide-bottom-space
                  maxlength="50"
                  :rules="[val => val.length > 0 || $t('MEMBER.020')]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY_REPORT.020') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="shopPostDto.managerName"
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
                {{ $t('COMPANY_REPORT.021') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="shopPostDto.managerPhoneNumber"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  maxlength="50"
                  :rules="[val => val.length > 0 || $t('SHOP.135')]"
                />
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section>
                {{ $t('COMPANY_REPORT.022') }}
              </q-item-section>
              <q-item-section side>
                <q-input
                  v-model="shopPostDto.managerEmail"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  maxlength="50"
                  :rules="[val => val.length > 0 || $t('COMPANY.055')]"
                />
              </q-item-section>
            </q-item>

            <q-item dense>
              <q-item-label caption>
                * {{ $t('SHOP.136') }}
              </q-item-label>
            </q-item>

            <q-item>
              <q-item-section>
                {{ $t('SHOP.003') }}
              </q-item-section>
              <q-item-section side>
                <q-btn-toggle
                  v-model="shopPostDto.corporate"
                  toggle-color="primary"
                  :options="[
                    { label: $t('COMMON.032'), value: false },
                    { label: $t('COMMON.031'), value: true }
                  ]"
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('COMPANY_REPORT.011') }}
              </q-item-section>
              <q-item-section side class="col-6">
                <q-input
                  v-model.number="shopPostDto.deviceCount"
                  dense
                  no-error-icon
                  hide-bottom-space
                  outlined
                  readonly
                  :rules="[ val => val <= 200 || $t('SHOP.166')]"
                  :suffix="$t('COMMON.095')"
                  input-class="text-right"
                >
                  <template v-slot:append>
                    <q-btn :label="$t('DEVICE_TEMPLATE.013')" color="primary" dense @click="openDeviceModal" />
                  </template>
                </q-input>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('SHOP.137') }}
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="shopPostDto.posCode"
                  :options="linkType"
                  emit-value
                  map-options
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                      <q-tooltip
                        v-if="scope.opt.value === 'mobilepos'"
                        class="bg-red text-white"
                        anchor="top middle"
                        self="bottom middle"
                        style="width: 300px; height: 35px;text-align: center; font-size: 15px;"
                      >
                        {{ $t('SHOP.153') }}
                      </q-tooltip>
                    </q-item>
                  </template>
                </q-select>
              </q-item-section>
            </q-item>
            <q-item v-if="shopPostDto.posCode === 'okpos'">
              <q-item-section>
                {{ $t('SHOP.028') }}
              </q-item-section>
              <q-item-section side>
                <q-input v-model="shopPostDto.shopPosCode" dense outlined no-error-icon hide-bottom-space />
              </q-item-section>
            </q-item>
            <q-item v-if="shopPostDto.posCode === 'smartro'">
              <q-item-section>
                {{ $t('SHOP.029') }}
              </q-item-section>
              <q-item-section side>
                <q-input v-model="shopPostDto.mappedStoreCode" dense outlined no-error-icon hide-bottom-space />
              </q-item-section>
            </q-item>
            <q-item v-if="shopPostDto.posCode === 'easy'">
              <q-item-section>
                {{ $t('SHOP.029') }}
              </q-item-section>
              <q-item-section side>
                <q-input v-model="shopPostDto.mappedStoreCode" dense outlined no-error-icon hide-bottom-space />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                {{ $t('SHOP.138') }}
              </q-item-section>
              <q-item-section side>
                <q-select
                  v-model="shopPostDto.vanCode"
                  :options="vanCode"
                  emit-value
                  map-options
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
.tool-tip{
  border:1px solid blue !important;
}
</style>
