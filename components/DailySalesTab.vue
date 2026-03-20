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
  dailySearchParam: {
    startDate: string
    endDate: string
    searchType: string
    searchLocale: string
  }
}>()

const emits = defineEmits <{(e: 'changeProductTab', tab: string, searchParam: any, currentParam: any): void,
  (e: 'saveDailySearchParam', param: {
    startDate: string
    endDate: string
    searchType: string
    searchLocale: string
  }): void
}>()

const pagination = ref({
  rowsPerPage: 0
})

const searchTypeList = ref([
  { label: $t('REPORT_ORDER.003'), value: 'daily' },
  { label: $t('REPORT_ORDER.004'), value: 'weekly' },
  { label: $t('REPORT_ORDER.005'), value: 'monthly' },
  { label: $t('REPORT_ORDER.006'), value: 'dayOfWeek' }
])
const columns = [
  {
    name: 'orderDate',
    label: $t('REPORT_ORDER.007'),
    align: 'center',
    field: 'orderDate'
  },
  {
    name: 'orderQuantity',
    label: $t('REPORT_ORDER.008'),
    align: 'center',
    field: 'orderQuantity',
    format: (val: number) => $t('COMMON.086', { count: val.toLocaleString() }),
    sortable: true
  },
  {
    name: 'orderPrice',
    label: $t('REPORT_ORDER.009'),
    align: 'center',
    field: 'orderPrice',
    format: (val: number) => val.toLocaleString() + $t('COMMON.049'),
    sortable: true
  },
  {
    name: 'orderCount',
    label: $t('REPORT_ORDER.010'),
    align: 'center',
    field: 'orderCount',
    format: (val: number) => $t('COMMON.086', { count: val.toLocaleString() }),
    sortable: true
  }
]

const defaultTime = new Date(2000, 0, 1, 0, 0, 0)

const startDate = ref(props.dailySearchParam.startDate)
const endDate = ref(props.dailySearchParam.endDate)
const searchType = ref(props.dailySearchParam.searchType)
const currentSearchType = ref(props.dailySearchParam.searchType)
const searchLocale = ref(props.dailySearchParam.searchLocale)

