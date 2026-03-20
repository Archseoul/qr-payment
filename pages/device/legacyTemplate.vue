<script setup lang="ts">
import { QTable, useQuasar } from 'quasar'
import TemplateAddModal from '~/components/TemplateAddModal.vue'
import { customFetch } from '~/composables/customFetch'
import { LabelTemplateClass } from '~/classes/LabelTemplateClass'
import { useCustomFetch } from '#imports'
import type { ShopInfoVo } from '~/types'
import MultipleShopSelectModal from '~/components/device/template/MultipleShopSelectModal.vue'
import TemplateUpdateModal from '~/components/TemplateUpdateModal.vue'

const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const openTemplateAddModal = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  $q.dialog({
    component: TemplateAddModal
  }).onOk(async () => {
    await labelTemplateData.refresh()
    initialTableDataLoad()
  })
}
const loading = ref(true)
const searchInput = ref('')
const stringFilter = ref('')
const inputToFilter = () => {
  stringFilter.value = searchInput.value
}
const templateList = ref<LabelTemplateClass[]>([])
const paginationOption = ref({
  sortBy: 'labelTemplateSeq',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 10
})
const table = ref<QTable | null>(null)
const { page, rowsPerPage, sortBy, descending } = paginationOption.value
const filter = stringFilter.value
const startRow = (page - 1)
const fetchCount = rowsPerPage === 0 ? paginationOption.value.rowsNumber : rowsPerPage

const labelTemplateData = await useCustomFetch<LabelTemplateClass[]>('/admin/handOrder/labelTemplate', {
  method: 'GET',
  params: {
    startRow,
    fetchCount,
    filter,
    sortBy,
    descending
  }
})

const { data } = labelTemplateData

const { data: shopInfo } = await useCustomFetch<ShopInfoVo[]>('/admin/handOrder/v2/shop', {
  method: 'GET'
})

const templateTypeRecords: Record<string, string> = {
  DEFAULT_SMALL: $t('COMMON.078'),
  WHITE: $t('DEVICE_TEMPLATE.001'),
  BLACK: $t('DEVICE_TEMPLATE.002'),
  CUSTOM_SMALL: $t('DEVICE_TEMPLATE.003'),
  DEFAULT: $t('COMMON.078'),
  KIOSK: $t('DEVICE_TEMPLATE.004'),
  TABLE: $t('DEVICE_TEMPLATE.005'),
  IMAGE: $t('DEVICE_TEMPLATE.006'),
  CUSTOM: $t('DEVICE_TEMPLATE.003'),
  '': $t('DEVICE_TEMPLATE.007')
}
const columns: QTable['columns'] = [{
  name: 'templateName',
  label: $t('DEVICE_QR.039'),
  field: 'templateName'
}, {
  name: 'deviceType',
  label: $t('DEVICE_TEMPLATE.008'),
  field: (row: LabelTemplateClass) => `${row.deviceType} ${$t('DEVICE_TEMPLATE.026')}`
}, {
  name: 'templateType',
  label: $t('DEVICE_TEMPLATE.009'),
  field: (row: LabelTemplateClass) => templateTypeRecords[row.smallTemplateType ?? row.bigTemplateType ?? '']
}, {
  name: 'storeCount',
  label: $t('DEVICE_TEMPLATE.010'),
  field: 'shopCount'
}, {
  name: 'applyToShop',
  label: $t('DEVICE_TEMPLATE.012'),
  field: 'labelTemplateSeq',
  align: 'center'
}, {
  name: 'manage',
  label: $t('DEVICE_TEMPLATE.013'),
  field: 'templateName',
  align: 'center'
}]
const initialRowsNumberData = await useCustomFetch<number>('/admin/handOrder/labelTemplate/rowsNumber', {
  method: 'GET',
  params: {
    filterString: filter
  }
})
const getRowsNumber = async (filter: string) => {
  return await customFetch<number>('/admin/handOrder/labelTemplate/rowsNumber', {
    method: 'GET',
    params: {
      filterString: filter
    },
    onResponse (_context) {
    }
  })
}

