<script setup lang="ts">
import ProductSalesTab from '~/components/ProductSalesTab.vue'
import DailySalesTab from '~/components/DailySalesTab.vue'

const route = useRoute()
const dayjs = useDayjs()

const shopCode:string = route.params.shopCode as string

const tab = ref('daily')

const dailySearchParam = ref({
  startDate: dayjs().format('YYYY-MM-DD 00:00:00'),
  endDate: dayjs().format('YYYY-MM-DD HH:00:00'),
  searchType: 'daily',
  searchLocale: 'ALL'
})

const productSearchParam = ref({
  startDate: dayjs().format('YYYY-MM-DD 00:00:00'),
  endDate: dayjs().format('YYYY-MM-DD HH:00:00'),
  searchLocale: 'ALL'
})

const saveDailySearchParam = (param: {
  startDate: string
  endDate: string
  searchType: string
  searchLocale: string
}) => {
  dailySearchParam.value = param
}

const saveProductSearchParam = (param: {
  startDate: string
  endDate: string
  searchLocale: string
}) => {
  productSearchParam.value = param
}

const changeProductTab = (tabName:string, searchParam: {
  startDate: string
  endDate: string
  searchLocale: string
}, currentParam:{
  startDate: string
  endDate: string
  searchType: string
  searchLocale: string
}) => {
  dailySearchParam.value = currentParam
  productSearchParam.value = searchParam
  tab.value = tabName

  console.log(productSearchParam.value)
}
</script>
<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.021') }}</span>
      <q-separator class="q-mt-lg" />
      <div class="search-box q-mt-md row justify-between" />
    </div>
    <div class="content-body col column">
      <div class="tab-list">
        <q-tabs
          v-model="tab"
          dense
          align="justify"
          active-class="text-handorder"
          content-class="text-grey-5"
        >
          <q-tab name="daily" icon="calendar_month" :label="$t('REPORT_ORDER.001')" />
          <q-tab name="product" icon="category" :label="$t('REPORT_ORDER.002')" />
        </q-tabs>
      </div>
      <div class="tab-item col">
        <template v-if="tab === 'daily'">
          <DailySalesTab :shop-code="shopCode" :daily-search-param="dailySearchParam" @change-product-tab="changeProductTab" @save-daily-search-param="saveDailySearchParam" />
        </template>
        <template v-else-if="tab === 'product'">
          <ProductSalesTab :shop-code="shopCode" :product-search-param="productSearchParam" @save-product-search-param="saveProductSearchParam" />
        </template>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">

</style>
