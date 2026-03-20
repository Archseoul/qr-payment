<script setup lang="ts">
import customParseFormat from 'dayjs/plugin/customParseFormat'
import useDayjs from 'dayjs'
import type { Ref } from 'vue'
import type { QTableProps } from 'quasar'

import type { HoPrintLogVo, HoSalesVo } from '~/types'
import { paymentMethodCode } from '~/utils/code'
import { useAuthStore } from '~/store/auth'

const dayjs = useDayjs
dayjs.extend(customParseFormat)
const paymentMethod = ref(null)
const shopName = ref(null)
const dateRange = ref({
  from: dayjs().subtract(1, 'week').format('YYYY-MM-DD'),
  to: dayjs().format('YYYY-MM-DD')
})
const nuxtApp = useNuxtApp()
const userAuth = useAuthStore(nuxtApp.$pinia)
const pagination = ref({
  rowsPerPage: 0
})

const cardHistoryData = await useCustomFetch<HoSalesVo[]>('/admin/handOrder/sales/v2/history', {
  method: 'GET',
  params: {
    paymentMethod: paymentMethod.value ?? undefined,
    shopName: shopName.value ?? undefined,
    startDate: dateRange.value.from,
    endDate: dateRange.value.to,
    memberId: userAuth.userInfo.id
  }
})
const cardHistory:Ref<HoSalesVo[] | null | undefined> = cardHistoryData.data

const search = async () => {
  cardHistory.value = await customFetch<HoSalesVo[]>('/admin/handOrder/sales/v2/history', {
    method: 'GET',
    params: {
      paymentMethod: paymentMethod.value ?? undefined,
      shopName: shopName.value ?? undefined,
      startDate: dateRange.value.from,
      endDate: dateRange.value.to,
      memberId: userAuth.userInfo.id
    }
  })
}

const columns:QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    field: (row:HoSalesVo) => (cardHistory.value?.indexOf(row) ?? 0) + 1
  },
  {
    name: 'agency',
    label: $t('CARD_HISTORY.002'),
    field: (row:HoSalesVo) => row.company?.companyName ?? $t('COMMON.053')
  },
  {
    name: 'shopCode',
    label: $t('CARD_HISTORY.003'),
    field: (row:HoSalesVo) => row.shopInfo.shopCode
  },
  {
    name: 'shopName',
    label: $t('CARD_HISTORY.004'),
    field: (row:HoSalesVo) => row.shopInfo.shopName
  },
  {
    name: 'date',
    label: $t('CARD_HISTORY.005'),
    field: (row:HoSalesVo) => dayjs(row.pgPaymentResult.trdDtm, 'YYYYMMDDHHmmss').format('YYYY-MM-DD')
  },
  {
    name: 'time',
    label: $t('CARD_HISTORY.006'),
    field: (row:HoSalesVo) => dayjs(row.pgPaymentResult.trdDtm, 'YYYYMMDDHHmmss').format('HH:mm:ss')
  },
  {
    name: 'prodName',
    label: $t('CARD_HISTORY.007'),
    field: (row:HoSalesVo) => row.pgPaymentResult.pmtprdNm
  },
  {
    name: 'amt',
    label: $t('CARD_HISTORY.008'),
    field: (row:HoSalesVo) => row.pgPaymentResult.trdAmt
  },
  {
    name: 'paymentMethod',
    label: $t('CARD_HISTORY.009'),
    field: (row:HoSalesVo) => paymentMethodCode[row.pgPaymentResult.ezpDivCd] ?? $t('CARD_HISTORY.017')
  },
  {
    name: 'cancelDt',
    label: $t('CARD_HISTORY.010'),
    field: (row:HoSalesVo) => {
      return row.pgPaymentResult.cancelDtm ? dayjs(row.pgPaymentResult.cancelDtm, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss') : ''
    }
  },
  {
    name: 'cancelAmt',
    label: $t('CARD_HISTORY.011'),
    field: (row:HoSalesVo) => row.pgPaymentResult.canceledAmt
  },
  {
    name: 'detail',
    label: $t('CARD_HISTORY.012'),
    field: (row:HoSalesVo) => row.printLogGroup.printGroupUuid
  }
]

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('CARD_HISTORY.001') }}</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col full-width column">
      <div>
        <q-item>
          <q-item-section>
            <div class="flex q-gutter-sm">
              <q-input :model-value="dateRange?.from" readonly outlined label="시작날짜" />
              <q-input :model-value="dateRange?.to" readonly outlined label="끝날짜">
                <template v-slot:append>
                  <q-icon name="event">
                    <q-popup-proxy>
                      <q-date
                        v-model="dateRange"
                        range
                        mask="YYYY-MM-DD"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </q-item-section>
          <q-item-section side>
            <div class="flex q-gutter-sm">
              <q-input v-model="shopName" label="매장명" outlined />
              <q-btn label="조회" color="primary" @click="search" />
            </div>
          </q-item-section>
        </q-item>
      </div>
      <div class="col full-width">
        <q-table
          v-model:pagination="pagination"
          :rows="cardHistory as HoSalesVo[]"
          :row-key="(row:HoSalesVo) => row.printLogGroup.printGroupUuid"
          :columns="columns"
          hide-pagination
          style="height: 100%"
          virtual-scroll
          bordered
          flat
        >
          <template v-slot:body-cell-detail="rowData">
            <q-td :props="rowData">
              <q-icon
                name="description"
                class="cursor-pointer fit text-grey-7"
                style="font-size: 1.4rem;"
                @click="console.log(rowData.row.printLogGroup.printLog)"
              >
                <q-popup-proxy>
                  <q-banner>
                    <q-table
                      flat
                      :rows="(rowData.row as HoSalesVo).printLogGroup.printLog"
                      :columns="[
                        {
                          name: 'index',
                          label: $t('CARD_HISTORY.013'),
                          field: (row:HoPrintLogVo) => (rowData.row as HoSalesVo).printLogGroup.printLog.indexOf(row) + 1
                        },
                        {
                          name: 'prodName',
                          label: $t('CARD_HISTORY.014'),
                          field: (row:HoPrintLogVo) => row.menuName
                        },
                        {
                          name: 'salesQty',
                          label: $t('CARD_HISTORY.015'),
                          field: (row:HoPrintLogVo) => row.quantity
                        },
                        {
                          name: 'salesAmt',
                          label: $t('CARD_HISTORY.016'),
                          field: (row:HoPrintLogVo) => row.finalPrice
                        },
                      ]"
                      hide-pagination
                    />
                  </q-banner>
                </q-popup-proxy>
              </q-icon>
            </q-td>
          </template>
        </q-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
