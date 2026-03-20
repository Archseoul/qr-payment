<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import useDayjs from 'dayjs'
import type { ShopAuthorityResponse } from '~/types'
import { useAuthStore } from '~/store/auth'

const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const dayjs = useDayjs
const $q = useQuasar()

const filter = ref('')
const pagination = ref({
  rowsPerPage: 0
})

const keyword = ref('')
const startDate = ref('')
const endDate = ref('')

// 권한 부여 현황 리스트 조회
const fetchGrants = () => {
  const params: Record<string, any> = {
    isPg: false
  }
  if (keyword.value) {
    params.keyword = keyword.value
  }
  if (startDate.value) {
    params.startDate = startDate.value
  }
  if (endDate.value) {
    params.endDate = endDate.value
  }
  return params
}

const grantListData = await useCustomFetch<ShopAuthorityResponse[]>('/admin/handOrder/shop/authority/grants', {
  method: 'GET',
  params: fetchGrants()
})

// EXPIRED와 TERMINATED 상태는 화면에 표시하지 않음 (엑셀 다운로드에만 포함)
const grantList = computed(() =>
  (grantListData.data.value ?? []).filter(grant =>
    grant.authorityStatus !== 'EXPIRED' && grant.authorityStatus !== 'TERMINATED'
  )
)

const columns: QTableProps['columns'] = [
  {
    name: 'authorityStatus',
    required: true,
    label: '상태',
    align: 'center',
    field: 'authorityStatus',
    sortable: true
  },
  {
    name: 'memberId',
    required: true,
    label: '요청자 ID',
    align: 'left',
    field: 'memberId',
    sortable: true
  },
  {
    name: 'requestDate',
    required: true,
    label: '요청일시',
    align: 'center',
    field: 'requestDate',
    sortable: true,
    format: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
  },
  {
    name: 'endDate',
    required: true,
    label: '만료/종료 일시',
    align: 'center',
    field: 'endDate',
    sortable: true,
    format: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
  },
  {
    name: 'shopCode',
    required: true,
    label: '매장코드',
    align: 'left',
    field: 'shopCode',
    sortable: true
  },
  {
    name: 'shopName',
    required: true,
    label: '매장명',
    align: 'left',
    field: 'shopName',
    sortable: true
  },
  {
    name: 'companyName',
    required: true,
    label: '관리 협력사명',
    align: 'left',
    field: 'companyName',
    sortable: true,
    format: (val: string) => val || '-'
  }
]

// 조회 기간 변경 시 재조회
const refreshWithDates = async () => {
  await grantListData.refresh()
}

// 엑셀 다운로드
const downloadExcel = async () => {
  try {
    const blob = await customFetch<Blob>('/admin/handOrder/shop/authority/grants/excel', {
      method: 'GET',
      responseType: 'blob',
      params: {
        isPg: false
      },
      onResponseError: () => {
        $q.notify({
          type: 'negative',
          message: '엑셀 다운로드에 실패하였습니다'
        })
      }
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `권한부여현황_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
    link.setAttribute('download', fileName)
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    $q.notify({
      type: 'positive',
      message: '엑셀 다운로드가 완료되었습니다'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '엑셀 다운로드 중 오류가 발생했습니다'
    })
  }
}

// 권한 강제 종료
const terminateAuthority = (grant: ShopAuthorityResponse) => {
  $q.dialog({
    title: '권한 종료',
    message: `${grant.shopName} 매장에 대한 ${grant.userName}님의 권한을 종료하시겠습니까?`,
    ok: {
      label: '종료',
      color: 'negative'
    },
    cancel: {
      label: '취소',
      color: 'grey-5'
    }
  }).onOk(async () => {
    try {
      await customFetch('/admin/handOrder/shop/authority/request', {
        method: 'POST',
        params: {
          shopSeq: grant.shopSeq,
          memberUuid: grant.memberUuid,
          type: 'TERMINATE',
          isPg: false
        },
        onResponse: (context) => {
          if (context.response.status === 200) {
            $q.notify({
              message: '권한이 종료되었습니다',
              color: 'positive',
              icon: 'check'
            })
            grantListData.refresh()
          }
        },
        onResponseError: () => {
          $q.notify({
            message: '권한 종료에 실패하였습니다',
            color: 'negative',
            icon: 'close'
          })
        }
      })
    } catch (error) {
      $q.notify({
        message: '권한 종료 중 오류가 발생했습니다',
        color: 'negative',
        icon: 'close'
      })
    }
  })
}

// 행 클릭 시 매장 정보 수정 모달 (hasShopInfoEditPermission이 있는 관리자만)
const handleRowClick = (_evt: Event, row: ShopAuthorityResponse) => {
  if (!authStore.userInfo.hasShopInfoEditPermission) {
    return
  }

  $q.dialog({
    component: defineAsyncComponent(() => import('~/components/ShopAuthorityEditModal.vue')),
    componentProps: {
      shopCode: row.shopCode
    }
  }).onOk(() => {
    refreshWithDates()
  })
}

// 상태 버튼 클릭 (ROLE_ADMIN만 가능)
const handleStatusClick = (row: ShopAuthorityResponse) => {
  if (authStore.userInfo.role !== 'ROLE_ADMIN') {
    return
  }

  terminateAuthority(row)
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">권한 부여 현황</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <q-card flat>
        <q-card-section>
          <div class="row q-col-gutter-md items-center">
            <div class="col-auto">
              <div class="text-subtitle2">
                조회 기간
              </div>
            </div>
            <div class="col-auto">
              <q-input
                v-model="startDate"
                dense
                outlined
                type="date"
                label="시작일"
                style="min-width: 150px"
              />
            </div>
            <div class="col-auto">
              <span class="text-subtitle2">~</span>
            </div>
            <div class="col-auto">
              <q-input
                v-model="endDate"
                dense
                outlined
                type="date"
                label="종료일"
                style="min-width: 150px"
              />
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                label="조회"
                @click="refreshWithDates"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <q-table
            v-model:pagination="pagination"
            style="height: 100%"
            flat
            bordered
            :rows="grantList ?? []"
            :columns="columns"
            row-key="grantSeq"
            virtual-scroll
            :rows-per-page-options="[0]"
            :filter="filter"
            hide-bottom
            class="shop-grant-table"
            @row-click="handleRowClick"
          >
            <template v-slot:top-left>
              <q-input
                v-model="filter"
                dense
                debounce="300"
                placeholder="매장명, 사용자명 또는 ID로 검색"
                style="min-width: 300px"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </template>

            <template v-slot:top-right>
              <q-btn
                color="primary"
                label="엑셀 다운로드"
                icon="download"
                @click="downloadExcel"
              />
            </template>

            <template v-slot:body="props">
              <q-tr
                :props="props"
                :class="authStore.userInfo.hasShopInfoEditPermission ? 'cursor-pointer' : ''"
                @click="(evt: Event) => handleRowClick(evt, props.row)"
              >
                <q-td
                  v-for="col in props.cols"
                  :key="col.name"
                  :props="props"
                >
                  <template v-if="col.name === 'authorityStatus'">
                    <q-btn
                      label="권한 부여"
                      color="green"
                      :disable="authStore.userInfo.role !== 'ROLE_ADMIN'"
                      size="sm"
                      padding="xs md"
                      no-caps
                      @click.stop="handleStatusClick(props.row)"
                    />
                  </template>
                  <template v-else>
                    {{ col.value }}
                  </template>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shop-grant-table {
  :deep(.q-table__top) {
    padding: 12px;
  }

  :deep(tbody tr.cursor-pointer) {
    &:hover {
      background-color: #f5f5f5;
    }
  }
}
</style>
