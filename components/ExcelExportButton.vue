<script setup lang="ts">
import * as XLSX from 'xlsx'

interface tableData {
  [key: string]: string
}

const props = defineProps<{
  content: tableData[],
  header: string[],
  skipHeader : boolean,
  fileName: string,
}>()

const exportExcel = () => {
  const excel = XLSX.utils.book_new()

  const excelContent = XLSX.utils.json_to_sheet(props.content, {
    header: props.header,
    skipHeader: props.skipHeader
  })

  XLSX.utils.book_append_sheet(excel, excelContent, 'Sheet1')

  const filePath = `${props.fileName}.xlsx`

  XLSX.writeFile(excel, filePath)
}

</script>

<template>
  <q-btn
    color="primary"
    :label="$t('HISTORY.011')"
    @click="exportExcel"
  />
</template>

<style scoped lang="scss">

</style>
