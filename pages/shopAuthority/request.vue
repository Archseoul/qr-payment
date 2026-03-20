<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import type { ShopAuthorityResponse } from '~/types'

const $q = useQuasar()

const searchKeyword = ref('')
const shopList = ref<ShopAuthorityResponse[]>([])
const isSearched = ref(false)
const isLoading = ref(false)
const pagination = ref({
  rowsPerPage: 0
})

// 매장 검색 함수
const searchShops = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    return
  }

  isLoading.value = true
  try {
    shopList.value = await customFetch<ShopAuthorityResponse[]>('/admin/handOrder/shop/authority/requests', {
      method: 'GET',
      params: { keyword, isPg: false }
    })
    isSearched.value = true
  } catch {
    shopList.value = []
  } finally {
    isLoading.value = false
  }
}

const columns: QTableProps['columns'] = [
  {
    name: 'action',
    required: true,
    label: '권한 요청',
    align: 'center',
    field: 'shopSeq'
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
    name: 'shopStatus',
    required: true,
    label: '매장 상태',
    align: 'center',
    field: 'shopStatus',
    sortable: true,
    format: (val: string) => {
      switch (val) {
        case 'PENDING': return '이용 대기'
        case 'TEST': return '테스트'
        case 'ACTIVE': return '이용'
        case 'TERMINATE': return '종료'
        default: return '-'
      }
    }
  },
  {
    name: 'address1',
    required: true,
    label: '주소',
    align: 'left',
    field: 'address1',
    sortable: true,
    format: (val: string) => val || '-'
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

// 권한 요청 처리
const requestAuthority = async (shopSeq: number, shopName: string) => {
  try {
    await customFetch('/admin/handOrder/shop/authority/request', {
      method: 'POST',
      params: { shopSeq, type: 'REQUEST', isPg: false }
    })

    // 요청 성공 시 해당 매장의 authorityStatus 업데이트
    const shop = shopList.value.find(s => s.shopSeq === shopSeq)
    if (shop) {
      shop.authorityStatus = 'REQUESTED'
    }

    // 성공 다이얼로그 표시
    $q.dialog({
      title: '권한 요청 완료',
      message: `${shopName} 매장에 대한 권한 요청이 완료되었습니다.\n48시간 동안 해당 매장을 확인하실 수 있습니다.`,
      ok: { label: '확인', color: 'primary' }
    })
  } catch (error: any) {
    $q.notify({
      message: error?.data?.message || '권한 요청에 실패하였습니다',
      color: 'negative',
      icon: 'close'
    })
  }
}

// 권한 요청 버튼 클릭 시 확인 다이얼로그
const handleRequestClick = (row: ShopAuthorityResponse) => {
  if (isRequestedShop(row)) {
    return
  }

  $q.dialog({
    title: '매장 권한 요청',
    message: `${row.shopName} 매장에 대한 권한을 요청하시겠습니까?\n권한 요청 후 48시간 동안 해당 매장을 확인하실 수 있습니다.`,
    ok: { label: '권한 요청', color: 'primary' },
    cancel: { label: '취소', color: 'grey-5' }
  }).onOk(() => requestAuthority(row.shopSeq, row.shopName))
}

// 이미 요청한 매장인지 확인 (authorityStatus 기반)
const isRequestedShop = (row: ShopAuthorityResponse) => {
  return row.authorityStatus === 'REQUESTED' || row.authorityStatus === 'APPROVED'
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">매장 권한 요청</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <q-card flat>
        <q-card-section>
          <div class="text-subtitle1 text-bold q-mb-md">
            매장 검색
          </div>
          <div class="text-body2 text-grey-7 q-mb-md">
            매장명 또는 매장코드를 입력하고 검색 버튼을 클릭하거나 엔터를 눌러주세요.
          </div>
          <div class="row q-col-gutter-md items-center q-mb-md">
            <div class="col-auto" style="min-width: 400px">
              <q-input
                v-model="searchKeyword"
                dense
                outlined
                placeholder="매장명 또는 매장코드로 검색"
                @keypress.enter="searchShops"
              >
                <template v-slot:append>
                  <q-icon name="search" class="cursor-pointer" @click="searchShops" />
                </template>
              </q-input>
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                label="검색"
                icon="search"
                :loading="isLoading"
                @click="searchShops"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="isSearched">
          <div v-if="shopList.length === 0" class="text-center text-grey-7 q-py-xl">
            검색 결과가 없습니다
          </div>
          <q-table
            v-else
            v-model:pagination="pagination"
            style="height: 100%"
            flat
            bordered
            :rows="shopList"
            :columns="columns"
            row-key="shopCode"
            virtual-scroll
            :rows-per-page-options="[0]"
            hide-bottom
            class="shop-authority-table"
          >
            <template v-slot:body-cell-action="props">
              <q-td :props="props">
                <q-btn
                  :label="isRequestedShop(props.row) ? '요청 완료' : '권한 요청'"
                  :color="isRequestedShop(props.row) ? 'grey-5' : 'primary'"
                  :disable="isRequestedShop(props.row)"
                  size="sm"
                  padding="xs md"
                  no-caps
                  @click="handleRequestClick(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-card-section v-else class="text-center text-grey-6 q-py-xl">
          <q-icon name="search" size="64px" color="grey-5" class="q-mb-md" />
          <div class="text-h6">
            매장을 검색해주세요
          </div>
          <div class="text-body2 q-mt-sm">
            매장명 또는 매장코드를 입력하고 검색해주세요
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shop-authority-table {
  :deep(.q-table__top) {
    padding: 12px;
  }

  :deep(tbody tr) {
    &:hover {
      background-color: #f5f5f5;
    }
  }
}
</style>
