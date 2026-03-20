<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import type { HoOptionGroupVo, HoOptionVo } from '~/types'

const props = defineProps<{
  optionList: HoOptionVo[],
  shopCode: string,
  optionGroup : HoOptionGroupVo
}>()

const $q = useQuasar()

// 옵션 리스트의 초기 상태를 저장 (깊은 복사)
// const initialOptionList = ref(JSON.parse(JSON.stringify(props.optionList)))
const optionList = ref([...props.optionList])

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

// 옵션 순서를 위로 올리는 함수
const moveOptionUp = (index: number) => {
  if (index > 0) {
    const temp = optionList.value[index]
    optionList.value.splice(index, 1)
    optionList.value.splice(index - 1, 0, temp)
  }
}

// 옵션 순서를 아래로 내리는 함수
const moveOptionDown = (index: number) => {
  if (index < optionList.value.length - 1) {
    const temp = optionList.value[index]
    optionList.value.splice(index, 1)
    optionList.value.splice(index + 1, 0, temp)
  }
}

// 옵션의 인덱스와 orderIndex를 동기화하는 함수
const syncOrderIndexes = () => {
  optionList.value.forEach((option: HoOptionVo, index: number) => {
    option.orderIndex = index + 1 // 인덱스 값에 1을 더해 순서대로 치환
    option.shopCode = props.shopCode
  })
}

// 옵션 상태 비교 후 변경된 항목만 저장하는 함수
const saveOptionList = async () => {
  syncOrderIndexes()

  const saleOptionArray = optionList.value.filter(option => !option.outOfStock && !option.isHidden)
  const required = props.optionGroup.optionRequired
  const minQty = props.optionGroup.minQty

  if (minQty) {
    if (saleOptionArray.length < minQty) {
      $q.dialog({
        title: $t('SHOP.117'),
        message: $t('SHOP.118'),
        ok: $t('COMMON.004')
      })
      return
    }
  } else if (required) {
    if (saleOptionArray.length < 1) {
      $q.dialog({
        title: $t('SHOP.117'),
        message: $t('SHOP.119'),
        ok: $t('COMMON.004')
      })
      return
    }
  }

  // 옵션 순서 변경 API 호출
  await customFetch('/admin/handOrder/shop/menu-option/sort', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(optionList.value)
  })

  $q.dialog({
    title: $t('SHOP.117'),
    message: $t('SHOP.120'),
    ok: $t('COMMON.004')
  }).onOk(() => {
    onDialogOK()
    onDialogHide()
  })
}

// 취소 버튼 클릭 시 동작
const cancelDialog = () => {
  onDialogCancel()
  onDialogHide()
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    no-backdrop-dismiss
    no-esc-dismiss
    class="dialog-container"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin" style="display: flex; flex-direction: column;">
      <!-- Dialog 제목 -->
      <!--해당 옵션 그룹의 unique option이 true일 때 해당 옵션의 outOfStock이 전부 true면 optionGroupMapping 전부 끊어주기-->
      <q-card-section class="q-pa-md">
        <div class="text-h6 text-bold">
          {{ $t('SHOP.111') }}
        </div>
      </q-card-section>

      <!-- 옵션 리스트 -->
      <q-card-section class="q-pa-sm" style="flex-grow: 1; overflow-y: auto;">
        <div v-for="(option, index) in optionList" :key="option.optionUuid" class="option-item">
          <div class="option-title-section">
            <q-item-label class="option-title">
              {{ option.orderIndex }}. {{ option.optionName }}
            </q-item-label>
          </div>
          <div class="flex justify-between">
            <div>
              <q-checkbox
                v-model="option.outOfStock"
                dense
                :label="$t('SHOP.112')"
                color="red"
              />
              <q-checkbox
                v-model="option.isHidden"
                dense
                :label="$t('COMMON.063')"
              />
            </div>
            <div class="option-middle-section">
              <div class="option-buttons">
                <q-btn flat dense round icon="arrow_upward" @click="moveOptionUp(index)" />
                <q-btn flat dense round icon="arrow_downward" @click="moveOptionDown(index)" />
              </div>
            </div>
          </div>
          <q-separator class="q-mt-sm q-mb-sm" />
        </div>
      </q-card-section>

      <!-- 저장 및 취소 버튼 항상 하단 고정 -->
      <q-card-actions align="right" class="q-pa-md" style="border-top: 1px solid #ddd;">
        <q-btn
          flat
          :label="$t('COMMON.005')"
          color="red"
          @click="cancelDialog"
        />
        <q-btn
          flat
          :label="$t('COMMON.009')"
          color="primary"
          @click="saveOptionList"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-container .q-dialog__inner--minimized > div {
  max-height: calc(100vh - 100px);
}

.option-item {
  padding-bottom: 10px;
}

.option-title-section {
  margin-bottom: 15px;
  text-align: left;
}

.option-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.option-middle-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-buttons {
  display: flex;
  gap: 5px;
}

.q-card-plugin {
  width: 100%;
}
</style>
