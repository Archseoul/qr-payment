<script setup lang="ts">
import type { Ref } from 'vue'
import type { QTableProps } from 'quasar'
import type { HoTableVo, ShopInfoVo } from '~/types'

interface TableRow {
  tableName: string;
  tableNumber: string;
}

const emit = defineEmits<(event: 'update:selected-table-seqs', value: string[] | []) => void>()

const shopInfo = inject<Ref<ShopInfoVo>>('shopInfo')

const tableList = inject<Ref<HoTableVo[]>>('tableList')

const checkTableList = () => {
  return tableList?.value
    ?.filter(tb => tb.delivery)
    .map(tb => ({
      tableName: tb.tableName,
      tableNumber: tb.tableNum
    })) || []
}

const selected = ref<TableRow[]|[]>(checkTableList())

const updateSelectedTable = () => {
  const updatedSeqs = tableList?.value
    ?.filter(table => selected.value.some(sel => sel.tableNumber === table.tableNum))
    .map(table => String(table.tableSeq)) || []

  emit('update:selected-table-seqs', updatedSeqs)
}

watch(selected, () => {
  updateSelectedTable()
})

// 배달 테이블 속성이 변경될 때만 체크박스 상태 업데이트
watch(() => tableList?.value?.map(tb => ({ tableNum: tb.tableNum, delivery: tb.delivery })), (newValue, oldValue) => {
  if (newValue && oldValue && newValue.length > 0) {
    const hasChanged = newValue.some((newTb, idx) => 
      !oldValue[idx] || newTb.delivery !== oldValue[idx].delivery
    )
    if (hasChanged) {
      selected.value = checkTableList()
    }
  }
}, { deep: true })

const tableColumns = ref<QTableProps['columns']>([
  {
    name: '테이블 이름',
    label: '테이블 이름',
    align: 'center',
    field: 'tableName',
    sortable: true
  },
  {
    name: '테이블 번호',
    label: '테이블 번호',
    align: 'center',
    field: 'tableNumber',
    sortable: true
  }
])

const rows = ref<TableRow[]>([])

onMounted(() => {
  if (tableList?.value) {
    tableList.value = [...tableList.value].sort((a, b) =>
      a.tableName.localeCompare(b.tableName, undefined, { numeric: true })
    )

    rows.value = tableList.value.map(table => ({
      tableName: table.tableName,
      tableNumber: table.tableNum
    }))
  }

  updateSelectedTable()

  if (!shopInfo?.value.isDeliveryUse) {
    selected.value = []
  }
})
</script>

<template>
  <div class="wrap">
    <div class="header">
      <p>배달 테이블 선택</p>
      <span>배달 주문을 받을 테이블을 선택할 수 있습니다.</span>
    </div>
    <div class="body">
      <q-table
        v-model:selected="selected"
        flat
        bordered
        :rows="rows"
        :columns="tableColumns"
        row-key="tableNumber"
        selection="multiple"
        style="height: 100%"
        dense
        class="no-footer"
        :pagination="{ rowsPerPage: 0 }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.wrap{
  height: 100%;
  .header{
    letter-spacing: -0.6px;
    p{
      font-size: 1.2em;
      font-weight: 700;
      margin: 0;
    }

    span{
      color: #AEAEAE;
      font-size: 0.8em;
    }
  }

  .body{
    padding-top: 10px;
    height: 85%;

    .disabled{
      pointer-events: none;
      opacity: 0.5;
    }
  }
}
:deep(.no-footer .q-table__bottom ){
  display: none;
}
</style>
