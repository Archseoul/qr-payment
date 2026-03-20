<script setup lang="ts">

import type { QTableProps } from 'quasar'
import { QSelect } from 'quasar'
import type { CompanyVo } from '~/types'

const props = defineProps<{
  companyCode: string
}>()

const myCompanyLevel = props.companyCode.length / 3

const { data: companyList } = await useCustomFetch<CompanyVo[]>(`/admin/handOrder/company/partner/${props.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const { data: companyInfo } = await useCustomFetch<CompanyVo>(`/admin/handOrder/company/${props.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

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
  headCompanySeq: companyInfo.value?.companySeq ?? 0,
  bankName: ''
})
const createPopup = ref(false) // 등록 팝업

const headCompanyList:any = ref([{
  label: '없음',
  value: 0
}])

const filterData = ref({
  companyLevel: 1,
  headCompanySeq: 0
})

const maxCompanyLevel = ref(0)

const pagination = ref({
  rowsPerPage: 0
})
const filter = ref('') // 검색어
const columns:QTableProps['columns'] = [
  {
    name: 'companyCode',
    required: true,
    label: '협력사 코드',
    align: 'left',
    field: 'companyCode',
    sortable: true
  },
  {
    name: 'companyName',
    required: true,
    label: '협력사명',
    align: 'left',
    field: 'companyName',
    sortable: true
  },
  {
    name: 'ownerName',
    required: true,
    label: '대표자명',
    align: 'left',
    field: 'ownerName',
    sortable: true
  },
  {
    name: 'managerName',
    required: true,
    label: '담당자명',
    align: 'left',
    field: 'managerName',
    sortable: true
  }
]

const rowData = ref({
  data: companyList.value?.filter((key:CompanyVo) => key.companyCode.length === filterData.value.companyLevel * 3 + props.companyCode.length)
})
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
    headCompanySeq: companyInfo.value?.companySeq ?? 0,
    bankName: ''
  }
  headCompanyListUpdate()
  createPopup.value = true
}

const submitCompany = async () => {
  if (company.value.headCompanySeq === 0) {
    company.value.headCompanySeq = companyInfo.value?.companySeq ?? 0
  }
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
  filterList()
}
const getMaxCompanyLevel = () => {
  const chunkSize = 3
  const maxCompanyCode = companyList.value?.map((company:CompanyVo) => company.companyCode).reduce((a, b) => a.length > b.length ? a : b)
  let depth = 0
  if (maxCompanyCode == null || maxCompanyCode === undefined) { return }
  for (let i = 0; i < maxCompanyCode.length; i += chunkSize) {
    const chunk = maxCompanyCode.substring(i, i + chunkSize)
    if (chunk.length !== chunkSize) {
      break
    }
    depth++
  }
  maxCompanyLevel.value = depth - myCompanyLevel
}

getMaxCompanyLevel()

