<script setup lang="ts">
import type { HoShopMenuboardVo } from '~/types'

const { dialogRef, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const $q = useQuasar()

const props = defineProps<{
  menuboardList: HoShopMenuboardVo[],
  shopCode: string,
}>()

const menuboardList = ref<HoShopMenuboardVo[]>(props.menuboardList.map(menuboard => menuboard).sort((a, b) => a.priority - b.priority))

const saveMenuboardOrder = async () => {
  $q.loading.show()

  await customFetch(`/admin/handOrder/menuboard/${props.shopCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menuboardList.value.map((menuboard, index) => {
      menuboard.priority = index
      return menuboard
    }))
  }).catch((context) => {
    $q.notify({
      message: `${$t('SHOP_MENUBOARD.024')} ${context.response._data.message}`,
      color: 'negative',
      icon: 'close'
    })
    $q.loading.hide()
  })

  $q.notify({
    message: $t('SHOP_MENUBOARD.025'),
    color: 'positive',
    icon: 'check'
  })
  $q.loading.hide()
  onDialogOK()
}

// 옵션 그룹 순서를 위로 올리는 함수
const moveOrderUp = (index: number) => {
  if (index > 0) {
    const temp = menuboardList.value[index]
    menuboardList.value.splice(index, 1)
    menuboardList.value.splice(index - 1, 0, temp)
  }
}

// 옵션 그룹 순서를 아래로 내리는 함수
const moveOrderDown = (index: number) => {
  if (index < menuboardList.value.length - 1) {
    const temp = menuboardList.value[index]
    menuboardList.value.splice(index, 1)
    menuboardList.value.splice(index + 1, 0, temp)
  }
}

</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogCancel"
  >
    <q-card class="q-dialog-plugin" style="width: 700px; max-width:80vw;" persistent>
      <q-card-section class="q-pa-md">
        <div class="text-h5 text-bold row justify-between">
          {{ $t('SHOP_MENUBOARD.002') }}
          <div>
            <q-btn
              :label="$t('COMMON.009')"
              color="primary"
              @click="saveMenuboardOrder"
            />
          </div>
        </div>

        <q-separator class="q-my-lg" />
        <div class="q-mt-sm">
          <q-list>
            <q-item v-for="menuboard, index in menuboardList" :key="menuboard.shopMenuboardSeq">
              <q-item-section side>
                {{ index+1 }}
              </q-item-section>
              <q-item-section side class="row">
                <q-btn
                  icon="arrow_upward"
                  round
                  flat
                  dense
                  @click="moveOrderUp(index)"
                />
                <q-btn
                  icon="arrow_downward"
                  round
                  flat
                  dense
                  @click="moveOrderDown(index)"
                />
              </q-item-section>
              <q-item-section>
                {{ menuboard.menuboardName }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
