<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QTable, useDialogPluginComponent } from 'quasar'
import type { ShopInfoVo } from '~/types'
import ShopTableData from '~/classes/ShopTableDataVo'

const props = defineProps<{
  shopList: ShopInfoVo[] | undefined
  routeString: string
}>()

defineEmits([
  ...useDialogPluginComponent.emits
])

const table = ref<QTable|null>(null)
const filterString = useState('filterString', () => '')
const router = useRouter()

// shopList가 undefined일 경우 빈 배열 처리
const shopTableData = computed(() => {
  if (!props.shopList || !Array.isArray(props.shopList)) {
    return []
  }
  return props.shopList.map((shopInfoVo, index) => new ShopTableData(index, shopInfoVo))
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const cancelDialog = () => {
  router.back()
  onDialogCancel()
}

const columns:QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    field: 'index'
  },
  {
    name: 'shopName',
    label: $t('COMMON.027'),
    field: 'shopName',
    align: 'right'
  }
]

const paginationOption = ref({
  sortBy: 'index',
  descending: false,
  page: 1,
  rowsPerPage: 10
})
const maxPages = computed(() => Math.ceil((table.value?.computedRowsNumber ?? 0) / paginationOption.value.rowsPerPage))
</script>

<template>
  <q-dialog
    ref="dialogRef"
    no-backdrop-dismiss
    no-esc-dismiss
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <div class="q-ma-sm">
        <q-table
          ref="table"
          v-model:pagination="paginationOption"
          :title="$t('COMMON.097')"
          flat
          :rows="shopTableData"
          :columns="columns"
          row-key="index"
          rows-per-page-label="10"
          hide-pagination
          :rows-per-page-options="[]"
          :filter="filterString"
          :no-data-label="$t('COMMON.113')"
        >
          <template v-slot:top-right>
            <q-input
              v-model="filterString"
              debounce="300"
              :placeholder="$t('COMMON.076')"
              dense
              clearable
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
          <template v-slot:body-cell-shopName="rowData">
            <q-td :props="rowData">
              <NuxtLink class="nuxt_button" :to="`${routeString}${rowData.row.shopCode}`">
                {{ rowData.row.shopName }}
              </NuxtLink>
            </q-td>
          </template>
          <template v-slot:bottom>
            <q-pagination
              v-model="paginationOption.page"
              :max="maxPages"
              :min="1"
              :max-pages="9"
              :direction-links="true"
              :boundary-numbers="true"
              :ellipses="true"
              size="10px"
              class="justify-center fit"
            />
          </template>
          <template v-slot:no-data>
            <div class="text-center q-pa-md">
              {{ $t('COMMON.113') }}
            </div>
          </template>
        </q-table>
      </div>
      <q-card-actions align="right">
        <q-btn
          flat
          :label="$t('COMMON.005')"
          color="primary"
          @click="cancelDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
@import 'assets/variables.scss';
.nuxt_button {
  text-decoration: none;
  background-color: $handorder-color;
  color: white;
  width: fit-content;
  justify-content: center;
  align-items: center;
  padding: 0.4rem 0.6rem;
  border-radius: 0.25rem;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}
</style>
