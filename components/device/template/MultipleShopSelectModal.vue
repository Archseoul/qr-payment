<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QTable, useDialogPluginComponent, useQuasar } from 'quasar'
import type { ShopInfoVo } from '~/types'

const props = defineProps<{
  shopList: ShopInfoVo[] | undefined
  labelTemplateSeq: number
}>()
defineEmits([
  ...useDialogPluginComponent.emits
])
const $q = useQuasar()
const table = ref<QTable|null>(null)
const filterString = useState('filterString', () => '')
const shopTableData = props.shopList
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const cancelDialog = () => {
  onDialogCancel()
}

const columns:QTableProps['columns'] = [
  {
    name: 'shopName',
    label: $t('COMMON.027'),
    field: 'shopName',
    align: 'right'
  }
]

const paginationOption = ref({
  sortBy: 'shopSeq',
  descending: false,
  page: 1,
  rowsPerPage: 10
})
const maxPages = computed(() => Math.ceil((table.value?.computedRowsNumber ?? 0) / paginationOption.value.rowsPerPage))

const selected = ref<ShopInfoVo[]>([])
const assignShops = () => {
  $q.dialog({
    title: $t('DEVICE_TEMPLATE.012'),
    message: $t('DEVICE_TEMPLATE.054'),
    ok: $t('COMMON.077'),
    cancel: $t('COMMON.005')
  }).onOk(() => {
    onDialogOK(selected.value)
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <div class="q-ma-sm">
        <q-table
          ref="table"
          v-model:pagination="paginationOption"
          v-model:selected="selected"
          :title="$t('COMMON.097')"
          flat
          :rows="(shopTableData as ShopInfoVo[])"
          :columns="columns"
          row-key="shopSeq"
          rows-per-page-label="10"
          hide-pagination
          :rows-per-page-options="[]"
          :filter="filterString"
          selection="multiple"
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
      <q-card-actions align="right">
        <q-btn
          flat
          :label="$t('COMMON.005')"
          color="primary"
          @click="cancelDialog"
        />
        <q-btn
          flat
          :label="$t('COMMON.077')"
          color="primary"
          @click="assignShops"
        />
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
