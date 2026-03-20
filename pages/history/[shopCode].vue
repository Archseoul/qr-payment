<script setup lang="ts">
import ko from 'element-plus/dist/locale/ko.min.mjs'
import type { QTableProps } from 'quasar'
import { useRoute } from 'vue-router'
import type { Ref } from 'vue'
import type { HoPrintLogGroupVo, HoPrintLogVo, HoSalesVo, LocaleCodeVo, ShopInfoVo } from '~/types'
import { orderStatusCode } from '~/utils/code'
import { useCustomFetch } from '~/composables/useCustomFetch'
import { updateMenuNames } from '~/composables/updateMenuNames'
import { priceToCurrency } from '~/composables/priceToCurrency'
import { useAuthStore } from '~/store/auth'
import { orderCancel } from '~/composables/order/useOrderCancel'

const route = useRoute()
const dayjs = useDayjs()
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)

const $q = useQuasar()

const pagination = ref({
  rowsPerPage: 0
})

const startDate = ref(dayjs().format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))
const localeRadio = ref('')

// shopLanguage 값을 확인하기 위해 shop정보 가져오는 통신
const { data: shop } = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + route.params.shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

localeRadio.value = shop.value?.shopLanguage as string ?? 'ko'

const { isDeliveryUse } = shop.value!
const orderListData = await useCustomFetch<HoPrintLogGroupVo[]>(`/admin/handOrder/shop/${route.params.shopCode}/v2/history`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  params: {
    startDate: startDate.value,
    endDate: endDate.value,
    shopLanguage: localeRadio.value
  }
})

const orderList = orderListData?.data

// 매장 언어 설정을 위해 언어의 종류를 가져오는 통신
const localeList:Ref<LocaleCodeVo[] | null> = ref(null)

const localeListData = async () => {
  return await customFetch<LocaleCodeVo[]>(`/admin/handOrder/locale/shop/${route.params.shopCode}`, {
    method: 'GET'
  })
}

localeListData().then((res) => {
  const defaultLocale = {
    localeCode: 'ko',
    localeName: '한국어'
  }
  res.unshift(defaultLocale as LocaleCodeVo)
  localeList.value = res
})

const localeOptions = computed(() => {
  return localeList.value?.map((locale:LocaleCodeVo) => ({
    label: locale.localeName,
    value: locale.localeCode
  }))
})
//
// updateMenuNames(orderList.value as HoPrintLogGroupVo[], localeRadio.value as string)
//
// watch(() => orderList.value, (newVal) => {
//   updateMenuNames(newVal as HoPrintLogGroupVo[], localeRadio.value as string)
// }, { deep: true })

const columns:QTableProps['columns'] = [
  {
    name: 'insDate',
    label: $t('HISTORY.001'),
    field: 'insDate',
    align: 'center',
    format: (val:string) => `${val == null ? '-' : dayjs(val).format('YYYY-MM-DD HH:mm:ss')}`
  },
  {
    name: 'orderStatus.orderCode',
    label: $t('ORDER.017'),
    field: (row:HoPrintLogGroupVo) => {
      return row.orderStatus.orderCode
    },
    align: 'center'
  },
  {
    name: 'tableName',
    label: $t('HISTORY.002'),
    field: 'tableName',
    align: 'center'
  },
  {
    name: 'menuName',
    label: $t('HISTORY.003'),
    field: (row:HoPrintLogGroupVo) => {
      return getMenuName(row.printLog)
    },
    align: 'center'
  },
  {
    name: 'menuPrice',
    label: $t('HISTORY.005'),
    field: (row:HoPrintLogGroupVo) => {
      return getTotalPrice(row.printLog)
    },
    align: 'center'
  },
  {
    name: 'status',
    label: $t('HISTORY.006'),
    field: (row:HoPrintLogGroupVo) => {
      return row.orderStatus.status
    },
    align: 'center',
    format: (val:string) => {
      if (val == null) {
        return '-'
      }
      const orderStatus = orderStatusCode.find(code => code.value === val)
      if (orderStatus) {
        return $t(orderStatus.label)
      }
      return '-'
    }
  },
  {
    name: 'cancelOrder',
    label: '주문 취소',
    field: (row:HoPrintLogGroupVo) => {
      return row.orderStatus?.status
    },
    align: 'center'
  }
]

