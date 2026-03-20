<script setup lang="ts">
import ko from 'element-plus/dist/locale/ko.min.mjs'
import type { QTableProps } from 'quasar'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import type { Ref } from 'vue'
import type { HoPaymentVo, HoPaymentListResponse, HoPaymentCancelResponse, ShopInfoVo } from '~/types'
import { paymentStatusCode, paymentMethodCode } from '~/utils/code'
import { useCustomFetch } from '~/composables/useCustomFetch'
import { priceToCurrency } from '~/composables/priceToCurrency'

const route = useRoute()
const dayjs = useDayjs()
const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const pagination = ref({
  sortBy: 'insDate',
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
})

const startDate = ref(dayjs().format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))
const statusFilter = ref('')

// 매장 정보 조회
const { data: shop } = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + route.params.shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const paymentList:Ref<HoPaymentVo[]> = ref([])
const loading = ref(false)

// 결제 목록 조회
const fetchPaymentList = async (page = 0, size = 20, status = '', start = '', end = '') => {
  loading.value = true
  try {
    const params:any = {
      page,
      size
    }

    if (status) { params.status = status }
    if (start) { params.startDate = start }
    if (end) { params.endDate = end }

    const response = await customFetch<HoPaymentListResponse>(
      `/data/handOrder/shop/${route.params.shopCode}/payments`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        params
      }
    )

    if (response) {
      paymentList.value = response.payments
      pagination.value.rowsNumber = response.totalCount
      pagination.value.page = response.currentPage + 1
    }
  } catch (error) {
    console.error('결제 목록 조회 오류:', error)
    $q.notify({
      message: '결제 목록을 불러오는데 실패했습니다.',
      color: 'negative',
      position: 'top',
      icon: 'mdi-alert'
    })
  } finally {
    loading.value = false
  }
}

// 초기 데이터 로드
await fetchPaymentList(0, 20, statusFilter.value, startDate.value, endDate.value)

const columns:QTableProps['columns'] = [
  {
    name: 'insDate',
    label: '결제 일시',
    field: 'insDate',
    align: 'center',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : dayjs(val).format('YYYY-MM-DD HH:mm:ss')}`
  },
  {
    name: 'paymentUuid',
    label: '결제 ID',
    field: 'paymentUuid',
    align: 'center',
    format: (val:string) => val ? val.substring(0, 13) + '...' : '-'
  },
  {
    name: 'tableNum',
    label: '테이블',
    field: 'tableNum',
    align: 'center'
  },
  {
    name: 'paymentTitle',
    label: '결제명',
    field: 'paymentTitle',
    align: 'center'
  },
  {
    name: 'paymentAmount',
    label: '결제 금액',
    field: 'paymentAmount',
    align: 'center',
    format: (val:number) => priceToCurrency(val, shop.value?.shopLanguage as string)
  },
  {
    name: 'paymentMethod',
    label: '결제 방법',
    field: 'paymentMethod',
    align: 'center',
    format: (val:string) => {
      return paymentMethodCode[val as keyof typeof paymentMethodCode] || val || '-'
    }
  },
  {
    name: 'paymentRequesterCode',
    label: '요청자',
    field: 'paymentRequesterCode',
    align: 'center'
  },
  {
    name: 'paymentStatus',
    label: '상태',
    field: 'paymentStatus',
    align: 'center',
    format: (val:string) => {
      if (val == null) { return '-' }
      const status = paymentStatusCode.find(code => code.value === val)
      return status ? $t(status.label) : val
    }
  },
  {
    name: 'actions',
    label: '작업',
    field: '',
    align: 'center'
  }
]

// 검색
const doSearch = async () => {
  pagination.value.page = 1
  await fetchPaymentList(
    0,
    pagination.value.rowsPerPage,
    statusFilter.value,
    startDate.value,
    endDate.value
  )
}

// 테이블 페이지 변경
const onRequest = async (props:any) => {
  const { page, rowsPerPage } = props.pagination
  await fetchPaymentList(
    page - 1,
    rowsPerPage,
    statusFilter.value,
    startDate.value,
    endDate.value
  )
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
}

// 결제 취소
const cancelPayment = async (payment: HoPaymentVo) => {
  if (!checkPermissions(['U'])) {
    return
  }

  if (payment.paymentStatus !== 'COMPLETED') {
    $q.notify({
      message: '완료된 결제만 취소할 수 있습니다.',
      color: 'warning',
      position: 'top',
      icon: 'mdi-alert'
    })
    return
  }

  $q.dialog({
    title: '결제 취소',
    message: `결제를 취소하시겠습니까?\n금액: ${priceToCurrency(payment.paymentAmount, shop.value?.shopLanguage as string)}`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    loading.value = true
    try {
      const response = await customFetch<HoPaymentCancelResponse>(
        `/data/handOrder/payment/${payment.paymentUuid}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response && response.success) {
        $q.notify({
          message: '결제가 취소되었습니다.',
          color: 'positive',
          position: 'top',
          icon: 'mdi-check'
        })
        // 목록 새로고침
        await fetchPaymentList(
          pagination.value.page - 1,
          pagination.value.rowsPerPage,
          statusFilter.value,
          startDate.value,
          endDate.value
        )
      } else {
        $q.notify({
          message: response?.message || '결제 취소에 실패했습니다.',
          color: 'negative',
          position: 'top',
          icon: 'mdi-alert'
        })
      }
    } catch (error:any) {
      console.error('결제 취소 오류:', error)
      $q.notify({
        message: error.message || '결제 취소 중 오류가 발생했습니다.',
        color: 'negative',
        position: 'top',
        icon: 'mdi-alert'
      })
    } finally {
      loading.value = false
    }
  })
}

