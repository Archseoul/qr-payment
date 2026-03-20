<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QTable, useQuasar } from 'quasar'
import type {
  HandOrderProductBatchPostDto,
  HoRandomMapVo,
  HoTableVo,
  LabelDataDto,
  LabelDto,
  LabelTemplateVo,
  ShopInfoVo
} from '~/types'
import { QrAddModal, QrLabelMapModal } from '#components'

const props = defineProps<{
  shopInfo: ShopInfoVo | null,
  hoRandomMap: HoRandomMapVo[] | null
  loading: boolean
  tableList: HoTableVo[] | null
}>()
const emits = defineEmits<{
  refresh: []
}>()
const config = useRuntimeConfig()
const { baseUrl } = config.public
const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()
const labelStatusPopup = ref(false)
const labelList:Ref<LabelDataDto[]> = ref([])
const filterString = ref('')
const labelTemplate = ref<LabelTemplateVo | null>(null)
const urlToTableNum = (url:string) => {
  return url.slice(url.lastIndexOf('/') + 1)
}
const getTableNum = (row:HoRandomMapVo) => {
  return Number(row.landingUrl.slice(row.landingUrl.lastIndexOf('/') + 1))
}
const columns:QTableProps['columns'] = [
  {
    name: 'tableNum',
    label: $t('DEVICE_QR.013'),
    field: getTableNum,
    sortable: true,
    style: 'width: 50px',
    align: 'left'
  },
  {
    name: 'tableName',
    label: $t('DEVICE_QR.014'),
    field: (row:HoRandomMapVo) => props.tableList?.find(table => table.tableNum === urlToTableNum(row.landingUrl))?.tableName,
    sortable: true,
    align: 'left'
  },
  {
    name: 'productId',
    label: $t('DEVICE_QR.015'),
    field: 'productId',
    sortable: true,
    align: 'left'
  },
  {
    name: 'landingUrl',
    label: $t('DEVICE_QR.016'),
    field: 'landingUrl',
    sortable: true,
    align: 'center'
  },
  {
    name: 'randomCode',
    label: $t('DEVICE_QR.017'),
    field: 'randomCode',
    sortable: true,
    align: 'center'
  },
  {
    name: 'storeCode',
    label: $t('COMMON.026'),
    field: 'storeCode'
  },
  {
    name: 'apply',
    label: $t('DEVICE_QR.019'),
    field: 'productId',
    style: 'width: 120px',
    align: 'center'
  },
  {
    name: 'renew',
    label: $t('DEVICE_QR.020'),
    field: 'productId',
    style: 'width: 120px',
    align: 'center'
  },
  {
    name: 'delete',
    label: $t('COMMON.007'),
    field: 'productId',
    style: 'width: 120px',
    align: 'center'
  }
]
const expanded = ref(false)
const table = ref<QTable|null>(null)
const paginationOption = ref({
  sortBy: 'index',
  descending: false,
  page: 1,
  rowsPerPage: 10
})
const maxPages = computed(() => Math.ceil((table.value?.computedRowsNumber ?? 0) / paginationOption.value.rowsPerPage))
const renewQr = async (productId: string) => {
  await customFetch('/admin/handOrder/qr/renew', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      shopSeq: props.shopInfo?.shopSeq,
      productId,
      stationCode: config.public.stationCode
    },
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_QR.021'),
          color: 'positive',
          icon: 'check'
        })
        emits('refresh')
      } else {
        $q.notify({
          message: $t('DEVICE_QR.022'),
          color: 'negative',
          icon: 'close'
        })
        emits('refresh')
      }
    }
  })
}
const renewAllQr = async (storeCode:string) => {
  await customFetch('/admin/handOrder/qr/renew/batch', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      shopSeq: props.shopInfo?.shopSeq,
      storeCode,
      stationCode: config.public.stationCode
    },
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_QR.021'),
          color: 'positive',
          icon: 'check'
        })
        emits('refresh')
      } else {
        $q.notify({
          message: $t('DEVICE_QR.022'),
          color: 'negative',
          icon: 'close'
        })
        emits('refresh')
      }
    }
  })
}
enum RenewType {
  ALL,
  ONE
}
const openRenewConfirmDialog = (renewType:RenewType, productId: string|null, storeCode:string|null) => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    title: $t('DEVICE_QR.023'),
    message: $t('DEVICE_QR.024') + '<br>' + $t('DEVICE_QR.025'),
    cancel: true,
    html: true
  }).onOk(async () => {
    if (renewType === RenewType.ONE) {
      if (!productId) {
        return
      }
      await renewQr(productId)
    } else {
      if (!storeCode) {
        return
      }
      await renewAllQr(storeCode)
    }
  })
}
const deleteQr = async (productId:string) => {
  await customFetch('/admin/handOrder/qr', {
    method: 'DELETE',
    params: {
      shopCode: props.shopInfo?.shopCode,
      productId,
      stationCode: config.public.stationCode
    },
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_QR.026'),
          color: 'positive',
          icon: 'check'
        })
        emits('refresh')
      }
    },
    onResponseError (_ctx) {
      $q.notify({
        message: $t('DEVICE_QR.027'),
        color: 'negative',
        icon: 'close'
      })
      emits('refresh')
    }
  })
}
const openDeleteConfirmDialog = (productId: string) => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    title: $t('DEVICE_QR.028'),
    message: $t('DEVICE_QR.029') + '<br>' + $t('DEVICE_QR.030'),
    cancel: true,
    html: true
  }).onOk(async () => {
    await deleteQr(productId)
  })
}
const openAddQrModal = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  if (!props.shopInfo || !props.tableList) {
    return
  }
  $q.dialog({
    component: QrAddModal,
    componentProps: {
      shopInfo: props.shopInfo,
      tableList: props.tableList
    }
  }).onOk(() => {
    emits('refresh')
  })
}
const addBatchQr = async () => {
  if (!props.shopInfo) {
    return
  }
  const data:HandOrderProductBatchPostDto = {
    storeCode: props.shopInfo.qrStoreCode,
    tableTotalCount: props.shopInfo.deviceCount
  }
  await customFetch('/admin/handOrder/qr/batch', {
    method: 'POST',
    params: {
      shopCode: props.shopInfo.shopCode,
      stationCode: config.public.stationCode
    },
    body: data,
    onResponse (_ctx) {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('DEVICE_QR.031'),
          color: 'positive',
          icon: 'check'
        })
        emits('refresh')
      } else if (_ctx.response.status === 400) {
        $q.notify({
          message: $t('DEVICE_QR.032'),
          color: 'warning',
          icon: 'close'
        })
        emits('refresh')
      } else {
        $q.notify({
          message: $t('DEVICE_QR.033'),
          color: 'negative',
          icon: 'close'
        })
        emits('refresh')
      }
    }
  })
}
const addBatchQrConfirmDialog = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  $q.dialog({
    title: $t('DEVICE_QR.034'),
    message: $t('DEVICE_QR.035'),
    cancel: true
  }).onOk(async () => {
    await addBatchQr()
  })
}
const openApplyDialog = (productId: string) => {
  if (!checkPermissions(['U'])) {
    return
  }
  if (!props.shopInfo) {
    return
  }
  $q.dialog({
    component: QrLabelMapModal,
    componentProps: {
      productId,
      shopCode: props.shopInfo.shopCode
    }
  })
}
const doesTableAndDeviceMatch = computed(() => props.shopInfo?.deviceCount === props.shopInfo?.tableCount)

