<script setup lang="ts">
import { QForm, QInput } from 'quasar'
import { ref } from 'vue'
import type { ShopDeviceVo, ShopPostDto, ShopInfoVo } from '~/types'

const props = defineProps<{
  shopCode: string,
  shopSeq: number,
  shopInfo: ShopPostDto | ShopInfoVo,
  isEditable: boolean
}>()

const emits = defineEmits<{
  'update:shopInfo': [value:ShopPostDto | ShopInfoVo],
}>()

const shopInfo = computed<ShopPostDto | ShopInfoVo>({
  get: () => props.shopInfo,
  set: value => emits('update:shopInfo', value)
})

const newDevice = ref<ShopDeviceVo>({
  shopDeviceSeq: null,
  shopSeq: props.shopSeq,
  deviceType: '',
  deviceColor: '',
  quantity: 1,
  status: 'INSERT'
})

const deviceColorOptions = computed(() => {
  return deviceColorOption.map(item => ({
    label: $t(item.label),
    value: item.value
  }))
})

const insertDevice = () => {
  const exists = shopInfo.value.deviceList.find(shopDevice => shopDevice.deviceType === newDevice.value.deviceType && shopDevice.deviceColor === newDevice.value.deviceColor)

  if (exists !== undefined) {
    if (exists.status !== 'INSERT') {
      exists.status = 'UPDATE'
    }
    exists.quantity += newDevice.value.quantity
  } else {
    shopInfo.value.deviceList.push(newDevice.value)
  }

  newDevice.value = {
    shopDeviceSeq: null,
    shopSeq: props.shopSeq,
    deviceType: '',
    deviceColor: '',
    quantity: 1,
    status: 'INSERT'
  }

  setDeviceCount()
}

const deleteDevice = (target:ShopDeviceVo) => {
  // const target = shopInfo.value.deviceList[index]
  if (target.status === 'INSERT') {
    shopInfo.value.deviceList = shopInfo.value.deviceList.filter(shopDevice => shopDevice.deviceType !== target.deviceType || shopDevice.deviceColor !== target.deviceColor)
  } else {
    target.status = 'DELETE'
    target.quantity = 0
  }
  setDeviceCount()
}

const setDeviceCount = () => {
  shopInfo.value.deviceCount = shopInfo.value.deviceList.length === 0 ? 0 : shopInfo.value.deviceList.map(shopDevice => shopDevice.quantity).reduce((acc, cur) => acc + cur)
}

const updateQuantity = (shopDevice:ShopDeviceVo) => {
  if (shopDevice.quantity < 1) {
    shopDevice.quantity = 1
  }
  if (shopDevice.status === 'NORMAL') {
    shopDevice.status = 'UPDATE'
  }
  setDeviceCount()
}

</script>

<template>
  <q-list>
    <q-form v-if="props.isEditable" @submit="insertDevice">
      <q-item>
        <q-item-section class="col-5">
          <q-select
            v-model="newDevice.deviceType"
            :label="$t('COMMON.073')"
            :options="deviceTypeOption"
            emit-value
            map-options
            dense
            outlined
          />
        </q-item-section>
        <q-item-section class="col-3">
          <q-select
            v-model="newDevice.deviceColor"
            :label="$t('SHOP.139')"
            :options="deviceColorOptions"
            emit-value
            map-options
            dense
            outlined
          />
        </q-item-section>
        <!--
        <q-item-section class="col-2">
          <q-input
            v-model.number="newDevice.quantity"
            label="수량"
            dense
            outlined
            type="number"
            mask="#"
          />
        </q-item-section>-->
        <q-item-section side>
          <q-btn
            :label="$t('COMMON.096')"
            color="primary"
            type="submit"
            :disable="newDevice.deviceType === '' || newDevice.deviceColor === '' || newDevice.quantity === null || newDevice.quantity <= 0"
          />
        </q-item-section>
      </q-item>
    </q-form>
    <q-separator />
    <q-item v-for="(shopDevice, index) in shopInfo.deviceList.filter(shopDevice => shopDevice.status !== 'DELETE')" :key="index">
      <q-item-section v-if="props.isEditable" class="col-1">
        <q-btn color="negative" dense @click="deleteDevice(shopDevice)">
          <q-icon name="delete" />
        </q-btn>
      </q-item-section>
      <q-item-section class="col-5">
        <q-select
          v-model="shopDevice.deviceType"
          :label="$t('COMMON.073')"
          :options="deviceTypeOption"
          emit-value
          map-options
          dense
          outlined
          readonly
        />
      </q-item-section>
      <q-item-section class="col-3">
        <q-select
          v-model="shopDevice.deviceColor"
          :label="$t('SHOP.139')"
          :options="deviceColorOptions"
          emit-value
          map-options
          dense
          outlined
          readonly
        />
      </q-item-section>
      <q-item-section class="col-2">
        <q-input
          v-model.number="shopDevice.quantity"
          :label="$t('COMMON.080')"
          dense
          outlined
          type="number"
          :readonly="!props.isEditable"
          :rules="[ val => val <= 200 || $t('SHOP.166')]"
          @update:model-value="updateQuantity(shopDevice)"
        />
      </q-item-section>
      <!--<q-item-section class="col-2">
        <q-input
          v-model.number="shopDevice.status"
          label="상태"
          dense
          outlined
        />
      </q-item-section>
      -->
    </q-item>
    <q-separator />
    <q-item>
      <q-item-section>
        {{ $t('SHOP.140') }}
      </q-item-section>
      <q-item-section side>
        {{ shopInfo.deviceCount }}
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped lang="scss">

</style>
