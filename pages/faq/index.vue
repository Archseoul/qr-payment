<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QTable } from 'quasar'
import type { Ref } from 'vue'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import useDayjs from 'dayjs'
import { customFetch } from '~/composables/customFetch'
import type { HoNoticeVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'
import { useAuthStore } from '~/store/auth'

const { checkPermissions } = useCheckPermissions()
const $q = useQuasar()
const dayjs = useDayjs
dayjs.extend(customParseFormat)
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const router = useRouter()
const searchInput = ref('')
const stringFilter = ref('')

const inputToFilter = () => {
  stringFilter.value = searchInput.value
}

const table:Ref<QTable | null> = ref(null)
const loading = ref(true)
const noticeList = ref<HoNoticeVo[]>([])

const paginationOption = ref({
  sortBy: 'index',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10
})
const maxPages = computed(() => Math.ceil((table.value?.computedRowsNumber ?? 0) / paginationOption.value.rowsPerPage))
const columns:QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    field: (row:HoNoticeVo) => (paginationOption.value.page - 1) * 10 + (noticeList.value.indexOf(row) + 1),
    style: 'width: 80px'
  },
  { name: 'boardTitle', label: $t('COMMON.087'), field: 'boardTitle', sortable: true, align: 'left' },
  {
    name: 'createDt',
    label: $t('COMMON.088'),
    field: (row:HoNoticeVo) => dayjs(row.createDt).format('YYYY-MM-DD'),
    sortable: true,
    style: 'width: 120px'
  }
]
const getRowsNumber = async (filter:string) => {
  return await customFetch<number>('/admin/handOrder/notice/rowsNumber', {
    method: 'GET',
    params: {
      filterString: filter,
      boardType: 'FAQ'
    }
  })
}
const fetchNoticeList = async (startRow:number, fetchCount:number, filter:string, sortBy:string, descending:boolean) => {
  return await customFetch<HoNoticeVo[]>('/admin/handOrder/notice', {
    method: 'GET',
    params: {
      startRow,
      fetchCount,
      filter,
      sortBy,
      descending,
      boardType: 'FAQ'
    }
  })
}

const { page, rowsPerPage, sortBy, descending } = paginationOption.value
const filter = stringFilter.value
loading.value = true
const initialRowsNumberData = await useCustomFetch<number>('/admin/handOrder/notice/rowsNumber', {
  method: 'GET',
  params: {
    filterString: filter,
    boardType: 'FAQ'
  }
})
paginationOption.value.rowsNumber = initialRowsNumberData.data.value ?? 0
const fetchCount = rowsPerPage === 0 ? paginationOption.value.rowsNumber : rowsPerPage
const startRow = (page - 1) * rowsPerPage
const { data } = await useCustomFetch<HoNoticeVo[]>('/admin/handOrder/notice', {
  method: 'GET',
  params: {
    startRow,
    fetchCount,
    filter,
    sortBy,
    descending,
    boardType: 'FAQ'
  }
})
const initialTableDataLoad = () => {
  noticeList.value.splice(0, noticeList.value.length, ...data.value ?? [])
  paginationOption.value.page = page
  paginationOption.value.rowsPerPage = rowsPerPage
  paginationOption.value.sortBy = sortBy
  paginationOption.value.descending = descending

  loading.value = false
}
const onTableDataRequest = async (props: {
  pagination: {
    sortBy: string;
    descending: boolean;
    page: number;
    rowsPerPage: number;
  };
  filter?: string | any;
  getCellValue: (col: any, row: any) => any;
}) => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination
  const filter = stringFilter.value
  loading.value = true

  paginationOption.value.rowsNumber = await getRowsNumber(filter)
  const fetchCount = rowsPerPage === 0 ? paginationOption.value.rowsNumber : rowsPerPage
  const startRow = (page - 1) * rowsPerPage
  const returnedData = await fetchNoticeList(startRow, fetchCount, filter, sortBy, descending)
  noticeList.value.splice(0, noticeList.value.length, ...returnedData)
  paginationOption.value.page = page
  paginationOption.value.rowsPerPage = rowsPerPage
  paginationOption.value.sortBy = sortBy
  paginationOption.value.descending = descending

  loading.value = false
}

