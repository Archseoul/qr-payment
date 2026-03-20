<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import type { HoOptionGroupVo } from '~/types'

const props = defineProps<{
  optionGroupList: HoOptionGroupVo[],
  shopCode: string
}>()

const $q = useQuasar()

const optionGroupList = ref([...props.optionGroupList])

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

// 옵션 그룹 순서를 위로 올리는 함수
const moveOptionGroupUp = (index: number) => {
  if (index > 0) {
    const temp = optionGroupList.value[index]
    optionGroupList.value.splice(index, 1)
    optionGroupList.value.splice(index - 1, 0, temp)
  }
}

// 옵션 그룹 순서를 아래로 내리는 함수
const moveOptionGroupDown = (index: number) => {
  if (index < optionGroupList.value.length - 1) {
    const temp = optionGroupList.value[index]
    optionGroupList.value.splice(index, 1)
    optionGroupList.value.splice(index + 1, 0, temp)
  }
}

// 옵션 그룹의 인덱스와 orderIndex를 동기화하는 함수
const syncOrderIndexes = () => {
  optionGroupList.value.forEach((optionGroup: HoOptionGroupVo, index: number) => {
    optionGroup.orderIndex = index + 1 // 인덱스 값에 1을 더해 순서대로 치환
    optionGroup.shopCode = props.shopCode
  })
}

// 옵션 그룹 순서를 저장하는 함수
const saveOptionGroupList = async () => {
  syncOrderIndexes()

  // 옵션 그룹 순서 변경 API 호출
  await customFetch('/admin/handOrder/shop/menu-option/group/sort', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(optionGroupList.value)
  })

  $q.dialog({
    title: $t('SHOP.115'),
    message: $t('SHOP.116'),
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
      <q-card-section class="q-pa-md">
        <div class="text-h6 text-bold">
          {{ $t('SHOP.115') }}
        </div>
      </q-card-section>

      <!-- 옵션 그룹 리스트 -->
      <q-card-section class="q-pa-sm" style="flex-grow: 1; overflow-y: auto;">
        <template v-for="(optionGroup, index) in optionGroupList" :key="optionGroup.optionGroupUuid">
          <div class="optionGroup-item">
            <div class="optionGroup-title-section">
              <q-item-label class="optionGroup-title">
                {{ optionGroup.orderIndex }}. {{ optionGroup.optionGroupName }}
              </q-item-label>
            </div>
            <div class="optionGroup-middle-section">
              <div class="optionGroup-buttons">
                <q-btn flat dense round icon="arrow_upward" @click="moveOptionGroupUp(index)" />
                <q-btn flat dense round icon="arrow_downward" @click="moveOptionGroupDown(index)" />
              </div>
            </div>
          </div>
          <q-separator class="q-mt-sm q-mb-sm" />
        </template>
      </q-card-section>

      <!-- 저장 및 취소 버튼 -->
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
          @click="saveOptionGroupList"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-container .q-dialog__inner--minimized > div {
  max-height: calc(100vh - 100px);
}

.optionGroup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.optionGroup-title-section {
  flex: 1;
  text-align: left; /* 좌측 정렬 */
}

.optionGroup-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.optionGroup-middle-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.optionGroup-buttons {
  display: flex;
  flex-direction: column; /* 상하로 배치 */
  gap: 5px;
}

.q-card-plugin {
  width: 100%;
}
</style>
