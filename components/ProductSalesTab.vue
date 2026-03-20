<script setup lang="ts">
import ko from 'element-plus/dist/locale/ko.min.mjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import useDayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { LocaleCodeVo } from '~/types'

const dayjs = useDayjs
const $q = useQuasar()

dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

const props = defineProps<{
  shopCode: string
  productSearchParam: {
    startDate: string
    endDate: string
    searchType: string
    searchLocale: string
  }
}>()

const emits = defineEmits <{(e: 'saveProductSearchParam', param: {
    startDate: string
    endDate: string
    searchLocale: string
  }): void
}>()

const pagination = ref({
  rowsPerPage: 0
})
const columns = [
  {
    name: 'menuName',
    label: $t('COMMON.033'),
    align: 'center',
    field: 'menuName',
    sortable: true
  },
  {
    name: 'menuQuantity',
    label: $t('REPORT_ORDER.008'),
    align: 'center',
    field: 'menuQuantity',
    format: (val: number) => $t('COMMON.086', { count: val.toLocaleString() }),
    sortable: true
  },
  {
    name: 'menuPrice',
    label: $t('REPORT_ORDER.009'),
    align: 'center',
    field: 'menuPrice',
    format: (val: number) => val.toLocaleString() + $t('COMMON.049'),
    sortable: true
  }
]

const defaultTime = new Date(2000, 0, 1, 0, 0, 0)

const startDate = ref(props.productSearchParam.startDate)
const endDate = ref(props.productSearchParam.endDate)
const searchLocale = ref(props.productSearchParam.searchLocale)

const { data: orderList } = await useCustomFetch('/admin/handOrder/report/product/sales', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  params: {
    searchParam: JSON.stringify({
      startDate: startDate.value,
      endDate: endDate.value,
      shopCode: props.shopCode,
      searchLocale: searchLocale.value,
      pgYn: false
    })
  }
})

const { data: localeList } = await useCustomFetch<LocaleCodeVo[]>(`/admin/handOrder/locale/shop/${props.shopCode}`, {
  method: 'GET'
})

const setToday = () => {
  startDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  doSearch()
}

const setYesterday = () => {
  startDate.value = dayjs().subtract(1, 'day').format('YYYY-MM-DD 00:00:00')
  endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  doSearch()
}

const set7Day = () => {
  startDate.value = dayjs().subtract(7, 'day').format('YYYY-MM-DD 00:00:00')
  endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  doSearch()
}

const setMonth = () => {
  startDate.value = dayjs().subtract(1, 'month').format('YYYY-MM-DD 00:00:00')
  endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  doSearch()
}

const doSearch = async () => {
  orderList.value = await customFetch('/admin/handOrder/report/product/sales', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      searchParam: JSON.stringify({
        startDate: startDate.value,
        endDate: endDate.value,
        shopCode: props.shopCode,
        searchLocale: searchLocale.value,
        pgYn: false
      })
    }
  })
  emits('saveProductSearchParam', {
    startDate: startDate.value,
    endDate: endDate.value,
    searchLocale: searchLocale.value
  })
}

const disabledDate = (time: any) => {
  return time.getTime() > Date.now()
}

const disabledMinutes = () => {
  return makeRange(0, 59)
}

const disabledEndHours = () => {
  if (dayjs(endDate.value).isSame(dayjs(), 'day')) {
    return makeRange(dayjs().hour() + 1, 23)
  }
}

const disabledStartHours = () => {
  if (dayjs(startDate.value).isSame(dayjs(), 'day')) {
    return makeRange(dayjs().hour(), 23)
  }
}

const makeRange = (start: number, end: number) => {
  const result: number[] = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
}

const setNextDay = () => {
  // 설정한 시간은 그대로 유지하고 날짜만 변경
  if (dayjs(startDate.value).isSame(dayjs(), 'day')) {
    startDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  } else {
    startDate.value = dayjs(startDate.value).add(1, 'day').format('YYYY-MM-DD HH:00:00')
  }
  // 만약 종료일이 지금 시간보다 크다면 오늘 날짜로 설정
  if (dayjs(endDate.value).isSame(dayjs(), 'day')) {
    endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  } else {
    endDate.value = dayjs(endDate.value).add(1, 'day').format('YYYY-MM-DD HH:00:00')
  }
}

const setPrevDay = () => {
  startDate.value = dayjs(startDate.value).subtract(1, 'day').format('YYYY-MM-DD HH:00:00')
  endDate.value = dayjs(endDate.value).subtract(1, 'day').format('YYYY-MM-DD HH:00:00')
}

