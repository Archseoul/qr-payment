<script setup lang="ts">
import customParseFormat from 'dayjs/plugin/customParseFormat'
import useDayjs from 'dayjs'
import type { QTableProps } from 'quasar'
import type { PrinterVo } from '~/types'

const dayjs = useDayjs
dayjs.extend(customParseFormat)

const $q = useQuasar()
const route = useRoute()
const isElectron = ref(false)
onMounted(() => { isElectron.value = !!(window as any).electronAPI })

const scrollTable = (direction: 'left' | 'right') => {
  const el = document.querySelector('.q-table__middle.scroll')
  if (!el) { return }
  el.scrollBy({ left: direction === 'right' ? 250 : -250, behavior: 'smooth' })
}

const dateRange = ref({
  from: dayjs().subtract(1, 'week').format('YYYY-MM-DD'),
  to: dayjs().format('YYYY-MM-DD')
})
const pagination = ref({
  rowsPerPage: 0
})

interface PaymentHistoryItem {
  shopCode: string;
  shopName: string;
  paymentDate: string | null;
  paymentTime: string | null;
  paymentType: string;
  menuName: string;
  paymentAmount: number;
  cancelDateTime: string | null;
  cancelAmount: number | null;
  resultMsg: string;
  paymentUuid: string;
}

interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
}

const fetchParams = reactive({
  startDate: dateRange.value.from,
  endDate: dateRange.value.to
})

const paymentHistoryData = await useCustomFetch<PaymentHistoryResponse>(
  `/admin/handOrder/shop/${route.params.shopCode}/payments/history`,
  {
    method: 'GET',
    params: fetchParams
  }
)

const paymentHistory = paymentHistoryData.data

const search = async () => {
  fetchParams.startDate = dateRange.value.from
  fetchParams.endDate = dateRange.value.to
  await paymentHistoryData.refresh()
}

// ── 정산 현황 모달 ──────────────────────────────────────────────────────────
interface PaymentSummary {
  shopName: string
  openDate: string
  closeDate: string
  totalCount: number
  completeCount: number
  canceledCount: number
  completeAmount: number
  canceledAmount: number
}

const showReprintModal = ref(false)
const isSummaryLoading = ref(false)
const isReprinting = ref(false)
const summaryData = ref<PaymentSummary | null>(null)

// ShopStatusButtons의 shopPrinterData와 동일한 방식으로 프린터 목록 조회
const { data: printerData } = await useCustomFetch<PrinterVo[]>(
  `/admin/handOrder/shop/${route.params.shopCode}/printer`,
  { method: 'GET', headers: { 'Content-Type': 'application/json' } }
)

const openReprintModal = async () => {
  summaryData.value = null
  showReprintModal.value = true
  isSummaryLoading.value = true
  try {
    const startDate = `${dateRange.value.from} 00:00:00`
    const endDate = `${dateRange.value.to} 23:59:59`
    const res = await useCustomFetch<PaymentSummary>(
      `/admin/handOrder/shop/${route.params.shopCode}/payments/summary`,
      { method: 'GET', params: { startDate, endDate } }
    )
    summaryData.value = res.data.value
  } catch (e) {
    $q.notify({ type: 'negative', message: '정산 현황 조회에 실패했습니다.' })
  } finally {
    isSummaryLoading.value = false
  }
}

const closeReprintModal = () => {
  showReprintModal.value = false
}

// ShopStatusButtons의 handleShopClose 출력 로직과 동일
const onReprint = async () => {
  if (isReprinting.value || !summaryData.value) { return }
  isReprinting.value = true
  try {
    const startDate = `${dateRange.value.from} 00:00:00`
    const endDate = `${dateRange.value.to} 23:59:59`
    const summary = await customFetch(
      `/admin/handOrder/shop/${route.params.shopCode}/payments/summary`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' }, params: { startDate, endDate } }
    )
    const orderReceiptPrinterList = (printerData.value ?? []).filter(
      (printer: PrinterVo) => printer.orderReceipt === true
    )
    const data = {
      ...(typeof summary === 'object' && summary !== null ? summary : {}),
      printerList: orderReceiptPrinterList
    }
    if (window.electronAPI && typeof (window.electronAPI as any).printPaymentSummary === 'function') {
      ;(window.electronAPI as any).printPaymentSummary(JSON.stringify(data))
    }
    closeReprintModal()
  } catch (e) {
    console.error('재출력 실패:', e)
    $q.notify({ type: 'negative', message: '재출력 요청에 실패했습니다.' })
  } finally {
    isReprinting.value = false
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const onCancel = async (row: PaymentHistoryItem) => {
  try {
    await customFetch(
      `handOrder/payment/total/${row.paymentUuid}/cancel`,
      { method: 'POST' }
    )

    const result = await customFetch<PaymentHistoryResponse>(
      `/admin/handOrder/shop/${route.params.shopCode}/payments/history`,
      { method: 'GET', params: { startDate: fetchParams.startDate, endDate: fetchParams.endDate } }
    )
    paymentHistory.value = result as any

    $q.notify({ type: 'positive', message: '결제가 취소되었습니다.' })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: '결제 취소에 실패했습니다.' })
  }
}

