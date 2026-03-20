<script setup lang="ts">
import type { HoMenuVo, ShopInfoVo } from '~/types'

const $q = useQuasar()

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const props = defineProps< {
  shopInfo: ShopInfoVo,
  menuInfo: HoMenuVo
}>()

const menuInfo = ref(props.menuInfo)
const labelList = ref<string[]>([])

const labelCode = ref(menuInfo.value.label)

const addLabel = () => {
  $q.dialog({
    title: '라벨 등록',
    message: '라벨을 등록하시겠습니까?',
    ok: '확인',
    cancel: '취소'
  }).onOk(() => {
    postLabel()
  })
}

const postLabel = async () => {
  const regexp = /^[a-zA-Z0-9]*$/

  if (!regexp.test(labelCode.value)) {
    $q.notify({
      message: '라벨 코드는 영문과 숫자만 입력 가능합니다.',
      color: 'negative'
    })
    return
  }

  if (labelCode.value === '') {
    $q.notify({
      message: '라벨 코드를 입력해주세요.',
      color: 'negative'
    })
    return
  }
  if (labelList.value.includes(labelCode.value)) {
    $q.notify({
      message: '이미 등록된 라벨입니다.',
      color: 'negative'
    })
    return
  }

  await customFetch(`/admin/handOrder/menu/${menuInfo.value.menuSeq}/label`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      shopCode: props.shopInfo.shopCode,
      label: labelCode.value
    }
  }).then(() => {
    labelList.value.push(labelCode.value)
    labelCode.value = ''
  })
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card style="width: 500px">
      <q-card-section class="text-h6 text-bold">
        라벨 정보 입력
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="label-box">
          <div class="label-add row">
            <q-input
              v-model="labelCode"
              class="col-10"
              label="라벨 코드"
              outlined
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn
          label="취소"
          color="grey-5"
          @click="onDialogCancel"
        />
        <q-btn
          label="저장"
          color="primary"
          @click="addLabel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
