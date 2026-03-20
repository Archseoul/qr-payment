<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QTable, useDialogPluginComponent, useQuasar } from 'quasar'
import sortBy from 'lodash-es/sortBy'
import type { HoTableVo, LabelTemplateToTablesDto, ShopInfoVo } from '~/types'

const props = defineProps<{
  shopList: ShopInfoVo[] | undefined
  labelTemplateSeq: number
}>()
defineEmits([
  ...useDialogPluginComponent.emits
])
const $q = useQuasar()
const table = ref<QTable | null>(null)
const tableTable = ref<QTable | null>(null)
const shopSelected = ref<boolean>(false)
const filterString = useState('filterString', () => '')
const shopTableData = props.shopList
const tableTableData = ref<HoTableVo[]>([])
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const cancelDialog = () => {
  onDialogCancel()
}

const toggleShopSelected = () => {
  shopSelected.value = !shopSelected.value
}

const columns: QTableProps['columns'] = [
  {
    name: 'shopName',
    label: $t('COMMON.027'),
    field: 'shopName',
    align: 'right'
  }
]
const tableColumns: QTableProps['columns'] = [
  { name: 'tableNum', label: $t('DEVICE_QR.013'), field: 'tableNum', align: 'right' }
]

const paginationOption = ref({
  sortBy: 'shopSeq',
  descending: false,
  page: 1,
  rowsPerPage: 10
})
const tablePaginationOption = ref({
  rowsPerPage: 0
})
const maxPages = computed(() => Math.ceil((table.value?.computedRowsNumber ?? 0) / paginationOption.value.rowsPerPage))

const selectedShop = ref<ShopInfoVo[]>([])
const selectedTable = ref<HoTableVo[]>([])
const selectedDto = computed(():LabelTemplateToTablesDto => {
  return {
    shopInfoList: selectedShop.value,
    tableSeqList: selectedTable.value.map(table => table.tableSeq)
  }
})
const selectShop = async () => {
  if (selectedShop.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: $t('DEVICE_TEMPLATE.055')
    })
    return
  }
  try {
    tableTableData.value = await customFetch<HoTableVo[]>('/admin/handOrder/table/all', {
      method: 'GET',
      params: {
        shopSeqList: selectedShop.value.map(shop => shop.shopSeq)
      }
    })
    tableTableData.value = sortBy(tableTableData.value, ['tableSeq', 'tableNum'])
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: $t('DEVICE_TEMPLATE.056')
    })
    return
  }
  shopSelected.value = true
  selectedTable.value = []
}
const assignTables = () => {
  $q.dialog({
    title: $t('DEVICE_TEMPLATE.057'),
    message: $t('DEVICE_TEMPLATE.058'),
    ok: $t('COMMON.077'),
    cancel: $t('COMMON.005')
  }).onOk(() => {
    onDialogOK(selectedDto.value)
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <div class="column flex">
        <div v-if="!shopSelected" class="q-ma-sm">
          <q-table
            ref="table"
            v-model:pagination="paginationOption"
            v-model:selected="selectedShop"
            :title="$t('COMMON.097')"
            flat
            :rows="(shopTableData as ShopInfoVo[])"
            :columns="columns"
            row-key="shopSeq"
            rows-per-page-label="10"
            hide-pagination
            :rows-per-page-options="[]"
            :filter="filterString"
            selection="single"
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
          </q-table>
        </div>
        <div v-else class="q-ma-sm">
          <q-table
            ref="tableTable"
            v-model:selected="selectedTable"
            v-model:pagination="tablePaginationOption"
            :title="$t('DEVICE_QR.055')"
            flat
            :rows="tableTableData as HoTableVo[]"
            :columns="tableColumns"
            row-key="tableSeq"
            selection="multiple"
            virtual-scroll
            style="height: 600px;"
            hide-pagination
          />
        </div>
      </div>
      <q-card-actions align="right">
        <div v-if="!shopSelected">
          <q-btn
            flat
            :label="$t('COMMON.094')"
            color="primary"
            @click="cancelDialog"
          />
          <q-btn
            flat
            :label="$t('COMMON.023')"
            color="primary"
            @click="selectShop"
          />
        </div>
        <div v-else>
          <q-btn
            flat
            :label="$t('COMMON.100')"
            color="primary"
            @click="toggleShopSelected"
          />
          <q-btn
            flat
            :label="$t('COMMON.077')"
            color="primary"
            @click="assignTables"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
@import '~/assets/variables.scss';

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
