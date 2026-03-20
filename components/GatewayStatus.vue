<script setup lang="ts">
import type { GatewayInfoVo } from '~/types'
import { GatewayAddModal } from '#components'

const props = defineProps<{
  shopCode: string
  gatewayInfoList: GatewayInfoVo[] | null
  loading:boolean
}>()
const emits = defineEmits<{
  refresh: []
}>()

const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const openAddGatewayDialog = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  $q.dialog({
    component: GatewayAddModal,
    componentProps: {
      shopCode: props.shopCode
    }
  }).onOk(() => {
    emits('refresh')
  })
}
const deleteGateway = async (gatewayRfMac:string) => {
  await customFetch('/admin/handOrder/gateway', {
    method: 'DELETE',
    params: {
      shopCode: props.shopCode,
      gatewayRfMac
    }
  })
  emits('refresh')
}
const deleteGatewayConfirm = (gatewayRfMac:string) => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    title: $t('DEVICE_QR.006'),
    message: $t('DEVICE_QR.007'),
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await deleteGateway(gatewayRfMac)
  })
}
</script>

<template>
  <q-card class="full-width">
    <q-card-section class="row text-center items-center justify-between text-bold text-h6 text-center">
      <div class="cursor-pointer">
        {{ $t('DEVICE_QR.008') }}
      </div>
      <div>
        <q-btn
          color="primary"
          @click="$emit('refresh')"
        >
          {{ $t('COMMON.074') }}
        </q-btn>
      </div>
    </q-card-section>
    <q-separator />
    <div class="row q-gutter-md q-pa-lg">
      <q-card v-for="gatewayInfo in gatewayInfoList" :key="gatewayInfo.macAddress" class="card">
        <q-card-section horizontal class="text-h6 text-bold">
          <q-item class="full-width">
            <q-item-section>{{ gatewayInfo.name }}</q-item-section>
            <q-item-section side>
              <q-btn
                flat
                :label="$t('COMMON.007')"
                color="negative"
                @click="deleteGatewayConfirm(gatewayInfo.code)"
              />
            </q-item-section>
          </q-item>
        </q-card-section>
        <q-separator />
        <q-list padding dense>
          <template v-for="[key, value] in Object.entries(gatewayInfo ?? {})" :key="key">
            <q-item v-if="(key !== 'station') && (key !=='endDevicesCountByState')">
              <q-item-section>
                <q-item-label>{{ key }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  {{ value }}
                  <q-badge
                    v-if="key === 'status' && value === 'CONNECTED'"
                    color="green"
                    :label="$t('DEVICE_QR.009')"
                  />
                  <q-badge
                    v-if="key === 'status' && value === 'NOT_READY'"
                    color="orange"
                    :label="$t('DEVICE_QR.010')"
                  />
                  <q-badge
                    v-if="key === 'status' && ((value === 'DISCONNECTED') || (value === 'UNREGISTERED'))"
                    color="red"
                    :label="$t('DEVICE_QR.011')"
                  />
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <q-item>
            <q-item-section>
              <q-item-label>station</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>
                {{ gatewayInfo?.station.name }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <!--          <q-item>
            <q-item-section top>
              <q-item-label>QR 라벨 상태</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-list v-if="gatewayInfo?.endDevicesCountByState" bordered separator dense>
                <q-item v-for="[key, value] in Object.entries(gatewayInfo.endDevicesCountByState)" :key="key">
                  <q-item-section>
                    <q-item-label>{{ key }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>
                      {{ value }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-item-section>
          </q-item>-->
        </q-list>
        <q-inner-loading
          :showing="loading"
        />
      </q-card>
      <q-card class="card column justify-center items-center">
        <q-btn
          round
          size="lg"
          icon="add"
          color="primary"
          @click="openAddGatewayDialog"
        />
        <div class="text-h6 text-bold q-mt-sm">
          {{ $t('DEVICE_QR.012') }}
        </div>
      </q-card>
    </div>
  </q-card>
</template>

<style scoped lang="scss">
.card{
  min-width: 400px;
  min-height: 406px;
}
</style>
