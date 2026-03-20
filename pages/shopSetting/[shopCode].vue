<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { QInput, QSelect } from 'quasar'
import type { Ref } from 'vue'
import isElectron from 'is-electron'
import type { AvailableRouterMethod } from 'nitropack'
import {
  type ShopInfoVo,
  type PrinterVo,
  type HoBusinessTime,
  type HoBreakTime,
  type HoBreakTimeVo,
  type AlertChargeVo,
  type HoTableVo,
  SignageClass, type SignageVo
} from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'
import { PrintBaudRateList, PrintSerialPortList } from '~/utils/code'
import { PrinterClass } from '~/classes/PrinterClass'
import { useAuthStore } from '~/store/auth'

const route = useRoute()
const $q = useQuasar()
const dayjs = useDayjs()
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = authStore
const noticeInput = ref<QInput | null>(null)
const { checkPermissions } = useCheckPermissions()

const deliveryModalVisible = ref(false)

const shopCode = route.params.shopCode as string

const shopInfoData = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const shopInfo = ref<ShopInfoVo | null>(null)
shopInfo.value = shopInfoData.data?.value ?? null

// 다먹고 결제 관련 필드 기본값 설정
if (shopInfo.value) {
  shopInfo.value.afterEatPaymentActive = shopInfo.value.afterEatPaymentActive ?? false
  // shopInfo.value.frontPaymentUse = shopInfo.value.frontPaymentUse ?? false // 프론트 결제 사용 여부 주석
  shopInfo.value.frontPaymentDeviceCode = shopInfo.value.frontPaymentDeviceCode ?? null

  shopInfo.value.usagePurpose = shopInfo.value.usagePurpose ?? 'ALL'

  // 알림톡 관련 필드 기본값 설정
  shopInfo.value.alimtalkUse = shopInfo.value.alimtalkUse ?? false
  shopInfo.value.phoneNumberOptional = shopInfo.value.phoneNumberOptional ?? false
}

provide('shopInfo', shopInfo)

const alertChargingListData = await useCustomFetch<AlertChargeVo[]>('/admin/handOrder/shop/' + shopCode + '/alert', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const alertChargingList = ref<AlertChargeVo[]>(alertChargingListData.data.value ?? [])

const alertCountData = await useCustomFetch<number>('/admin/handOrder/shop/' + shopCode + '/alert/count', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const printerData = await useCustomFetch<PrinterVo[]>('/admin/handOrder/shop/' + shopCode + '/printer', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const printerList = ref<PrinterVo[]>([])
printerList.value = printerData.data.value

const tableData = await useCustomFetch<HoTableVo[]>(`/admin/handOrder/table/${shopCode}`, {
  method: 'GET'
}).then((res) => {
  return res.data
})

const tableList: Ref<HoTableVo[] | null | undefined> = tableData

provide('tableList', tableList)

const signageData = await useCustomFetch<SignageVo[]>('/admin/handOrder/shop/' + shopCode + '/signage', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const signageList = ref<SignageVo[]>([])
signageList.value = signageData.data.value ?? []

// 프린터 메뉴 매핑 모달 관련 상태
const printerMenuMappingModal = ref(false)
const selectedPrinter = ref<PrinterVo | null>(null)

const alertCount: Ref<number | null | undefined> = alertCountData.data

const chargingPopup = ref(false)

const tab = ref<string>('alarm-history')

const amt = ref<string>('')

const cashReceipt = ref(false)

const chargingApply = ref(false)

// 에이전트 모드 옵션 정의
const agentModeOptions = [
  { label: '모두', value: 'ALL' },
  { label: '주문전용', value: 'TABLE_ORDER' },
  { label: '결제창 전용', value: 'PAYMENT_WINDOW' }
]

const validateNotice = (value: string) => {
  if (!value) { return true }
  if (!value.trim()) { return $t('SHOP_SETTING.001') }
  if (value.length > 200) { return $t('SHOP_SETTING.002') }
  return true
}

// 테이블 관리 비활성화 시 다먹고 결제도 비활성화
watch(
  () => shopInfo.value?.tableManagement,
  (newVal) => {
    if (!newVal && shopInfo.value) {
      shopInfo.value.afterEatPaymentActive = false
    }
  }
)

watch(
  () => shopInfo.value?.alimtalkUse,
  (newVal) => {
    if (!newVal && shopInfo.value) {
      shopInfo.value.phoneNumberOptional = false
      shopInfo.value.acceptOrderAlarm = false
      shopInfo.value.cancelOrderAlarm = false
      shopInfo.value.pickupAlarm = false
    }
  }
)

const createBusinessTime = (time: string | null): HoBusinessTime => {
  return {
    hour: time ? time.slice(0, 2) : '00',
    minute: time ? time.slice(2, 4) : '00'
  }
}
const openTime = ref<HoBusinessTime>(createBusinessTime(shopInfo?.value?.openTime || null))
const closeTime = ref<HoBusinessTime>(createBusinessTime(shopInfo?.value?.closeTime || null))

const hourOption:string[] = new Array(24).fill(0).map((_, idx) => idx < 10 ? `0${idx}` : `${idx}`)
const minuteOption = ['00', '30']

const initBreakTimeData = async () => {
  const breakTimeData = await useCustomFetch<HoBreakTimeVo[]>(`/admin/handOrder/shop/breakTime/${shopCode}`, {
    method: 'GET'
  }).then((res) => {
    return res.data
  })

  const breakTimeList: HoBreakTime[] = []

  // breakTimeData.value가 null이거나 undefined인 경우 빈 배열 반환
  if (!breakTimeData.value) {
    return breakTimeList
  }

  breakTimeData.value.forEach((breakTime: HoBreakTimeVo) => {
    const newBreakTime: HoBreakTime = {
      ...breakTime,
      startTimeData: createBusinessTime(breakTime.startTime),
      endTimeData: createBusinessTime(breakTime.endTime),
      state: 'NORMAL',
      seq: breakTimeList.length
    }

    breakTimeList.push(newBreakTime)

    if (breakTime.dayOfWeek > 0) {
      newBreakTime.dayOfWeek = -1
    }
  })

  return breakTimeList
}

const setBreakTimeData = (breakTime: HoBreakTime) => {
  if (breakTime.state === 'NORMAL') {
    breakTime.state = 'UPDATE'
  }
  breakTime.startTime = breakTime.startTimeData!.hour + breakTime.startTimeData!.minute
  breakTime.endTime = breakTime.endTimeData!.hour + breakTime.endTimeData!.minute
}

const breakTimeList = ref<HoBreakTime[]>([])

breakTimeList.value = await initBreakTimeData()

const insertBreakTime = () => {
  breakTimeList.value.push({
    shopBreakTimeSeq: undefined,
    shopSeq: shopInfo.value!.shopSeq,
    startTime: '0000',
    endTime: '0000',
    startTimeData: createBusinessTime(shopInfo.value?.openTime || '0000'),
    endTimeData: createBusinessTime(shopInfo.value?.closeTime || '0000'),
    dayOfWeek: 0,
    dayOfWeekList: [],
    state: 'NEW',
    seq: breakTimeList.value.length
  })
}

const deleteBreakTime = (seq: number) => {
  const target = breakTimeList.value.find(bt => bt.seq === seq)

  if (!target) {
    return
  }

  if (target.state === 'NEW') {
    breakTimeList.value = breakTimeList.value.filter(breakTime => breakTime.seq !== seq)
  } else {
    target.state = 'DELETE'
  }
}

const saveBreakTime = async () => {
  if (breakTimeList.value.filter(breakTime => breakTime.state !== 'NORMAL').length === 0) {
    return
  }

  await customFetch(`/admin/handOrder/shop/breakTime/${shopCode}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: breakTimeList.value.filter(breakTime => breakTime.state === 'DELETE'),
    onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
      $q.notify({
        type: 'negative',
        message: `${$t('SHOP_SETTING.003')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
      })
    }
  })

  await customFetch(`/admin/handOrder/shop/breakTime/${shopCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: breakTimeList.value.filter(breakTime => breakTime.state !== 'NORMAL' && breakTime.state !== 'DELETE'),
    onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
      $q.notify({
        type: 'negative',
        message: `${$t('SHOP_SETTING.004')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
      })
    }
  })

  await refreshNuxtData()
  breakTimeList.value = await initBreakTimeData()
}

