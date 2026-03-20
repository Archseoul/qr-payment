<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import { isEmpty } from 'lodash-es'
import type { CompanyVo, CompanyStatusPutDto } from '~/types'
import CompanyCreateModal from '~/components/CompanyCreateModal.vue'
import { encrypt } from '~/utils/encrypt'
import { companyStatusCode } from '~/utils/code'

const router = useRouter()
const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const selected = ref<CompanyVo[]>([])

const pagination = ref({
  rowsPerPage: 0
})
const filter = ref('') // 검색어
const filterByCompanyName: QTableProps['filterMethod'] = (rows, terms) => {
  const keyword = String(terms ?? '')
    .trim()
    .toLowerCase()

  if (!keyword) { return rows }

  return rows.filter(row =>
    row.companyName?.toLowerCase().includes(keyword)
  )
}

const columns:QTableProps['columns'] = [
  {
    name: 'activeYn',
    required: true,
    label: $t('COMPANY.001'),
    align: 'left',
    field: 'activeYn',
    format: (val:string) => {
      const item = companyStatusCode.find(item => item.value === val)
      return item ? $t(item.label) : ''
    },
    sortable: true
  },
  {
    name: 'companyCode',
    required: true,
    label: $t('COMPANY.002'),
    align: 'left',
    field: 'companyCode',
    sortable: true
  },
  {
    name: 'companyName',
    required: true,
    label: $t('COMPANY.003'),
    align: 'left',
    field: 'companyName',
    sortable: true
  },
  {
    name: 'managerName',
    required: true,
    label: $t('COMPANY.004'),
    align: 'left',
    field: 'managerName',
    sortable: true
  },
  {
    name: 'documentRequired',
    required: true,
    label: $t('COMPANY.005'),
    align: 'left',
    field: 'businessNumber',
    format: (val:string) => isEmpty(val) ? 'X' : 'O',
    sortable: true
  },
  {
    name: 'startDate',
    required: true,
    label: $t('COMPANY.006'),
    align: 'left',
    field: 'startDate',
    sortable: true
  },
  {
    name: 'shopCount',
    required: true,
    label: $t('COMPANY.007'),
    align: 'left',
    field: 'shopCount',
    sortable: true
  },
  {
    name: 'headCompanyName',
    required: true,
    label: $t('COMPANY.008'),
    align: 'left',
    field: 'headCompanyName',
    sortable: true
  }
]

const companyListData = await useCustomFetch<CompanyVo[]>('/admin/handOrder/v2/company', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const companyList = companyListData.data

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const companyDetailPage:QTableProps['onRowClick'] = (evt, row, index) => {
  router.push(`/company/${row?.companyCode}`)
}

const setClipboardLink = () => {
  const encryptCode = encrypt(selected.value[0].companyCode)
  const link = `${window.location.origin}/signup/company/${encryptCode}`
  navigator.clipboard.writeText(link)
  $q.notify({
    type: 'positive',
    message: $t('COMPANY.009')
  })
}

const createCompany = () => {
  if (!checkPermissions(['C'])) {
    return
  }

  $q.dialog({
    component: CompanyCreateModal
  }).onOk(async () => {
    // refresh가 내부에서 clearNuxtData를 자동으로 호출
    await companyListData.refresh()
  })
}

const changeCompanyStatus = (status:string) => {
  let message:string = ''
  if (status === 'delete') {
    if (!checkPermissions(['D'])) {
      return
    }

    message = $t('COMPANY.010')
  } else {
    if (!checkPermissions(['U'])) {
      return
    }
    message = $t('COMPANY.011', { status: status === 'N' ? $t('COMMON.006') : $t('COMPANY.017') })
  }

  $q.dialog({
    title: $t('COMPANY.012'),
    message,
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    const reqeustBody:CompanyStatusPutDto[] = []
    selected.value.forEach((item) => {
      const requestObject:CompanyStatusPutDto = {
        companySeq: 0,
        activeYn: ''
      }

      requestObject.companySeq = item.companySeq
      requestObject.activeYn = status
      reqeustBody.push(requestObject)
    })

    await customFetch('/admin/handOrder/company/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: reqeustBody
    })

    // refresh가 내부에서 clearNuxtData를 자동으로 호출
    await companyListData.refresh()
  })
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('COMPANY.013') }}</span>
      <q-btn :label="$t('COMPANY.014')" color="primary" class="q-mt-md float-right" @click="createCompany" />
      <q-btn :label="$t('COMPANY.015')" color="primary" class="q-mt-md float-right q-mr-md" :disable="isEmpty(selected) || selected?.length > 1" @click="setClipboardLink" />
      <q-btn color="primary" :label="$t('COMPANY.016')" class="q-mt-md float-right q-mr-md" :disable="isEmpty(selected)">
        <q-menu auto-close>
          <q-list style="min-width: 100px">
            <q-item clickable @click="changeCompanyStatus('Y')">
              <q-item-section>{{ $t('COMPANY.017') }}</q-item-section>
            </q-item>
            <q-item clickable @click="changeCompanyStatus('N')">
              <q-item-section>{{ $t('COMMON.006') }}</q-item-section>
            </q-item>
            <q-item clickable @click="changeCompanyStatus('delete')">
              <q-item-section>{{ $t('COMMON.007') }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <q-table
        v-model:pagination="pagination"
        v-model:selected="selected"
        style="height: 100%"
        flat
        bordered
        :rows="companyList"
        :columns="columns"
        row-key="companyCode"
        virtual-scroll
        :rows-per-page-options="[0]"
        :filter="filter"
        :filter-method="filterByCompanyName"
        hide-bottom
        :no-data-label="$t('COMPANY.018')"
        :selection="isEmpty(filter) ? 'single':'multiple'"
        @row-click="companyDetailPage"
      >
        <template v-slot:top-left>
          <q-input v-model="filter" borderless dense debounce="300" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
