<script setup lang="ts">
import { QTable, useQuasar } from 'quasar'
import type { QTableProps } from 'quasar'
import useDayjs from 'dayjs'
import type { ShopInfoVo, CompanyReportDto, AdminMemberVo } from '~/types'

import { useAuthStore } from '~/store/auth'

const { userInfo } = useAuthStore()
const dayjs = useDayjs
const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const table = ref<QTable>()
const parentCompanyListData = await useCustomFetch<CompanyReportDto[]>('/admin/handOrder/company/report/parent', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const parentCompanyList = parentCompanyListData.data

const companyList = ref<{index:number, companyList:CompanyReportDto[], selectedList:CompanyReportDto[], selectAll:boolean}[]>([])

const convertParentCompanyList = () => {
  if (!parentCompanyList.value) { return }

  companyList.value = parentCompanyList.value.map((company:CompanyReportDto, index:number) => {
    return {
      index,
      companyList: [company],
      selectedList: [company],
      selectAll: false
    }
  })
}

const selectedCompany = ref<CompanyReportDto[]>([])

const setSelectedCompany = () => {
  selectedCompany.value = []

  for (let i = companyList.value.length - 1; i >= 0; i--) {
    const company = companyList.value[i]

    if (company.selectedList.length !== 0) {
      selectedCompany.value = company.selectedList
      break
    }
  }
}

const workerList = ref<AdminMemberVo[]>([])

const getWorkerList = async (companySeq:number) => {
  const workerListData = await customFetch<AdminMemberVo[]>('/admin/handOrder/company/report/worker', {
    method: 'GET',
    params: {
      companySeq
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (workerListData !== null) {
    workerList.value = workerListData
  }
}

const selectedWorker = ref<AdminMemberVo[]>([])

const selectAllWorkers = computed({ get: () => selectedWorker.value.length === workerList.value.length, set: (val) => { selectedWorker.value = val ? workerList.value : [] } })

const pagination = ref({
  rowsPerPage: 0
})
const columns:QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    align: 'left',
    field: (row:ShopInfoVo) => shopList.value.indexOf(row) + 1,
    required: true,
    sortable: true
  },
  {
    name: 'shopCode',
    label: $t('COMMON.026'),
    align: 'left',
    field: 'shopCode',
    sortable: true
  },
  {
    name: 'shopName',
    label: $t('COMMON.027'),
    align: 'left',
    field: 'shopName',
    sortable: true
  },
  {
    name: 'shopStatus',
    label: $t('COMMON.028'),
    align: 'left',
    field: 'shopStatus',
    sortable: true,
    format: (val, row) => val === 'ACTIVE' ? $t('COMPANY_REPORT.007') : val === 'PENDING' ? $t('COMPANY_REPORT.008') : (val === 'TERMINATE' || row.isActive === false) ? $t('COMMON.006') : ''
  },
  {
    name: 'corporate',
    label: $t('COMMON.029'),
    align: 'left',
    field: 'corporate',
    sortable: true,
    format: val => val ? $t('COMMON.031') : $t('COMMON.032')
  },
  {
    name: 'startDate',
    label: $t('COMPANY_REPORT.009'),
    align: 'left',
    field: 'startDate',
    sortable: true,
    format: val => val === null ? '-' : dayjs(val, 'YYYYMMDD').format('YYYY/MM/DD')
  },
  {
    name: 'installationDate',
    label: $t('COMPANY_REPORT.010'),
    align: 'left',
    field: 'installationDate',
    sortable: true,
    format: val => val === null ? '-' : dayjs(val, 'YYYYMMDD').format('YYYY/MM/DD')
  },
  {
    name: 'deviceCount',
    label: $t('COMPANY_REPORT.011'),
    align: 'left',
    field: 'deviceCount',
    sortable: true
  },
  {
    name: 'monthlyFare',
    label: $t('COMPANY_REPORT.012'),
    align: 'left',
    field: 'monthlyFare',
    sortable: true,
    format: val => val.toLocaleString()
  },
  {
    name: 'totalFare',
    label: $t('COMPANY_REPORT.013'),
    align: 'left',
    field: 'monthlyFare',
    sortable: true,
    format: (val, row) => (val * row.deviceCount).toLocaleString()
  },
  {
    name: 'workerName',
    label: $t('COMPANY_REPORT.015'),
    align: 'left',
    field: 'workerName',
    sortable: true
  }
]

const adminColumns:QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    align: 'left',
    field: (row:ShopInfoVo) => shopList.value.indexOf(row) + 1,
    required: true,
    sortable: true
  },
  {
    name: 'shopCode',
    label: $t('COMMON.026'),
    align: 'left',
    field: 'shopCode',
    sortable: true
  },
  {
    name: 'shopName',
    label: $t('COMMON.027'),
    align: 'left',
    field: 'shopName',
    sortable: true
  },
  {
    name: 'shopStatus',
    label: $t('COMMON.028'),
    align: 'left',
    field: 'shopStatus',
    sortable: true,
    format: val => val === 'ACTIVE' ? $t('COMPANY_REPORT.007') : val === 'PENDING' ? $t('COMPANY_REPORT.008') : val === 'TEST' ? $t('COMMON.030') : val === 'TERMINATE' ? $t('COMMON.006') : ''
  },
  {
    name: 'corporate',
    label: $t('COMMON.029'),
    align: 'left',
    field: 'corporate',
    sortable: true,
    format: val => val ? $t('COMMON.031') : $t('COMMON.032')
  },
  {
    name: 'startDate',
    label: $t('COMPANY_REPORT.009'),
    align: 'left',
    field: 'startDate',
    sortable: true,
    format: val => val === null ? '-' : dayjs(val, 'YYYYMMDD').format('YYYY/MM/DD')
  },
  {
    name: 'installationDate',
    label: $t('COMPANY_REPORT.010'),
    align: 'left',
    field: 'installationDate',
    sortable: true,
    format: val => val === null ? '-' : dayjs(val, 'YYYYMMDD').format('YYYY/MM/DD')
  },
  {
    name: 'deviceCount',
    label: $t('COMPANY_REPORT.011'),
    align: 'left',
    field: 'deviceCount',
    sortable: true
  },
  {
    name: 'monthlyFare',
    label: $t('COMPANY_REPORT.012'),
    align: 'left',
    field: 'monthlyFare',
    sortable: true,
    format: val => val.toLocaleString()
  },
  {
    name: 'totalFare',
    label: $t('COMPANY_REPORT.013'),
    align: 'left',
    field: 'monthlyFare',
    sortable: true,
    format: (val, row) => (val * row.deviceCount).toLocaleString()
  },
  {
    name: 'companyName',
    label: $t('COMPANY_REPORT.014'),
    align: 'left',
    field: 'companyName',
    sortable: true
  },
  {
    name: 'workerName',
    label: $t('COMPANY_REPORT.015'),
    align: 'left',
    field: 'workerName',
    sortable: true
  },
  { name: 'shopType', label: $t('COMPANY.028'), align: 'left', field: 'shopType', sortable: true },
  { name: 'ownerName', label: $t('COMPANY.027'), align: 'left', field: 'ownerName', sortable: true },
  { name: 'ownerBirth', label: $t('COMPANY_REPORT.016'), align: 'left', field: 'ownerBirth', sortable: true },
  { name: 'businessNumber', label: $t('COMPANY.030'), align: 'left', field: 'businessNumber', sortable: true },
  { name: 'address1', label: `${$t('COMPANY_REPORT.017')}1`, align: 'left', field: 'address1', sortable: true },
  { name: 'address2', label: `${$t('COMPANY_REPORT.017')}2`, align: 'left', field: 'address2', sortable: true },
  {
    name: 'posCode',
    label: $t('COMPANY_REPORT.019'),
    align: 'left',
    field: 'posCode',
    sortable: true,
    format: val => linkType.find(type => type.value === val)?.label ?? '-'
  },
  { name: 'managerName', label: $t('COMPANY_REPORT.020'), align: 'left', field: 'managerName', sortable: true },
  // { name: 'agencyId', label: '담당 대리점ID', align: 'left', field: 'agencyId', sortable: true },
  { name: 'managerPhoneNumber', label: $t('COMPANY_REPORT.021'), align: 'left', field: 'managerPhoneNumber', sortable: true },
  { name: 'managerEmail', label: $t('COMPANY_REPORT.022'), align: 'left', field: 'managerEmail', sortable: true },
  { name: 'shopPhoneNumber', label: $t('COMPANY_REPORT.023'), align: 'left', field: 'shopPhoneNumber', sortable: true },
  { name: 'bankName', label: $t('COMPANY.037'), align: 'left', field: 'bankName', sortable: true },
  { name: 'accountNumber', label: $t('COMPANY.038'), align: 'left', field: 'accountNumber', sortable: true },
  { name: 'accountHolder', label: $t('COMPANY.039'), align: 'left', field: 'accountHolder', sortable: true },
  { name: 'naverUrl', label: $t('COMPANY_REPORT.024'), align: 'left', field: 'naverUrl', sortable: true },
  { name: 'tableCount', label: $t('COMPANY_REPORT.025'), align: 'left', field: 'tableCount', sortable: true },
  { name: 'deviceType', label: $t('COMPANY_REPORT.026'), align: 'left', field: 'deviceType', sortable: true },
  { name: 'shopLanguage', label: $t('COMPANY_REPORT.027'), align: 'left', field: 'shopLanguage', sortable: true },
  { name: 'globalPayType', label: $t('COMPANY_REPORT.028'), align: 'left', field: 'globalPayType', sortable: true, format: val => val === 'won' ? $t('COMMON.049') : val === 'usd' ? $t('COMMON.050') : '-' },
  { name: 'bannerUse', label: $t('COMPANY_REPORT.029'), align: 'left', field: 'bannerUse', sortable: true, format: val => val ? 'O' : 'X' },
  { name: 'vanCode', label: $t('COMPANY_REPORT.030'), align: 'left', field: 'vanCode', sortable: true, format: val => vanCode.find(van => van.value === val)?.label ?? '-' },
  { name: 'etcNote', label: $t('COMPANY_REPORT.018'), align: 'left', field: 'etcNote', sortable: true }
]