const filterList = () => {
  const filterList = {
    value: companyList.value?.filter((key:CompanyVo) => key.companyCode.length === filterData.value.companyLevel * 3 + props.companyCode.length)
  }
  if (filterData.value.headCompanySeq !== 0) { filterList.value = filterList.value?.filter((key:CompanyVo) => key.headCompanySeq === filterData.value.headCompanySeq) }
  rowData.value.data = filterList.value
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const childCompanyList:QTableProps['onRowClick'] = (evt, row, index) => {
  const childCompanyLevel = row?.companyCode.length / 3 - myCompanyLevel + 1
  filterData.value.companyLevel = childCompanyLevel
  filterData.value.headCompanySeq = row?.companySeq
  filterList()
}

const createCompanyLevel = ref(1)

const headCompanyListUpdate = () => {
  const filterCompanyList = {
    value: companyList.value?.filter((key:CompanyVo) => key.companyCode.length === (createCompanyLevel.value) * 3 + props.companyCode.length).map(i => ({ label: i.companyName, value: i.companySeq }))
  }
  filterCompanyList.value?.unshift({
    label: companyInfo.value?.companyName ?? '',
    value: companyInfo.value?.companySeq ?? 0
  })
  headCompanyList.value = filterCompanyList.value
}

</script>

<template>
  <div class="row justify-between">
    <div class="row">
      <q-select
        v-model="filterData.companyLevel"
        :options="[...Array(maxCompanyLevel).keys()].map(i => ({ label: `${i + 1}차`, value: i + 1 }))"
        label="협력사 구분"
        class="q-mb-md"
        style="width: 200px"
        outlined
        emit-value
        map-options
        @update:model-value="filterList"
      />
      <template v-if="filterData.companyLevel > 1">
        <q-select
          v-model="filterData.headCompanySeq"
          label="상위 협력사"
          class="q-ml-md"
          style="width: 200px"
          outlined
          emit-value
          map-options
          :options="companyList.filter((key:CompanyVo) => key.companyCode.length === (filterData.companyLevel - 1) * 3 + companyCode.length).map(i => ({ label: i.companyName, value: i.companySeq }))"
          @update:model-value="filterList"
        >
          <template v-slot:append>
            <q-icon v-if="filterData.headCompanySeq !== 0" name="close" class="cursor-pointer" @click.stop.prevent="filterData.headCompanySeq = 0;filterList()" />
          </template>
        </q-select>
      </template>
    </div>
    <div>
      <q-btn label="협력사 등록" color="primary" class="q-mt-md" @click="createCompany" />
    </div>
  </div>
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
    no-data-label="등록된 협력사가 없습니다."
    @row-click="childCompanyList"
  />

  <q-dialog v-model="createPopup" presistent>
    <q-card style="width: 800px">
      <q-card-section>
        <div class="text-h6 text-bold">
          협력사 등록
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="submitCompany">
          <q-select v-model="createCompanyLevel" label="협력사 구분" :options="[...Array(maxCompanyLevel).keys()].map(i => ({ label: `${i + 1}`, value: i + 1 }))" @update:model-value="headCompanyListUpdate" />
          <q-select v-model="company.headCompanySeq" label="상위 협력사" :options="headCompanyList" emit-value map-options />
          <q-separator class="q-my-lg" />
          <q-input v-model="company.companyName" label="협력사명" :rules="[val => val && val.length > 0 || '협력사명을 입력해주세요']" />
          <q-input v-model="company.companyType" label="업종" :rules="[val => val && val.length > 0 || '업종을 입력해주세요']" />
          <q-input v-model="company.ownerName" label="대표자명" :rules="[val => val && val.length > 0 || '대표자명을 입력해주세요']" />
          <q-input v-model="company.startDate" label="거래 시작일" :rules="[val => val && val.length > 0 || '거래 시작일을 입력해주세요']" />
          <q-input v-model="company.endDate" label="거래 종료일" :rules="[val => val && val.length > 0 || '거래 종료일을 입력해주세요']" />
          <q-input v-model="company.businessStatus" label="업태" :rules="[val => val && val.length > 0 || '업태를 입력해주세요']" />
          <q-input v-model="company.managerName" label="담당자명" :rules="[val => val && val.length > 0 || '담당자명을 입력해주세요']" />
          <q-input v-model="company.managerPhone" label="담당자 연락처" :rules="[val => val && val.length > 0 || '담당자 연락처를 입력해주세요']" />
          <q-input v-model="company.managerEmail" label="담당자 이메일" :rules="[val => val && val.length > 0 || '담당자 이메일을 입력해주세요']" />
          <q-input v-model="company.accountNumber" label="계좌번호" />
          <q-input v-model="company.bankName" label="은행명" />
          <div class="q-my-lg">
            <q-btn label="등록" color="primary" class="q-my-md float-right" type="submit" />
            <q-btn label="취소" color="grey-5" class="q-my-md float-right q-mr-md" @click="createPopup = false" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