const openLabelStatusModal = async (productId: string, tableNum:number) => {
  if (!props.shopInfo) {
    return
  }
  labelTemplate.value = await customFetch<LabelTemplateVo>(`/admin/handOrder/new/labelTemplate/${props.shopInfo.shopSeq}/${tableNum}`) ||
    await customFetch<LabelTemplateVo>(`/admin/handOrder/labelTemplate/${props.shopInfo.shopSeq}`)
  const productByLabelData = await customFetch<LabelDto>('/admin/handOrder/product/label', {
    method: 'GET',
    params: {
      shopSeq: props.shopInfo.shopSeq,
      productId
    }
  })

  if (productByLabelData == null) {
    $q.notify({
      message: $t('DEVICE_QR.036'),
      color: 'warning',
      icon: 'close'
    })
    return false
  }

  labelList.value = productByLabelData.labelList

  labelStatusPopup.value = true
  return true
}

const labelColumns:QTableProps['columns'] = [
  {
    name: 'labelCode',
    label: $t('DEVICE_QR.037'),
    field: 'labelCode',
    sortable: true,
    align: 'center'
  },
  {
    name: 'updateStatus',
    label: $t('DEVICE_QR.038'),
    field: 'updateStatus',
    sortable: true,
    align: 'center'
  },
  {
    name: 'templateName',
    label: $t('DEVICE_QR.039'),
    field: () => labelTemplate.value?.templateName ?? 'N/A'
  }
]

</script>

