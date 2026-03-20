<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QTable } from 'quasar'
import type { HandOrderLabelStatusVo } from '~/types'

defineProps<{
  labelStatus: HandOrderLabelStatusVo[] | null
  loading: boolean
}>()
defineEmits<{
  refresh: []
}>()
const filterString = ref('')

const columns:QTableProps['columns'] = [
  {
    name: 'labelCode',
    label: '라벨 코드',
    field: 'labelCode',
    sortable: true,
    align: 'left'
  },
  {
    name: 'stationCode',
    label: '스테이션 코드',
    field: 'stationCode',
    sortable: true
  },
  {
    name: 'status',
    label: '상태',
    field: 'status',
    sortable: true
  },
  {
    name: 'statusUpdateTime',
    label: '상태 업데이트 시간',
    field: 'statusUpdateTime',
    sortable: true
  },
  {
    name: 'qrName',
    label: '표시중인 QR',
    field: (row:HandOrderLabelStatusVo) => {
      if (row.articleList.length === 0) {
        return '없음'
      } else {
        return row.articleList[0].id
      }
    },
    sortable: true
  },
  {
    name: 'url',
    label: 'QR URL',
    field: (row:HandOrderLabelStatusVo) => {
      if (row.articleList.length === 0) {
        return '없음'
      } else {
        return row.articleList[0].nfc
      }
    },
    sortable: true,
    align: 'center'
  },
  {
    name: 'shopCode',
    label: 'QR 매장 코드',
    field: (row:HandOrderLabelStatusVo) => {
      if (row.articleList.length === 0) {
        return '없음'
      } else {
        return row.articleList[0].reservedOne
      }
    },
    sortable: true
  },
  {
    name: 'signalStrength',
    label: '신호 세기',
    field: (row:HandOrderLabelStatusVo) => {
      return row.sLabelStatus.signalStrength
    },
    sortable: true
  },
  {
    name: 'battery',
    label: '배터리 상태',
    field: (row:HandOrderLabelStatusVo) => {
      return row.sLabelStatus.battery
    },
    sortable: true
  },
  {
    name: 'updateStatus',
    label: '업데이트 상태',
    field: (row:HandOrderLabelStatusVo) => {
      return row.sLabelStatus.updateStatus
    },
    sortable: true
  },
  {
    name: 'aliveStatus',
    label: '활성화 상태',
    field: (row:HandOrderLabelStatusVo) => {
      return row.sLabelStatus.aliveStatus
    },
    sortable: true
  },
  {
    name: 'temperature',
    label: '온도',
    field: (row:HandOrderLabelStatusVo) => {
      return row.sLabelStatus.temperature
    },
    sortable: true
  }
]
const expanded = ref(true)
const visibleColumns = ref(['labelCode', 'status', 'signalStrength', 'qrName', 'updateStatus', 'aliveStatus'])
const table = ref<QTable|null>(null)
const paginationOption = ref({
  sortBy: 'index',
  descending: false,
  page: 1,
  rowsPerPage: 10
})
const maxPages = computed(() => Math.ceil((table.value?.computedRowsNumber ?? 0) / paginationOption.value.rowsPerPage))
</script>

<template>
  <q-card>
    <q-card-section class="row text-center items-center justify-between text-bold text-h6 text-center">
      <div class="cursor-pointer" @click="expanded = !expanded">
        라벨 상태
      </div>
      <div>
        <q-btn
          color="primary"
          @click="$emit('refresh')"
        >
          새로고침
        </q-btn>
        <q-btn
          class="q-ml-sm"
          color="grey"
          round
          flat
          dense
          :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          @click="expanded = !expanded"
        />
      </div>
    </q-card-section>
    <q-separator />
    <q-slide-transition>
      <div v-show="expanded">
        <q-table
          ref="table"
          v-model:pagination="paginationOption"
          class="fit"
          flat
          :loading="loading"
          :loading-label="loading ? '로딩중...' : ''"
          :rows="labelStatus ?? []"
          row-key="labelCode"
          :columns="columns"
          hide-pagination
          :filter="filterString"
          :visible-columns="visibleColumns"
        >
          <template v-slot:top-right>
            <q-input
              v-model="filterString"
              debounce="300"
              placeholder="검색어를 입력하세요"
              dense
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
          <template v-slot:top-left>
            <q-select
              v-model="visibleColumns"
              multiple
              outlined
              dense
              options-dense
              :display-value="'표시할 정보 선택'"
              emit-value
              map-options
              :options="columns"
              option-value="name"
              options-cover
              style="min-width: 150px;"
            />
          </template>
          <template v-slot:bottom>
            <q-pagination
              v-model="paginationOption.page"
              class="justify-center fit"
              :max="maxPages"
            />
          </template>
        </q-table>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<style scoped lang="scss">

</style>
