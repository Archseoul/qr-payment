<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import type { HoMenuVo } from '~/types'

const props = defineProps<{
  menuList: HoMenuVo[],
  shopCode: string
}>()

const $q = useQuasar()

// 메뉴 리스트의 초기 상태를 저장 (깊은 복사)
const initialMenuList = ref(JSON.parse(JSON.stringify(props.menuList)))
const menuList = ref([...props.menuList])

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

// 메뉴 순서를 위로 올리는 함수
const moveMenuUp = (index: number) => {
  if (index > 0) {
    const temp = menuList.value[index]
    menuList.value.splice(index, 1)
    menuList.value.splice(index - 1, 0, temp)
  }
}

// 메뉴 순서를 아래로 내리는 함수
const moveMenuDown = (index: number) => {
  if (index < menuList.value.length - 1) {
    const temp = menuList.value[index]
    menuList.value.splice(index, 1)
    menuList.value.splice(index + 1, 0, temp)
  }
}

// 메뉴의 인덱스와 orderIndex를 동기화하는 함수
const syncOrderIndexes = () => {
  menuList.value.forEach((menu:HoMenuVo, index:number) => {
    menu.orderIndex = index + 1 // 인덱스 값에 1을 더해 순서대로 치환
    menu.shopCode = props.shopCode
  })
}

// 메뉴 상태 비교 후 변경된 항목만 저장하는 함수
const saveMenuList = async () => {
  syncOrderIndexes()

  // 변경된 항목들만 필터링
  const changedMenus = menuList.value.filter((menu) => {
    const initialMenu = initialMenuList.value.find((initialMenu:HoMenuVo) => initialMenu.menuSeq === menu.menuSeq)
    return (
      menu.outOfStock !== initialMenu.outOfStock ||
        menu.isRecommended !== initialMenu.isRecommended ||
        menu.delayingMenu !== initialMenu.delayingMenu ||
        menu.isHidden !== initialMenu.isHidden
    )
  })
  // 메뉴 순서 변경 API 호출
  await customFetch('/admin/handOrder/shop/category/menu/sort', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menuList.value)
  })

  if (changedMenus.length > 0) {
    // 변경된 메뉴 상태만 서버로 전송
    for (const menu of changedMenus) {
      await customFetch('/admin/handOrder/shop/category/menu/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(menu)
      })
    }
  }

  $q.dialog({
    title: $t('SHOP.109'),
    message: $t('SHOP.110'),
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
          {{ $t('SHOP.111') }}
        </div>
      </q-card-section>

      <!-- 메뉴 리스트 -->
      <q-card-section class="q-pa-sm" style="flex-grow: 1; overflow-y: auto;">
        <div v-for="(menu, index) in menuList" :key="menu.menuSeq" class="menu-item">
          <div class="menu-title-section">
            <q-item-label class="menu-title">
              {{ menu.orderIndex }}. {{ menu.menuName }}
            </q-item-label>
          </div>
          <div class="menu-middle-section">
            <div class="menu-checkboxes">
              <q-checkbox
                v-model="menu.outOfStock"
                dense
                :label="$t('SHOP.112')"
                color="red"
              />
              <q-checkbox
                v-model="menu.isRecommended"
                dense
                :label="$t('SHOP.113')"
                color="green"
              />
              <q-checkbox
                v-model="menu.delayingMenu"
                dense
                :label="$t('SHOP.114')"
                color="orange"
              />
              <q-checkbox
                v-model="menu.isHidden"
                dense
                :label="$t('COMMON.063')"
                color="orange"
              />
            </div>
            <div class="menu-buttons">
              <q-btn flat dense round icon="arrow_upward" @click="moveMenuUp(index)" />
              <q-btn flat dense round icon="arrow_downward" @click="moveMenuDown(index)" />
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
          @click="saveMenuList"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-container .q-dialog__inner--minimized > div{
  max-height: calc(100vh - 100px);
}

.menu-item {
  padding-bottom: 10px;
}

.menu-title-section {
  margin-bottom: 15px;
  text-align: left;
}

.menu-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.menu-middle-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-checkboxes {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.menu-buttons {
  display: flex;
  gap: 5px;
}

.q-card-plugin {
  width: 100%;
}
</style>
