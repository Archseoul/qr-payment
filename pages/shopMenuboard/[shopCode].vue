<script setup lang="ts">
import { dayjs } from 'element-plus'
import { useQuasar } from 'quasar'
import { cloneDeep } from 'lodash-es'
import MenuboardCard from '~/components/MenuboardCard.vue'
import MenuboardModal from '~/components/MenuboardModal.vue'
import MenuboardOrder from '~/components/MenuboardOrder.vue'
import type { HoCategoryVo, HoShopMenuboardVo, ShopInfoVo } from '~/types'

const route = useRoute()
const $q = useQuasar()

const shopCode = route.params.shopCode as string

const { data: shopInfo } = await useCustomFetch<ShopInfoVo>(`/admin/handOrder/shop/${shopCode}`, {
  method: 'GET'
})

const menuboardList = ref<HoShopMenuboardVo[]>([])
const menuboardListData = await useCustomFetch<HoShopMenuboardVo[]>(`/admin/handOrder/menuboard/list/${shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
menuboardList.value = menuboardListData.data.value ?? []

const getMenuboardList = async () => {
  const menuboardListData = await customFetch<HoShopMenuboardVo[]>(`/admin/handOrder/menuboard/list/${shopCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  menuboardList.value = menuboardListData
}

const { data: categories } = await useCustomFetch<HoCategoryVo[]>(`/admin/handOrder/shop/category/${shopCode}`, {
  method: 'GET'
})

// 새 메뉴보드 객체를 computed로 만들어 항상 최신 상태 반영
const newMenuboard = computed<HoShopMenuboardVo>(() => ({
  shopMenuboardSeq: undefined,
  shopSeq: shopInfo.value?.shopSeq ?? 0,
  menuboardName: '',
  useYn: true,
  everydayYn: true,
  startTime: '0000',
  endTime: '0000',
  dayOfWeekList: [],
  menuSeqList: [],
  priority: menuboardList.value?.length ?? 0
}))

const openMenuboardModal = (menuboard?:HoShopMenuboardVo | undefined) => {
  let propsMenuboard
  if (menuboard) {
    propsMenuboard = menuboard
  } else {
    propsMenuboard = cloneDeep(newMenuboard.value)
  }
  $q.dialog({
    title: $t('SHOP_MENUBOARD.001'),
    component: MenuboardModal,
    componentProps: {
      shopSeq: shopInfo.value?.shopSeq,
      shopCode: shopInfo.value?.shopCode,
      categoryList: categories.value,
      menuboard: propsMenuboard
    }
  }).onOk(async () => {
    await refreshData()
  })
}

const openMenuboardOrderModal = () => {
  $q.dialog({
    title: $t('SHOP_MENUBOARD.002'),
    component: MenuboardOrder,
    componentProps: {
      shopCode: shopInfo.value?.shopCode,
      menuboardList: menuboardList.value
    }
  }).onOk(async () => {
    await refreshData()
  })
}

const currentMenuboard = ref<HoShopMenuboardVo | null>(null)
const currentMenuboardData = await useCustomFetch<HoShopMenuboardVo>(`/admin/handOrder/menuboard/current/${shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
currentMenuboard.value = currentMenuboardData.data.value ?? null

const getCurrentMenuboard = async () => {
  if (menuboardList.value && menuboardList.value.length > 0) {
    const currentMenuboardData = await customFetch<HoShopMenuboardVo>(`/admin/handOrder/menuboard/current/${shopCode}`)
    currentMenuboard.value = currentMenuboardData
  } else {
    currentMenuboard.value = null
  }
}

const time = () => {
  return dayjs().format('YYYY-MM-DD (dd), HH:mm  기준')
}

const timetable = ref(false)

const refreshData = async () => {
  await getMenuboardList()
  await getCurrentMenuboard()
}

const splitterModel = ref(20)

const hoveredBoardSeq = ref<number | undefined | null>(null)
</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <div class="row justify-between">
        <div>
          <span class="text-h5 text-bold">{{ $t('SIDE_MENU.010') }}</span>
          <q-toggle
            v-model="timetable"
            :label="$t('SHOP_MENUBOARD.003')"
          />
        </div>
        <div>
          <q-btn
            :label="$t('SHOP_MENUBOARD.004')"
            color="grey"
            class="q-mr-sm"
            @click="openMenuboardOrderModal()"
          />
          <q-btn
            :label="$t('COMMON.064')"
            color="primary"
            @click="openMenuboardModal()"
          />
        </div>
      </div>
      <q-separator class="q-my-sm" />
    </div>
    <div class="content-body col full-width column">
      <template v-if="timetable">
        <q-splitter
          v-model="splitterModel"
          style="height:100%"
        >
          <template v-slot:before>
            <q-card
              bordered
            >
              <q-card-section class="q-md-mt text-bold justify-around text-center">
                <div>
                  {{ $t('SHOP_MENUBOARD.005') }}
                </div>
              </q-card-section>
              <q-separator />
              <q-list>
                <q-item
                  v-for="menuboard in menuboardList"
                  :key="menuboard.shopMenuboardSeq"
                  clickable
                  @click="openMenuboardModal(menuboard)"
                  @mouseover="hoveredBoardSeq = menuboard.shopMenuboardSeq"
                  @mouseleave="hoveredBoardSeq = null"
                >
                  {{ menuboard.menuboardName }}
                </q-item>
              </q-list>
            </q-card>
          </template>
          <template v-slot:after>
            <div style="height:100%; overflow: scroll;">
              <MenuboardTimeTable :key="menuboardList?.length" :menuboard-list="menuboardList ?? null" :hovered-board-seq="hoveredBoardSeq" @open-menuboard-modal="(menuboard) => openMenuboardModal(menuboard)" />
            </div>
          </template>
        </q-splitter>
      </template>
      <template v-else>
        <div class="row column" style="margin-bottom:10px">
          <span>
            {{ $t('SHOP_MENUBOARD.006') }} :
            {{ currentMenuboard?.menuboardName || $t('COMMON.053') }}
            ({{ time() }})
            <q-btn
              :label="$t('COMMON.074')"
              color="primary"
              dense
              size="sm"
              @click="refreshData"
            />
          </span>
        </div>
        <div class="row col column justify-between full-width" style="margin-bottom: 5px;">
          <div v-if="menuboardList && menuboardList.length > 0" class="row q-gutter-sm justify-around col">
            <!-- <div
              v-for="menuboard in menuboardList"
              :key="menuboard.shopMenuboardSeq"
              class="card-item"
            > -->
            <MenuboardCard
              v-for="menuboard in menuboardList"
              :key="menuboard.shopMenuboardSeq"
              :menuboard="menuboard"
              :category-list="categories ?? null"
              :current-menuboard-yn="currentMenuboard?.shopMenuboardSeq === menuboard.shopMenuboardSeq"
              @click="openMenuboardModal(menuboard)"
            />
            <!-- </div> -->
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
