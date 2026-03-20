<script setup lang="ts">

import type { QTableProps } from 'quasar'
import { QSelect } from 'quasar'
import type { AdminMemberVo, CompanyVo, ShopInfoVo } from '~/types'

const props = defineProps<{
  companyCode: string
}>()

const myCompanyLevel = props.companyCode.length / 3

const { data: companyMemberList } = await useCustomFetch<AdminMemberVo[]>(`/admin/handOrder/company/member/${props.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const { data: companyList } = await useCustomFetch<CompanyVo[]>(`/admin/handOrder/company/partner/${props.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const { data: companyInfo } = useCustomFetch<CompanyVo>(`/admin/handOrder/company/${props.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const filterData = ref({
  companyLevel: 1,
  companyCode: ''
})

const createCompanyLevel = ref(1)
const maxCompanyLevel = ref(0)
const filterCompanyList:any = ref([])

const getMaxCompanyLevel = () => {
  const chunkSize = 3
  const maxCompanyCode = companyList.value?.map((company:CompanyVo) => company.companyCode).reduce((a, b) => a.length > b.length ? a : b)
  let depth = 0
  if (maxCompanyCode == null) { return }
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
const memberPopup = ref(false)
const member:Ref<AdminMemberVo> = ref({
  memberUuid: '',
  id: '',
  password: '',
  userName: '',
  storeSeq: '',
  role: '',
  companySeq: 0,
  userType: '',
  email: '',
  companyCode: '',
  shopInfo: {} as ShopInfoVo
})
const partnerCompanyYn = ref(false)

const passwordConfirm = ref('')

const pagination = ref({
  rowsPerPage: 0
})
const selectedMember = ref([])

const userTypes = ref([
  {
    label: $t('MEMBER.003'),
    value: 'shop'
  },
  {
    label: $t('MEMBER.004'),
    value: 'company'
  }
])

const memberColumns:QTableProps['columns'] = [
  {
    name: 'id',
    required: true,
    label: $t('COMMON.018'),
    align: 'left',
    field: 'id',
    sortable: true
  },
  {
    name: 'userName',
    required: true,
    label: $t('COMMON.017'),
    align: 'left',
    field: 'userName',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : val}`
  },
  {
    name: 'email',
    required: true,
    label: $t('COMMON.019'),
    align: 'left',
    field: 'email',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : val}`
  },
  {
    name: 'userType',
    required: true,
    label: $t('MEMBER.011'),
    align: 'left',
    field: 'userType',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : userTypes.value.find(item => item.value === val)?.label} ${$t('COMPANY.065')}`
  }
]

const createMember = () => {
  filterList()
  partnerCompanyYn.value = false
  member.value = {
    memberUuid: '',
    id: '',
    password: '',
    userName: '',
    storeSeq: '',
    role: '',
    companySeq: 0,
    companyCode: '',
    userType: '',
    email: '',
    agreed: false,
    shopInfo: {} as ShopInfoVo
  }
  memberPopup.value = true
}

const submitMember = () => {
  if (member.value.userType === 'shop' && !partnerCompanyYn.value) {
    member.value.companySeq = companyInfo.value?.companySeq ?? 0
  }
  member.value.shopInfo.franchiseYn = 'Y'
  customFetch('/admin/handOrder/company/member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(member.value)
  }).then(() => {
    memberPopup.value = false
    refreshMemberList()
  })
}

const filterList = () => {
  const filterList = {
    value: companyList.value?.filter((key:CompanyVo) => key.companyCode.length === (createCompanyLevel.value) * 3 + props.companyCode.length).map(i => ({ label: i.companyName, value: i.companySeq }))
  }
  filterCompanyList.value = filterList.value
}

