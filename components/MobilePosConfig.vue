<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import type { MobilePosDeviceVo, ShopInfoVo, MobilePosDeviceRoleVo } from '~/types'

const props = defineProps<{
  modelValue: ShopInfoVo
}>()

const emits = defineEmits<{
  'update:modelValue': [ShopInfoVo]
}>()

const shopData = computed({
  get: () => props.modelValue,
  set: (value: ShopInfoVo) => emits('update:modelValue', value)
})

const $q = useQuasar()
const devicesData = await useCustomFetch<MobilePosDeviceVo[]>(`/admin/handOrder/member/mobilePos/${shopData.value.shopCode}`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  onResponseError: (ctx) => {
    $q.notify({
      type: 'negative',
      message: `${ctx.response._data.message} 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
    })
  }
})

const rolesData = await useCustomFetch<MobilePosDeviceRoleVo[]>('/admin/handOrder/member/mobilePos/roles', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  onResponseError: (ctx) => {
    $q.notify({
      type: 'negative',
      message: `${ctx.response._data.message} 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
    })
  }
})

const devices = ref(devicesData.data.value?.map(device => ({ ...device })) ?? [])
const roles = ref(rolesData.data.value?.map(role => ({ ...role, label: role.deviceRoleName, value: Number(role.deviceRole) })) ?? [])

const saveDevices = async () => {
  await customFetch<{message: string}>('/admin/handOrder/member/mobilePos', {
    method: 'PUT',
    body: devices.value,
    onResponseError: (ctx) => {
      $q.notify({
        type: 'negative',
        message: `${ctx.response._data.message} 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
      })
    }
  })

  $q.notify({
    type: 'positive',
    message: $t('COMMON.112')
  })
}

const deleteDevice = (data: MobilePosDeviceVo) => {
  $q.dialog({
    title: '디바이스 삭제',
    message: ` ${data.device_id} 디바이스를 삭제하시겠습니까? `,
    ok: {
      label: '삭제',
      color: 'negative',
      loading: false
    },
    cancel: true,
    persistent: true
  }).onOk(() => {
    customFetch<{message: string}>('/admin/handOrder/member/mobilePos', {
      method: 'DELETE',
      body: { device_id: data.device_id, shop_seq: data.shop_seq },
      onResponseError: (ctx) => {
        $q.notify({
          type: 'negative',
          message: `${ctx.response._data.message} 상태 코드: ${ctx.response.status} ${ctx.response.statusText}`
        })
      },
      onResponse: () => {
        $q.notify({ type: 'positive', message: '디바이스가 삭제되었습니다.' })
        devices.value = devices.value.filter(device => device.device_id !== data.device_id)
      }
    })
  })
}

const resetDevices = () => {
  devices.value = devicesData.data.value?.map(device => ({ ...device })) ?? []
}
</script>

<template>
  <q-card-section class="q-pa-md">
    <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md">
      디바이스 설정
    </div>

    <p v-if="devices.length < 1" class="text-center text-grey-9">
      등록된 디바이스가 없습니다.
    </p>

    <q-list v-else bordered separator>
      <q-item v-for="device in devices" :key="device.device_id">
        <q-item-section>
          <div class="row items-center q-col-gutter-md justify-between">
            <div class="row q-gutter-x-lg" style="flex:1">
              <div class="col">
                <q-input
                  v-model="device.device_id"
                  label="디바이스 ID"
                  outlined
                  dense
                  readonly
                  class="full-width"
                />
              </div>
              <div>
                <q-select
                  v-model="device.device_role"
                  :options="roles"
                  label="권한"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="full-width"
                />
              </div>
              <div class="col-auto">
                <q-toggle
                  v-model="device.is_approved"
                  true-value="Y"
                  false-value="N"
                  color="primary"
                  label="승인 여부"
                  left-label
                />
              </div>
            </div>
            <div>
              <q-btn
                color="negative"
                icon="delete"
                flat
                round
                dense
                aria-label="디바이스 삭제"
                @click="deleteDevice(device)"
              />
            </div>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div class="q-mt-md flex justify-end">
      <q-btn color="info" label="초기화" :disable="devices.length < 1" @click="resetDevices" />
      <q-btn color="primary" label="저장" class="q-ml-sm" :disable="devices.length < 1" @click="saveDevices" />
    </div>
  </q-card-section>
</template>

<style scoped>

</style>
