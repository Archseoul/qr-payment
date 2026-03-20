<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useQuasar, QSelect } from 'quasar'

import { computed, ref, type Ref, watch } from 'vue'
import type { AdminMemberVo, HoMenuAuthGroupVo, ShopInfoVo } from '~/types/'
import { allMenuList, PERMISSION_READ, PERMISSION_WRITE, PERMISSION_UPDATE, PERMISSION_DELETE, PERMISSION_UPLOAD, PERMISSION_DOWNLOAD } from '~/utils/code'
const $q = useQuasar()
const filter = ref('')
const memberPopup = ref(false)
const changePasswordPopup = ref(false)
const selectedMemberList:Ref<AdminMemberVo[]> = ref([])
const selectedMember:Ref<AdminMemberVo | null> = ref(null)
const passwordConfirm = ref('')
const isIdAvailable = ref(false)
const idInputRef = ref<any>(null)

const checkId = async () => {
  if (member.value.id.length !== 0) {
    isIdAvailable.value = await customFetch<boolean>('/admin/handOrder/member/id/check-available', {
      method: 'GET',
      params: { id: member.value.id }
    })
    isIdAvailable.value
      ? $q.notify({ message: $t('COMPANY.057'), color: 'positive', icon: 'check' })
      : $q.notify({ message: $t('COMPANY.058'), color: 'negative', icon: 'close' })
    idInputRef.value?.validate()
  }
}