const refreshMemberList = async () => {
  const { data } = await useCustomFetch<AdminMemberVo[]>(`/admin/handOrder/company/member/${props.companyCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  companyMemberList.value = data.value
}

const selectedCompanyMember = async () => {
  companyMemberList.value = await customFetch<AdminMemberVo[]>(`/admin/handOrder/company/member/${filterData.value.companyCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

</script>

<template>
  <div class="row justify-between">
    <div class="row">
      <q-select
        v-model="filterData.companyLevel"
        :options="[...Array(maxCompanyLevel).keys()].map(i => ({ label: `${i + 1} ${$t('COMPANY.066')}`, value: i + 1 }))"
        :label="$t('COMPANY.067')"
        class="q-mb-md"
        style="width: 200px"
        outlined
        emit-value
        map-options
        @update:model-value="filterList"
      />
      <template v-if="filterData.companyLevel > 1">
        <q-select
          v-model="filterData.companyCode"
          :label="$t('COMPANY.068')"
          class="q-ml-md"
          style="width: 200px"
          outlined
          emit-value
          map-options
          :options="companyList.filter((key:CompanyVo) => key.companyCode.length === (filterData.companyLevel - 1) * 3 + companyCode.length).map(i => ({ label: i.companyName, value: i.companyCode }))"
          @update:model-value="selectedCompanyMember"
        >
          <template v-slot:append>
            <q-icon v-if="filterData.companyCode !== ''" name="close" class="cursor-pointer" @click.stop.prevent="filterData.companyCode = '';refreshMemberList()" />
          </template>
        </q-select>
      </template>
    </div>
    <div class="float-right q-mb-md">
      <q-btn
        color="primary"
        :label="$t('COMPANY.045')"
        @click="createMember"
      />
    </div>
  </div>
  <q-table
    v-model:pagination="pagination"
    v-model:selected="selectedMember"
    :rows="companyMemberList"
    :columns="memberColumns"
    row-key="memberUuid"
    style="max-height: 500px"
    virtual-scroll
    :rows-per-page-options="[0]"
    :filter="filter"
    hide-bottom
    flat
    bordered
    :no-data-label="$t('COMPANY.069')"
  />
  <q-dialog v-model="memberPopup" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('MEMBER.009') }}
        </div>
      </q-card-section>

      <q-separator />
      <q-form style="width: 500px" @submit="submitMember">
        <q-card-section style="max-height: 50vh" class="scroll">
          <q-toggle v-model="partnerCompanyYn" :options="userTypes" :label="$t('COMPANY.070')" />
          <template v-if="partnerCompanyYn">
            <div class="text-bold">
              {{ $t('COMPANY.071') }}
            </div>
            <q-select
              v-model="createCompanyLevel"
              :label="$t('COMPANY.067')"
              :options="[...Array(maxCompanyLevel).keys()].map(i => ({ label: `${i + 1}`, value: i + 1 }))"
              emit-value
              map-options
              @update:model-value="filterList"
            />
            <q-select v-model="member.companySeq" :label="$t('MEMBER.004')" :options="filterCompanyList" emit-value map-options />
          </template>
          <q-separator class="q-mt-lg q-mb-md" />
          <div class="text-bold">
            {{ $t('MEMBER.016') }}
          </div>
          <q-input
            v-model="member.id"
            :label="$t('COMMON.018')"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || $t('LOGIN.002')]"
            class="q-mb-sm input-width70"
            dense
          />
          <q-input
            v-model="member.password"
            :label="$t('LOGIN.003')"
            type="password"
            lazy-rules
            outlined
            :rules="[
              val => val && val.length > 0 || $t('LOGIN.004'),
              val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(val) || $t('COMPANY.064')
            ]"
            class="q-mb-md input-width70"
            dense
          />
          <q-input
            v-model="passwordConfirm"
            :label="$t('COMMON.048')"
            type="password"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || $t('LOGIN.004'), val => val === member.password || $t('COMPANY.063')]"
            class="q-mb-md input-width70"
            dense
          />
          <q-input
            v-model="member.userName"
            :label="$t('COMMON.017')"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || $t('COMPANY.059')]"
            class="q-mb-md input-width70"
            dense
          />
          <q-input
            v-model="member.email"
            :label="$t('COMMON.019')"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || $t('MEMBER.018')]"
            class="q-mb-md input-width70"
            dense
          />
          <q-select
            v-model="member.userType"
            :options="userTypes"
            :label="$t('MEMBER.011')"
            class="input-width70"
            emit-value
            map-options
          />
          <template v-if="member.userType == 'shop'">
            <q-separator class="q-mt-lg q-mb-md" />
            <div class="text-bold q-mb-lg">
              {{ $t('MEMBER.019') }}
            </div>
            <div>
              <q-input
                v-model="member.shopInfo.shopName"
                :label="$t('COMMON.027')"
                lazy-rules
                outlined
                :rules="[val => val && val.length > 0 || $t('MEMBER.020')]"
                class="q-mb-md input-width70"
                dense
              />
              <q-input
                v-model="member.shopInfo.address1"
                :label="$t('COMPANY.031')"
                lazy-rules
                outlined
                :rules="[val => val && val.length > 0 || $t('MEMBER.021')]"
                class="q-mb-md input-width70"
                dense
              />
              <q-select
                v-model="member.shopInfo.linkType"
                :options="linkType"
                :label="$t('MEMBER.022')"
                class="input-width70"
                emit-value
                map-options
              />
            </div>
          </template>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('COMMON.005')" color="red" />
          <q-btn flat :label="$t('COMMON.009')" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