const fetchLabelTemplateList = async (startRow: number, fetchCount: number, filter: string, sortBy: string, descending: boolean) => {
  return await customFetch<LabelTemplateClass[]>('/admin/handOrder/labelTemplate', {
    method: 'GET',
    params: {
      startRow,
      fetchCount,
      filter,
      sortBy,
      descending
    }
  })
}
const initialTableDataLoad = () => {
  templateList.value.splice(0, templateList.value.length, ...data.value?.map(x => new LabelTemplateClass(x)) ?? [])
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
  const returnedData = await fetchLabelTemplateList(startRow, fetchCount, filter, sortBy, descending)
  templateList.value.splice(0, templateList.value.length, ...returnedData.map(x => new LabelTemplateClass(x)) ?? [])
  paginationOption.value.page = page
  paginationOption.value.rowsPerPage = rowsPerPage
  paginationOption.value.sortBy = sortBy
  paginationOption.value.descending = descending

  loading.value = false
}

const selected = ref<LabelTemplateClass[]>([])
const applyLabelTemplateToShops = async (labelTemplateSeq: number, shopList: ShopInfoVo[]) => {
  await customFetch('/admin/handOrder/labelTemplate/applyToShop', {
    method: 'POST',
    params: { labelTemplateSeq },
    body: shopList,
    onResponse (context) {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_TEMPLATE.014'),
          color: 'positive',
          icon: 'check'
        })
      }
    }
  }).catch(() => {
    $q.notify({
      message: $t('DEVICE_TEMPLATE.015'),
      color: 'negative',
      icon: 'close'
    })
  })
}
const openMultipleShopSelectModal = (labelTemplateSeq: number) => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: MultipleShopSelectModal,
    componentProps: {
      shopList: shopInfo.value ?? [],
      labelTemplateSeq
    }
  }).onOk(async (selectedShops: ShopInfoVo[]) => {
    $q.loading.show()
    await applyLabelTemplateToShops(labelTemplateSeq, selectedShops)
    $q.loading.hide()
    await labelTemplateData.refresh()
    initialTableDataLoad()
  })
}
paginationOption.value.rowsNumber = initialRowsNumberData.data.value ?? 0

const deleteTemplate = () => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    title: $t('DEVICE_TEMPLATE.016'),
    message: $t('DEVICE_TEMPLATE.018'),
    ok: $t('COMMON.007'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    const labelTemplateSeqs = selected.value.map(x => x.labelTemplateSeq)
    await customFetch('/admin/handOrder/labelTemplate', {
      method: 'DELETE',
      body: labelTemplateSeqs,
      onResponse: async (context) => {
        if (context.response.status === 200) {
          $q.notify({
            message: $t('DEVICE_TEMPLATE.019'),
            color: 'positive',
            icon: 'check'
          })
          await labelTemplateData.refresh()
          initialTableDataLoad()
        } else {
          $q.notify({
            message: $t('DEVICE_TEMPLATE.020'),
            color: 'negative',
            icon: 'close'
          })
        }
      }
    }).catch(() => {
      $q.notify({
        message: $t('DEVICE_TEMPLATE.020'),
        color: 'negative',
        icon: 'close'
      })
    })
  })
}

const openTemplateUpdateModal = (template: LabelTemplateClass) => {
  $q.dialog({
    component: TemplateUpdateModal,
    componentProps: {
      template
    }
  }).onOk(async () => {
    await labelTemplateData.refresh()
    initialTableDataLoad()
  })
}
initialTableDataLoad()
</script>
<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('DEVICE_TEMPLATE.021') }}</span>
      <div class="row full-width justify-end">
        <q-btn :label="$t('DEVICE_TEMPLATE.016')" color="primary" class="q-mt-md q-mr-sm float-right" @click="deleteTemplate" />
        <q-btn :label="$t('DEVICE_TEMPLATE.022')" color="primary" class="q-mt-md float-right" @click="openTemplateAddModal" />
      </div>
      <q-separator class="q-my-md" />
    </div>
    <div class="content-body col">
      <q-scroll-area class="full-height q-pr-md">
        <q-table
          ref="table"
          v-model:pagination="paginationOption"
          v-model:selected="selected"
          :filter="stringFilter"
          :rows="templateList"
          :columns="columns"
          row-key="labelTemplateSeq"
          :loading="loading"
          binary-state-sort
          selection="multiple"
          @request="onTableDataRequest"
        >
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
          <template v-slot:body-cell-applyToShop="props">
            <q-td :props="props">
              <q-btn
                color="primary"
                :label="$t('COMMON.077')"
                flat
                @click="openMultipleShopSelectModal(props.row.labelTemplateSeq)"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-manage="props">
            <q-td :props="props">
              <q-btn
                color="grey"
                :label="$t('DEVICE_TEMPLATE.023')"
                flat
                @click="openTemplateUpdateModal(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-scroll-area>
    </div>
  </div>
</template>