const visibleColumns = ref(columns.map(col => col.name))

if (authStore.userInfo.userType !== 'admin') {
  visibleColumns.value = visibleColumns.value.filter(col => col !== 'cancelOrder')
}

const doSearch = async () => {
  const res = await customFetch<HoPrintLogGroupVo[]>(`/admin/handOrder/shop/${route.params.shopCode}/v2/history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      startDate: startDate.value,
      endDate: endDate.value,
      shopLanguage: localeRadio.value
    }
  })

  orderList.value = res ?? []
}

const getMenuName = (printList:HoPrintLogVo[]) => {
  const menuName = printList[0]?.menuName

  const resultMenuName = (count : number):string => {
    return (localeRadio.value as string === 'ko') ? `${$t('HISTORY.007', { count })}` : ` other case ${count}`
  }

  return menuName + (printList.length > 1 ? resultMenuName(printList.length - 1) : '')
}

const getTotalPrice = (orderList:HoPrintLogVo[]) => {
  let totalPrice = 0
  orderList.forEach((order:HoPrintLogVo) => {
    totalPrice += order.finalPrice
  })

  return priceToCurrency(totalPrice, localeRadio.value as string)
}

const setToday = () => {
  startDate.value = dayjs().format('YYYY-MM-DD')
  endDate.value = dayjs().format('YYYY-MM-DD')
  doSearch()
}

const setYesterday = () => {
  startDate.value = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  endDate.value = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  doSearch()
}

const set3Day = () => {
  startDate.value = dayjs().subtract(3, 'day').format('YYYY-MM-DD')
  endDate.value = dayjs().format('YYYY-MM-DD')
  doSearch()
}

const setWeek = () => {
  startDate.value = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
  endDate.value = dayjs().format('YYYY-MM-DD')
  doSearch()
}

const formatPhoneNumber = (phoneNumber : string|null|undefined) => {
  return phoneNumber ? phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : ''
}

const cancelOrder = async (order: HoPrintLogGroupVo) => {
  const { data } = await useCustomFetch<HoSalesVo>(`/handOrder/sales/${order.printGroupUuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (data.value) {
    orderCancel(data.value, $q, orderListData.refresh)
  }
}

const getExcelHeader = () => {
  const headers = columns.map(col => col.label).filter(label => label !== $t('ORDER.003'))

  if (authStore.userInfo.userType === 'admin' || authStore.userInfo.userType === 'shop') {
    headers.push('카드 승인번호')
  }

  return headers
}

const getExcelContent = () => {
  const includeApprNo = authStore.userInfo.userType === 'admin' || authStore.userInfo.userType !== 'shop'

  interface tableData {
    [key: string]: string
  }
  const visibleColumnsData = columns.filter(col => col.name !== 'cancelOrder' && visibleColumns.value.includes(col.name))
  const contentArray:tableData[] = []
  orderList.value?.forEach((row: HoPrintLogGroupVo) => {
    const rowData:tableData = {}
    visibleColumnsData.forEach((col) => {
      const field = col.field
      const format = col.format
      const val = typeof field === 'function' ? field(row) : typeof field === 'string' ? row[field] : undefined
      const formattedVal = format !== undefined ? format(val, row) : val

      rowData[col.label] = formattedVal
    })
    if (includeApprNo && row.cardApprNo) {
      rowData['카드 승인번호'] = row.cardApprNo
    }
    contentArray.push(rowData)
  })

  return contentArray
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('HISTORY.008') }}</span>
      <q-separator class="q-mt-lg" />
    </div>
    <div class="search-box q-mt-md row justify-between">
      <div>
        <ElConfigProvider :locale="ko">
          <!--        <ElDatePicker model-value="value1" type="date" placeholder="Pick a day" style="width: 100%;" />-->
          <el-date-picker v-model="startDate" type="date" :placeholder="$t('COMMON.082')" size="large" value-format="YYYY-MM-DD" />
          ~
          <el-date-picker v-model="endDate" type="date" :placeholder="$t('COMMON.082')" size="large" value-format="YYYY-MM-DD" />
        </ElConfigProvider>
        <div class="q-mt-sm">
          <q-btn :label="$t('COMMON.083')" @click="setToday" />
          <q-btn :label="$t('COMMON.084')" @click="setYesterday" />
          <q-btn :label="$t('HISTORY.009')" @click="set3Day" />
          <q-btn :label="$t('HISTORY.010')" @click="setWeek" />
        </div>
      </div>

      <div v-if="shop" class="flex justify-between items-center row">
        <div class="q-mr-lg">
          <q-radio
            v-for="option in localeOptions"
            :key="option.value"
            v-model="localeRadio"
            checked-icon="task_alt"
            unchecked-icon="panorama_fish_eye"
            :val="option.value"
            :label="option.label"
          />
        </div>
        <div class="row align-center" style="align-items: center;">
          <div style="margin-right:5px">
            <ExcelExportButton
              :content="getExcelContent()"
              :header="getExcelHeader()"
              :skip-header="false"
              :file-name="`${shop?.shopName}_${startDate}_${endDate}`"
            />
          </div>
          <q-btn :label="$t('COMMON.021')" color="primary" class="float-right" @click="doSearch" />
        </div>
      </div>
    </div>
    <div class="col">
      <template v-if="isDeliveryUse">
        <q-table
          v-model:pagination="pagination"
          class="sticky-header-table full-height"
          flat
          bordered
          :rows="orderList ?? []"
          :columns="columns"
          row-key="printGroupUuid"
          :rows-per-page-options="[0]"
          hide-bottom
        >
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width />
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td auto-width>
                <q-btn
                  v-if="props.row.delivery || props.row.takeOut"
                  size="sm"
                  color="orange"
                  round
                  dense
                  :icon="props.expand ? 'remove' :'add' "
                  :visible-columns="visibleColumns"
                  class="center-icon"
                  @click="props.expand = !props.expand"
                />
              </q-td>

              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                <div v-if="col.name === 'cancelOrder'">
                  <q-btn
                    v-if="props.row.orderStatus?.status !== undefined && props.row.orderStatus?.status !== 'CANCEL' && props.row.cardApprNo !== null"
                    label="주문취소"
                    color="negative"
                    @click.stop="cancelOrder(props.row)"
                  />
                </div>
                <div v-else>
                  {{ col.value }}
                </div>
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <div class="text-left">
                  <span class="q-mr-md no-pointer-events">
                    <span class="text-weight-bold">주소 :</span> {{ props.row.printLog[0].deliveryAddress }}
                    <span class="text-weight-bold q-ml-sm">상세주소 :</span> {{ props.row.printLog[0].deliveryDetailAddress }}
                  </span>
                  <span class="no-pointer-events"><span class="text-weight-bold">전화번호 :</span> {{ formatPhoneNumber(props.row.printLog[0].userPhoneNumber) }}</span>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </template>
      <template v-else>
        <q-table
          v-model:pagination="pagination"
          class="sticky-header-table full-height"
          flat
          bordered
          :rows="orderList ?? []"
          :columns="columns"
          :visible-columns="visibleColumns"
          row-key="printSeq"
          virtual-scroll
          :rows-per-page-options="[0]"
          hide-bottom
        >
          <template v-if="authStore.userInfo.userType === 'admin'" v-slot:body-cell-cancelOrder="rowData">
            <q-td :props="rowData">
              <q-btn
                v-if="rowData.row.orderStatus?.status !== undefined && rowData.row.orderStatus?.status !== 'CANCEL'"
                label="주문취소"
                color="negative"
                @click.stop="cancelOrder(rowData.row)"
              />
            </q-td>
          </template>
        </q-table>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sticky-header-table{
  :deep(thead tr:first-child th) {
    background-color: #ffffff;
  }
  :deep(thead tr th) {
    position: sticky;
    z-index: 1;
  }
  :deep(thead tr:first-child th) {
    top: 0;
  }
}

</style>