initialTableDataLoad()
const deleteNotice = (boardSeq:number) => {
  $q.loading.show()
  customFetch(`/admin/handOrder/notice/${boardSeq}`, {
    method: 'DELETE',
    params: {
      boardType: 'FAQ'
    }
  }).then(() => {
    $q.notify({
      message: $t('NOTICE.006'),
      color: 'positive',
      icon: 'check'
    })
    table.value?.requestServerInteraction()
  }).catch(() => {
    $q.notify({
      message: $t('NOTICE.007'),
      color: 'negative',
      icon: 'report_problem'
    })
  }).finally(() => {
    $q.loading.hide()
  })
}
const openDeleteConfirmDialog = (boardSeq:number | null) => {
  if (!checkPermissions(['D'])) {
    return
  }
  if (boardSeq === null) {
    return
  }
  $q.dialog({
    message: $t('NOTICE.008'),
    cancel: true,
    persistent: true
  }).onOk(() => {
    deleteNotice(boardSeq)
  })
}

const createFaq = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  router.push('/faq/create')
}

const updateFaq = (row:HoNoticeVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  router.push(`/faq/update-${row.boardSeq}`)
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">FAQ</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <q-scroll-area class="full-height q-pr-md">
        <q-table
          ref="table"
          v-model:pagination="paginationOption"
          :filter="stringFilter"
          :rows="noticeList"
          :columns="columns"
          row-key="boardSeq"
          :loading="loading"
          binary-state-sort
          @request="onTableDataRequest"
          @row-click="(evt, row, index) => $router.push(`/faq/${row.boardSeq}`)"
        >
          <template v-slot:top-right>
            <q-btn
              v-if="authStore.userInfo.userType === 'admin'"
              color="primary"
              @click="createFaq"
            >
              {{ $t('NOTICE.001') }}
            </q-btn>
          </template>
          <template v-slot:top-left>
            <q-input
              v-model="searchInput"
              :placeholder="$t('COMMON.076')"
              dense
              clearable
              @keyup.enter="inputToFilter"
            >
              <template v-slot:append>
                <q-btn @click="inputToFilter">
                  <q-icon name="search" />
                </q-btn>
              </template>
            </q-input>
          </template>
          <template v-slot:body="props">
            <q-tr class="cursor-pointer" :props="props" @click="() => props.expand = !props.expand">
              <q-td v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.value }}
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props">
              <q-td auto-width />
              <q-td>
                <div class="pre-box text-left">
                  {{ (props.row as HoNoticeVo).boardText }}
                </div>
              </q-td>
              <q-td auto-width>
                <q-btn
                  v-if="authStore.userInfo.userType === 'admin'"
                  size="sm"
                  color="primary"
                  outline
                  class="q-mr-sm"
                  @click="updateFaq(props.row)"
                >
                  {{ $t('COMMON.062') }}
                </q-btn>
                <q-btn
                  v-if="authStore.userInfo.userType === 'admin'"
                  size="sm"
                  color="negative"
                  @click="openDeleteConfirmDialog((props.row as HoNoticeVo).boardSeq ?? null)"
                >
                  {{ $t('COMMON.007') }}
                </q-btn>
              </q-td>
            </q-tr>
          </template>
          <template v-slot:bottom>
            <q-pagination
              v-model="paginationOption.page"
              :max="maxPages"
              boundary-links
              direction-links
              class="justify-center fit"
              @update:model-value="(val:number) => table?.setPagination({...table.pagination, page:val}, true)"
            />
          </template>
        </q-table>
      </q-scroll-area>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pre-box{
  white-space: pre-wrap;
  word-break: break-all;
}

</style>
