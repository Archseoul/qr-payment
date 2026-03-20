<script setup lang="ts">
import type { QTableProps } from 'quasar'
import type { CompanyVo } from '~/types'

const router = useRouter()

const company = ref<CompanyVo>({
  companySeq: 0,
  companyCode: '',
  companyName: '',
  companyType: '',
  ownerName: '',
  startDate: '',
  endDate: '',
  businessStatus: '',
  managerName: '',
  managerPhone: '',
  managerEmail: '',
  accountNumber: '',
  headCompanySeq: 0,
  bankName: '',
  businessType: '',
  businessNumber: '',
  accountHolder: '',
  headCompanyName: '',
  address1: '',
  address2: '',
  businessLicensePath: null,
  bankbookPath: null,
  bankbookFileName: null,
  businessLicenseFileName: null,
  pickupPgCode: null,
  servingPgCode: null
})
const createPopup = ref(false) // 등록 팝업

const pagination = ref({
  rowsPerPage: 0
})
const filter = ref('') // 검색어

const columns:QTableProps['columns'] = [
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
    name: 'ownerName',
    required: true,
    label: $t('COMPANY.027'),
    align: 'left',
    field: 'ownerName',
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
    name: 'headCompanyName',
    required: true,
    label: $t('COMPANY.008'),
    align: 'left',
    field: 'headCompanyName',
    sortable: true
  }
]

const { data: companyList } = await useCustomFetch<CompanyVo[]>('/admin/handOrder/company', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const rowData = ref({
  data: companyList.value
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const companyDetailPage:QTableProps['onRowClick'] = (evt, row, index) => {
  router.push(`/company/${row?.companyCode}`)
}

const createCompany = () => {
  company.value = {
    companySeq: 0,
    companyCode: '',
    companyName: '',
    companyType: '',
    ownerName: '',
    startDate: '',
    endDate: '',
    businessStatus: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    accountNumber: '',
    headCompanySeq: 0,
    bankName: '',
    businessType: '',
    businessNumber: '',
    accountHolder: '',
    headCompanyName: '',
    address1: '',
    address2: '',
    businessLicensePath: null,
    bankbookPath: null,
    bankbookFileName: null,
    businessLicenseFileName: null,
    pickupPgCode: null,
    servingPgCode: null
  }
  createPopup.value = true
}

const submitCompany = async () => {
  company.value.headCompanySeq = 1
  await customFetch('/admin/handOrder/company', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(company.value)
  })
  createPopup.value = false
  await refreshData()
}

const refreshData = async () => {
  const { data } = await useCustomFetch<CompanyVo[]>('/admin/handOrder/company', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  companyList.value = data.value
}

</script>

<template>
  <div class="main-content relative-position full-height">
    <span class="text-h5 text-bold">{{ $t('COMPANY.013') }}</span>
    <q-btn :label="$t('COMPANY.014')" color="primary" class="q-mt-md float-right" @click="createCompany" />

    <q-separator class="q-my-lg" />
    <q-table
      v-model:pagination="pagination"
      flat
      bordered
      :rows="rowData.data"
      :columns="columns"
      row-key="companyCode"
      virtual-scroll
      :rows-per-page-options="[0]"
      :filter="filter"
      hide-bottom
      :no-data-label="$t('COMPANY.018')"
      @row-click="companyDetailPage"
    />

    <q-dialog v-model="createPopup" presistent>
      <q-card style="width: 800px">
        <q-card-section>
          <div class="text-h6 text-bold">
            {{ $t('COMPANY.014') }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="submitCompany">
            <q-input v-model="company.companyName" :label="$t('COMPANY.003')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.companyType" :label="$t('COMPANY.028')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.ownerName" :label="$t('COMPANY.027')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.startDate" :label="$t('COMPANY.006')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.endDate" :label="$t('COMPANY.096')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.businessStatus" :label="$t('COMPANY.029')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.managerName" :label="$t('COMPANY.004')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.managerPhone" :label="$t('COMPANY.034')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.managerEmail" :label="$t('COMPANY.035')" :rules="[val => val && val.length > 0 || $t('COMPANY.015')]" />
            <q-input v-model="company.accountNumber" :label="$t('COMPANY.038')" />
            <q-input v-model="company.bankName" :label="$t('COMPANY.097')" />
            <div class="q-my-lg">
              <q-btn :label="$t('COMMON.034')" color="primary" class="q-my-md float-right" type="submit" />
              <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-my-md float-right q-mr-md" @click="createPopup = false" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="scss">

</style>
