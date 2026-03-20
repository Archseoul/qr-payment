<script setup lang="ts">
import { cloneDeepWith } from 'lodash-es'
import { useQuasar } from 'quasar'
import type { Ref } from 'vue'
import type { HoShopGroupCustomLinkVo, HoShopGroupLinkVo, HoShopGroupVo } from '~/types'
import ShopGroupInfo from '~/components/ShopGroupInfo.vue'

const shopGroupListData = await useCustomFetch<HoShopGroupVo[]>('/admin/handOrder/shop/group', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const shopGroupList:Ref<HoShopGroupVo[] | null> = shopGroupListData.data

const $q = useQuasar()

const shopGroupLinkList = ref<HoShopGroupLinkVo[]>([])
const shopGroupMappedList = ref<HoShopGroupLinkVo[]>([])
const shopGroupCustomLinkList = ref<HoShopGroupCustomLinkVo[]>([])

const selectedGroup = ref<HoShopGroupVo | null>(null)
const groupNameSearch = ref('')

// 필터링된 매장 그룹 리스트 (검색 기능)
const filteredShopGroupList = computed(() => {
  if (!shopGroupList || !shopGroupList.value || shopGroupList.value.length === 0) {
    return []
  }
  if (!groupNameSearch.value.trim()) {
    return shopGroupList.value
  }
  return shopGroupList.value.filter((group: HoShopGroupVo) =>
    group.shopGroupName.toLowerCase().includes(groupNameSearch.value.toLowerCase())
  )
})
const createShopGroupPopup = ref(false)
const createShopGroupName = ref('')

const cloneShopGroup = async (group:HoShopGroupVo) => {
  await getShopGroupLinkList(group.shopGroupUuid)
  await getShopGroupMappedList(group.shopGroupUuid)
  await getShopGroupCustomLinkList(group.shopGroupUuid)
  selectedGroup.value = cloneDeepWith(group)
}

const getShopGroupLinkList = async (shopGroupUuid:string) => {
  const { data } = await useCustomFetch<HoShopGroupLinkVo[]>(`/admin/handOrder/shop/group/link/${shopGroupUuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  shopGroupLinkList.value = data.value ?? []
}

const getShopGroupMappedList = async (shopGroupUuid:string) => {
  const { data } = await useCustomFetch<HoShopGroupLinkVo[]>(`/admin/handOrder/shop/group/mapped/${shopGroupUuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  shopGroupMappedList.value = data.value ?? []
}

const getShopGroupCustomLinkList = async (shopGroupUuid:string) => {
  const { data } = await useCustomFetch<HoShopGroupCustomLinkVo[]>(`/admin/handOrder/shop/group/custom-link/${shopGroupUuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  shopGroupCustomLinkList.value = data.value ?? []
}

const deleteShopGroup = () => {
  $q.dialog({
    title: '매장 그룹 삭제',
    message: '매장 그룹을 삭제하시겠습니까?',
    ok: {
      label: '확인',
      color: 'primary'
    },
    cancel: {
      label: '취소',
      color: 'negative'
    }
  }).onOk(async () => {
    if (!selectedGroup.value) {
      return
    }
    await customFetch(`/admin/handOrder/shop/group/${selectedGroup.value.shopGroupUuid}`, {
      method: 'DELETE'
    })
    shopGroupListData.refresh()

    $q.notify({
      message: '삭제되었습니다.',
      color: 'positive'
    })
  })
}

const openCreateShopGroupPopup = () => {
  createShopGroupPopup.value = true
}

const closeCreateShopGroupPopup = () => {
  createShopGroupPopup.value = false
  createShopGroupName.value = ''
}

const createShopGroup = async () => {
  if (!createShopGroupName) {
    return
  }

  try {
    await customFetch('/admin/handOrder/shop/group', {
      method: 'POST',
      body: JSON.stringify({
        shopGroupName: createShopGroupName.value
      })
    })

    shopGroupListData.refresh()

    $q.notify({
      message: '매장 그룹이 생성되었습니다.',
      color: 'positive'
    })

    closeCreateShopGroupPopup()
  } catch (error) {
    console.error('매장 그룹 생성 실패:', error)
    $q.notify({
      message: '매장 그룹 생성에 실패했습니다.',
      color: 'negative'
    })
  }
}

const refreshData = async () => {
  $q.loading.show()
  shopGroupListData.refresh()

  await cloneShopGroup(selectedGroup.value!)
  $q.loading.hide()
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">매장 그룹</span>
      <q-btn label="삭제" color="red" class="q-mt-md q-mr-md float-right" icon="delete" @click="deleteShopGroup" />
      <q-btn label="신규" color="primary" class="q-mt-md q-mr-md float-right" icon="edit_document" @click="openCreateShopGroupPopup" />
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col row full-height">
      <div class="col-3 column q-mt-sm  full-height">
        <q-input
          v-model="groupNameSearch"
          outlined
          placeholder="검색"
        />
        <q-card class="q-mt-md col column">
          <q-card-section class="text-center">
            <span class="text-bold">그룹</span>
            <q-separator class="q-mt-md" />
          </q-card-section>
          <q-card-section class="col overflow-auto">
            <q-list>
              <template v-if="filteredShopGroupList && filteredShopGroupList.length > 0">
                <q-item
                  v-for="group in filteredShopGroupList"
                  :key="group.shopGroupUuid"
                  clickable
                  @click="cloneShopGroup(group)"
                >
                  <q-item-section>
                    {{ group.shopGroupName }}
                  </q-item-section>
                </q-item>
              </template>
              <template v-else>
                <q-item>
                  <q-item-section>
                    그룹이 없습니다.
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
      <q-separator vertical class="q-mx-lg" />
      <div class="col column full-height">
        <q-card class="q-mt-md col column">
          <q-card-section class="text-center">
            <span class="text-bold">
              그룹 상세
            </span>
            <q-separator class="q-mt-md" />
          </q-card-section>
          <q-card-section class="col overflow-auto">
            <template v-if="selectedGroup">
              <ShopGroupInfo :selected-group="selectedGroup" @refresh="refreshData" />
              <q-separator class="q-mt-md" />
              <ShopGroupLinkInfo :shop-group-uuid="selectedGroup.shopGroupUuid" :shop-group-link-list="shopGroupLinkList" @refresh="refreshData" />
              <q-separator class="q-mt-md" />
              <ShopGroupMappedInfo :shop-group-uuid="selectedGroup.shopGroupUuid" :shop-group-mapped-list="shopGroupMappedList" @refresh="refreshData" />
              <q-separator class="q-mt-md" />
              <ShopGroupCustomLinkInfo :shop-group-uuid="selectedGroup.shopGroupUuid" :shop-group-custom-link-list="shopGroupCustomLinkList" @refresh="refreshData" />
            </template>
            <template v-else>
              <q-item>
                <q-item-section>
                  그룹을 선택해주세요.
                </q-item-section>
              </q-item>
            </template>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-dialog v-model="createShopGroupPopup">
      <q-card class="create_shop_group_popup">
        <q-card-section style="padding-bottom:10px">
          <div class="row justify-between">
            <div class="text-h6 text-bold">
              그룹생성
            </div>
            <div class="text-h6 cursor-pointer close-btn">
              <q-icon name="close" @click="closeCreateShopGroupPopup" />
            </div>
          </div>
          <q-separator class="q-mt-sm" />
        </q-card-section>
        <q-card-section>
          <div class="create_group_content col-1">
            <q-input
              v-model="createShopGroupName"
              outlined
              label="그룹명"
              placeholder="그룹명을 입력해주세요."
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="취소"
            color="primary"
            flat
            @click="closeCreateShopGroupPopup"
          />
          <q-btn
            label="저장"
            color="primary"
            flat
            @click="createShopGroup"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="scss">

.create_shop_group_popup{
  width: 400px;
}
.custom_image_ui{

}
</style>
