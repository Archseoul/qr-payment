<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import type { QxImageVo, ShopInfoVo, ShopPostDto } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'
import QxImageUploadModal from '~/components/QxImageUploadModal.vue'

const props = defineProps<{
  shopCode: string,
  shopSeq: number,
  shopInfo: ShopPostDto | ShopInfoVo
}>()

const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const previewImageUrl = ref('')

const { data: deviceList } = await useCustomFetch<QxImageVo[]>(`/admin/handOrder/shop/${props.shopCode}/qx/device/image`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const pagination = ref({
  rowsPerPage: 0
})

const deviceColumns:QTableProps['columns'] = [
  {
    name: 'imageName',
    required: true,
    label: $t('SHOP.123'),
    align: 'left',
    field: 'imageName',
    sortable: true
  },
  {
    name: 'imageOriginalName',
    required: true,
    label: $t('SHOP.124'),
    align: 'left',
    field: 'imageOriginalName',
    sortable: true,
    style: 'width: 200px'
  }
]

const qxImageUpload = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: QxImageUploadModal,
    componentProps: {
      shopCode: props.shopCode
    }
  }).onOk(() => {
    refreshNuxtData()
  })
}
const previewImage = async (row: QxImageVo) => {
  if (!checkPermissions(['R'])) {
    return
  }
  const imageUrl = await customFetch(`/admin/handOrder/shop/${props.shopCode}/qx/device/image/preview`, {
    method: 'GET',
    params: {
      imageUuid: row.imageUuid
    },
    responseType: 'blob'
  })
  const blob = await imageUrl
  const url = URL.createObjectURL(blob as Blob)
  previewImageUrl.value = url
  $q.dialog({
    title: $t('SHOP.125'),
    message: `<img src="${url}" alt="${$t('SHOP.125')}" style="max-width: 100%; max-height: 500px;">`,
    html: true,
    ok: $t('COMMON.094')
  }).onDismiss(() => {
    URL.revokeObjectURL(url) // 메모리 해제
  })
}
</script>

<template>
  <div>
    <div class="">
      <q-btn
        class="q-mb-md"
        color="primary"
        :label="$t('SHOP.126')"
        @click="qxImageUpload"
      />
    </div>
    <q-separator class="q-my-md" />
    <q-table
      v-model:pagination="pagination"
      class="q-mb-md-lg full-height"
      :rows="deviceList ?? []"
      :columns="deviceColumns"
      row-key="imageUuid"
      :rows-per-page-options="[0]"
      hide-bottom
    >
      <template v-slot:header="slotProps">
        <q-tr :props="slotProps">
          <q-th
            v-for="col in slotProps.cols"
            :key="col.name"
            :props="slotProps"
            class="text-center"
          >
            {{ col.label }}
          </q-th>
          <q-th auto-width>
            {{ $t('SHOP.127') }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="slotProps">
        <q-tr :props="slotProps">
          <q-td
            v-for="col in slotProps.cols"
            :key="col.name"
            :props="slotProps"
          >
            {{ col.value }}
          </q-td>
          <q-td auto-width>
            <q-btn
              icon="visibility"
              color="primary"
              dense
              @click="previewImage(slotProps.row)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<style scoped lang="scss">

</style>
