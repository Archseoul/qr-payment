<script setup lang="ts">
import type { Ref } from 'vue'
import { ref, computed, watch } from 'vue'
import { allMenuList, PERMISSION_READ, PERMISSION_WRITE, PERMISSION_UPDATE, PERMISSION_DELETE, PERMISSION_UPLOAD, PERMISSION_DOWNLOAD } from '~/utils/code'
import type { HoMenuAuthGroupVo } from '~/types'

// Quasar 컴포넌트 사용
const $q = useQuasar()

// API에서 메뉴 그룹 리스트를 가져옴
const menuGroupListData = await useCustomFetch<HoMenuAuthGroupVo[]>('/admin/handOrder/menu/auth', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

// computed로 변경하여 undefined와 null 모두 방지
const menuGroupList = menuGroupListData.data ?? []

// 필터링된 그룹 리스트 (검색 기능)
const filteredGroupList = computed(() => {
  if (!menuGroupList || menuGroupList.length === 0) {
    return []
  }
  if (!groupNameSearch.value.trim()) {
    return menuGroupList.value
  }
  return menuGroupList.value.filter((group: HoMenuAuthGroupVo) =>
    group.groupName.toLowerCase().includes(groupNameSearch.value.toLowerCase())
  )
})

// 선택된 그룹
const selectedGroup: Ref<HoMenuAuthGroupVo | null> = ref(null)

// 검색 및 팝업 관리
const groupNameSearch = ref('')
const createAuthPopup = ref(false)
const createAuthGroupName = ref('')
const editTitleActive = ref(false)

// 테이블 컬럼 정의
const menuColumns = [
  { name: 'menuName', label: $t('COMMON.033'), align: 'left', field: 'menuName' },
  { name: 'read', label: $t('COMMON.021'), align: 'center', field: 'read' },
  { name: 'write', label: $t('COMMON.034'), align: 'center', field: 'write' },
  { name: 'update', label: $t('COMMON.035'), align: 'center', field: 'update' },
  { name: 'delete', label: $t('COMMON.007'), align: 'center', field: 'delete' },
  { name: 'upload', label: $t('COMMON.036'), align: 'center', field: 'upload' },
  { name: 'download', label: $t('COMMON.037'), align: 'center', field: 'download' }
]
const pagination = ref({
  rowsPerPage: 0
})

// 권한 상태를 관리할 맵
const permissionMap = ref<{ [key: string]: number }>({})

// `menuAuth`를 파싱하여 `permissionMap`을 초기화
watch(selectedGroup, (newGroup) => {
  if (newGroup) {
    const authItems = newGroup.menuAuth.split('|')
    const map: { [key: string]: number } = {}
    authItems.forEach((auth) => {
      const menuCode = `${auth.slice(0, 2)}00`
      const permissionCode = parseInt(auth.slice(2))
      map[menuCode] = permissionCode
    })
    permissionMap.value = map
  } else {
    permissionMap.value = {}
  }
}, { immediate: true })

// 필터링된 메뉴 리스트
const filteredMenuList:any = computed(() => {
  return allMenuList
    .map((menu) => {
      const filteredSubMenu = menu.menuList.filter(subMenu =>
        subMenu.auth.includes('ALL') || subMenu.auth.includes('admin')
      ).filter((menu) => {
        // menuCode 1500,1600 제외 (메뉴 권한, 사용자 등록/현황 페이지)
        return menu?.menuCode !== '1500' && menu?.menuCode !== '1600'
      })
      if (menu.auth.includes('ALL') || menu.auth.includes('admin') || filteredSubMenu.length > 0) {
        return { ...menu, menuList: filteredSubMenu }
      }
      return null
    })
    .filter(menu => menu !== null)
})

// 특정 권한이 있는지 확인하는 함수
const hasPermission = (menuCode: string, permission: number): boolean => {
  if (!selectedGroup.value) { return false }
  const authItem = selectedGroup.value.menuAuth.split('|').find(auth => `${auth.slice(0, 2)}00` === menuCode)
  if (!authItem) { return false }
  const permissionCode = parseInt(authItem.slice(2), 10)
  return (permissionCode & permission) === permission
}

// 특정 권한을 토글하는 함수
const togglePermission = (menuCode: string, permission: number): void => {
  if (!selectedGroup.value) { return }

  const currentCode = permissionMap.value[menuCode] || 0
  const newCode = currentCode ^ permission
  permissionMap.value[menuCode] = newCode

  if (menuCode.slice(1, 2) === '0') {
    const menu = filteredMenuList.value.find((menu: { menuCode: string; }) => menu.menuCode === menuCode)
    if (menu.menuList) {
      menu.menuList.forEach((subMenu: { menuCode: string | number; }) => {
        const childCode = permissionMap.value[subMenu.menuCode] || 0
        const newChildCode = newCode & childCode
        permissionMap.value[subMenu.menuCode] = newChildCode
      })
    }
  }

  // `menuAuth` 문자열을 업데이트
  const authItems = Object.entries(permissionMap.value)
    .map(([code, perm]) => `${code.toString().slice(0, 2)}${perm.toString().padStart(2, '0')}`)
    .join('|')
  selectedGroup.value.menuAuth = authItems
}

// 그룹 생성 함수
const createAuthGroup = () => {
  if (createAuthGroupName.value.trim() === '') {
    $q.notify({
      message: $t('MENU_AUTH.001'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  $q.dialog({
    title: $t('MENU_AUTH.002'),
    message: $t('MENU_AUTH.003'),
    cancel: true,
    persistent: true,
    color: 'primary'
  }).onOk(async () => {
    const allAuthList = getAllAuthList()
    const newGroup: HoMenuAuthGroupVo = {
      authGroupSeq: 0,
      groupName: createAuthGroupName.value,
      menuAuth: allAuthList
    }
    selectedGroup.value = newGroup
    await customFetch('/admin/handOrder/menu/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newGroup)
    })
    $q.notify({
      message: $t('MENU_AUTH.004'),
      color: 'positive',
      position: 'top'
    })
    await menuGroupListData.refresh()
    closeCreateAuthPopup()
  })
}

// 모든 권한 리스트 생성 함수
const getAllAuthList = (): string => {
  return filteredMenuList.value.flatMap((menu: { menuCode: any; menuList: any[]; }) => [
    menu.menuCode,
    ...menu.menuList.map(subMenu => subMenu.menuCode)
  ]).map((auth: any) => `${auth.toString().slice(0, 2)}15`).join('|')
}

// 저장 함수 (추후 구현 필요)
const saveAuth = () => {
  if (!selectedGroup.value) {
    $q.notify({
      message: $t('MENU_AUTH.005'),
      color: 'negative',
      position: 'top'
    })
    return
  }

  $q.dialog({
    title: $t('COMMON.009'),
    message: $t('COMMON.038'),
    color: 'primary',
    ok: $t('COMMON.009'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await customFetch('/admin/handOrder/menu/auth', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedGroup.value)
    })
    $q.notify({
      message: `${$t('COMMON.009')} ${$t('COMMON.039')}`,
      color: 'positive',
      position: 'top'
    })
    await menuGroupListData.refresh()
    closeCreateAuthPopup()
  })
}

// 삭제 함수 (추후 구현 필요)
const deleteAuth = () => {
  if (!selectedGroup.value) {
    $q.notify({
      message: $t('MENU_AUTH.006'),
      color: 'negative',
      position: 'top'
    })
    return
  }
  $q.dialog({
    title: $t('COMMON.007'),
    message: $t('COMMON.038'),
    color: 'negative',
    ok: $t('COMMON.007'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/menu/auth/${selectedGroup.value?.authGroupSeq}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response:any) => {
      if (response.status === 200) {
        $q.notify({
          message: `${$t('MENU_AUTH.007')} ${$t('COMMON.039')}`,
          color: 'positive',
          position: 'top'
        })
      } else {
        $q.notify({
          message: response.message,
          color: 'negative',
          position: 'top'
        })
      }
    })
    await menuGroupListData.refresh()
    selectedGroup.value = null
  })
}

// 팝업 열기/닫기 함수
const openCreateAuthPopup = () => {
  createAuthPopup.value = true
}

const closeCreateAuthPopup = () => {
  createAuthPopup.value = false
  createAuthGroupName.value = ''
}

const editTitle = () => {
  editTitleActive.value = !editTitleActive.value
}
</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold"> {{ $t('MENU_AUTH.007') }} </span>
      <q-btn :label="$t('COMMON.007')" color="red" class="q-mt-md q-mr-md float-right" icon="delete" @click="deleteAuth" />
      <q-btn :label="$t('COMMON.009')" color="primary" class="q-mt-md q-mr-md float-right" icon="save" @click="saveAuth" />
      <q-btn :label="$t('COMMON.040')" color="primary" class="q-mt-md q-mr-md float-right" icon="edit_document" @click="openCreateAuthPopup" />
      <q-separator class="q-mt-lg" />
    </div>
    <div class="content-body col row full-height">
      <div class="col-3 column q-mt-sm full-height">
        <q-input
          v-model="groupNameSearch"
          outlined
          :placeholder="$t('COMMON.041')"
        />
        <q-card class="q-mt-md col overflow-auto">
          <q-card-section class="text-center">
            <span class="text-bold"> {{ $t('COMMON.042') }} </span>
            <q-separator class="q-mt-md" />
          </q-card-section>
          <q-card-section>
            <ClientOnly>
              <q-list style="max-height: 100%; overflow-y: auto;">
                <template v-if="filteredGroupList && filteredGroupList.length > 0">
                  <q-item
                    v-for="group in filteredGroupList"
                    :key="group.authGroupSeq"
                    clickable
                    @click="selectedGroup = group"
                  >
                    <q-item-section>
                      {{ group.groupName }}
                    </q-item-section>
                  </q-item>
                </template>
                <template v-else>
                  <q-item>
                    <q-item-section>
                      {{ $t('MENU_AUTH.008') }}
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>
              <template v-slot:fallback>
                <q-list>
                  <q-item>
                    <q-item-section>
                      <q-skeleton type="text" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>
            </ClientOnly>
          </q-card-section>
        </q-card>
      </div>
      <q-separator vertical class="q-mx-lg" />
      <div class="col column full-height">
        <q-card class="q-mt-md col column">
          <q-card-section class="text-center">
            <span class="text-bold">

              <template v-if="!editTitleActive">
                <div>
                  <!--                  <q-icon v-if="selectedGroup?.groupName" name="edit" class="q-mr-sm" @click="editTitle" />-->
                  {{ selectedGroup?.groupName ?? $t('COMMON.043') }}
                </div>
              </template>
              <template v-else>
                <div class="row justify-center items-center">
                  <q-icon name="save" class="q-ml-sm" @click="editTitle" />
                  <q-input v-model="selectedGroup.groupName" dense outlined class="title-box" />
                </div>
              </template>

            </span>
            <q-separator class="q-mt-md" />
          </q-card-section>
          <q-card-section class="col">
            <template v-if="selectedGroup">
              <q-table
                :pagination="pagination"
                :rows-per-page-options="[0]"
                :rows="filteredMenuList"
                :columns="menuColumns"
                row-key="menuCode"
                flat
                virtual-scroll
                hide-bottom
                class="full-height auth_table"
              >
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td auto-width>
                      <div class="row items-center text-bold">
                        {{ $t(props.row.menuName) }}
                      </div>
                    </q-td>
                    <q-td align="center">
                      <q-checkbox
                        :model-value="hasPermission(props.row.menuCode, PERMISSION_READ)"
                        color="primary"
                        @update:model-value="togglePermission(props.row.menuCode, PERMISSION_READ)"
                      />
                    </q-td>
                    <q-td align="center">
                      <q-checkbox
                        :model-value="hasPermission(props.row.menuCode, PERMISSION_WRITE)"
                        color="primary"
                        @update:model-value="togglePermission(props.row.menuCode, PERMISSION_WRITE)"
                      />
                    </q-td>
                    <q-td align="center">
                      <q-checkbox
                        :model-value="hasPermission(props.row.menuCode, PERMISSION_UPDATE)"
                        color="primary"
                        @update:model-value="togglePermission(props.row.menuCode, PERMISSION_UPDATE)"
                      />
                    </q-td>
                    <q-td align="center">
                      <q-checkbox
                        :model-value="hasPermission(props.row.menuCode, PERMISSION_DELETE)"
                        color="primary"
                        @update:model-value="togglePermission(props.row.menuCode, PERMISSION_DELETE)"
                      />
                    </q-td>
                    <q-td align="center">
                      <q-checkbox
                        :model-value="hasPermission(props.row.menuCode, PERMISSION_UPLOAD)"
                        color="primary"
                        @update:model-value="togglePermission(props.row.menuCode, PERMISSION_UPLOAD)"
                      />
                    </q-td>
                    <q-td align="center">
                      <q-checkbox
                        :model-value="hasPermission(props.row.menuCode, PERMISSION_DOWNLOAD)"
                        color="primary"
                        @update:model-value="togglePermission(props.row.menuCode, PERMISSION_DOWNLOAD)"
                      />
                    </q-td>
                  </q-tr>
                  <!-- 서브 메뉴 렌더링 -->
                  <template v-for="subMenu in props.row.menuList" :key="subMenu.menuCode">
                    <q-tr>
                      <q-td class="pl-4 sub-title" colspan="1">
                        └ {{ $t(subMenu.menuName) }}
                      </q-td>
                      <q-td align="center">
                        <q-checkbox
                          :model-value="hasPermission(subMenu.menuCode, PERMISSION_READ)"
                          color="primary"
                          :disable="!hasPermission(props.row.menuCode, PERMISSION_READ)"
                          @update:model-value="togglePermission(subMenu.menuCode, PERMISSION_READ)"
                        />
                      </q-td>
                      <q-td align="center">
                        <q-checkbox
                          :model-value="hasPermission(subMenu.menuCode, PERMISSION_WRITE)"
                          color="primary"
                          :disable="!hasPermission(props.row.menuCode, PERMISSION_WRITE)"
                          @update:model-value="togglePermission(subMenu.menuCode, PERMISSION_WRITE)"
                        />
                      </q-td>
                      <q-td align="center">
                        <q-checkbox
                          :model-value="hasPermission(subMenu.menuCode, PERMISSION_UPDATE)"
                          color="primary"
                          :disable="!hasPermission(props.row.menuCode, PERMISSION_UPDATE)"
                          @update:model-value="togglePermission(subMenu.menuCode, PERMISSION_UPDATE)"
                        />
                      </q-td>
                      <q-td align="center">
                        <q-checkbox
                          :model-value="hasPermission(subMenu.menuCode, PERMISSION_DELETE)"
                          color="primary"
                          :disable="!hasPermission(props.row.menuCode, PERMISSION_DELETE)"
                          @update:model-value="togglePermission(subMenu.menuCode, PERMISSION_DELETE)"
                        />
                      </q-td>
                      <q-td align="center">
                        <q-checkbox
                          :model-value="hasPermission(subMenu.menuCode, PERMISSION_UPLOAD)"
                          color="primary"
                          :disable="!hasPermission(props.row.menuCode, PERMISSION_UPLOAD)"
                          @update:model-value="togglePermission(subMenu.menuCode, PERMISSION_UPLOAD)"
                        />
                      </q-td>
                      <q-td align="center">
                        <q-checkbox
                          :model-value="hasPermission(subMenu.menuCode, PERMISSION_DOWNLOAD)"
                          color="primary"
                          :disable="!hasPermission(props.row.menuCode, PERMISSION_DOWNLOAD)"
                          @update:model-value="togglePermission(subMenu.menuCode, PERMISSION_DOWNLOAD)"
                        />
                      </q-td>
                    </q-tr>
                  </template>
                </template>
              </q-table>
            </template>
            <template v-else>
              <q-item>
                <q-item-section>
                  {{ $t('MENU_AUTH.009') }}
                </q-item-section>
              </q-item>
            </template>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="createAuthPopup">
      <q-card class="create_auth_popup">
        <q-card-section style="padding-bottom:10px">
          <div class="row justify-between">
            <div class="text-h6 text-bold">
              {{ $t('MENU_AUTH.002') }}
            </div>
            <div class="text-h6 cursor-pointer close-btn">
              <q-icon name="close" @click="closeCreateAuthPopup" />
            </div>
          </div>
          <q-separator class="q-mt-sm" />
        </q-card-section>
        <q-card-section>
          <div class="create_group_content col-1">
            <q-input
              v-model="createAuthGroupName"
              outlined
              :label="$t('COMMON.044')"
              :placeholder="$t('MENU_AUTH.010')"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            :label="$t('COMMON.005')"
            color="primary"
            flat
            @click="closeCreateAuthPopup"
          />
          <q-btn
            :label="$t('COMMON.009')"
            color="primary"
            flat
            @click="createAuthGroup"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="scss">

.title-box{
  width: 200px;
}
.auth_table{
  .sub-title{
    padding-left: 20px;
  }
  .q-checkbox.disabled{
    :deep(.q-checkbox__bg){
      background-color: rgba(0, 0, 0, 0.2);
      border-color: rgba(0, 0, 0, 0.2);
    }
  }
}

.create_auth_popup{
  width: 400px;
}
</style>