const businessTime = () => {
  // DB에 저장하기 위해 시간은 24시로 바꿈  ex) pm 01:00 -> 13:00
  const settingTime = (time: HoBusinessTime): string => {
    return `${time.hour}${time.minute}`
  }
  if (!shopInfo.value) { return }

  shopInfo.value.openTime = settingTime(openTime.value)
  shopInfo.value.closeTime = settingTime(closeTime.value)
}

const saveSettings = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    title: $t('COMMON.051'),
    message: $t('COMMON.038'),
    ok: {
      label: $t('COMMON.004'),
      color: 'primary'
    },
    cancel: {
      label: $t('COMMON.005'),
      flat: true,
      color: 'grey-8',
      handler: () => {
        console.log('cancel')
      }
    }
  }).onOk(() => {
    // 후불 매장이면 주문 수락 알림톡, 주문 취소 알림톡, 픽업 알림톡 꺼버리기
    if (!shopInfo.value?.pg) {
      shopInfo.value!.acceptOrderAlarm = false
      shopInfo.value!.cancelOrderAlarm = false
      shopInfo.value!.pickupAlarm = false
      shopInfo.value!.afterEatPaymentActive = false
    }

    businessTime()

    if (noticeInput.value?.validate() === false) {
      return $q.notify({
        type: 'negative',
        message: $t('SHOP_SETTING.005')
      })
    }

    putShopInfo()
    printerSequence()
    signageSequence()
    saveBreakTime()
  })
}