const { data: orderList } = await useCustomFetch('/admin/handOrder/report/daily/sales', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  params: {
    searchParam: JSON.stringify({
      startDate: startDate.value,
      endDate: endDate.value,
      shopCode: props.shopCode,
      searchType: searchType.value,
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
  if (searchType.value === 'monthly') {
    endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  } else {
    endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  }
  doSearch()
}

const setYesterday = () => {
  startDate.value = dayjs().subtract(1, 'day').format('YYYY-MM-DD 00:00:00')
  if (searchType.value === 'monthly') {
    endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  } else {
    endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  }
  doSearch()
}

const set7Day = () => {
  startDate.value = dayjs().subtract(7, 'day').format('YYYY-MM-DD 00:00:00')
  if (searchType.value === 'monthly') {
    endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  } else {
    endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  }
  doSearch()
}

const setMonth = () => {
  startDate.value = dayjs().subtract(1, 'month').format('YYYY-MM-DD 00:00:00')
  if (searchType.value === 'monthly') {
    endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  } else {
    endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
  }
  doSearch()
}

const doSearch = async () => {
  orderList.value = await customFetch('/admin/handOrder/report/daily/sales', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      searchParam: JSON.stringify({
        startDate: startDate.value,
        endDate: endDate.value,
        shopCode: props.shopCode,
        searchType: searchType.value,
        searchLocale: searchLocale.value,
        pgYn: false
      })
    }
  })
  currentSearchType.value = searchType.value
  emits('saveDailySearchParam', {
    startDate: startDate.value,
    endDate: endDate.value,
    searchType: searchType.value,
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
  if (searchType.value === 'monthly') {
    return makeRange(0, 23)
  }
  if (dayjs(endDate.value).isSameOrBefore(dayjs())) {
    return makeRange(dayjs().hour() + 1, 23)
  }
}

const disabledStartHours = () => {
  if (searchType.value === 'monthly') {
    return makeRange(0, 23)
  }

  if (dayjs(startDate.value).isSameOrBefore(dayjs())) {
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
  if (dayjs().isSameOrBefore(dayjs(startDate.value), 'day')) {
    startDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
  } else {
    startDate.value = dayjs(startDate.value).add(1, 'day').format('YYYY-MM-DD HH:00:00')
  }
  // 만약 종료일이 지금 시간보다 크다면 오늘 날짜로 설정
  if (dayjs().isSameOrBefore(dayjs(endDate.value), 'day')) {
    if (searchType.value === 'monthly') {
      endDate.value = dayjs().format('YYYY-MM-DD 00:00:00')
    } else {
      endDate.value = dayjs().format('YYYY-MM-DD HH:00:00')
    }
  } else if (searchType.value === 'monthly') {
    endDate.value = dayjs(endDate.value).add(1, 'day').format('YYYY-MM-DD 00:00:00')
  } else {
    endDate.value = dayjs(endDate.value).add(1, 'day').format('YYYY-MM-DD HH:00:00')
  }
}

const setPrevDay = () => {
  startDate.value = dayjs(startDate.value).subtract(1, 'day').format('YYYY-MM-DD HH:00:00')
  endDate.value = dayjs(endDate.value).subtract(1, 'day').format('YYYY-MM-DD HH:00:00')
}

const doProductSalesDetail = (row: any) => {
  const searchParam = {
    startDate: startDate.value,
    endDate: endDate.value,
    searchType: searchType.value,
    searchLocale: searchLocale.value
  }

  switch (currentSearchType.value) {
    case 'daily': {
      // YYYY년 MM월 dd일
      const searchDay = dayjs(row.orderDate, 'YYYY년 MM월 DD일').format('YYYY-MM-DD 00:00:00')
      searchParam.startDate = searchDay
      searchParam.endDate = dayjs(searchDay).add(1, 'day').format('YYYY-MM-DD 00:00:00')
      break
    }
    case 'weekly': {
      // 1. 입력 문자열에서 연도, 월, 주차 정보를 추출
      const regex = /(\d{4})년 (\d{2})월 (\d)주/
      const match = row.orderDate.match(regex)

      if (!match) {
        throw new Error($t('REPORT_ORDER.011'))
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, year, month, week] = match

      // 2. 해당 월의 첫 번째 날을 찾기
      const firstDayOfMonth = dayjs(`${year}-${month}-01`, 'YYYY-MM-DD')

      // 3. 해당 월의 n번째 주의 시작일과 종료일을 계산
      const startOfNthWeek = firstDayOfMonth.startOf('isoWeek').add(Number(week) - 1, 'week')
      const endOfNthWeek = startOfNthWeek.endOf('isoWeek')

      searchParam.startDate = dayjs(startOfNthWeek).format('YYYY-MM-DD 00:00:00')
      searchParam.endDate = dayjs(endOfNthWeek).add(1, 'day').format('YYYY-MM-DD 00:00:00')
      break
    }
    case 'monthly': {
      const searchMonth = dayjs(row.orderDate, 'YYYY년 MM월')
      searchParam.startDate = dayjs(searchMonth).startOf('month').format('YYYY-MM-DD 00:00:00')
      searchParam.endDate = dayjs(searchMonth).endOf('month').add(1, 'day').format('YYYY-MM-DD 00:00:00')
      break
    }
  }

  // 시작일이 검색한 날짜보다 작다면 검색한 날짜로 설정
  if (dayjs(searchParam.startDate).isSameOrBefore(dayjs(startDate.value), 'day')) {
    searchParam.startDate = startDate.value
  }

  if (dayjs().isSameOrBefore(dayjs(searchParam.endDate), 'day')) {
    if (currentSearchType.value === 'monthly') {
      searchParam.endDate = dayjs().format('YYYY-MM-DD 00:00:00')
    } else {
      searchParam.endDate = dayjs().format('YYYY-MM-DD HH:00:00')
    }
  }

  if (dayjs(endDate.value).isBefore(dayjs(searchParam.endDate))) {
    searchParam.endDate = endDate.value
  }

  const currentParam = {
    startDate: startDate.value,
    endDate: endDate.value,
    searchType: searchType.value,
    searchLocale: searchLocale.value
  }
  emits('changeProductTab', 'product', searchParam, currentParam)
}
const changeSearchType = () => {
  if (searchType.value === 'monthly') {
    startDate.value = dayjs(startDate.value).format('YYYY-MM-DD 00:00:00')
    endDate.value = dayjs(endDate.value).format('YYYY-MM-DD 00:00:00')
  }
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
          <q-radio
            v-for="option in searchTypeList "
            :key="option.value"
            v-model="searchType"
            :val="option.value"
            :label="option.label"
            class="q-mr-lg"
            @update:model-value="changeSearchType"
          />
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
          <span class="text-h5">{{ $t('COMMON.086', { count: orderList.reduce((acc, cur) => acc + cur.orderQuantity, 0).toLocaleString() }) }}</span>
        </div>
        <div class="total-item">
          <span class="text-h5 text-bold">{{ $t('REPORT_ORDER.019') }}:</span>
          <span class="text-h5">{{ orderList.reduce((acc, cur) => acc + cur.orderPrice, 0).toLocaleString() }}{{ $t('COMMON.049') }}</span>
        </div>
        <div class="total-item">
          <span class="text-h5 text-bold">{{ $t('REPORT_ORDER.020') }}:</span>
          <span class="text-h5">{{ $t('COMMON.086', { count: orderList.reduce((acc, cur) => acc + cur.orderCount, 0).toLocaleString() }) }}</span>
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
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.value }}
            </q-td>
            <q-td v-if="currentSearchType !== 'dayOfWeek'" auto-width>
              <q-btn
                :label="$t('REPORT_ORDER.017')"
                color="primary"
                @click="() => doProductSalesDetail(props.row)"
              />
            </q-td>
          </q-tr>
        </template>
      </q-table>
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
