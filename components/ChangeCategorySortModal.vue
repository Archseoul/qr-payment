<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import type { HoCategoryVo } from '~/types'

const props = defineProps<{
  categoryList: HoCategoryVo[],
  shopCode: string
}>()

const $q = useQuasar()

const categoryList = ref([...props.categoryList])

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

// 카테고리 순서를 위로 올리는 함수
const moveCategoryUp = (index: number) => {
  if (index > 0) {
    const temp = categoryList.value[index]
    categoryList.value.splice(index, 1)
    categoryList.value.splice(index - 1, 0, temp)
  }
}

// 카테고리 순서를 아래로 내리는 함수
const moveCategoryDown = (index: number) => {
  if (index < categoryList.value.length - 1) {
    const temp = categoryList.value[index]
    categoryList.value.splice(index, 1)
    categoryList.value.splice(index + 1, 0, temp)
  }
}

// 카테고리의 인덱스와 orderIndex를 동기화하는 함수
const syncOrderIndexes = () => {
  categoryList.value.forEach((category: HoCategoryVo, index: number) => {
    category.orderIndex = index + 1 // 인덱스 값에 1을 더해 순서대로 치환
    category.shopCode = props.shopCode
  })
}

// 카테고리 순서를 저장하는 함수
const saveCategoryList = async () => {
  syncOrderIndexes()

  // 카테고리 순서 변경 API 호출
  await customFetch('/admin/handOrder/shop/category/sort', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryList.value)
  })

  $q.dialog({
    title: $t('SHOP.066'),
    message: $t('SHOP.108'),
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
          {{ $t('SHOP.066') }}
        </div>
      </q-card-section>

      <!-- 카테고리 리스트 -->
      <q-card-section class="q-pa-sm" style="flex-grow: 1; overflow-y: auto;">
        <template v-for="(category, index) in categoryList" :key="category.categoryUuid">
          <div class="category-item">
            <div class="category-title-section">
              <q-item-label class="category-title">
                {{ category.orderIndex }}. {{ category.categoryName }}
              </q-item-label>
            </div>
            <div class="category-middle-section">
              <div class="category-buttons">
                <q-btn flat dense round icon="arrow_upward" @click="moveCategoryUp(index)" />
                <q-btn flat dense round icon="arrow_downward" @click="moveCategoryDown(index)" />
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
          @click="saveCategoryList"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-container .q-dialog__inner--minimized > div {
  max-height: calc(100vh - 100px);
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-title-section {
  flex: 1;
  text-align: left; /* 좌측 정렬 */
}

.category-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.category-middle-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-buttons {
  display: flex;
  flex-direction: column; /* 상하로 배치 */
  gap: 5px;
}

.q-card-plugin {
  width: 100%;
}
</style>