const putShopInfo = async () => {
  const requestBody = {
    ...shopInfo.value,
    // 알림톡 관련 필드명 매핑
    isAlimtalkUse: shopInfo.value?.alimtalkUse ?? false,
    isPhoneNumberOptional: shopInfo.value?.phoneNumberOptional ?? false
  }

  await customFetch('/admin/handOrder/shop', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: requestBody,
    onResponseError: (context: {
      response: { status: any; statusText: any };
    }) => {
      $q.notify({
        type: 'negative',
        message: `${$t('SHOP.018')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
      })
    }
  })
  $q.dialog({
    title: $t('COMMON.051'),
    message: $t('SHOP.017'),
    persistent: true
  }).onOk(async () => {
    await shopInfoData.refresh()
  })
}

const openDeliveryModal = () => {
  if (!shopInfo.value?.pg) {
    $q.notify({
      type: 'negative',
      message: $t('SHOP.153')
    })

    return
  }

  deliveryModalVisible.value = true
}

const closeDeliveryModal = () => {
  deliveryModalVisible.value = false
}

const dataRefresh = async () => {
  await refreshNuxtData('/admin/handOrder/table/' + shopCode)
  await refreshNuxtData('/admin/handOrder/shop/' + shopCode)
}

const columns: QTableProps['columns'] = [
  {
    name: 'applyDate',
    required: true,
    label: $t('REPORT_ORDER.007'),
    align: 'left',
    field: 'applyDate',
    sortable: true,
    format: (val: string) => dayjs(val).format('YYYY-MM-DD')
  },
  {
    name: 'chargeStatus',
    required: true,
    label: $t('SHOP_SETTING.028'),
    align: 'left',
    field: 'chargeStatus',
    sortable: true,
    format: (val: string) => val === 'apply' ? $t('SHOP_SETTING.029') : $t('COMMON.039')
  },
  {
    name: 'chargeAmount',
    required: true,
    label: $t('SHOP_SETTING.030'),
    align: 'left',
    field: 'chargeAmount',
    sortable: true,
    format: (val: number) => val.toLocaleString()
  },
  {
    name: 'chargeCount',
    required: true,
    label: $t('SHOP_SETTING.031'),
    align: 'left',
    field: 'chargeCount',
    sortable: true,
    format: (val: number) => val.toLocaleString()
  }
]

const openChargingPopup = () => {
  chargingPopup.value = true
  amt.value = ''
}

const alertClosePopup = () => {
  chargingPopup.value = false
  chargingApply.value = false
}

const applyAlertCharging = () => {
  if (!amt.value) {
    $q.notify({
      type: 'negative',
      message: $t('SHOP_SETTING.032')
    })
    return
  }

  const chargingCount = AmtList.find(item => item.amount === Number(amt.value))?.count
  const chargingCountWithComma = chargingCount?.toLocaleString()

  $q.dialog({
    title: $t('COMMON.051'),
    message: $t('SHOP_SETTING.033', { count: chargingCountWithComma }),
    ok: {
      label: $t('COMMON.004'),
      color: 'primary'
    },
    cancel: {
      label: $t('COMMON.005'),
      flat: true,
      color: 'grey-8'
    }
  }).onOk(() => {
    postAlertCharging()
  })
}

const postAlertCharging = async () => {
  const amtObj = AmtList.find(item => item.amount === Number(amt.value))
  const alertCharging = {
    shopSeq: shopInfo.value?.shopSeq,
    chargeAmount: amtObj?.amount,
    chargeCount: amtObj?.count,
    cashReceiptRequest: cashReceipt.value,
    chargeStatus: 'apply'
  }

  await customFetch('/admin/handOrder/shop/alert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: alertCharging,
    onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
      $q.notify({
        type: 'negative',
        message: `${$t('SHOP_SETTING.034')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
      })
    }
  })
  chargingApply.value = true
  await alertChargingListData.refresh()
  alertChargingList.value = alertChargingListData.data.value ?? []
}