const columns: QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    field: (row: PaymentHistoryItem) => {
      const list = paymentHistory.value?.payments ?? []
      const index = list.indexOf(row)
      return list.length - index
    },
    align: 'left',
    style: 'width: 50px'
  },
  {
    name: 'shopCode',
    label: '매장 코드',
    field: (row: PaymentHistoryItem) => row.shopCode,
    align: 'center',
    style: 'width: 120px'
  },
  {
    name: 'shopName',
    label: '매장명',
    field: (row: PaymentHistoryItem) => row.shopName,
    align: 'center',
    style: 'width: 150px'
  },
  {
    name: 'paymentDate',
    label: '결제일',
    field: (row: PaymentHistoryItem) => row.paymentDate ?? '',
    align: 'center',
    style: 'width: 110px'
  },
  {
    name: 'paymentTime',
    label: '결제시간',
    field: (row: PaymentHistoryItem) => row.paymentTime ?? '',
    align: 'center',
    style: 'width: 100px'
  },
  {
    name: 'paymentType',
    label: '결제 유형',
    field: (row: PaymentHistoryItem) => row.paymentType,
    align: 'center',
    style: 'width: 120px'
  },
  {
    name: 'menuName',
    label: '판매 상품명',
    field: (row: PaymentHistoryItem) => row.menuName,
    align: 'center',
    style: 'width: 200px'
  },
  {
    name: 'paymentAmount',
    label: '결제 금액',
    field: (row: PaymentHistoryItem) => row.paymentAmount != null ? row.paymentAmount.toLocaleString() + '원' : '',
    align: 'right',
    style: 'width: 120px'
  },
  {
    name: 'cancelDateTime',
    label: '결제 취소 일시',
    field: (row: PaymentHistoryItem) => row.cancelDateTime ?? '',
    align: 'center',
    style: 'width: 150px'
  },
  {
    name: 'cancelAmount',
    label: '결제 취소 금액',
    field: (row: PaymentHistoryItem) => row.cancelAmount != null ? row.cancelAmount.toLocaleString() + '원' : '',
    align: 'right',
    style: 'width: 130px'
  },
  {
    name: 'cancel',
    label: '',
    field: 'cancel',
    align: 'right',
    style: 'width: 80px'
  }
]
</script>

