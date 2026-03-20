<script setup lang="ts">
import * as XLSX from 'xlsx'

import type { HoCategoryVo, HoMenuVo, ExcelImportDto, HoOptionGroupVo, ExcelOptionJsonVo, ExcelCategoryMenuJsonVo, ExcelOptionGroupJsonVo, HoOptionVo } from '~/types'

const $q = useQuasar()

const props = defineProps<{
  shopCode: string,
  shopSeq: number,
}>()

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const excelImportDto = ref<ExcelImportDto>({
  categoryMenuList: [],
  optionGroupList: [],
  optionList: []
})

const mappingWorkSheet = ref<XLSX.WorkSheet>({})

const menuList = ref<HoMenuVo[]>([])

const optionGroupList = ref<HoOptionGroupVo[]>([])

const file = ref<File>()

const confirmExcelImport = () => {
  if (!file.value) {
    $q.notify({
      message: $t('COMPANY.075'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  $q.dialog({
    title: $t('COMPANY.076'),
    message: `${$t('COMPANY.077')} <br/>${$t('COMPANY.078')}`,
    cancel: true,
    html: true
  })
    .onOk(saveExcelData)
}
const saveExcelData = async () => {
  $q.loading.show()

  await customFetch(`/admin/handOrder/shop/category/menu/excel/${props.shopCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(excelImportDto.value)
  }).catch((error) => { console.log(error) })
    .then(async () => {
      optionGroupList.value = await customFetch<HoOptionGroupVo[]>(`/admin/handOrder/shop/menu-option/${props.shopCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      menuList.value = await customFetch<HoCategoryVo[]>(`/admin/handOrder/shop/category/${props.shopCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(data => data.map((category:HoCategoryVo) => category.menus).flat())
    })
  importMappingData()

  $q.notify({
    message: $t('COMPANY.079'),
    color: 'positive',
    position: 'top'
  })
  $q.loading.hide()
  onDialogOK()
}

const convertExcelToJson = () => {
  if (!file.value) {
    return
  }
  const reader = new FileReader()
  reader.onload = (e:ProgressEvent<FileReader>) => {
    const data = e.target?.result

    const workbook = XLSX.read(data, { type: 'array' })
    workbook.SheetNames.forEach((sheetName) => {
      try {
        const worksheet = workbook.Sheets[sheetName]
        let categoryMenuJson:ExcelCategoryMenuJsonVo[] = []
        let optionGroupJson:ExcelOptionGroupJsonVo[] = []
        let optionJson:ExcelOptionJsonVo[] = []

        switch (sheetName) {
          case '카테고리-메뉴':
            categoryMenuJson = XLSX.utils.sheet_to_json(worksheet, { header: ['categoryName', 'menuName', 'menuPrice', 'menuDescription'] })
            excelImportDto.value.categoryMenuList = categoryMenuJson.filter((item:ExcelCategoryMenuJsonVo, index:number) => item.categoryName && item.menuName && index !== 0)
              .map((item:ExcelCategoryMenuJsonVo) => {
                return {
                  categoryName: item.categoryName,
                  menuName: item.menuName,
                  menuPrice: item.menuPrice ?? 0,
                  menuDescription: `"${item.menuDescription ?? ''}"`
                }
              })
            break

          case '옵션그룹':
            optionGroupJson = XLSX.utils.sheet_to_json(worksheet, { header: ['optionGroupName', 'optionUnique', 'optionRequired', 'doesReplace', 'minQty', 'maxQty'] })
            excelImportDto.value.optionGroupList = optionGroupJson.filter((item:ExcelOptionGroupJsonVo, index:number) => item.optionGroupName && index !== 0)
              .map((item:ExcelOptionGroupJsonVo) => {
                return {
                  optionGroupName: item.optionGroupName,
                  optionUnique: item.optionUnique,
                  optionRequired: item.optionRequired,
                  doesReplace: item.doesReplace,
                  isHidden: false,
                  shopCode: props.shopCode,
                  minQty: item.minQty ?? null,
                  maxQty: item.maxQty ?? null,
                  optionGroupUuid: '',
                  engOptionGroupName: '',
                  insDate: '',
                  insTid: '',
                  uptDate: '',
                  uptTid: '',
                  optionGroupVisibleName: '',
                  orderIndex: 0,
                  tempMenuSeq: 0,
                  isDeleted: false,
                  shopSeq: props.shopSeq,
                  optionList: [],
                  mappedOptionGroupCode: '',
                  mappedOptionGroupName: ''
                }
              })

            break

          case '옵션':
            optionJson = XLSX.utils.sheet_to_json(worksheet, { header: ['optionGroupName', 'optionName', 'optionPrice'] })
            excelImportDto.value.optionList = optionJson.filter((item:ExcelOptionJsonVo, index:number) => item.optionName && index !== 0)
              .map((item:ExcelOptionJsonVo):HoOptionVo => {
                return {
                  optionName: item.optionName,
                  optionGroupUuid: '',
                  optionPrice: item.optionPrice ?? 0,
                  shopCode: props.shopCode,
                  optionUuid: '',
                  orderIndex: 0,
                  insDate: '',
                  insTid: '',
                  uptDate: '',
                  uptTid: '',
                  engOptionName: '',
                  isDeleted: false,
                  isHidden: false,
                  mappedOptionCode: '',
                  mappedOptionName: '',
                  mappedOptionGroupCode: '',
                  optionGroupName: item.optionGroupName
                }
              })

            break

          case '매핑' :
            mappingWorkSheet.value = worksheet
            break

          default:
            break
        }
      } catch (error) {
        $q.notify({
          message: $t('COMPANY.080'),
          color: 'negative',
          position: 'top'
        })
        file.value = undefined
      }
    })
  }

  reader.readAsArrayBuffer(file.value)
}

const importMappingData = () => {
  const headerList = ['menuName']
  excelImportDto.value.optionGroupList.forEach((optionGroup:HoOptionGroupVo) => {
    headerList.push(optionGroupList.value.find((item:HoOptionGroupVo) => item.optionGroupName === optionGroup.optionGroupName)?.optionGroupUuid ?? '')
  })
  XLSX.utils.sheet_to_json(mappingWorkSheet.value, { header: headerList })
    .filter((item:any) => item.menuName)
    .forEach(async (item:any) => {
      const menu = menuList.value.find((menu:HoMenuVo) => menu.menuName === item.menuName)
      if (menu === undefined) {
        return
      }

      const optionGroupUuidList:string[] = []

      for (const key in item) {
        if (key !== '' && key !== 'menuName' && item[key]) {
          optionGroupUuidList.push(key)
        }
      }

      if (optionGroupUuidList.length !== 0) {
        await customFetch('/admin/handOrder/shop/option-mapping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            menuSeq: menu.menuSeq,
            optionGroupUuidList
          })
        }).catch((error) => { console.log(error) })
      }
    })
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <ClientOnly>
      <q-card style="width: 500px">
        <q-card-section class="text-h6 text-bold">
          {{ $t('COMPANY.081') }}
        </q-card-section>

        <q-card-section>
          <q-btn :label="$t('COMPANY.082')" color="grey-5" href="/ExcelImportTemplate.xlsx" target="_blank" />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div>
            <q-list dense>
              <q-item>
                <q-item-section>
                  <p>{{ $t('COMPANY.083') }}</p>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <p>{{ $t('COMPANY.084') }}</p>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <div>
            <q-file v-model="file" :label="$t('COMPANY.085')" accept=".xlsx" filled @update:model-value="convertExcelToJson" />
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            :label="$t('COMMON.005')"
            color="grey-5"
            @click="onDialogCancel"
          />
          <q-btn
            :label="$t('COMMON.009')"
            color="primary"
            @click="confirmExcelImport"
          />
        </q-card-actions>
      </q-card>
    </ClientOnly>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