const setSelectAll = (index:number) => {
  if (index === -1 || !companyList.value[index]) { return }

  const company = companyList.value[index]
  const newSelectAll = parentCompanyList.value && parentCompanyList.value[index] !== undefined
    ? false
    : company.companyList && company.selectedList
      ? company.companyList.length === company.selectedList.length
      : false

  // Nuxt 4 reactivity: 중첩 객체 변경 시 명시적으로 배열 재할당
  if (company.selectAll !== newSelectAll) {
    companyList.value = companyList.value.map((item, idx) =>
      idx === index ? { ...item, selectAll: newSelectAll } : item
    )
  }
}
const setCompanyFilter = async (index: number) => {
  setSelectedCompany()
  setSelectAll(index)

  workerList.value = []
  selectedWorker.value = []

  if (index !== -1 && companyList.value[index].selectedList.length !== 1) {
    companyList.value.splice(index + 1, companyList.value.length - index - 1)
    setSelectedCompany()
    setSelectAll(index)
  } else {
    await getNextCompanyList(index)
  }

  if (selectedCompany.value.length === 1) {
    await getWorkerList(selectedCompany.value[0].companySeq)
  }

  // await getShopList()
}

// Nuxt 4 reactivity: 전체 선택 토글 함수
const toggleSelectAll = (index: number, val: boolean) => {
  companyList.value = companyList.value.map((item, idx) =>
    idx === index
      ? {
          ...item,
          selectedList: val ? item.companyList : [],
          selectAll: val
        }
      : item
  )
  setCompanyFilter(index)
}