const printerSequence = async () => {
  const printerOperations: {
    list: PrinterVo[] | [],
    method: AvailableRouterMethod<string & {}>,
    failMessage: string
  }[] = [
    {
      list: printerList.value?.filter((item: PrinterVo) => item.printerObjectType === 'new') ?? [],
      method: 'post',
      failMessage: $t('SHOP_SETTING.006')
    },
    {
      list: printerList.value?.filter((item: PrinterVo) => item.printerObjectType === 'update') ?? [],
      method: 'put',
      failMessage: $t('SHOP_SETTING.007')
    }
  ]

  const printerDeleteList = printerList.value?.filter((item: PrinterVo) => item.printerObjectType === 'delete') ?? []

  // list의 데이터가 있는 항목만 필터링
  const validOperations = printerOperations.filter(operation => operation.list.length > 0)

  for (const { list, method, failMessage } of validOperations) {
    await customFetch('/admin/handOrder/shop/printer', {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: list,
      onResponseError: (context: {
        response: { status: any; statusText: any };
      }) => {
        $q.notify({
          type: 'negative',
          message: `${failMessage} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
        })
      }
    })
  }

  if (printerDeleteList.length > 0) {
    for (const printer of printerDeleteList) {
      if (printer.printerSeq === 0) { continue }

      await customFetch(`/admin/handOrder/shop/printer/${shopInfo.value!.shopCode}/${printer.printerSeq}`, {
        method: 'delete',
        headers: {
          'Content-Type': 'application/json'
        },
        onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
          $q.notify({
            type: 'negative',
            message: `${$t('SHOP_SETTING.008')} ${$t('COMMON.014')}: ${context.response.status} ${context.response.statusText}`
          })
        }
      })
    }
  }
}

const shopReceiptType = computed({
  get () {
    if (!shopInfo.value?.receiptType) {
      shopReceiptType.value = 'PAYMENT'
    }
    return shopInfo.value?.receiptType ?? 'PAYMENT' // 기본값 설정
  },
  set (newValue) {
    if (shopInfo.value) {
      shopInfo.value.receiptType = newValue
    }
  }
})

const newPrinter = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  const printerObject = new PrinterClass()
  printerObject.shopSeq = shopInfo.value!.shopSeq
  if (shopInfo.value.pg) {
    if (shopReceiptType.value) {
      printerObject.orderReceiptType = shopReceiptType.value
      printerObject.rePrintType = shopReceiptType.value
    }
  }
  printerList.value!.push(printerObject)
}

const deletePrinter = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  printerList.value!.forEach((printer: PrinterVo) => {
    if (printer.check) {
      printer.printerObjectType = 'delete'
    }
  })
}

const resetPrinterInfo = (printer: PrinterVo) => {
  if (printer.printerType === 'network') {
    printer.mainConnectionInfo = ''
    printer.subConnectionInfo = ''
  }
  if (printer.printerType === 'serial') {
    printer.mainConnectionInfo = 'COM1'
    printer.subConnectionInfo = '9600'
  }
}

const testPrinting = (printer: PrinterVo) => {
  if (!isElectron()) {
    $q.notify({
      type: 'negative',
      message: $t('SHOP_SETTING.009')
    })
    return
  }
  window.electronAPI.testPrint(printer.printerType, printer.mainConnectionInfo, printer.subConnectionInfo)
}

const openPrinterMenuMapping = (printer: PrinterVo) => {
  selectedPrinter.value = printer
  printerMenuMappingModal.value = true
}

const handlePrinterMenuMappingSave = (menuSeqList: number[]) => {
  if (selectedPrinter.value) {
    selectedPrinter.value.menuSeqList = menuSeqList
    if (selectedPrinter.value.printerObjectType === 'normal') {
      selectedPrinter.value.printerObjectType = 'update'
    }
  }
}

const newSignage = () => {
  if (!shopInfo.value?.pg) {
    $q.notify({
      type: 'negative',
      message: $t('SHOP.153')
    })

    return
  }

  if (!checkPermissions(['U'])) {
    return
  }
  const signageObject = new SignageClass()
  signageObject.shopSeq = shopInfo.value!.shopSeq
  signageList.value!.push(signageObject)
}

const deleteSignage = () => {
  if (!shopInfo.value?.pg) {
    $q.notify({
      type: 'negative',
      message: $t('SHOP.153')
    })

    return
  }

  if (!checkPermissions(['D'])) {
    return
  }
  signageList.value!.forEach((signage: SignageVo) => {
    if (signage.check) {
      signage.signageObjectType = 'delete'
    }
  })
}

const signageSequence = async () => {
  const signageOperations: {
    list: SignageVo[] | [],
    method: AvailableRouterMethod<string & {}>
    failMessage: string
  }[] = [
    {
      list: signageList.value?.filter((item: SignageVo) => item.signageObjectType !== 'delete') ?? [],
      method: 'put',
      failMessage: '사이니지 정보 수정에 실패하였습니다.'
    }
  ]

  const signageDeleteList = signageList.value?.filter((item: SignageVo) => item.signageObjectType === 'delete') ?? []

  // list의 데이터가 있는 항목만 필터링
  const validOperations = signageOperations.filter(operation => operation.list.length > 0)

  for (const { list, method, failMessage } of validOperations) {
    await customFetch('/admin/handOrder/shop/signage', {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: list,
      onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
        $q.notify({
          type: 'negative',
          message: `${failMessage} 상태 코드: ${context.response.status} ${context.response.statusText}`
        })
      }
    })
  }

  if (signageDeleteList.length > 0) {
    for (const signage of signageDeleteList) {
      if (signage.signageCode === null) { continue }

      await customFetch(`/admin/handOrder/shop/signage/${signage.signageCode}`, {
        method: 'delete',
        headers: {
          'Content-Type': 'application/json'
        },
        onResponseError: (context: { response: { status: any; statusText: any; }; }) => {
          $q.notify({
            type: 'negative',
            message: `사이니지 정보 삭제에 실패하였습니다. 상태 코드: ${context.response.status} ${context.response.statusText}`
          })
        }
      })
    }
  }
}
</script>

<template>
  <div v-if="shopInfo" class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t("SIDE_MENU.009") }}</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col overflow-auto">
      <div v-if="shopInfo.pg" class="full-width row wrap justify-between items-start content-start">
        <!--        알림톡 설정 -->
        <div>
          <div class="text-h6 text-bold title-box">
            {{ $t("SHOP_SETTING.053") }}
          </div>
          <div class="setting-container">
            <div class="column q-mt-md q-ml-lg q-gutter-y-md">
              <template v-if="shopInfo.pg">
                <div class="col">
                  <span class="option-text">{{ $t("SHOP_SETTING.076") }}</span>
                  <q-toggle v-model="shopInfo.alimtalkUse" :disable="!alertCount || alertCount <= 0" />
                  <q-icon v-if="!alertCount || alertCount <= 0" name="info" color="orange" class="q-ml-sm">
                    <q-tooltip>{{ $t("SHOP_SETTING.077") }}</q-tooltip>
                  </q-icon>
                  <p class="text-grey-6">
                    {{ $t("SHOP_SETTING.078") }}
                  </p>
                </div>

                <div v-if="shopInfo.alimtalkUse" class="col q-ml-md" style="margin-top: 0px">
                  <span class="option-text">{{ $t("SHOP_SETTING.079") }}</span>
                  <q-toggle v-model="shopInfo.phoneNumberOptional" />
                  <p class="text-grey-6">
                    {{ $t("SHOP_SETTING.080") }}
                  </p>
                </div>

                <div v-if="shopInfo.alimtalkUse" class="col q-ml-md" style="margin-top: 0px">
                  <span class="option-text">{{ $t("SHOP_SETTING.054") }}</span>
                  <q-toggle v-model="shopInfo.acceptOrderAlarm" />
                  <p class="text-grey-6">
                    {{ $t("SHOP_SETTING.057") }}
                  </p>
                </div>

                <div v-if="shopInfo.alimtalkUse" class="col q-ml-md" style="margin-top: 0px">
                  <span class="option-text">{{ $t("SHOP_SETTING.055") }}</span>
                  <q-toggle v-model="shopInfo.cancelOrderAlarm" />
                  <p class="text-grey-6">
                    {{ $t("SHOP_SETTING.058") }}
                  </p>
                </div>

                <div v-if="shopInfo.alimtalkUse" class="col q-ml-md" style="margin-top: 0px">
                  <span class="option-text">{{ $t("SHOP_SETTING.056") }}</span>
                  <q-toggle v-model="shopInfo.pickupAlarm" />
                  <p class="text-grey-6">
                    {{ $t("SHOP_SETTING.059") }}
                  </p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <q-card class="box-style charging-box">
          <q-card-section>
            <div class="text-h6 text-bold title-box">
              {{ $t("SHOP_SETTING.035") }}
            </div>
            <div class="charging-container">
              <div class="column q-mt-md q-ml-lg q-gutter-y-lg">
                <div class="col">
                  <span>※ {{ $t("SHOP_SETTING.036") }}</span>
                </div>
                <div class="col">
                  <span>※ {{ $t("SHOP_SETTING.037") }} </span>
                </div>
                <div class="col column q-gutter-y-md">
                  <div class="col text-h6 text-bold">
                    {{ $t("SHOP_SETTING.038") }}
                  </div>
                  <div class="col">
                    <span class="q-mr-lg">{{ $t("SHOP_SETTING.039") }} :
                      {{ $t("COMMON.086", {count: alertCount?.toLocaleString() ?? 0}) }}
                    </span>
                    <q-btn color="primary" :label="$t('SHOP_SETTING.043')" @click="openChargingPopup" />
                  </div>
                </div>
              </div>
            </div>
            <q-dialog v-model="chargingPopup" persistent>
              <q-card class="charging-popup">
                <template v-if="!chargingApply">
                  <q-card-section>
                    <div class="column">
                      <div class="col row justify-between q-mr-lg q-ml-sm">
                        <div>
                          <span class="text-bold">{{ $t("SHOP_SETTING.040") }}</span>
                        </div>
                        <div>
                          <span class="text-bold">{{ $t("SHOP_SETTING.041") }}</span>
                        </div>
                      </div>
                      <div class="col">
                        <q-radio v-model="amt" val="7700" class="full-width label-custom">
                          <div class="row justify-between q-mr-lg">
                            <div>
                              <span>7,700{{ $t("COMMON.049") }}</span>
                            </div>
                            <div>
                              <span>{{ $t("COMMON.086", { count: "1,000" }) }}</span>
                            </div>
                          </div>
                        </q-radio>
                        <q-radio v-model="amt" val="38500" class="full-width label-custom">
                          <div class="row justify-between q-mr-lg">
                            <div>
                              <span>38,500{{ $t("COMMON.049") }}</span>
                            </div>
                            <div>
                              <span>{{ $t("COMMON.086", { count: "5,000" }) }}</span>
                            </div>
                          </div>
                        </q-radio>
                        <q-radio v-model="amt" val="77000" class="full-width label-custom">
                          <div class="row justify-between q-mr-lg">
                            <div>
                              <span>77,000{{ $t("COMMON.049") }}</span>
                            </div>
                            <div>
                              <span>{{ $t("COMMON.086", { count: "10,000" }) }}</span>
                            </div>
                          </div>
                        </q-radio>
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions align="between">
                    <q-checkbox v-model="cashReceipt" :label="$t('SHOP_SETTING.042')" />
                    <div class="button-box">
                      <q-btn flat :label="$t('COMMON.005')" color="grey" class="q-mr-md" @click="chargingPopup = false" />
                      <q-btn flat :label="$t('SHOP_SETTING.043')" color="primary" @click="applyAlertCharging">
                        <q-tooltip class="bg-primary" :offset="[0,0]">
                          {{ $t('SHOP_SETTING.044') }}
                        </q-tooltip>
                      </q-btn>
                    </div>
                  </q-card-actions>
                  <q-card-actions align="left">
                    * {{ $t("SHOP_SETTING.045") }}
                  </q-card-actions>
                </template>
                <template v-else>
                  <q-card-section>
                    <div class="column">
                      <div class="col q-mb-sm">
                        <span class="text-h6 text-bold">{{ $t("SHOP_SETTING.046") }}</span>
                      </div>
                      <div class="col row q-ml-md q-gutter-y-md">
                        <span>* {{ $t("SHOP_SETTING.047") }}</span>
                        <span>* {{ $t("SHOP_SETTING.048") }}</span>
                      </div>
                      <div class="col text-bold background-gray q-mt-md">
                        <span>{{ $t("SHOP_SETTING.049") }}</span>
                      </div>
                      <div class="col q-mt-md">
                        <span>{{ $t("SHOP_SETTING.050") }}</span>
                      </div>
                      <div class="col q-mt-md">
                        <span>{{ $t("SHOP_SETTING.051") }}: {{ amt }}{{ $t("COMMON.049") }}</span>
                      </div>
                      <div class="col q-mt-md">
                        <span>{{ $t("SHOP_SETTING.052") }}: {{ shopInfo.shopName }}</span>
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions>
                    <div class="button-box">
                      <q-btn :label="$t('COMMON.004')" color="grey" class="q-mr-md" @click="alertClosePopup" />
                    </div>
                  </q-card-actions>
                </template>
              </q-card>
            </q-dialog>
          </q-card-section>
        </q-card>
      </div>
      <div class="full-width row wrap justify-start items-start content-start">
        <div class="shop-setting-box">
          <div class="text-h6 text-bold title-box">
            {{ $t("SIDE_MENU.009") }}
          </div>
          <div class="shop-container">
            <div class="column q-mt-md q-ml-lg q-gutter-y-md">
              <div v-if="userInfo.userType === 'admin'" class="col">
                <span class="option-text"> {{ $t("SHOP_SETTING.081") }} </span>
                <!--  :disable="!shopInfo.pg"              -->
                <q-toggle
                  v-model="shopInfo.afterEatPaymentActive"
                  disable
                />
                <q-icon v-if="!shopInfo.pg" name="info" color="orange" class="q-ml-sm">
                  <q-tooltip>{{ $t("SHOP_SETTING.082") }}</q-tooltip>
                </q-icon>
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.083") }}
                </p>
              </div>
              <div class="col">
                <span class="option-text">{{ $t("SHOP_SETTING.010") }} </span><q-toggle v-model="shopInfo.acceptOrderButtonActive" />
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.011") }}
                </p>
              </div>
              <div class="col">
                <span class="option-text">{{ $t("SHOP_SETTING.012") }} </span><q-toggle v-model="shopInfo.tableManagement" />
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.013") }}
                </p>
              </div>
              <div v-if="shopInfo.pg" class="col">
                <span class="option-text">{{ $t("SHOP_SETTING.070") }}</span>
                <q-toggle v-model="shopInfo.useOrderTypeSelection" />
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.071") }}
                </p>
              </div>
              <div v-if="userInfo.userType === 'admin'" class="col">
                <div class="row items-center q-mb-xs">
                  <span class="option-text">{{ $t("SHOP_SETTING.084") }}</span>
                  <q-select
                    v-model="shopInfo.usagePurpose"
                    :options="agentModeOptions"
                    emit-value
                    map-options
                    outlined
                    dense
                    style="min-width: 150px"
                    class="q-ml-md"
                    :disable="!shopInfo.tableManagement"
                  />
                  <q-icon
                    v-if="!shopInfo.tableManagement"
                    name="info"
                    color="orange"
                    class="q-ml-sm"
                  >
                    <q-tooltip>{{ $t("SHOP_SETTING.085") }}</q-tooltip>
                  </q-icon>
                </div>
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.086") }}
                </p>

                <!-- usagePurpose가 ALL, PAYMENT_WINDOW일 때만 표시 -->
                <div
                  v-if="shopInfo.usagePurpose === 'ALL' || shopInfo.usagePurpose === 'PAYMENT_WINDOW'"
                  class="q-ml-md q-mt-md q-pa-md"
                  style="border-left: 3px solid #ff8b4a; background-color: #fafafa; border-radius: 4px;"
                >
                  <div class="text-weight-medium q-mb-sm">
                    <q-icon name="devices" color="orange" class="q-mr-xs" />
                    {{ $t("SHOP_SETTING.087") }}
                  </div>
                  <q-input
                    v-model="shopInfo.frontPaymentDeviceCode"
                    class="q-mt-sm"
                    outlined
                    dense
                    placeholder="예: AAAAA"
                    style="max-width: 400px"
                  >
                    <template v-slot:prepend>
                      <q-icon name="qr_code" />
                    </template>
                    <template v-slot:hint>
                      {{ $t("SHOP_SETTING.088") }}
                    </template>
                  </q-input>
                </div>
              </div>
              <!--              프린트 사용 여부-->
              <div class="col">
                <span class="option-text">{{ $t("SHOP_SETTING.014") }} </span><q-toggle v-model="shopInfo.usePrinter" />
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.015") }}
                </p>
                <div v-if="shopInfo!.usePrinter && shopInfo.pg" class="flex row justify-start items-center">
                  <span class="q-mr-lg">영수증 타입: </span>
                  <q-select
                    v-model="shopReceiptType"
                    :options="receiptTypeOption.filter(item => item.value !== '')"
                    autocomplete="off"
                    emit-value
                    map-options
                    style="width: 150px"
                  />
                </div>
              </div>
              <!--              요청사항 활성화 여부-->
              <div v-if="userInfo.userType === 'admin'" class="col">
                <span class="option-text">{{ $t("SHOP_SETTING.016") }} </span><q-toggle v-model="shopInfo!.requestActive" />
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.017") }}
                </p>
              </div>
              <!-- 공지사항 등록 ui -->
              <div>
                <span class="option-text">{{ $t("SHOP_SETTING.018") }}</span>
                <div class="q-mb-sm">
                  <q-input
                    ref="noticeInput"
                    v-model="shopInfo.noticeContent"
                    class="notice-input"
                    :placeholder="$t('SHOP_SETTING.019')"
                    dense
                    clearable
                    autogrow
                    :rules="[validateNotice]"
                    :autofocus="false"
                    counter
                    maxlength="200"
                  />
                </div>
              </div>

              <!-- 영업시간 설정 ui -->
              <div class="col q-mb-md">
                <span class="option-text">{{ $t("SHOP_SETTING.020") }}</span>

                <div class="flex items-center">
                  <div class="flex row justify-start items-center q-gutter-sm" style="margin-top :0px;">
                    <q-select
                      v-model="openTime.hour"
                      filled
                      dense
                      :options="hourOption"
                      autocomplete="off"
                    />
                    <span>:</span>
                    <q-select
                      v-model="openTime.minute"
                      filled
                      dense
                      :options="minuteOption"
                      autocomplete="off"
                    />
                  </div>

                  <div class="q-ma-md">
                    ~
                  </div>

                  <div class="flex row justify-start items-center q-gutter-sm">
                    <q-select
                      v-model="closeTime.hour"
                      filled
                      dense
                      :options="hourOption"
                      autocomplete="off"
                    />
                    <span>:</span>
                    <q-select
                      v-model="closeTime.minute"
                      filled
                      dense
                      :options="minuteOption"
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>

              <!-- 브레이크타임 설정 ui -->
              <div class="col q-mb-md">
                <span>{{ $t('SHOP_SETTING.021') }} <q-btn :label="$t('COMMON.096')" color="primary" dense @click="insertBreakTime" /></span>
                <div v-if="Array.isArray(breakTimeList) && breakTimeList.length > 0">
                  <div v-for="(breakTime, index) in breakTimeList.filter((bt) => bt.state !== 'DELETE')" :key="index" class="flex items-center" style="margin-bottom: 10px;">
                    <div class="flex row justify-start items-center q-gutter-sm" style="margin-top :0px;">
                      <q-btn color="negative" dense @click="deleteBreakTime(breakTime.seq)">
                        <q-icon name="delete" />
                      </q-btn>
                      <q-select
                        v-model="breakTime.startTimeData!.hour"
                        filled
                        dense
                        :options="hourOption"
                        autocomplete="off"
                        @update:model-value="setBreakTimeData(breakTime)"
                      />
                      <span>:</span>
                      <q-select
                        v-model="breakTime.startTimeData!.minute"
                        filled
                        dense
                        :options="minuteOption"
                        autocomplete="off"
                        @update:model-value="setBreakTimeData(breakTime)"
                      />

                      <div>~</div>

                      <q-select
                        v-model="breakTime.endTimeData!.hour"
                        filled
                        dense
                        :options="hourOption"
                        autocomplete="off"
                        @update:model-value="setBreakTimeData(breakTime)"
                      />
                      <span>:</span>
                      <q-select
                        v-model="breakTime.endTimeData!.minute"
                        filled
                        dense
                        :options="minuteOption"
                        autocomplete="off"
                        @update:model-value="setBreakTimeData(breakTime)"
                      />
                      <div>
                        <q-toggle
                          v-model="breakTime.dayOfWeek"
                          :label="$t('COMMON.065')"
                          :true-value="0"
                          :false-value="-1"
                          @update:model-value="() => {
                            if(breakTime.state === 'NORMAL') {
                              breakTime.state = 'UPDATE'
                            }
                          }"
                        />
                      </div>

                      <div v-if="breakTime.dayOfWeek !== 0" style="margin-left: 30px">
                        <q-option-group
                          v-model="breakTime.dayOfWeekList"
                          type="checkbox"
                          toggle-color="primary"
                          inline
                          :options="[
                            { label: $t('COMMON.066'), value: 1 },
                            { label: $t('COMMON.067'), value: 2 },
                            { label: $t('COMMON.068'), value: 3 },
                            { label: $t('COMMON.069'), value: 4 },
                            { label: $t('COMMON.070'), value: 5 },
                            { label: $t('COMMON.071'), value: 6 },
                            { label: $t('COMMON.072'), value: 7 },
                          ]"
                          @update:model-value="() => {
                            if(breakTime.state === 'NORMAL') {
                              breakTime.state = 'UPDATE'
                            }
                          }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 배달매장 설정 ui-->
              <div class="col">
                <div class="q-mb-sm flex items-center">
                  <span class="option-text">{{ $t("SHOP_SETTING.061") }}</span>
                  <q-btn
                    :label="$t('SHOP_SETTING.062')"
                    color="primary"
                    class="q-ml-md"
                    @click="openDeliveryModal"
                  />
                </div>
                <p class="text-grey-6">
                  {{ $t("SHOP_SETTING.063") }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="full-width row wrap justify-start items-start content-start q-mt-lg">
          <div class="full-width">
            <div class="text-h6 text-bold title-box">
              {{ $t("SHOP_SETTING.022") }}
              <!--            프린터 설정 on off 설정-->
            </div>
            <div class="print-container">
              <!-- 프린���별 메뉴 출력 기능 스위치 -->
              <div class="column q-mt-md q-ml-lg q-mb-md">
                <div class="col">
                  <span class="option-text">{{ $t("SHOP_SETTING.066") }}</span>
                  <q-toggle
                    v-model="shopInfo.usePrinterMenuFilter"
                    :disable="!shopInfo.usePrinter"
                  />
                  <p class="text-grey-6">
                    {{ $t("SHOP_SETTING.067") }}
                  </p>
                </div>
              </div>

              <div class="row q-mt-md q-ml-lg q-gutter-x-md">
                <q-btn :label="$t('SHOP_SETTING.023')" color="primary" @click="newPrinter" />
                <q-btn :label="$t('SHOP_SETTING.024')" color="negative" @click="deletePrinter" />
              </div>

              <div class="print-list-table q-mt-md q-mb-lg">
                <div class="print-header row justify-center items-center">
                  <div class="print-header-item">
                    <q-checkbox />
                  </div>
                  <div class="print-header-item col">
                    {{ $t("SHOP_SETTING.025") }}
                  </div>
                  <div class="print-header-item col-2 required-field">
                    {{ $t("COMMON.073") }}
                  </div>
                  <div class="print-header-item col-2 required-field">
                    Serial / IP
                  </div>
                  <div class="print-header-item col required-field">
                    BaudRate / Port
                  </div>
                  <div class="print-header-item col-2">
                    {{ $t("SIDE_MENU.019") }}
                  </div>
                  <div class="print-header-item col">
                    {{ $t("SHOP_SETTING.026") }}
                  </div>
                  <div v-if="shopInfo.usePrinterMenuFilter" class="print-header-item col">
                    {{ $t("SHOP_SETTING.068") }}
                  </div>
                  <div class="print-header-item col" />
                </div>
                <div
                  v-for="(printer, index) in printerList.filter(
                    (item) =>
                      item.printerObjectType === 'new' ||
                      item.printerObjectType === 'update',
                  )"
                  :key="index"
                  class="print-body row justify-center items-center"
                >
                  <div class="print-body-item">
                    <q-checkbox v-model="printer.check" />
                  </div>
                  <div class="print-body-item col">
                    <q-input v-model="printer.printerName" />
                  </div>
                  <div class="print-body-item col-2">
                    <q-select
                      v-model="printer.printerType"
                      :options="PrintType"
                      emit-value
                      map-options
                      @update:model-value="resetPrinterInfo(printer)"
                    />
                  </div>
                  <div class="print-body-item col-2">
                    <q-select
                      v-if="printer.printerType === 'serial'"
                      v-model="printer.mainConnectionInfo"
                      :options="PrintSerialPortList"
                      emit-value
                      map-options
                    />
                    <q-input v-else-if="printer.printerType === 'network'" v-model="printer.mainConnectionInfo" />
                  </div>
                  <div class="print-body-item col">
                    <q-select
                      v-if="printer.printerType === 'serial'"
                      v-model="printer.subConnectionInfo"
                      :options="PrintBaudRateList"
                      emit-value
                      map-options
                    />
                    <q-input v-else-if="printer.printerType === 'network'" v-model="printer.subConnectionInfo" />
                  </div>
                  <template v-if="shopInfo.pg">
                    <div class="print-body-item col-2">
                      <q-select
                        v-model="printer.orderReceiptType"
                        :options="receiptTypeOption"
                        emit-value
                        map-options
                      />
                    </div>
                    <div class="print-body-item col">
                      <q-select
                        v-model="printer.rePrintType"
                        :options="receiptTypeOption"
                        emit-value
                        map-options
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div class="print-body-item col-2">
                      <q-toggle v-model="printer.orderReceipt" />
                    </div>
                    <div class="print-body-item col">
                      <q-toggle v-model="printer.rePrint" />
                    </div>
                  </template>

                  <div v-if="shopInfo.usePrinterMenuFilter" class="print-body-item col">
                    <q-btn
                      :label="$t('SHOP_SETTING.069')"
                      color="secondary"
                      size="sm"
                      @click="openPrinterMenuMapping(printer)"
                    />
                  </div>

                  <div class="print-body-item col">
                    <q-btn label="test" color="primary" @click="testPrinting(printer)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!--        사이니지 설정-->

      <div class="text-h6 text-bold title-box">
        {{ $t('SHOP_SETTING.072') }}
      </div>
      <div class="print-container">
        <div class="row q-mt-md q-ml-lg q-gutter-x-md">
          <q-btn :label="$t('SHOP_SETTING.023')" color="primary" @click="newSignage" />
          <q-btn :label="$t('SHOP_SETTING.024')" color="negative" @click="deleteSignage" />
        </div>

        <div class="print-list-table q-mt-md q-mb-lg">
          <div class="print-header row justify-center items-center">
            <div class="print-header-item">
              <q-checkbox />
            </div>
            <div class="print-header-item col">
              {{ $t('SHOP_SETTING.073') }}
            </div>
            <div class="print-header-item col-6 required-field">
              {{ $t('SHOP_SETTING.074') }}
            </div>
            <div class="print-header-item col-4 required-field">
              {{ $t('SHOP_SETTING.075') }}
            </div>
          </div>
          <div v-for="(signage, index) in signageList?.filter(item => item.signageObjectType === 'new' || item.signageObjectType === 'update')" :key="`signage-${index}`" class="print-body row justify-center items-center">
            <div class="print-body-item">
              <q-checkbox v-model="signage.check" :disable="!shopInfo.pg" />
            </div>
            <div class="print-body-item col">
              <q-input v-model="signage.signageName" :disable="!shopInfo.pg" :autofocus="false" />
            </div>
            <div class="print-body-item col-6">
              <q-input
                v-model="signage.signageCode"
                :readonly="signage.signageObjectType === 'update'"
                :autofocus="false"
              />
            </div>
            <div class="print-body-item col-4">
              <q-toggle v-model="signage.isActive" :disable="!shopInfo.pg" />
            </div>
          </div>
        </div>
      </div>

      <div class="save-button-container">
        <q-btn color="primary" :label="$t('SHOP_SETTING.027')" @click="saveSettings" />
      </div>
      <q-separator class="q-my-lg" />
      <div>
        <q-card>
          <q-tabs v-model="tab">
            <q-tab name="alarm-history" :label="$t('SHOP_SETTING.060')" />
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="tab">
            <q-tab-panel name="alarm-history">
              <div class="q-mt-md">
                <ClientOnly>
                  <q-table
                    flat
                    bordered
                    style="max-height: 500px"
                    :rows="alertChargingList"
                    :columns="columns"
                    row-key="alertChargeKey"
                    virtual-scroll
                    :rows-per-page-options="[0]"
                    hide-bottom
                  />
                  <template v-slot:fallback>
                    <div class="text-center q-pa-md">
                      <q-spinner size="md" />
                      <div class="q-mt-sm">
                        {{ $t("COMMON.015") }}
                      </div>
                    </div>
                  </template>
                </ClientOnly>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>

      <!-- 프린터 메뉴 매핑 모달 -->
      <PrinterMenuMappingModal
        v-model="printerMenuMappingModal"
        :printer="selectedPrinter"
        :shop-code="shopCode"
        @save="handlePrinterMenuMappingSave"
      />

      <DeliverySettingModal
        :delivery-modal-visible="deliveryModalVisible"
        @close:delivery-modal-visible="closeDeliveryModal"
        @update:delivery-setting="dataRefresh"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-body {
  .box-style {
    width: 48%;
    margin-bottom: 20px;
  }
  .title-box {
    font-size: 1.5rem;
    color: #ff8b4a;
    font-weight: bold;
    line-height: 1.8;
    margin-bottom: 10px;
    text-transform: uppercase;
  }
  .option-text {
    font-size: 1.1rem;
    font-weight: 700;
  }
  .shop-box {
    width: 100%;
  }
  .save-button-container {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
  }
}
.charging-popup {
  width: 450px;
  padding: 1rem;
  .label-custom {
    :deep(.q-radio__label) {
      width: 100%;
    }
  }
  .background-gray {
    background-color: #f5f5f4;
    padding: 0.7rem;
  }
}

.print-list-table {
  .print-header {
    display: flex;
    height: 50px;
    background-color: #f5f5f4;
    .print-header-item {
      font-weight: 700;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 1rem;
    }
    .required-field {
      &:after {
        color: red;
        content: "*";
      }
    }
  }
  .print-body {
    height: 50px;
    .print-body-item {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 1rem;
    }
  }
}
</style>
