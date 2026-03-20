<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import type { ShopPostDto, ShopInfoVo } from '~/types'

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const props = defineProps<{
  shopCode: string,
  shopSeq: number,
  shopInfo: ShopPostDto | ShopInfoVo,
  isEditable: boolean
}>()

const emits = defineEmits<{
  'update:shopInfo': [value:ShopPostDto | ShopInfoVo],
}>()

const shopInfo = computed<ShopPostDto | ShopInfoVo>({
  get: () => props.shopInfo,
  set: value => emits('update:shopInfo', value)
})

const clickOk = () => {
  onDialogOK()
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin" style="width: 700px">
      <q-card-section class="text-h6 text-bold">
        {{ $t('SIDE_MENU.014') }}
      </q-card-section>
      <q-separator />
      <q-card-section>
        <ShopDevice
          :shop-seq="props.shopSeq"
          :shop-code="shopCode"
          :shop-info="shopInfo"
          :is-editable="props.isEditable"
        />
      </q-card-section>
      <q-card-actions>
        <q-btn
          :label="$t('COMMON.004')"
          color="primary"
          flat
          @click="clickOk"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