const validationDate = (type:string) => {
  // 시작일 종료일 서로 벨리데이션
  switch (type) {
    case 'start':
      if (dayjs(startDate.value).isAfter(dayjs(endDate.value))) {
        $q.notify({
          type: 'negative',
          message: $t('REPORT_ORDER.012')
        })
        startDate.value = dayjs(endDate.value).format('YYYY-MM-DD 00:00:00')
      }
      break
    case 'end':
      if (dayjs(endDate.value).isBefore(dayjs(startDate.value))) {
        $q.notify({
          type: 'negative',
          message: $t('REPORT_ORDER.013')
        })
        endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
      }
      break
  }
}

</script>

<template>
  <div class="column full-height">
    <div class="search-box q-mt-md row justify-between">
      <div class="q-mb-md">
        <div>
          <ElConfigProvider :locale="ko">
            <!--        <ElDatePicker model-value="value1" type="date" placeholder="Pick a day" style="width: 100%;" />-->
            <q-btn icon="arrow_back_ios" @click="setPrevDay" />
            <el-date-picker
              v-model="startDate"
              type="datetime"
              :placeholder="$t('COMMON.082')"
              size="large"
              value-format="YYYY-MM-DD HH:00:00"
              date-format="YYYY-MM-DD"
              time-format="HH:mm"
              :disabled-hours="disabledStartHours"
              :disabled-minutes="disabledMinutes"
              :disabled-seconds="disabledMinutes"
              :disabled-date="disabledDate"
              :clearable="false"
              :default-time="defaultTime"
              :editable="false"
              @change="validationDate('start')"
            />
            ~
            <el-date-picker
              v-model="endDate"
              type="datetime"
              :placeholder="$t('COMMON.082')"
              size="large"
              value-format="YYYY-MM-DD HH:00:00"
              date-format="YYYY-MM-DD"
              time-format="HH:mm"
              :disabled-hours="disabledEndHours"
              :disabled-minutes="disabledMinutes"
              :disabled-seconds="disabledMinutes"
              :disabled-date="disabledDate"
              :clearable="false"
              :default-time="defaultTime"
              :editable="false"
              @change="validationDate('end')"
            />
          </ElConfigProvider>
          <q-btn icon="arrow_forward_ios" @click="setNextDay" />

          <q-btn :label="$t('COMMON.083')" @click="setToday" />
          <q-btn :label="$t('COMMON.084')" @click="setYesterday" />
          <q-btn :label="$t('REPORT_ORDER.014')" @click="set7Day" />
          <q-btn :label="$t('REPORT_ORDER.015')" @click="setMonth" />
        </div>
        <div class="q-mt-sm">
          <el-select v-model="searchLocale" :placeholder="$t('COMMON.085')" :clearable="false">
            <el-option :label="$t('REPORT_ORDER.016')" value="ALL" />
            <el-option label="한국어" value="ko" />
            <el-option
              v-for="item in localeList"
              :key="item.localeCode"
              :label="item.localeName"
              :value="item.localeCode"
            />
          </el-select>
          <q-btn :label="$t('COMMON.021')" color="primary" class="float-right q-ml-lg" @click="doSearch" />
        </div>
      </div>
    </div>
    <div class="content-item col column">
      <div class="total-box row justify-around">
        <div class="total-item">
          <span class="text-h5 text-bold">{{ $t('REPORT_ORDER.018') }}:</span>
          <span class="text-h5">{{ $t('COMMON.086', {count: orderList.reduce((acc, cur) => acc + cur.menuQuantity, 0).toLocaleString() }) }}</span>
        </div>
        <div class="total-item">
          <span class="text-h5 text-bold">{{ $t('REPORT_ORDER.019') }}:</span>
          <span class="text-h5">{{ orderList.reduce((acc, cur) => acc + cur.menuPrice, 0).toLocaleString() }}{{ $t('COMMON.049') }}</span>
        </div>
      </div>

      <q-table
        v-model:pagination="pagination"
        :rows-per-page-options="[0]"
        :pagination="true"
        :rows="orderList"
        :columns="columns"
        class="full-height sticky-header-table col sales-table"
        virtual-scroll
        hide-bottom
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sticky-header-table{
  :deep(thead tr:first-child th) {
    // bg color is important for th; just specify one
    background-color: #ffffff;
  }
  :deep(thead tr th) {
    position: sticky;
    z-index: 1;
  }
  :deep(thead tr:first-child th) {
    top: 0;
  }
}
.total-box{
  background: #ff8b4a ;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  margin-bottom: 10px;
}
.electron-layout .sales-table{
  max-height: 400px;
}
</style>
