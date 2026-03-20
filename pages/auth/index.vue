<script setup lang="ts">
import type { QTableProps } from 'quasar'
import type { AuthVo } from '~/types'

const createAuthPopup = ref(false)
const detailAuthPopup = ref(false)
const authTab = ref('menu')

const { data: authList } = await useCustomFetch<AuthVo[]>('/admin/handOrder/auth', {
  method: 'GET'
})
const rowData = authList.value ?? [] as AuthVo[]

const authFilter = ref('')
const pagination = ref({
  rowsPerPage: 0
})
const authDetail = ref({
  authSeq: 0,
  authName: '',
  authCd: '',
  prevAuthSeq: '',
  createMemberUuid: '',
  shopSeq: 0,
  companySeq: 0,
  prevAuthName: '',
  companyName: '',
  menuAuthList: []
} as AuthVo)

const authColumns:QTableProps['columns'] = [
  {
    name: 'authName',
    required: true,
    label: $t('AUTH.001'),
    align: 'left',
    field: 'authName',
    sortable: true
  },
  {
    name: 'prevAuthName',
    required: true,
    label: $t('AUTH.002'),
    align: 'left',
    field: 'prevAuthName',
    sortable: true,
    format: (val:string) => `${val == null ? $t('AUTH.008') : val}`
  },
  {
    name: 'companyName',
    required: true,
    label: $t('AUTH.003'),
    align: 'left',
    field: 'companyName',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : val}`
  }
]

const menuAuthColumns:QTableProps['columns'] = [
  {
    name: 'menuName',
    required: true,
    label: $t('COMMON.033'),
    align: 'left',
    field: 'menuId',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : allMenuList.find(menu => menu.menuId === val)?.menuName}`
  },
  {
    name: 'menuAuth',
    required: true,
    label: $t('COMMON.103'),
    align: 'left',
    field: 'menuAuth',
    sortable: true
  }
]

const createAuth = () => {
  createAuthPopup.value = true
}
const detailAuth = (row:any) => {
  authTab.value = 'menu'
  detailAuthPopup.value = true
  authDetail.value = row
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-head">
      <span class="text-h5 text-bold">{{ $t('AUTH.004') }}</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <q-table
        v-model:pagination="pagination"
        :rows="rowData as AuthVo[]"
        :columns="authColumns"
        row-key="authSeq"
        :rows-per-page-options="[0]"
        hide-bottom
        style="height: 100%"
        virtual-scroll
        :filter="authFilter"
      >
        <template v-slot:top-right>
          <q-btn
            color="primary"
            :label="$t('AUTH.005')"
            @click="createAuth"
          />
        </template>
        <template v-slot:top-left>
          <q-input v-model="authFilter" dense debounce="300" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
        <template v-slot:header="slotProps">
          <q-tr :props="slotProps">
            <q-th
              v-for="col in slotProps.cols"
              :key="col.name"
              :props="slotProps"
              class="text-center"
            >
              {{ col.label }}
            </q-th>
            <q-th auto-width>
              {{ $t('AUTH.006') }}
            </q-th>
          </q-tr>
        </template>
        <template v-slot:body="slotProps">
          <q-tr :props="slotProps">
            <q-td
              v-for="col in slotProps.cols"
              :key="col.name"
              :props="slotProps"
            >
              {{ col.value }}
            </q-td>
            <q-td auto-width>
              <q-btn
                icon="description"
                color="primary"
                dense
                @click="detailAuth(slotProps.row)"
              />
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <q-dialog v-model="detailAuthPopup" persistent>
        <q-card style="width: 800px">
          <q-card-section class="row items-center">
            <div class="text-h6 text-bold">
              {{ $t('AUTH.007') }}
            </div>
            <q-space />
            <q-btn v-close-popup icon="close" flat round dense />
          </q-card-section>
          <q-separator />
          <q-card-section style="max-height: 70vh;" class="scroll">
            <div class="row">
              <div class="col-2">
                {{ $t('AUTH.002') }}
              </div>
              <q-separator vertical class="q-mr-md" />
              <div class="col-6">
                {{ authDetail.prevAuthName ?? $t('AUTH.008') }}
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div class="row">
              <div class="col-2">
                {{ $t('AUTH.001') }}
              </div>
              <q-separator vertical class="q-mr-md" />
              <div class="col-6">
                {{ authDetail.authName }}
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div class="row">
              <div class="col-2">
                {{ $t('AUTH.003') }}
              </div>
              <q-separator vertical class="q-mr-md" />
              <div class="col-6">
                {{ authDetail.companyName ?? '-' }}
              </div>
            </div>
            <q-separator class="q-mt-md" />
            <div>
              <q-tabs
                v-model="authTab"
                dense
                align="justify"
                active-class="text-handorder"
                content-class="text-grey-5"
              >
                <q-tab name="menu" icon="tune" :label="$t('SIDE_MENU.025')" />
                <q-tab name="member" icon="person" :label="$t('AUTH.009')" />
              </q-tabs>
            </div>
            <q-separator class="q-mb-md" />
            <div>
              <template v-if="authTab === 'menu'">
                <q-table
                  :data="authDetail.menuAuthList"
                  :columns="menuAuthColumns"
                  row-key="menuSeq"
                  hide-bottom
                  virtual-scroll
                  style="max-height: 300px;"
                />
                <q-separator class="q-my-md" />
                <div>
                  <q-btn
                    color="primary"
                    :label="$t('AUTH.010')"
                    @click="() => {}"
                  />
                </div>
              </template>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
<style>
.text-handorder{
  color: var(--handorder-color);
}
</style>
