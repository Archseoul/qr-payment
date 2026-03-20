<script setup lang="ts">
import { useRoute } from 'vue-router'
import { sortBy } from 'lodash-es'
import type { Ref } from 'vue'
import type { GatewayInfoVo, HoRandomMapVo, HoTableVo, ShopInfoVo } from '~/types'

definePageMeta({
  middleware: 'check-accessible-shop'
})
const route = useRoute()
const $q = useQuasar()
const gatewayLoading = ref(true)
const productLoading = ref(true)
const tableLoading = ref(true)
const config = useRuntimeConfig()
const shopCode = route.params.shopCode as string
const shopInfoData = await useCustomFetch<ShopInfoVo>(`/admin/handOrder/shop/${shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}).then((res) => {
  return res
})
const shopInfo = useState('shopInfo', ():ShopInfoVo|null => shopInfoData.data?.value ?? null)
shopInfo.value = shopInfoData.data?.value ?? null
const shopSeq = computed(():number => shopInfo.value?.shopSeq ?? 0)
const gatewayInfoData = await useCustomFetch<GatewayInfoVo[]>('/admin/handOrder/gatewayStatus', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  params: {
    shopSeq: shopSeq.value
  }
}).then((res) => {
  gatewayLoading.value = false
  return res
})
const gatewayInfo = gatewayInfoData.data.value ? gatewayInfoData.data : ref([])

const randomMapData = await useCustomFetch<HoRandomMapVo[]>('/admin/handOrder/productList', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  params: {
    shopSeq: shopSeq.value,
    storeCode: shopInfo.value?.qrStoreCode
  }
}).then((res) => {
  productLoading.value = false
  return res
})
const randomMap = randomMapData.data.value ? randomMapData.data : ref([])
randomMap.value = sortBy(randomMap.value, (row:HoRandomMapVo) => Number(row.landingUrl.slice(row.landingUrl.lastIndexOf('/') + 1)))

const tableData = await useCustomFetch<HoTableVo[]>(`/admin/handOrder/table/${shopCode}`, {
  method: 'GET'
}).then((res) => {
  tableLoading.value = false
  return res
})
const tableList:Ref<HoTableVo[]|null> = tableData.data

const refreshGatewayStatus = async () => {
  gatewayLoading.value = true
  gatewayInfo.value = await customFetch<GatewayInfoVo[]>('/admin/handOrder/gatewayStatus', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      shopSeq: shopSeq.value
    },
    baseURL: config.public.baseUrl
  }).then((res) => {
    gatewayLoading.value = false
    return res
  }) ?? null
}

const refreshRandomMap = async () => {
  productLoading.value = true
  randomMap.value = await customFetch<HoRandomMapVo[]>('/admin/handOrder/productList', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      shopSeq: shopSeq.value,
      storeCode: shopInfo.value?.qrStoreCode
    },
    baseURL: config.public.baseUrl
  }).then((res) => {
    productLoading.value = false
    return res
  })
}

const updateInstallationDate = () => {
  $q.dialog({
    message: $t('DEVICE_QR.001'),
    title: $t('DEVICE_QR.002'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/shop/${shopCode}/installation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(() => {
      $q.notify({
        message: $t('DEVICE_QR.003'),
        color: 'positive',
        position: 'top'
      })
      shopInfo.value!.shopStatus = 'ACTIVE'
    })
  })
}

</script>

<template>
  <div class="main-content relative-position full-height">
    <q-scroll-area class="fit">
      <div class="row justify-between">
        <span class="text-h5 text-bold" @dblclick="navigateTo('/chat')">{{ $t('DEVICE_QR.004') }}</span>
        <div>
          <q-btn
            :label="$t('DEVICE_QR.002')"
            color="primary"
            :disable="shopInfo?.shopStatus !== 'PENDING'"
            style="margin-right:15px"
            @click="updateInstallationDate"
          >
            <q-tooltip v-if="shopInfo?.shopStatus !== 'PENDING'">
              <div class="text-center">
                <div>{{ $t('DEVICE_QR.005') }}</div>
              </div>
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <q-separator class="q-my-lg" />

      <div class="q-pa-md fit row">
        <GatewayStatus
          :shop-code="shopCode"
          :gateway-info-list="gatewayInfo"
          :loading="gatewayLoading"
          @refresh="refreshGatewayStatus"
        />
      </div>
      <div class="q-pa-md fit">
        <UpdateQrRedirectLink :ho-random-map="randomMap" :loading="productLoading" :shop-info="shopInfo" :table-list="tableList" @refresh="refreshRandomMap" />
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

</style>