<template>
  <q-card>
    <q-card-section class="row text-center items-center justify-between text-bold text-h6 text-center">
      <div class="cursor-pointer" @click="expanded = !expanded">
        {{ $t('DEVICE_QR.040') }}
      </div>
      <div>
        <q-btn
          color="primary"
          @click="$emit('refresh')"
        >
          {{ $t('COMMON.074') }}
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
          :loading-label="loading ? $t('DEVICE_QR.041') : ''"
          :rows="hoRandomMap ?? []"
          row-key="productId"
          :columns="columns"
          hide-pagination
          :filter="filterString"
        >
          <template v-slot:top-left>
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
          <template v-slot:top-right>
            <q-btn
              color="primary"
              @click="openRenewConfirmDialog(RenewType.ALL, null,shopInfo?.qrStoreCode ?? '')"
            >
              {{ $t('DEVICE_QR.042') }}
            </q-btn>
          </template>
          <template v-slot:body-cell-landingUrl="rowData">
            <q-td :props="rowData">
              <NuxtLink :to="`${baseUrl}/r?r=${rowData.row.randomCode}`" target="_blank">
                {{ rowData.row.landingUrl }}
              </NuxtLink>
            </q-td>
          </template>
          <template v-slot:body-cell-productId="rowData">
            <q-td :props="rowData">
              <q-chip
                color="primary"
                text-color="white"
                :label="rowData.row.productId"
                clickable
                @click="openLabelStatusModal(rowData.row.productId, getTableNum(rowData.row))"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-apply="rowData">
            <q-td :props="rowData">
              <q-btn
                flat
                size="md"
                color="primary"
                @click="openApplyDialog(rowData.row.productId)"
              >
                {{ $t('COMMON.077') }}
              </q-btn>
            </q-td>
          </template>
          <template v-slot:body-cell-renew="rowData">
            <q-td :props="rowData">
              <q-btn
                flat
                size="md"
                color="primary"
                @click="openRenewConfirmDialog(RenewType.ONE,rowData.row.productId,null)"
              >
                {{ $t('DEVICE_QR.020') }}
              </q-btn>
            </q-td>
          </template>
          <template v-slot:body-cell-delete="rowData">
            <q-td :props="rowData">
              <q-btn
                flat
                size="md"
                color="negative"
                @click="openDeleteConfirmDialog(rowData.row.productId)"
              >
                {{ $t('COMMON.007') }}
              </q-btn>
            </q-td>
          </template>
          <template v-slot:bottom-row>
            <q-tr>
              <q-td colspan="100%">
                <div class="full-width q-gutter-sm row justify-center items-center">
                  <q-btn
                    :disable="shopInfo?.deviceCount<=(hoRandomMap?.length ?? 0) || shopInfo?.tableCount == 0"
                    color="primary"
                    :label="$t('DEVICE_QR.043')"
                    @click="openAddQrModal"
                  >
                    <q-tooltip v-if="shopInfo?.deviceCount<=(hoRandomMap?.length ?? 0)">
                      <div class="text-center">
                        <div>{{ $t('DEVICE_QR.044') }}</div>
                        <div>{{ $t('DEVICE_QR.045') }}</div>
                      </div>
                    </q-tooltip>
                    <q-tooltip v-else-if="shopInfo?.tableCount == 0">
                      <div class="text-center">
                        <div>{{ $t('DEVICE_QR.046') }}</div>
                      </div>
                    </q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="doesTableAndDeviceMatch"
                    outline
                    color="primary"
                    :label="$t('DEVICE_QR.047')"
                    :disable="(hoRandomMap?.length !== 0)"
                    @click="addBatchQrConfirmDialog"
                  >
                    <q-tooltip v-if="hoRandomMap?.length !== 0">
                      <div class="text-center">
                        <div>{{ $t('DEVICE_QR.048') }}</div>
                        <div>{{ $t('DEVICE_QR.049') }}</div>
                      </div>
                    </q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </q-tr>
          </template>
          <template v-slot:bottom>
            <q-pagination
              v-model="paginationOption.page"
              class="justify-center fit"
              :max="maxPages"
              :min="1"
              :max-pages="9"
              :direction-links="true"
              :boundary-numbers="true"
              :ellipses="true"
              size="10px"
            />
          </template>
        </q-table>
      </div>
    </q-slide-transition>
  </q-card>
  <q-dialog v-model="labelStatusPopup">
    <q-card style="width: 500px">
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('DEVICE_QR.018') }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-table
          :rows="labelList"
          :columns="labelColumns"
          flat
          hide-bottom
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
