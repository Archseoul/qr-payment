<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import useDayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import type { ShopInfoVo, ShopStatusPutDto, CompassShopStatusVo } from '~/types'

import ShopCreateModal from '~/components/ShopCreateModal.vue'
import { useAuthStore } from '~/store/auth'
import { encrypt } from '~/utils/encrypt'

const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { checkPermissions } = useCheckPermissions()
const $q = useQuasar()
const dayjs = useDayjs

const router = useRouter()
const pagination = ref({
  rowsPerPage: 0
})

const filter = ref('') // 검색어

const saveFilterString = (value:string|number|null) => {
  if (!value) { return }
  const strValue = value.toString()
  filter.value = strValue
  sessionStorage.setItem('shopFilter', strValue)
}

const loadFilterString = () => {
  const filterString = sessionStorage.getItem('shopFilter')
  if (filterString) {
    filter.value = filterString
  }
}

onMounted(() => {
  if (history.state.forward && history.state.forward.includes('/shop/')) {
    loadFilterString()
  } else {
    saveFilterString('')
  }
})

const selected = ref<ShopInfoVo[]>([])

const shopListData = await useCustomFetch<ShopInfoVo[]>('/admin/handOrder/v2/shop', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const shopList = shopListData.data

// 컴패스 매장 필터링
const compassOnly = ref(false)
const compassStatusFilter = ref<'all' | 'IN_PROGRESS' | 'ACTIVE'>('all')
const compassShopList = ref<CompassShopStatusVo[]>([])
const compassLoading = ref(false)
const compassLoaded = ref(false)

const filteredShopList = computed(() => {
  if (!compassOnly.value) {
    return shopList.value ?? []
  }
  const filtered = compassStatusFilter.value === 'all'
    ? compassShopList.value
    : compassShopList.value.filter(s => s.status === compassStatusFilter.value)
  const codes = new Set(filtered.map(s => s.shopCode))
  return (shopList.value ?? []).filter((shop: ShopInfoVo) => codes.has(shop.shopCode))
})

const onCompassToggle = async (val: boolean) => {
  if (!val) {
    compassStatusFilter.value = 'all'
    return
  }
  if (!compassLoaded.value) {
    compassLoading.value = true
    try {
      const data = await customFetch<CompassShopStatusVo[]>('/admin/handOrder/compass/shop', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const list = (data as any)?.data?.value ?? (data as any)?.data ?? data ?? []
      compassShopList.value = list as CompassShopStatusVo[]
      compassLoaded.value = true
    } catch (e) {
      $q.notify({ type: 'negative', message: '컴패스 매장 목록 조회 실패' })
      compassOnly.value = false
    } finally {
      compassLoading.value = false
    }
  }
}

const onCompassFilterChange = async (_val: 'all' | 'IN_PROGRESS' | 'ACTIVE') => {}

const columns:QTableProps['columns'] = [
  {
    name: 'pg',
    required: true,
    label: '선/후불',
    align: 'left',
    field: 'pg',
    sortable: true,
    format: (val:string) => val ? $t('SHOP.156') : $t('SHOP.036')
  },
  {
    name: 'shopCode',
    required: true,
    label: $t('COMMON.026'),
    align: 'left',
    field: 'shopCode',
    sortable: true
  },
  {
    name: 'shopName',
    required: true,
    label: $t('COMMON.027'),
    align: 'left',
    field: 'shopName',
    sortable: true
  },
  {
    name: 'activeYn',
    required: false,
    label: $t('SHOP.001'),
    align: 'left',
    field: 'shopStatus',
    sortable: true,
    format: (val:string) => val === 'PENDING' ? $t('COMPANY_REPORT.008') : val === 'TEST' ? $t('COMMON.030') : val === 'ACTIVE' ? $t('COMPANY_REPORT.007') : $t('COMMON.006')
  },
  {
    name: 'corporate',
    required: true,
    label: $t('SHOP.003'),
    align: 'left',
    field: 'corporate',
    sortable: true,
    format: (val:boolean) => `${val === false ? $t('COMMON.032') : $t('COMMON.031')}`
  },
  {
    name: 'startDate',
    required: true,
    label: $t('COMPANY_REPORT.009'),
    align: 'left',
    field: 'startDate',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : prettyDate(val)}`
  },
  {
    name: 'installationDate',
    required: true,
    label: $t('SHOP.004'),
    align: 'left',
    field: 'installationDate',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : prettyDate(val)}`
  },
  {
    name: 'signUpYn',
    required: true,
    label: $t('SHOP.005'),
    align: 'left',
    field: 'signUpYn',
    sortable: true,
    format: (val:boolean) => val ? 'O' : 'X'
  },
  {
    name: 'companyName',
    required: true,
    label: $t('SHOP.006'),
    align: 'left',
    field: 'companyName',
    sortable: true,
    format: (val:string) => `${val == null ? '-' : val}`
  }
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const shopDetailPage:QTableProps['onRowClick'] = (evt, row, index) => {
  router.push('/shop/' + row?.shopCode)
}

const createShop = () => {
  $q.dialog({
    component: ShopCreateModal,
    componentProps: {
      userInfo: authStore.userInfo
    }
  }).onOk(async () => {
    await shopListData.refresh()
  })
}

const setClipboardLink = () => {
  const encryptCode = encrypt(selected.value[0].shopCode)
  const link = `${window.location.origin}/signup/shop/${encryptCode}`
  navigator.clipboard.writeText(link)
  $q.notify({
    type: 'positive',
    message: $t('COMPANY.009')
  })
}

const prettyDate = (dateString:string) => {
  return dayjs(dateString, 'YYYYMMDD').format('YYYY/MM/DD')
}

const changeShopStatus = (status:string) => {
  const shopStatusList = [
    {
      status: 'PENDING',
      activeYn: 'Y',
      text: $t('COMPANY_REPORT.008')
    },
    {
      status: 'ACTIVE',
      activeYn: 'Y',
      text: $t('COMPANY_REPORT.007')
    },
    {
      status: 'TERMINATE',
      activeYn: 'N',
      text: $t('COMMON.006')
    },
    {
      status: 'TEST',
      activeYn: 'Y',
      text: $t('COMMON.030')
    },
    {
      status: 'DELETE',
      activeYn: 'N',
      text: $t('COMMON.007')
    }
  ]
  const shopStatus = shopStatusList.find(val => val.status === status)

  let message:string = ''
  if (status === 'DELETE') {
    if (!checkPermissions(['D'])) {
      return
    }

    message = $t('SHOP.002')
  } else {
    if (!checkPermissions(['U'])) {
      return
    }

    message = $t('SHOP.007', { text: shopStatus?.text })
  }

  $q.dialog({
    title: $t('SHOP.008'),
    message,
    ok: $t('COMMON.004'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    const reqeustBody:ShopStatusPutDto[] = []
    selected.value.forEach((item) => {
      const requestObject:ShopStatusPutDto = {
        shopSeq: 0,
        activeYn: '',
        shopStatus: ''
      }

      requestObject.shopSeq = item.shopSeq
      requestObject.activeYn = shopStatus?.activeYn ?? ''
      requestObject.shopStatus = status
      reqeustBody.push(requestObject)
    })

    await customFetch('/admin/handOrder/shop/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: reqeustBody
    })
    await shopListData.refresh()
  })
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.008') }} </span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col">
      <q-table
        v-model:pagination="pagination"
        v-model:selected="selected"
        style="height: 100%"
        flat
        bordered
        :rows="filteredShopList"
        :columns="columns"
        row-key="shopCode"
        virtual-scroll
        :rows-per-page-options="[0]"
        :filter="filter"
        hide-bottom
        class="shop-table"
        :selection="isEmpty(filter) ? 'single':'multiple'"
        @row-click="shopDetailPage"
      >
        <template v-slot:top-right>
          <!--          <q-btn label="사용자 수정" @click="updateMember" class="text-white bg-handorder" :disable="isEmpty(selectedMember)"/>-->
          <div class="compass-filter-wrap q-mr-md q-mt-md flex items-center">
            <span class="compass-filter-label">컴패스 매장만 보기</span>
            <q-toggle
              v-model="compassOnly"
              color="primary"
              dense
              class="q-mx-xs"
              :disable="compassLoading"
              @update:model-value="onCompassToggle"
            />
            <template v-if="compassOnly">
              <div class="compass-divider" />
              <q-spinner v-if="compassLoading" size="1.1em" color="primary" />
              <transition name="fade">
                <div v-if="!compassLoading" class="flex no-wrap gap-xs">
                  <q-btn
                    v-for="opt in [
                      { label: '전체', value: 'all', activeColor: '' },
                      { label: '진행중', value: 'IN_PROGRESS', activeColor: 'status-btn-progress' },
                      { label: '활성화', value: 'ACTIVE', activeColor: 'status-btn-active' },
                    ]"
                    :key="opt.value"
                    :label="opt.label"
                    no-caps
                    unelevated
                    rounded
                    :class="compassStatusFilter === opt.value
                      ? (opt.activeColor || 'status-btn-all')
                      : 'status-btn'"
                    @click="compassStatusFilter = opt.value as typeof compassStatusFilter; onCompassFilterChange(opt.value as typeof compassStatusFilter)"
                  />
                </div>
              </transition>
            </template>
          </div>
          <q-btn color="primary" :label="$t('SHOP.008')" class="q-mt-md float-right q-mr-md" :disable="isEmpty(selected)">
            <q-menu auto-close>
              <q-list style="min-width: 100px">
                <q-item clickable @click="changeShopStatus('PENDING')">
                  <q-item-section>{{ $t('COMPANY_REPORT.008') }}</q-item-section>
                </q-item>
                <q-item clickable @click="changeShopStatus('ACTIVE')">
                  <q-item-section>{{ $t('COMPANY_REPORT.007') }}</q-item-section>
                </q-item>
                <q-item clickable @click="changeShopStatus('TERMINATE')">
                  <q-item-section>{{ $t('COMMON.006') }}</q-item-section>
                </q-item>
                <q-item clickable @click="changeShopStatus('TEST')">
                  <q-item-section>{{ $t('COMMON.030') }}</q-item-section>
                </q-item>
                <q-item clickable @click="changeShopStatus('DELETE')">
                  <q-item-section>{{ $t('COMMON.007') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn :label="$t('COMPANY.015')" color="primary" class="q-mt-md float-right q-mr-md" :disable="isEmpty(selected) || selected.length > 1" @click="setClipboardLink" />
          <q-btn color="primary" :label="$t('SHOP.009')" class="q-mt-md" @click="createShop" />
        </template>
        <template v-slot:top-left>
          <q-input v-model="filter" dense debounce="300" placeholder="Search" @update:model-value="saveFilterString">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.compass-filter-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 42px;
  padding: 0 12px 0 10px;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06);
}

.compass-filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}

.compass-divider {
  width: 1px;
  height: 16px;
  background: #e0e0e0;
  margin: 0 8px;
  flex-shrink: 0;
}

.gap-xs {
  gap: 4px;
}

// 비활성 공통
.status-btn {
  background: #f5f5f5 !important;
  color: #888 !important;
  border: none !important;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: #ebebeb !important;
    color: #555 !important;
  }
}

// 전체 활성
.status-btn-all {
  background: #555 !important;
  color: #fff !important;
  border: none !important;
  font-size: 12px;
  font-weight: 600;
}

// 등록 진행중 활성 - 노란/주황 계열
.status-btn-progress {
  background: #f59e0b !important;
  color: #fff !important;
  border: none !important;
  font-size: 12px;
  font-weight: 600;
}

// 결제 사용가능 활성 - 초록 계열
.status-btn-active {
  background: #22c55e !important;
  color: #fff !important;
  border: none !important;
  font-size: 12px;
  font-weight: 600;
}
</style>