const isEditingAuthority = ref(false)
// 수정 모드용 권한 데이터
const editingAuthorityData = ref<{
  isAuthorityRequestBlocked: boolean
  hasShopInfoEditPermission: boolean
}>({
  isAuthorityRequestBlocked: false,
  hasShopInfoEditPermission: false
})
const memberListData = await useCustomFetch<AdminMemberVo[]>('/admin/handOrder/v2/member', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const memberList:Ref<AdminMemberVo[] | null> = memberListData.data

const menuAuthGroupListData = await useCustomFetch<HoMenuAuthGroupVo[]>('/admin/handOrder/menu/v2/auth', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const menuAuthGroupList:Ref<HoMenuAuthGroupVo[]> = menuAuthGroupListData.data

const selectedGroup:Ref<HoMenuAuthGroupVo | null> = ref(null)

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

const hasPermission = (menuCode: string, permission: number): boolean => {
  if (!selectedGroup.value) { return false }
  const authItem = selectedGroup.value.menuAuth.split('|').find(auth => `${auth.slice(0, 2)}00` === menuCode)
  if (!authItem) { return false }
  const permissionCode = parseInt(authItem.slice(2), 10)
  return (permissionCode & permission) === permission
}

const memberSearchType = ref('admin')
const menuColumns = [
  { name: 'menuName', label: $t('COMMON.033'), align: 'left', field: 'menuName' },
  { name: 'read', label: $t('COMMON.021'), align: 'center', field: 'read' },
  { name: 'write', label: $t('COMMON.034'), align: 'center', field: 'write' },
  { name: 'update', label: $t('COMMON.035'), align: 'center', field: 'update' },
  { name: 'delete', label: $t('COMMON.007'), align: 'center', field: 'delete' },
  { name: 'upload', label: $t('COMMON.036'), align: 'center', field: 'upload' },
  { name: 'download', label: $t('COMMON.037'), align: 'center', field: 'download' }
]

const filterMemberList = ref<AdminMemberVo[]>([])

// memberList나 memberSearchType이 변경될 때 filterMemberList 업데이트
watch([memberList, memberSearchType], () => {
  filterMemberList.value = memberList.value?.filter((item) => {
    return item.userType === memberSearchType.value
  }) || []
}, { immediate: true })

const member = ref({
  memberUuid: '',
  id: '',
  password: '',
  userName: '',
  storeSeq: '',
  role: '',
  companySeq: 0,
  userType: 'admin',
  email: '',
  isAuthorityRequestBlocked: false,
  hasShopInfoEditPermission: false,
  shopInfo: {} as ShopInfoVo
})

const userTypes = ref([
  {
    label: $t('MEMBER.002'),
    value: 'admin'
  },
  {
    label: $t('MEMBER.003'),
    value: 'shop'
  },
  {
    label: $t('MEMBER.004'),
    value: 'company'
  },
  {
    label: $t('MEMBER.005'),
    value: 'worker'
  }
])

const columns = computed<QTableProps['columns']>(() => {
  const baseColumns:QTableProps['columns'] = [
    {
      name: 'userType',
      required: true,
      label: $t('COMMON.029'),
      align: 'left',
      field: 'userType',
      sortable: true,
      format: (val:string) => `${val == null ? '-' : userTypes.value.find(item => item.value === val)?.label}`
    },
    {
      name: 'id',
      required: true,
      label: $t('COMMON.018'),
      align: 'left',
      field: 'id',
      sortable: true
    },
    {
      name: 'userName',
      required: true,
      label: $t('COMMON.017'),
      align: 'left',
      field: 'userName',
      sortable: true,
      format: (val:string) => `${val == null ? '-' : val}`
    },
    {
      name: 'email',
      required: true,
      label: $t('COMMON.019'),
      align: 'left',
      field: 'email',
      sortable: true,
      format: (val:string) => `${val == null ? '-' : val}`
    }]

  // 관리자 타입일 때만 권한 관련 컬럼 추가
  if (memberSearchType.value === 'admin') {
    baseColumns.push(
      {
        name: 'isAuthorityRequestBlocked',
        required: true,
        label: $t('MEMBER.027'),
        align: 'center',
        field: 'isAuthorityRequestBlocked',
        sortable: true
      },
      {
        name: 'hasShopInfoEditPermission',
        required: true,
        label: $t('MEMBER.028'),
        align: 'center',
        field: 'hasShopInfoEditPermission',
        sortable: true
      }
    )
  }

  baseColumns.push({
    name: 'passwordChange',
    required: true,
    label: $t('COMMON.045'),
    align: 'center',
    field: 'passwordChange'
  })

  return baseColumns
})

const pagination = ref({
  rowsPerPage: 0
})

const submitMember = async () => {
  member.value.shopInfo.franchiseYn = 'Y'
  await customFetch('/admin/handOrder/v2/member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(member.value)
  }).then(async () => {
    memberPopup.value = false
    await memberListData.refresh()
  })
}

const selectedMemberSequence = async () => {
  if (memberSearchType.value !== 'admin') { return }
  if (!selectedMemberList.value.length) { return }
  selectedMember.value = selectedMemberList.value[0]
  selectedGroup.value = null
  if (selectedMember.value.userType === 'admin') {
    if (!selectedMember.value.authGroupSeq) { return }
    const { data: menuAuth } = await useCustomFetch<HoMenuAuthGroupVo>(`/admin/handOrder/menu/auth/${selectedMember.value.authGroupSeq}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    selectedGroup.value = menuAuth.value
  }
}

const saveMemberAuth = async () => {
  if (!selectedGroup.value) { return }
  await customFetch('/admin/handOrder/member/menu/auth', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      authGroupSeq: selectedGroup.value.authGroupSeq,
      memberUuid: selectedMember.value?.memberUuid
    })
  }).then(async () => {
    $q.notify({
      message: $t('MEMBER.006'),
      color: 'positive',
      icon: 'check'
    })
    await memberListData.refresh()
  })
}

const changePassword = () => {
  $q.dialog({
    title: $t('COMMON.045'),
    message: $t('MEMBER.007'),
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await customFetch('/admin/handOrder/member', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedMember.value)
    }).then(async () => {
      $q.notify({
        message: $t('MEMBER.008'),
        color: 'positive',
        icon: 'check'
      })
      changePasswordPopup.value = false

      await memberListData.refresh()
    })
  })
}

const openChangePasswordPopup = () => {
  selectedMember.value = selectedMemberList.value[0]
  selectedMember.value.password = ''
  passwordConfirm.value = ''
  changePasswordPopup.value = true
}

const openCreateMemberPopup = () => {
  passwordConfirm.value = ''
  isIdAvailable.value = false
  memberPopup.value = true
}

// 권한 수정 모드 활성화/비활성화
const openAuthorityEditPopup = () => {
  if (!selectedMemberList.value.length) {
    $q.notify({
      message: $t('MEMBER.024'),
      color: 'warning',
      icon: 'warning'
    })
    return
  }

  selectedMember.value = selectedMemberList.value[0] ?? null
  if (!selectedMember.value) {
    return
  }
  // 현재 값으로 편집 데이터 초기화
  editingAuthorityData.value = {
    isAuthorityRequestBlocked: selectedMember.value.isAuthorityRequestBlocked || false,
    hasShopInfoEditPermission: selectedMember.value.hasShopInfoEditPermission || false
  }
  isEditingAuthority.value = true
}

// 권한 저장
const saveAuthority = async () => {
  if (!selectedMember.value) {
    return
  }

  await customFetch('/admin/handOrder/permissions', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      memberUuid: selectedMember.value.memberUuid,
      isAuthorityRequestBlocked: editingAuthorityData.value.isAuthorityRequestBlocked,
      hasShopInfoEditPermission: editingAuthorityData.value.hasShopInfoEditPermission
    }])
  }).then(async () => {
    $q.notify({
      message: $t('MEMBER.025'),
      color: 'positive',
      icon: 'check'
    })
    isEditingAuthority.value = false
    selectedMemberList.value = []
    selectedMember.value = null
    await memberListData.refresh()
  }).catch(() => {
    $q.notify({
      message: $t('MEMBER.026'),
      color: 'negative',
      icon: 'close'
    })
  })
}

// 권한 수정 취소
const cancelAuthorityEdit = async () => {
  isEditingAuthority.value = false
  selectedMemberList.value = []
  selectedMember.value = null
  // 데이터 새로고침하여 원래 값으로 되돌림
  await refreshNuxtData('/admin/handOrder/member')
}

// 권한 요청 제한 체크박스 변경 핸들러
const handleAuthorityRequestBlockedChange = (_row: AdminMemberVo, val: boolean) => {
  editingAuthorityData.value.isAuthorityRequestBlocked = val
  // 권한 요청 제한이 해제되면 매장정보 수정권한도 자동으로 해제
  if (!val) {
    editingAuthorityData.value.hasShopInfoEditPermission = false
  }
}

// 매장정보 수정권한 체크박스 변경 핸들러
const handleShopInfoEditPermissionChange = (_row: AdminMemberVo, val: boolean) => {
  editingAuthorityData.value.hasShopInfoEditPermission = val
  // 매장정보 수정권한이 체크되면 권한 요청 제한도 자동으로 체크
  if (val) {
    editingAuthorityData.value.isAuthorityRequestBlocked = true
  }
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.006') }}</span>

      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col overflow-auto no-wrap" :class="memberSearchType !== 'admin' ? '' : 'column'">
      <q-table
        v-model:pagination="pagination"
        v-model:selected="selectedMemberList"
        flat
        bordered
        :rows="filterMemberList"
        :columns="columns"
        row-key="memberUuid"
        virtual-scroll
        :rows-per-page-options="[0]"
        :filter="filter"
        hide-bottom
        class="member-table"
        :class="memberSearchType !== 'admin' ? 'full-height' : 'admin-height'"
        :selection="isEditingAuthority ? 'none' : 'single'"
      >
        <template v-slot:body-cell-isAuthorityRequestBlocked="props">
          <q-td :props="props">
            <q-checkbox
              v-if="isEditingAuthority && selectedMember?.memberUuid === props.row.memberUuid"
              :model-value="editingAuthorityData.isAuthorityRequestBlocked"
              @update:model-value="(val) => handleAuthorityRequestBlockedChange(props.row, val)"
            />
            <q-checkbox
              v-else
              :model-value="props.row.isAuthorityRequestBlocked"
              :disable="true"
            />
          </q-td>
        </template>
        <template v-slot:body-cell-hasShopInfoEditPermission="props">
          <q-td :props="props">
            <q-checkbox
              v-if="isEditingAuthority && selectedMember?.memberUuid === props.row.memberUuid"
              :model-value="editingAuthorityData.hasShopInfoEditPermission"
              :disable="!editingAuthorityData.isAuthorityRequestBlocked"
              @update:model-value="(val) => handleShopInfoEditPermissionChange(props.row, val)"
            />
            <q-checkbox
              v-else
              :model-value="props.row.hasShopInfoEditPermission"
              :disable="true"
            />
          </q-td>
        </template>
        <template v-slot:top-right>
          <q-btn
            v-if="memberSearchType === 'admin' && !isEditingAuthority"
            color="primary"
            :label="$t('MEMBER.023')"
            class="q-mr-md"
            @click="openAuthorityEditPopup"
          />
          <template v-if="isEditingAuthority">
            <q-btn
              color="positive"
              :label="$t('COMMON.009')"
              class="q-mr-md"
              @click="saveAuthority"
            />
            <q-btn
              color="negative"
              :label="$t('COMMON.005')"
              class="q-mr-md"
              flat
              @click="cancelAuthorityEdit"
            />
          </template>
          <q-btn
            v-if="memberSearchType === 'admin'"
            color="primary"
            :label="$t('MEMBER.009')"
            @click="openCreateMemberPopup"
          />
          <q-btn
            v-if="memberSearchType === 'admin'"
            color="primary"
            :label="$t('MEMBER.010')"
            class="q-ml-md"
            @click="selectedMemberSequence"
          />
          <q-btn
            color="primary"
            :label="$t('COMMON.045')"
            class="q-ml-md"
            @click="openChangePasswordPopup"
          />
        </template>
        <template v-slot:top-left>
          <div class="full-width row">
            <q-input v-model="filter" dense debounce="300" placeholder="Search" class="member-filter">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-select
              v-model="memberSearchType"
              :options="userTypes"
              :label="$t('MEMBER.011')"
              class=""
              emit-value
              map-options
              dense
              style="width: 200px;margin-left:8px"
            />
          </div>
        </template>
      </q-table>
      <!--    관리자 권한 관리  -->
      <template v-if="memberSearchType === 'admin'">
        <q-card class="q-my-lg">
          <q-card-section>
            <div>
              <span class="text-h6 text-bold">{{ $t('MEMBER.012') }}</span>
              <div class="float-right row items-center">
                <span class="q-mr-lg">
                  {{ $t('MEMBER.013') }} :
                  <span v-if="selectedMember">{{ selectedMember.id }}</span>
                  <span v-else>-</span>
                </span>
                <q-select
                  v-model="selectedGroup"
                  :options="menuAuthGroupList"
                  option-label="groupName"
                  :label="$t('MEMBER.014')"
                  emit-value
                  map-options
                  dense
                  style="width: 200px"
                />

                <q-btn
                  v-if="selectedGroup"
                  color="primary"
                  :label="$t('MEMBER.015')"
                  class="q-ml-md"
                  @click="saveMemberAuth"
                />
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section v-if="selectedGroup">
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
                    {{ hasPermission(props.row.menuCode, PERMISSION_READ) ? 'O' : 'X' }}
                  </q-td>
                  <q-td align="center">
                    {{ hasPermission(props.row.menuCode, PERMISSION_WRITE) ? 'O' : 'X' }}
                  </q-td>
                  <q-td align="center">
                    {{ hasPermission(props.row.menuCode, PERMISSION_UPDATE) ? 'O' : 'X' }}
                  </q-td>
                  <q-td align="center">
                    {{ hasPermission(props.row.menuCode, PERMISSION_DELETE) ? 'O' : 'X' }}
                  </q-td>
                  <q-td align="center">
                    {{ hasPermission(props.row.menuCode, PERMISSION_UPLOAD) ? 'O' : 'X' }}
                  </q-td>
                  <q-td align="center">
                    {{ hasPermission(props.row.menuCode, PERMISSION_DOWNLOAD) ? 'O' : 'X' }}
                  </q-td>
                </q-tr>
                <!-- 서브 메뉴 렌더링 -->
                <template v-for="subMenu in props.row.menuList" :key="subMenu.menuCode">
                  <q-tr>
                    <q-td class="pl-4 sub-title" colspan="1">
                      └ {{ $t(subMenu.menuName) }}
                    </q-td>
                    <q-td align="center">
                      {{ hasPermission(subMenu.menuCode, PERMISSION_READ) ? 'O' : 'X' }}
                    </q-td>
                    <q-td align="center">
                      {{ hasPermission(subMenu.menuCode, PERMISSION_WRITE) ? 'O' : 'X' }}
                    </q-td>
                    <q-td align="center">
                      {{ hasPermission(subMenu.menuCode, PERMISSION_UPDATE) ? 'O' : 'X' }}
                    </q-td>
                    <q-td align="center">
                      {{ hasPermission(subMenu.menuCode, PERMISSION_DELETE) ? 'O' : 'X' }}
                    </q-td>
                    <q-td align="center">
                      {{ hasPermission(subMenu.menuCode, PERMISSION_UPLOAD) ? 'O' : 'X' }}
                    </q-td>
                    <q-td align="center">
                      {{ hasPermission(subMenu.menuCode, PERMISSION_DOWNLOAD) ? 'O' : 'X' }}
                    </q-td>
                  </q-tr>
                </template>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </template>
      <q-dialog v-model="memberPopup" persistent>
        <q-card>
          <q-card-section>
            <div class="text-h6 text-bold">
              {{ $t('MEMBER.009') }}
            </div>
          </q-card-section>

          <q-separator />
          <q-form style="width: 500px" @submit="submitMember">
            <q-card-section style="max-height: 50vh" class="scroll">
              <div class="text-bold">
                {{ $t('MEMBER.016') }}
              </div>
              <q-input
                ref="idInputRef"
                v-model="member.id"
                :label="$t('COMMON.018')"
                lazy-rules
                outlined
                :rules="[
                  val => val && val.length > 0 || $t('LOGIN.002'),
                  () => isIdAvailable || $t('COMPANY.062')
                ]"
                class="q-mb-sm input-width70"
                dense
                @update:model-value="(val) => { isIdAvailable = false; if (typeof val === 'string') member.id = val.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '') }"
              >
                <template #append>
                  <q-btn
                    color="primary"
                    dense
                    flat
                    icon="search"
                    @click="checkId"
                  />
                </template>
              </q-input>
              <q-input
                v-model="member.password"
                :label="$t('COMMON.046')"
                type="password"
                lazy-rules
                outlined
                :rules="[
                  val => val && val.length > 0 || $t('LOGIN.004'),
                  val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(val) || $t('COMPANY.064')
                ]"
                class="q-mb-md input-width70"
                dense
              />
              <q-input
                v-model="passwordConfirm"
                :label="$t('COMMON.048')"
                type="password"
                lazy-rules
                outlined
                :rules="[val => val && val.length > 0 || $t('LOGIN.004'), val => val === member.password || $t('COMMON.049')]"
                class="q-mb-md input-width70"
                dense
              />
              <q-input
                v-model="member.userName"
                :label="$t('COMMON.017')"
                lazy-rules
                outlined
                :rules="[val => val && val.length > 0 || $t('MEMBER.017')]"
                class="q-mb-md input-width70"
                dense
              />
              <q-input
                v-model="member.email"
                :label="$t('COMMON.019')"
                lazy-rules
                outlined
                :rules="[val => val && val.length > 0 || $t('MEMBER.018')]"
                class="q-mb-md input-width70"
                dense
              />
              <q-select
                v-model="member.userType"
                :options="userTypes"
                :label="$t('MEMBER.011')"
                class="input-width70"
                emit-value
                map-options
                readonly
              />
              <template v-if="member.userType == 'admin'">
                <q-separator class="q-mt-lg q-mb-md" />
                <div class="text-bold q-mb-lg">
                  {{ $t('MEMBER.029') }}
                </div>
                <div class="q-mb-md">
                  <q-checkbox
                    v-model="member.isAuthorityRequestBlocked"
                    :label="$t('MEMBER.027')"
                    @update:model-value="(val) => { if (!val) member.hasShopInfoEditPermission = false }"
                  />
                </div>
                <div class="q-mb-md">
                  <q-checkbox
                    v-model="member.hasShopInfoEditPermission"
                    :disable="!member.isAuthorityRequestBlocked"
                    :label="$t('MEMBER.028')"
                  />
                </div>
              </template>
              <template v-if="member.userType == 'shop'">
                <q-separator class="q-mt-lg q-mb-md" />
                <div class="text-bold q-mb-lg">
                  {{ $t('MEMBER.019') }}
                </div>
                <div>
                  <q-input
                    v-model="member.shopInfo.shopName"
                    :label="$t('COMMON.027')"
                    lazy-rules
                    outlined
                    :rules="[val => val && val.length > 0 || $t('MEMBER.020')]"
                    class="q-mb-md input-width70"
                    dense
                  />
                  <q-input
                    v-model="member.shopInfo.address1"
                    :label="$t('COMMON.031')"
                    lazy-rules
                    outlined
                    :rules="[val => val && val.length > 0 || $t('MEMBER.021')]"
                    class="q-mb-md input-width70"
                    dense
                  />
                  <q-select
                    v-model="member.shopInfo.linkType"
                    :options="linkType"
                    :label="$t('MEMBER.022')"
                    class="input-width70"
                    emit-value
                    map-options
                  />
                </div>
              </template>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
              <q-btn v-close-popup flat :label="$t('COMMON.005')" color="red" />
              <q-btn flat :label="$t('COMMON.009')" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
      <q-dialog v-model="changePasswordPopup" persistent>
        <q-card>
          <q-card-section>
            <div class="text-h6 text-bold">
              {{ $t('COMMON.045') }}
            </div>
          </q-card-section>

          <q-separator />
          <q-form style="width: 500px" @submit="changePassword">
            <q-card-section style="max-height: 50vh" class="scroll">
              <q-input
                v-model="selectedMember!.password"
                :label="$t('COMMON.046')"
                type="password"
                lazy-rules
                outlined
                :rules="[
                  val => val && val.length > 0 || $t('LOGIN.004'),
                  val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(val) || $t('COMPANY.064')
                ]"
                class="q-mb-sm input-width70"
                dense
              />
              <q-input
                v-model="passwordConfirm"
                :label="$t('COMMON.048')"
                type="password"
                lazy-rules
                outlined
                :rules="[val => val && val.length > 0 || $t('LOGIN.004'), val => val === selectedMember.password || $t('COMPANY.063')]"
                class="q-mb-md input-width70"
                dense
              />
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
              <q-btn v-close-popup flat :label="$t('COMMON.005')" color="red" />
              <q-btn flat :label="$t('COMMON.009')" color="primary" type="submit" />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main-content{
  padding: 30px;
  .member-table{
    :deep(.q-checkbox__inner){
      color:var(--handorder-color) !important;
    }
  }
}
.input-width70{
  width: 70% !important;
}

.admin-height{
  height: 500px;
}

</style>