// 빠른 날짜 설정
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

// 엑셀 내보내기
const getExcelHeader = () => {
  return columns
    .filter(col => col.name !== 'actions')
    .map(col => col.label)
}

const getExcelContent = () => {
  interface tableData {
    [key: string]: string
  }
  const visibleColumnsData = columns.filter(col => col.name !== 'actions')
  const contentArray:tableData[] = []

  paymentList.value?.forEach((row: HoPaymentVo) => {
    const rowData:tableData = {}
    visibleColumnsData.forEach((col) => {
      const field = col.field
      const format = col.format
      const val = typeof field === 'function' ? field(row) : typeof field === 'string' ? row[field as keyof HoPaymentVo] : undefined
      const formattedVal = format !== undefined ? format(val, row) : val

      rowData[col.label] = formattedVal?.toString() || ''
    })
    contentArray.push(rowData)
  })

  return contentArray
}

// 상태 뱃지 색상
const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'COMPLETED':
      return 'positive'
    case 'CANCELLED':
      return 'negative'
    case 'FAILED':
      return 'grey'
    default:
      return 'grey'
  }
}
</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">결제 목록</span>
      <q-separator class="q-mt-lg" />
      <div class="search-box q-mt-md row justify-between">
        <div>
          <ElConfigProvider :locale="ko">
            <el-date-picker
              v-model="startDate"
              type="date"
              :placeholder="$t('COMMON.082')"
              size="large"
              value-format="YYYY-MM-DD"
            />
            ~
            <el-date-picker
              v-model="endDate"
              type="date"
              :placeholder="$t('COMMON.082')"
              size="large"
              value-format="YYYY-MM-DD"
            />
          </ElConfigProvider>
          <q-select
            v-model="statusFilter"
            :options="paymentStatusCode"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            class="q-ml-md"
            style="width: 150px; display: inline-block;"
          >
            <template v-slot:selected-item="scope">
              {{ $t(scope.opt.label) }}
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <div class="q-mt-sm">
            <q-btn :label="$t('COMMON.083')" @click="setToday" />
            <q-btn :label="$t('COMMON.084')" @click="setYesterday" />
            <q-btn :label="$t('HISTORY.009')" @click="set3Day" />
            <q-btn :label="$t('HISTORY.010')" @click="setWeek" />
          </div>
        </div>

        <div v-if="shop" class="flex justify-end items-center row">
          <div class="row align-center" style="align-items: center;">
            <div style="margin-right:5px">
              <ExcelExportButton
                :content="getExcelContent()"
                :header="getExcelHeader()"
                :skip-header="false"
                :file-name="`${shop?.shopName}_결제목록_${startDate}_${endDate}`"
              />
            </div>
            <q-btn :label="$t('COMMON.021')" color="primary" class="float-right" @click="doSearch" />
          </div>
        </div>
      </div>
    </div>
    <div class="content-body col">
      <q-table
        v-model:pagination="pagination"
        class="full-height sticky-header-table"
        flat
        bordered
        :rows="paymentList"
        :columns="columns"
        row-key="paymentUuid"
        :loading="loading"
        @request="onRequest"
      >
        <template v-slot:body-cell-paymentStatus="props">
          <q-td :props="props">
            <q-badge
              :color="getStatusColor(props.row.paymentStatus)"
              :label="props.value"
              rounded
            />
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="props.row.paymentStatus === 'COMPLETED'"
              :label="$t('ORDER.003')"
              color="negative"
              size="sm"
              dense
              @click="cancelPayment(props.row)"
            />
            <span v-else class="text-grey">-</span>
          </q-td>
        </template>
      </q-table>
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

.search-box {
  padding: 10px 0;
}
</style>