<template>
  <div>
    <div class="main-content relative-position full-height column">
      <div class="content-header">
        <span class="text-h5 text-bold">{{ $t("SIDE_MENU.033") }}</span>
        <q-separator class="q-my-lg" />
      </div>

      <div class="content-body col full-width column">
        <div>
          <q-item>
            <q-item-section>
              <div class="flex q-gutter-sm items-center">
                <input
                  v-model="dateRange.from"
                  type="date"
                  style="border: 1px solid #c0c0c0; border-radius: 4px; padding: 10px 12px; font-size: 14px; outline: none;"
                />
                <span style="color: #888;">~</span>
                <input
                  v-model="dateRange.to"
                  type="date"
                  style="border: 1px solid #c0c0c0; border-radius: 4px; padding: 10px 12px; font-size: 14px; outline: none;"
                />
              </div>
            </q-item-section>

            <q-item-section side>
              <div class="flex q-gutter-sm">
                <q-btn label="조회" color="primary" @click="search" />
                <q-btn v-if="isElectron" label="정산 현황보기" color="orange" outline @click="openReprintModal" />
              </div>
            </q-item-section>
          </q-item>
        </div>

        <div class="col full-width">
          <q-table
            v-model:pagination="pagination"
            :rows="paymentHistory.payments"
            row-key="paymentUuid"
            :columns="columns"
            hide-pagination
            style="height: 100%"
            virtual-scroll
            bordered
            flat
          >
            <template v-slot:body-cell-cancel="props">
              <q-td :props="props" class="text-right">
                <span v-if="props.row.resultMsg" class="text-negative text-caption">
                  {{ props.row.resultMsg }}
                </span>
                <q-btn
                  v-else-if="!props.row.cancelDateTime && !props.row.cancelAmount && props.row.paymentType !== '나중에결제'"
                  label="취소"
                  color="negative"
                  size="sm"
                  unelevated
                  @click="onCancel(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <template v-if="isElectron">
        <button class="tbl-nav-btn tbl-nav-btn--left" @click="scrollTable('left')">
          &#8249;
        </button>
        <button class="tbl-nav-btn tbl-nav-btn--right" @click="scrollTable('right')">
          &#8250;
        </button>
      </template>
    </Teleport>

    <Teleport to="body">
      <div v-if="showReprintModal" class="sm-overlay" @click.self="closeReprintModal">
        <div class="sm-modal">
          <div class="sm-header">
            <span class="sm-title">정산 현황</span>
            <button class="sm-close" type="button" @click="closeReprintModal">
              &times;
            </button>
          </div>

          <div class="sm-divider" />

          <!-- 로딩 -->
          <div v-if="isSummaryLoading" class="sm-loading">
            <q-spinner color="primary" size="36px" />
          </div>

          <!-- 데이터 -->
          <div v-else-if="summaryData" class="sm-body">
            <div class="sm-meta">
              <div style="display: flex; align-items: center;">
                <span class="sm-period">매장명: </span><span class="sm-shop-name">{{ summaryData.shopName }}</span>
              </div>
              <span class="sm-period">조회 기간: {{ dateRange.from }} ~ {{ dateRange.to }}</span>
            </div>

            <div class="sm-rows">
              <div class="sm-row">
                <span class="sm-label">전체 결제 건수</span>
                <span class="sm-value">{{ summaryData.totalCount.toLocaleString() }}건</span>
              </div>
              <div class="sm-row">
                <span class="sm-label">결제 완료 건수</span>
                <span class="sm-value sm-value--positive">{{ summaryData.completeCount.toLocaleString() }}건</span>
              </div>
              <div class="sm-row">
                <span class="sm-label">결제 취소 건수</span>
                <span class="sm-value sm-value--negative">{{ summaryData.canceledCount.toLocaleString() }}건</span>
              </div>
              <div class="sm-row sm-row--highlight">
                <span class="sm-label">결제 완료 금액</span>
                <span class="sm-value sm-value--positive">{{ summaryData.completeAmount.toLocaleString() }}원</span>
              </div>
              <div class="sm-row">
                <span class="sm-label">결제 취소 금액</span>
                <span class="sm-value sm-value--negative">{{ summaryData.canceledAmount.toLocaleString() }}원</span>
              </div>
            </div>
          </div>

          <div v-else class="sm-error">
            데이터를 불러오지 못했습니다.
          </div>

          <div class="sm-divider" />

          <div class="sm-footer">
            <button class="sm-btn sm-btn--cancel" type="button" @click="closeReprintModal">
              취소
            </button>
            <button
              class="sm-btn sm-btn--reprint"
              type="button"
              :disabled="isReprinting || !summaryData"
              @click="onReprint"
            >
              <span v-if="isReprinting" class="sm-spinner" />
              <span v-else>재출력</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.sm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.sm-modal {
  background: #fff;
  border-radius: 8px;
  min-width: 460px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.sm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 10px;
}

.sm-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -.6px;
}

.sm-close {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: #888;
  cursor: pointer;
  padding: 0 2px;
  &:hover { color: #333; }
}

.sm-divider {
  height: 1px;
  background: #e8e8e8;
}

.sm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.sm-body {
  padding: 20px 24px;
}

.sm-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
  letter-spacing: -.2px;
}

.sm-shop-name {
  margin: 0 0 0 5px;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.sm-period {
  font-size: 14px;
  color: #888;
}

.sm-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.sm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &--highlight {
    background: #fafafa;
  }
}

.sm-label {
  font-size: 13px;
  color: #555;
}

.sm-value {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;

  &--positive { color: rgb(2, 111, 42); }
  &--negative { color: rgb(255, 39, 43); }
}

.sm-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  font-size: 14px;
  color: #999;
}

.sm-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px;
}

.sm-footer {
  gap: 8px;
}

.sm-btn {
  padding: 8px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;

  &:hover:not(:disabled) { background: #f5f5f5; }

  &--reprint {
    background: #FF8B4A;
    color: #fff;
    border-color: #FF8B4A;
    &:hover:not(:disabled) { background: #e87a3a; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.sm-spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: sm-spin 0.7s linear infinite;
}

@keyframes sm-spin {
  to { transform: rotate(360deg); }
}

.tbl-nav-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  width: 36px;
  height: 64px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;

  &:hover { background: #FF8B4A; }
  &:active { background: #e87a3a; }

  &--left  { left: 8px; }
  &--right { right: 8px; }
}
</style>