const getNextCompanyList = async (index:number) => {
  const data = await customFetch<CompanyReportDto[]>('/admin/handOrder/company/report/child', {
    method: 'GET',
    params: {
      companyCode: companyList.value.length > 0 ? companyList.value[index].selectedList[0].companyCode : null
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (data !== null && data.length > 0) {
    const nextIndex = index + 1
    if (companyList.value.length > nextIndex) {
      // 기존 항목 업데이트
      companyList.value = companyList.value.map((item, idx) =>
        idx === nextIndex
          ? { ...item, companyList: data, selectedList: [], selectAll: false }
          : item
      )
    } else {
      // 새 항목 추가
      companyList.value = [...companyList.value, {
        index: nextIndex,
        companyList: data,
        selectedList: [],
        selectAll: false
      }]
    }
  }
}

const shopList = ref<ShopInfoVo[]>([])

const getShopList = async () => {
  if (!checkPermissions(['R'])) {
    return
  }

  $q.loading.show()

  const type = selectedWorker.value.length > 0 ? 'worker' : selectedCompany.value.length > 0 ? 'company' : 'admin'
  const paramList = JSON.stringify(type === 'worker' ? selectedWorker.value.map(worker => worker.memberUuid) : type === 'company' ? selectedCompany.value.map(company => company.companyCode) : [])

  const data = await customFetch<ShopInfoVo[]>('/admin/handOrder/company/report/shop', {
    method: 'GET',
    params: {
      type,
      paramList
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (data !== null) {
    shopList.value = data
  }
  $q.loading.hide()
}

const visibleColumns = ref(['shopCode', 'shopName', 'shopStatus', 'corporate', 'startDate', 'installationDate', 'deviceCount', 'monthlyFare', 'totalFare', 'workerName'])

const saveFilter = () => {
  localStorage.setItem('companyReportFilter' + (userInfo.userType === 'admin' ? 'Admin' : ''), JSON.stringify(visibleColumns.value))
}

const loadFilter = () => {
  const reportFilter = localStorage.getItem('companyReportFilter' + (userInfo.userType === 'admin' ? 'Admin' : ''))
  if (reportFilter) {
    visibleColumns.value = JSON.parse(reportFilter)
  }
}

/* 표 복사, 엑셀 export */
// 표 내용 복사
const copyTable = () => {
  if (!checkPermissions(['DW'])) {
    return
  }

  const text = makeData('\t', '\n')

  navigator.clipboard.writeText(text)
    .then(() => {
      $q.notify({ type: 'positive', message: $t('COMPANY_REPORT.031') })
    })
    .catch((err) => {
      console.error(`${$t('COMPANY_REPORT.032')}:`, err)
      $q.notify({ type: 'negative', message: $t('COMPANY_REPORT.032') })
    })
}

// 표 전체 데이터 가공
const makeData = (colSeparator:string, rowSeparator:string) => {
  const cols = table.value?.visibleColumns?.values().toArray()
  cols?.unshift('index')

  const filteredCols = table.value?.columns?.filter(column => cols?.includes(column.name))

  const rows = table.value?.filteredSortedRows

  return filteredCols?.map(column => `"${column.label}"`).join(colSeparator) + rowSeparator +
  rows?.map(row => makeText(row, filteredCols, colSeparator)).join(rowSeparator)
}

// 개별 텍스트 가공
const makeText = (row: ShopInfoVo, cols: QTableProps['columns'], separator:string) => {
  return cols?.map((col) => {
    const field = col.field
    const format = col.format
    const val = typeof field === 'function' ? field(row) : typeof field === 'string' ? row[field] : undefined
    const formattedVal = format !== undefined ? format(val, row) : val
    if (val === null || val === undefined) {
      return '"-"'
    } else {
      return `"${formattedVal}"`
    }
  }).join(separator)
}
onMounted(async () => {
  await convertParentCompanyList()
  await setCompanyFilter((parentCompanyList.value?.length ?? 0) - 1)
  loadFilter()
  await getShopList()
})

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <div class="row justify-between">
        <span class="text-h5 text-bold">{{ $t('SIDE_MENU.004') }}</span>
        <div class="row">
          <div v-if="userInfo.userType === 'admin'">
            <q-btn
              :label="$t('COMPANY_REPORT.001')"
              class="q-mr-md"
              color="primary"
              @click="copyTable"
            />
          </div>
          <q-btn
            :label="$t('COMMON.021')"
            color="primary"
            @click="getShopList"
          />
        </div>
      </div>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col full-width column">
      <div class="row justify-between full-width" style="margin-bottom: 5px;">
        <div class="row">
          <div v-for="(company, index) in companyList" :key="index" class="row">
            <q-select
              v-if="index === 0 || (company.companyList.length > 0 && companyList[index-1].selectedList.length === 1)"
              v-model="company.selectedList"
              :label="`${$t('COMMON.022')} ${index+1} ${$t('COMMON.023')}`"
              :readonly="parentCompanyList && parentCompanyList[index] !== undefined"
              multiple
              outlined
              dense
              options-dense
              map-options
              :options="companyList[index].companyList"
              option-value="companySeq"
              option-label="companyName"
              style="min-width: 200px;"
              @update:model-value="setCompanyFilter(index)"
            >
              <template v-slot:before>
                <div style="padding-left:6px">
                  <q-icon
                    v-if="index !== 0"
                    name="chevron_right"
                    size="md"
                    color="grey"
                  />
                </div>
              </template>
              <template v-slot:selected>
                <div>
                  {{ company.selectedList.length > 0 ? `${company.selectedList[0].companyName} ${company.selectedList.length > 1 ? $t('COMMON.025', { count: company.selectedList.length-1 }) : ''}` : '' }}
                </div>
              </template>
              <template v-slot:after-options>
                <div class="">
                  <q-separator />
                  <q-checkbox
                    v-model="company.selectAll"
                    :label="$t('COMMON.024')"
                    @update:model-value="(val:boolean) => toggleSelectAll(index, val)"
                  />
                </div>
              </template>
            </q-select>
          </div>
          <q-separator v-if="workerList && workerList.length > 0" vertical inset spaced />
          <div>
            <q-select
              v-if="workerList && workerList.length > 0"
              v-model="selectedWorker"
              :label="$t('COMPANY_REPORT.002')"
              :options="workerList"
              option-value="memberUuid"
              option-label="userName"
              multiple
              outlined
              dense
              options-dense
              style="min-width: 180px; margin-left:5px"
            >
              <template v-slot:selected>
                <div>
                  {{ selectedWorker.length > 0 ? `${selectedWorker[0].userName} ${selectedWorker.length > 1 ? `${$t('COMMON.025', { count: selectedWorker.length-1 })}` : ''}` : '' }}
                </div>
              </template>
              <template v-slot:after-options>
                <div class="">
                  <q-separator />
                  <q-checkbox
                    v-model="selectAllWorkers"
                    :label="$t('COMMON.024')"
                  />
                </div>
              </template>
            </q-select>
          </div>
        </div>
      </div>
      <div class="total-box row justify-around full-width">
        <div class="total-item">
          <span class="text-h6 text-bold">{{ $t('COMPANY_REPORT.003') }} : </span>
          <span class="text-h6">{{ shopList.filter((shop) => shop.shopStatus === 'ACTIVE').length }}</span>
        </div>
        <div class="total-item">
          <span class="text-h6 text-bold">{{ $t('COMPANY_REPORT.004') }} : </span>
          <span class="text-h6">{{ shopList.filter((shop) => shop.shopStatus === 'PENDING').length }}</span>
        </div>
        <div class="total-item">
          <span class="text-h6 text-bold">{{ $t('COMPANY_REPORT.005') }} : </span>
          <span class="text-h6">{{ shopList.filter((shop) => shop.shopStatus === 'TERMINATE').length }}</span>
        </div>
      </div>
      <ClientOnly>
        <div class="content-item col column full-width">
          <q-table
            ref="table"
            v-model:pagination="pagination"
            flat
            bordered
            :rows="shopList"
            :columns="userInfo.userType === 'admin' ? adminColumns : columns"
            :visible-columns="visibleColumns"
            row-key="shopCode"
            virtual-scroll
            :rows-per-page-options="[0]"
            :no-data-label="$t('COMPANY.018')"
            class="full-width full-height sticky-header-table col"
            style="height:100%"
            hide-bottom
          >
            <template v-slot:top-left>
              <q-select
                v-model="visibleColumns"
                emit-value
                map-options
                multiple
                outlined
                dense
                options-dense
                :options="userInfo.userType === 'admin' ? adminColumns.filter(col => col.name !== 'index') : columns.filter(col => col.name !== 'index')"
                option-value="name"
                option-label="label"
                :display-value="$t('COMPANY_REPORT.006')"
                @update:model-value="saveFilter"
              />
            </template>
          </q-table>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped lang="scss">
.total-box{
  background: #ff8b4a ;
  padding: 5px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  margin-bottom: 5px;
}
.sticky-header-table{
  :deep(thead tr:first-child th) {
    // bg color is important for th; just specify one
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
