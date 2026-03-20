<script setup lang="ts">

import type { QTableProps } from 'quasar'
import { QUploader, useQuasar } from 'quasar'
import { isEmpty, sortBy, cloneDeep } from 'lodash-es'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import useDayjs from 'dayjs'
import type { Ref } from 'vue'
import { useNuxtApp } from '#app'
import { useAuthStore } from '~/store/auth'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type {
  HoCategoryVo,
  HoMenuVo,
  HoOptionGroupVo,
  HoRandomMapVo,
  LocaleCategoryVo,
  LocaleCodeVo,
  LocaleMenuVo,
  ShopInfoVo
} from '~/types'
import ChangeCategorySortModal from '~/components/ChangeCategorySortModal.vue'
import ChangeMenuStatusModal from '~/components/ChangeMenuStatusModal.vue'
import ExcelImportModal from '~/components/ExcelImportModal.vue'
import MappingLabelModal from '~/components/MappingLabelModal.vue'

const dayjs = useDayjs
dayjs.extend(customParseFormat)
const config = useRuntimeConfig()
const token = useCookie('token')
const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const props = defineProps<{
  shopCode: string
}>()
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = authStore

const prettyDate = (dateString:string) => {
  return dayjs(dateString, 'YYYYMMDD').format('YYYY/MM/DD')
}

const isBefore = (startDate:string | null, endDate:string | null) => {
  if (isEmpty(startDate) || isEmpty(endDate)) { return true }
  return dayjs(startDate, 'YYYYMMDD').isBefore(dayjs(endDate, 'YYYYMMDD'))
}

const isAfter = (startDate:string | null, endDate:string | null) => {
  if (isEmpty(startDate) || isEmpty(endDate)) { return true }
  return dayjs(startDate, 'YYYYMMDD').isAfter(dayjs(endDate, 'YYYYMMDD'))
}

const categoryColumns:QTableProps['columns'] = [
  {
    name: 'categoryName',
    required: true,
    label: $t('SHOP.048'),
    align: 'left',
    field: 'categoryName',
    sortable: true
  },
  {
    name: 'menuCount',
    required: true,
    label: $t('SHOP.049'),
    align: 'center',
    field: 'menus',
    sortable: true,
    style: 'width: 100px',
    format: (val:any) => $t('COMMON.058', { number: val.length })
  },
  {
    name: 'orderIndex',
    required: true,
    label: $t('COMMON.057'),
    align: 'center',
    field: 'orderIndex',
    sortable: true,
    style: 'width: 100px'
  }
]
const categoryMenuColumns:QTableProps['columns'] = [
  {
    name: 'menuName',
    required: true,
    label: $t('COMMON.033'),
    align: 'left',
    field: 'menuName',
    sortable: true
  },
  {
    name: 'menuPrice',
    required: true,
    label: $t('COMMON.059'),
    align: 'left',
    field: 'menuPrice',
    sortable: true,
    style: 'width: 200px'
  },
  {
    name: 'orderIndex',
    required: true,
    label: $t('SHOP.050'),
    align: 'center',
    field: 'orderIndex',
    sortable: true,
    style: 'width: 100px'
  }
]

const selectedCategoryMenu = ref([])
const selectedCategory = ref([])

const categoryMenuPagination = ref({
  rowsPerPage: 0
})
const createPopup = ref(false)
const category = ref<HoCategoryVo>({
  shopCode: props.shopCode,
  categoryName: '',
  categoryUuid: '',
  shopSeq: 0,
  engCategoryName: '',
  insDate: '',
  insTid: '',
  uptDate: '',
  uptTid: '',
  menus: [],
  orderIndex: 0,
  isDeleted: false,
  isHidden: false,
  mappedCategoryCode: '',
  mappedCategoryName: ''
})

const categoryStatus = ref('POST')

const categoryListData = await useCustomFetch<HoCategoryVo[]>(`/admin/handOrder/shop/category/${props.shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const categoryList:Ref<HoCategoryVo[] | null> = categoryListData.data

const { data: optionGroupList } = await useCustomFetch<HoOptionGroupVo[]>(`/admin/handOrder/shop/menu-option/${props.shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const localeListData = await useCustomFetch<LocaleCodeVo[]>('/admin/handOrder/locale', {
  method: 'GET'
})
const localeList:Ref<LocaleCodeVo[] | null> = localeListData.data

const shopInfoData = await useCustomFetch<ShopInfoVo>(`/admin/handOrder/shop/${props.shopCode}`, {
  method: 'GET'
})
const shopInfo:Ref<ShopInfoVo|null> = shopInfoData.data
const shopLocaleData = await useCustomFetch<LocaleCodeVo[]>(`/admin/handOrder/locale/shop/${props.shopCode}`, {
  method: 'GET'
})
const shopLocale:Ref<LocaleCodeVo[] | null> = shopLocaleData.data

const getMenuLocaleData = async () => await customFetch<LocaleMenuVo[]>(`/admin/handOrder/locale/menu/${menu.value.menuSeq}`, {
  method: 'GET',
  onResponseError: (ctx) => {
    if (ctx.response.status !== 200) {
      $q.notify({
        message: $t('SHOP.051'),
        color: 'negative'
      })
    }
  }
})
const getCategoryLocaleData = async (categoryUuid: string) => await customFetch<LocaleCategoryVo[]>(`/admin/handOrder/locale/category/${categoryUuid}`, {
  method: 'GET',
  onResponseError: (ctx) => {
    if (ctx.response.status !== 200) {
      $q.notify({
        message: $t('SHOP.052'),
        color: 'negative'
      })
    }
  }
})

const menuLocales:Ref<LocaleMenuVo[] | null> = ref(null)
const categoryLocales:Ref<LocaleCategoryVo[] | null> = ref(null)
const defaultMenuLocales = ref<LocaleMenuVo[]>([])
const defaultCategoryLocales = ref<LocaleCategoryVo[]>([])
const initializeDefaultMenuLocales = () => {
  defaultMenuLocales.value = shopLocale.value?.map(locale => ({
    localeCode: locale.localeCode,
    localeMenuMapSeq: 0,
    menuSeq: 0,
    localeMenuName: '',
    localeInformationText: ''
  })) ?? []
}
const initializeDefaultCategoryLocales = () => {
  defaultCategoryLocales.value = shopLocale.value?.map(locale => ({
    localeCode: locale.localeCode,
    localeCategoryMapSeq: 0,
    categoryUuid: '',
    localeCategoryName: ''
  })) ?? []
}

const categoryPagination = ref({
  rowsPerPage: 0
})

const updateCategory = async (row:any) => {
  if (!checkPermissions(['U'])) {
    return
  }
  initializeDefaultCategoryLocales()
  category.value = cloneDeep(row)
  categoryLocales.value = await getCategoryLocaleData(row.categoryUuid)
  defaultCategoryLocales.value.forEach((localeCategory) => {
    localeCategory.categoryUuid = row.categoryUuid
    categoryLocales.value?.forEach((locale) => {
      if (locale.localeCode === localeCategory.localeCode) {
        localeCategory.localeCategoryMapSeq = locale.localeCategoryMapSeq
        localeCategory.localeCategoryName = locale.localeCategoryName
      }
    })
  })
  category.value.shopCode = props.shopCode
  createPopup.value = true
  categoryStatus.value = 'PUT'
}

const createCategory = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  initializeDefaultCategoryLocales()
  category.value = {
    shopCode: props.shopCode,
    categoryName: '',
    categoryUuid: '',
    shopSeq: 0,
    engCategoryName: '',
    insDate: '',
    insTid: '',
    uptDate: '',
    uptTid: '',
    menus: [],
    orderIndex: 0,
    isDeleted: false,
    isHidden: false,
    mappedCategoryCode: '',
    mappedCategoryName: ''
  }
  createPopup.value = true
  categoryStatus.value = 'POST'
}

const submitCategory = async () => {
  if (shop.value?.useLocale && categoryStatus.value === 'PUT') {
    await upsertLocaleCategory(defaultCategoryLocales.value, category.value.categoryUuid)
  }
  await customFetch('/admin/handOrder/shop/category', {
    method: categoryStatus.value,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(category.value)
  })
  createPopup.value = false
  category.value = {
    shopCode: props.shopCode,
    categoryName: '',
    categoryUuid: '',
    shopSeq: 0,
    engCategoryName: '',
    insDate: '',
    insTid: '',
    uptDate: '',
    uptTid: '',
    menus: [],
    orderIndex: 0,
    isDeleted: false,
    isHidden: false,
    mappedCategoryCode: '',
    mappedCategoryName: ''
  }
  await refreshData()
}

const deleteCheckPopup = ref(false)
const deleteCategory = async () => {
  await customFetch('/admin/handOrder/shop/category', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selectedCategory.value)
  })
  deleteCheckPopup.value = false
  await refreshData()

  selectedCategory.value = []
}

const refreshData = async () => {
  await categoryListData.refresh()
}

const menu = ref<HoMenuVo>({
  categoryUuid: '',
  shopCode: props.shopCode,
  menuName: '',
  menuPrice: 0,
  informationText: '',
  thumbnailPath: '',
  thumbnailUrl: '',
  menuSeq: 0,
  engMenuName: '',
  isRecommended: false,
  delayingMenu: false,
  outOfStock: false,
  isHidden: false,
  menuOptionGroups: [],
  orderIndex: 0,
  startDate: null,
  endDate: null,
  stockActiveYn: false,
  menuStock: 0
})
const menuPopup = ref(false)

const menuStatus = ref('POST')

const uploadStatus = ref('STANDARD')
const imageUpload:any = ref(null)

const updateMenu = async (row:HoMenuVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  initializeDefaultMenuLocales()
  menu.value = cloneDeep(row)
  menuLocales.value = await getMenuLocaleData()
  defaultMenuLocales.value.forEach((localeMenu) => {
    localeMenu.menuSeq = row.menuSeq
    menuLocales.value?.forEach((locale) => {
      if (locale.localeCode === localeMenu.localeCode) {
        localeMenu.localeMenuMapSeq = locale.localeMenuMapSeq
        localeMenu.localeMenuName = locale.localeMenuName
        localeMenu.localeInformationText = locale.localeInformationText
      }
    })
    localeMenu.localeInformationText = JSON.parse(isEmpty(localeMenu.localeInformationText) ? '""' : localeMenu.localeInformationText)
  })
  menu.value.shopCode = props.shopCode
  menu.value.informationText = JSON.parse(menu.value.informationText ?? '""')
  if (isEmpty(menu.value.thumbnailPath)) { uploadStatus.value = 'READY' } else { uploadStatus.value = 'SUCCESS' }
  menuPopup.value = true
  menuStatus.value = 'PUT'
}

const createMenu = (categoryUuid: string) => {
  if (!checkPermissions(['C'])) {
    return
  }
  menu.value = {
    categoryUuid,
    shopCode: props.shopCode,
    menuName: '',
    menuPrice: 0,
    informationText: '',
    thumbnailPath: '',
    thumbnailUrl: '',
    menuSeq: 0,
    engMenuName: '',
    isRecommended: false,
    delayingMenu: false,
    outOfStock: false,
    isHidden: false,
    menuOptionGroups: [],
    orderIndex: 0,
    startDate: null,
    endDate: null,
    stockActiveYn: false,
    menuStock: 0
  }
  initializeDefaultMenuLocales()
  uploadStatus.value = 'READY'
  menuPopup.value = true
  menuStatus.value = 'POST'
}

const submitMenu = async () => {
  if (uploadStatus.value === 'UPLOADING') {
    imageUpload.value.upload()
    return
  }
  if (uploadStatus.value !== 'SUCCESS' && uploadStatus.value !== 'READY') { return }
  if (uploadStatus.value === 'READY') {
    menu.value.thumbnailPath = ''
  }

  defaultMenuLocales.value.forEach((localeMenu) => {
    localeMenu.localeInformationText = JSON.stringify(localeMenu.localeInformationText)
  })
  if (shop.value?.useLocale && menuStatus.value === 'PUT') {
    await upsertLocaleMenu(defaultMenuLocales.value)
  }
  menu.value.informationText = JSON.stringify(menu.value.informationText)
  await customFetch('/admin/handOrder/shop/category/menu', {
    method: menuStatus.value,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menu.value)
  })
  menuPopup.value = false
  uploadStatus.value = 'STANDARD'
  menu.value = {
    categoryUuid: '',
    shopCode: props.shopCode,
    menuName: '',
    menuPrice: 0,
    informationText: '',
    thumbnailPath: '',
    thumbnailUrl: '',
    menuSeq: 0,
    engMenuName: '',
    isRecommended: false,
    delayingMenu: false,
    outOfStock: false,
    isHidden: false,
    menuOptionGroups: [],
    orderIndex: 0,
    startDate: null,
    endDate: null
  }
  await refreshData()
}

const deleteMenu = () => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    title: $t('COMPANY.046'),
    message: $t('COMMON.060'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/category/menu', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedCategoryMenu.value)
    })
    await refreshData()
    selectedCategoryMenu.value = []
  })
}

const selectedOptionGroup = ref<HoOptionGroupVo[]>([])
const mappingMenuPopup = ref(false)
const optionFilter = ref('')
const selectedMenuSeq = ref(0)

const mappingMenu = async (row:any) => {
  selectedMenuSeq.value = row.menuSeq
  const { data } = await useCustomFetch<string[] | null>(`/admin/handOrder/shop/option-mapping?menuSeq=${row.menuSeq}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  /* optionGroupList.value?.filter((optionGroup:any) => {
    data.value?.forEach((optionMapping:any) => {
      if (optionGroup.optionGroupUuid === optionMapping) {
        optionGroup.checked = true
      }
    })
  }) */

  selectedOptionGroup.value = optionGroupList.value!.filter((optionGroup:any) => data.value?.includes(optionGroup.optionGroupUuid))
  mappingMenuPopup.value = true
}
const upsertLocaleMenu = async (localeMenu: LocaleMenuVo[]) => {
  await customFetch(`/admin/handOrder/locale/menu/${menu.value.menuSeq}`, {
    method: 'PUT',
    body: localeMenu,
    onResponse: (context) => {
    },
    onResponseError: (context) => {
      $q.notify({
        message: `${$t('SHOP.053')} ${context.response._data.message}`,
        color: 'negative'
      })
    }
  })
}
const upsertLocaleCategory = async (localeCategory: LocaleCategoryVo[], categoryUuid:string) => {
  await customFetch(`/admin/handOrder/locale/category/${categoryUuid}`, {
    method: 'PUT',
    body: localeCategory,
    onResponse: (context) => {

    },
    onResponseError: (context) => {
      $q.notify({
        message: `${$t('SHOP.053')} ${context.response._data.message}`,
        color: 'negative'
      })
    }
  })
}
const submitMappingMenu = async () => {
  await customFetch('/admin/handOrder/shop/option-mapping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      menuSeq: selectedMenuSeq.value,
      optionGroupUuidList: selectedOptionGroup.value.map((optionGroup:any) => optionGroup.optionGroupUuid)
    })
  })

  selectedMenuSeq.value = 0
  selectedOptionGroup.value = []
  mappingMenuPopup.value = false
  await refreshData()
}

const optionGroupColumns:QTableProps['columns'] = [
  {
    name: 'optionGroupName',
    required: true,
    label: $t('SHOP.054'),
    align: 'right',
    field: 'optionGroupName',
    sortable: true
  },
  {
    name: 'optionUnique',
    required: true,
    label: $t('SHOP.055'),
    align: 'right',
    field: 'optionUnique',
    sortable: true,
    style: 'width: 150px',
    format: (val:any) => `${val ? $t('SHOP.056') : $t('SHOP.057')}`
  },
  {
    name: 'optionRequired',
    required: true,
    label: $t('SHOP.058'),
    align: 'right',
    field: 'optionRequired',
    sortable: true,
    style: 'width: 150px',
    format: (val:any) => `${val ? 'Y' : 'N'}`
  },
  {
    name: 'doesReplace',
    required: true,
    label: $t('SHOP.059'),
    align: 'right',
    field: 'doesReplace',
    sortable: true,
    style: 'width: 150px',
    format: (val:any) => `${val ? $t('SHOP.060') : $t('SHOP.061')}`
  }
]

const getUrl = () => {
  return `${config.public.baseUrl}/admin/handOrder/shop/category/menu/image?shopCode=${props.shopCode}`
}

const imageRejected = () => {
  $q.notify({
    message: $t('SHOP.062'),
    color: 'negative'
  })
}

const getAuthToken = () => {
  return [{
    name: 'Authorization', value: `Bearer ${token.value}`
  }]
}
const menuImageUploaded:QUploader['onUploaded'] = ({ xhr }) => {
  menu.value.thumbnailPath = xhr.response
  uploadStatus.value = 'SUCCESS'
  submitMenu()
}

const menuImageUploadFailed:QUploader['onFailed'] = async () => {
  const refreshToken = useCookie<string>('refreshToken', { default: () => '' })

  const result = await $fetch<{ accessToken: string }>('/handOrder/token/refresh', {
    baseURL: config.public.baseUrl,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken.value}`
    }
  })
  token.value = result.accessToken

  await submitMenu()
}

const { data: shop } = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + route.params?.shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const viewTableOne = async () => {
  if (!shop.value) { return }
  const randomMap = await customFetch<HoRandomMapVo[]>('/admin/handOrder/productList', {
    method: 'GET',
    params: {
      shopSeq: shop.value.shopSeq,
      storeCode: shop.value.qrStoreCode
    }
  })
  const config = useRuntimeConfig()
  const { baseUrl } = config.public
  const sortedRandomMap = sortBy(randomMap, row => Number(row.landingUrl.slice(row.landingUrl.lastIndexOf('/') + 1)))
  if (sortedRandomMap.length === 0) {
    $q.notify({
      message: $t('SHOP.063'),
      color: 'primary',
      actions: [{
        label: $t('SHOP.064'),
        color: 'white',
        handler: () => {
          router.push(`/device/qr/${shop.value?.shopCode}`)
        }
      }]
    })
    return
  }
  const firstTable = sortedRandomMap[0]
  window.open(`${baseUrl}/r?r=${firstTable.randomCode}`, '_blank')
}

const changeMenuStatus = (menus:HoMenuVo[]) => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: ChangeMenuStatusModal,
    componentProps: {
      menuList: menus,
      shopCode: props.shopCode
    }
  }).onOk(() => {
    refreshData()
  })
}

const changeCategorySort = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: ChangeCategorySortModal,
    componentProps: {
      categoryList: categoryList.value,
      shopCode: props.shopCode
    }
  }).onOk(() => {
    refreshData()
  })
}

const deleteCategoryPopup = () => {
  if (!checkPermissions(['D'])) {
    return
  }
  deleteCheckPopup.value = true
}

const showExcelImportModal = () => {
  if (!checkPermissions(['UP'])) {
    return
  }
  $q.dialog({
    component: ExcelImportModal,
    componentProps: {
      shopCode: props.shopCode,
      shopSeq: shopInfo.value?.shopSeq
    }
  }).onOk(() => {
    refreshNuxtData()
  })
}

const mappingLabel = (row:HoMenuVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: MappingLabelModal,
    componentProps: {
      shopInfo: shopInfo.value,
      menuInfo: row
    }
  }).onOk(() => {
    refreshNuxtData()
  })
}

</script>

<template>
  <q-table
    v-model:pagination="categoryPagination"
    v-model:selected="selectedCategory"
    class="q-mb-md-lg full-height"
    :rows="categoryList"
    :columns="categoryColumns"
    row-key="categoryUuid"
    :rows-per-page-options="[0]"
    hide-bottom
    selection="multiple"
  >
    <template v-slot:top-left>
      <q-btn outline color="primary" :label="$t('SHOP.065')" class="q-mr-md" @click="viewTableOne" />
      <q-btn color="primary" :label="$t('SHOP.066')" class="q-mr-md" @click="changeCategorySort" />
      <q-btn color="grey-5" :label="$t('SHOP.067')" class="q-mr-md" @click="showExcelImportModal" />
    </template>
    <template v-slot:top-right>
      <q-btn color="red" :label="$t('SHOP.068')" class="q-mr-md" :disable="isEmpty(selectedCategory)" @click="deleteCategoryPopup" />
      <q-btn color="primary" :label="$t('SHOP.069')" class="q-mr-md" @click="createCategory()" />
    </template>
    <template v-slot:header="templateProps">
      <q-tr :props="templateProps">
        <q-th auto-width>
          <q-checkbox v-model="templateProps.selected" />
        </q-th>
        <q-th
          v-for="col in templateProps.cols"
          :key="col.name"
          :props="templateProps"
        >
          {{ col.label }}
        </q-th>
        <q-th auto-width />
        <q-th auto-width />
      </q-tr>
    </template>
    <template v-slot:body="templateProps">
      <q-tr :props="templateProps">
        <q-td auto-width>
          <q-checkbox
            :model-value="templateProps.selected"
            @update:model-value="(val, evt) => {
              const descriptor = Object.getOwnPropertyDescriptor(templateProps, 'selected');
              if (descriptor) {
                descriptor.set?.call(templateProps, val, evt);
              }
            }"
          />
        </q-td>
        <q-td
          v-for="col in templateProps.cols"
          :key="col.name"
          :props="templateProps"
        >
          {{ col.value }}
          <q-icon v-if="col.name === 'categoryName' && templateProps.row.isHidden" name="visibility_off" style="opacity: 40%; " size="1.3em" />
        </q-td>
        <q-td auto-width>
          <q-btn dense flat icon="edit" class="" @click="updateCategory(templateProps.row)" />
        </q-td>
        <q-td auto-width>
          <q-btn
            size="sm"
            color="primary"
            round
            dense
            :icon="templateProps.expand ? 'remove' : 'add'"
            @click="templateProps.expand = !templateProps.expand"
          />
        </q-td>
      </q-tr>
      <q-tr v-if="templateProps.expand" :props="templateProps">
        <q-td colspan="100%">
          <q-table
            v-model:pagination="categoryMenuPagination"
            v-model:selected="selectedCategoryMenu"
            class="q-mb-md-lg shop-table"
            :rows="templateProps.row.menus as HoMenuVo[]"
            :columns="categoryMenuColumns"
            row-key="menuSeq"
            :rows-per-page-options="[0]"
            hide-bottom
            style="max-height: 500px"
            selection="multiple"
          >
            <template v-slot:top-right>
              <q-btn color="red" :label="$t('SHOP.070')" class="q-mr-md" :disable="isEmpty(selectedCategoryMenu)" @click="deleteMenu" />
              <q-space />
              <q-btn color="primary" :label="$t('SHOP.071')" class="q-mr-md" @click="createMenu(templateProps.row?.categoryUuid)" />
            </template>
            <template v-slot:top-left>
              <q-btn color="primary" :label="$t('SHOP.072')" @click="changeMenuStatus(templateProps.row.menus)" />
            </template>
            <template v-slot:header="templateProps_2">
              <q-tr :props="templateProps_2">
                <q-th auto-width>
                  <q-checkbox v-model="templateProps_2.selected" />
                </q-th>
                <q-th
                  v-for="col in templateProps_2.cols"
                  :key="col.name"
                  :props="templateProps_2"
                >
                  {{ col.label }}
                </q-th>
                <q-th auto-width />
                <q-th auto-width />
                <q-th v-if="userInfo.userType === 'admin'" auto-width />
              </q-tr>
            </template>
            <template v-slot:body="templateProps_2">
              <q-tr :props="templateProps_2">
                <q-td auto-width>
                  <q-checkbox
                    :model-value="templateProps_2.selected"
                    @update:model-value="(val, evt) => {
                      const descriptor = Object.getOwnPropertyDescriptor(templateProps_2, 'selected');
                      if (descriptor) {
                        descriptor.set.call(templateProps_2, val, evt);
                      }
                    }"
                  />
                </q-td>
                <q-td
                  v-for="col in templateProps_2.cols"
                  :key="col.name"
                  :props="templateProps_2"
                >
                  {{ col.value }}
                  <q-icon v-if="col.name === 'menuName' && templateProps_2.row.isHidden" name="visibility_off" style="opacity: 40%; " size="1.3em" />
                </q-td>
                <q-td auto-width>
                  <q-btn dense flat icon="edit" class="" @click="updateMenu(templateProps_2.row)" />
                </q-td>
                <q-td auto-width>
                  <q-btn dense flat icon="settings" class="" @click="mappingMenu(templateProps_2.row)" />
                </q-td>
                <q-td v-if="userInfo.userType === 'admin'">
                  <q-btn dense flat icon="video_label" class="" @click="mappingLabel(templateProps_2.row)" />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-td>
      </q-tr>
    </template>
  </q-table>

  <q-dialog v-model="createPopup" persistent>
    <q-card style="width: 500px">
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('SHOP.107') }} {{ categoryStatus === 'POST' ? $t('COMMON.061') : $t('COMMON.062') }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="submitCategory">
          <q-input v-model="category.categoryName" :label="$t('SHOP.048')" :rules="[val => val && val.length > 0 || $t('SHOP.073')]" />
          <template v-if="categoryStatus === 'PUT'">
            <template v-if="shopInfo?.useLocale">
              <q-input v-for="language in defaultCategoryLocales" :key="language.localeCode" v-model="language.localeCategoryName" :label="`${getLocaleName(language.localeCode, localeList)} ${$t('SHOP.048')}`" />
            </template>
            <q-checkbox v-model="category.isHidden" :label="$t('COMMON.063')" />
          </template>
          <div>
            <q-btn type="submit" :label="$t('COMMON.064')" color="primary" class="q-mt-md" />
            <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mt-md q-ml-md" @click="createPopup = false" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="deleteCheckPopup" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ $t('COMMON.060') }}
        </div>
        <div class="text-caption text-grey-5">
          {{ $t('SHOP.074') }}
        </div>
        <div class="q-mt-md">
          <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mr-md" @click="deleteCheckPopup = false" />
          <q-btn :label="$t('COMMON.007')" color="red" @click="deleteCategory" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="menuPopup">
    <q-card style="width: 500px">
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('COMMON.043') }} {{ menuStatus === 'POST' ? $t('COMMON.061') : $t('COMMON.062') }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="submitMenu">
          <template v-if="uploadStatus !== 'READY' && menuStatus !== 'POST' && uploadStatus !== 'UPLOADING' ">
            <q-img
              :src="menu.thumbnailUrl"
              spinner-color="white"
              :ratio="1"
            />
            <q-btn
              color="primary"
              :label="$t('SHOP.075')"
              class="q-mt-md"
              @click="uploadStatus = 'READY'"
            />
          </template>
          <template v-else>
            <q-uploader
              ref="imageUpload"
              :url="getUrl"
              style="max-width: 300px"
              :label="$t('SHOP.076')"
              accept=".jpg, image/*"
              :headers="getAuthToken"
              field-name="file"
              with-credentials
              hide-upload-btn
              @rejected="imageRejected"
              @uploaded="menuImageUploaded"
              @failed="menuImageUploadFailed"
              @added="uploadStatus = 'UPLOADING'"
            />
          </template>
          <q-separator class="q-my-md" />
          <q-input
            v-model="menu.menuName"
            :label="$t('COMMON.033')"
            :rules="[
              val => val && val.length > 0 || $t('SHOP.077'),
              val => val && val.length <= 100 || '메뉴명은 100자를 초과할 수 없습니다'
            ]"
          />
          <template v-if="shopInfo?.useLocale && menuStatus === 'PUT'">
            <q-input v-for="language in defaultMenuLocales" :key="language.localeCode" v-model="language.localeMenuName" :label="`${getLocaleName(language.localeCode, localeList)} ${$t('COMMON.033')}`" />
          </template>
          <q-input
            v-model="menu.menuPrice"
            :label="$t('COMMON.059')"
            type="number"
            :rules="[val => val !== null && val <= 10000000 || '메뉴 가격은 10,000,000원을 초과할 수 없습니다']"
          />
          <q-input v-model="menu.informationText" clearable :label="$t('SHOP.078')" type="textarea" :rules="[val=>(val ? val.length<=1000 : true) ||$t('SHOP.079')]" />
          <template v-if="shopInfo?.useLocale && menuStatus === 'PUT'">
            <q-input
              v-for="language in defaultMenuLocales"
              :key="language.localeCode"
              v-model="language.localeInformationText"
              :label="`${getLocaleName(language.localeCode, localeList)} ${$t('SHOP.080')}`"
              type="textarea"
              :rules="[val=>val.length<=1000||$t('SHOP.079')]"
            />
          </template>
          <q-input v-model="menu.ingredients" clearable label="성분" type="textarea" :rules="[val=>(val ? val.length<=1000 : true) ||'성분은 1000자를 초과할 수 없습니다']" />

          <!--          메뉴 재고 관리-->
          <div class="stock_wrap">
            <div>
              <div class="stock_toggle">
                <p>{{ $t('SHOP.081') }}</p>
                <q-toggle v-model="menu.stockActiveYn" />
              </div>
              <div v-if="menu.outOfStock">
                <span>※{{ $t('SHOP.082') }}</span>
              </div>
            </div>
            <div>
              <q-input
                v-model="menu.menuStock"
                filled
                :label="$t('SHOP.083')"
              />
            </div>
          </div>
          <div class="q-mt-sm">
            <q-input
              :model-value="menu.startDate ? prettyDate(menu.startDate) : null"
              readonly
              :label="$t('SHOP.084')"
              filled
              :rules="[value => (isBefore(value, menu.endDate)) || $t('SHOP.085')]"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="menu.startDate" mask="YYYYMMDD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              :model-value="menu.endDate ? prettyDate(menu.endDate) : null"
              readonly
              :label="$t('SHOP.086')"
              filled
              :rules="[value => (isAfter(value, menu.startDate)) || $t('SHOP.087')]"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="menu.endDate" mask="YYYYMMDD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div>
            <q-btn type="submit" :label="$t('COMMON.064')" color="primary" class="q-mt-md" />
            <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mt-md q-ml-md" @click="menuPopup = false" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="mappingMenuPopup">
    <q-card style="min-width: 800px">
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('SHOP.088') }}
        </div>
      </q-card-section>
      <q-card-section>
        <!--        <q-list bordered padding>
          <q-item-label header>
            옵션 그룹
          </q-item-label>
          <q-item v-for="optionGruop in optionGroupList" :key="optionGruop.optionGroupUuid">
            <q-item-section>
              <q-checkbox v-model="optionGruop.checked" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ optionGruop.optionGroupName }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>-->
        <q-table
          v-model:pagination="categoryPagination"
          v-model:selected="selectedOptionGroup"
          class="q-mt-md"
          :rows="optionGroupList"
          :columns="optionGroupColumns"
          row-key="optionGroupUuid"
          :rows-per-page-options="[0]"
          hide-bottom
          style="max-height: 300px"
          selection="multiple"
          :filter="optionFilter"
        >
          <template v-slot:top-left>
            <q-input v-model="optionFilter" borderless dense debounce="300" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
          <template v-slot:top-right>
            <q-btn color="primary" :label="$t('SHOP.089')" class="q-mr-md" />
          </template>
          <template v-slot:header="templateProps">
            <q-tr :props="templateProps">
              <q-th auto-width>
                <q-checkbox v-model="templateProps.selected" />
              </q-th>
              <q-th
                v-for="col in templateProps.cols"
                :key="col.name"
                :props="templateProps"
              >
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body="templateProps">
            <q-tr :props="templateProps">
              <q-td auto-width>
                <q-checkbox
                  :model-value="templateProps.selected"
                  @update:model-value="(val, evt) => {
                    const descriptor = Object.getOwnPropertyDescriptor(templateProps, 'selected');
                    if (descriptor) {
                      descriptor.set.call(templateProps, val, evt);
                    }
                  }"
                />
              </q-td>
              <q-td
                v-for="col in templateProps.cols"
                :key="col.name"
                :props="templateProps"
              >
                {{ col.value }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
        <div class="q-my-md">
          <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mr-md" @click="mappingMenuPopup = false" />
          <q-btn :label="$t('COMMON.009')" color="primary" @click="submitMappingMenu" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<!--
<q-form style="width: 700px">
          <template v-if="menu.menuImage">
            <q-img
              :src="menu.menuImage"
              spinner-color="white"
              :ratio="1"
            />
          </template>
          <template v-else>
            <q-uploader
              url="http://localhost:4444/upload"
              style="max-width: 300px"
              label="메뉴 사진"
              accept=".jpg, image/*"
              @rejected="imageRejected"
            />
          </template>
          <q-separator class="q-my-md" />
          <q-input
            v-model="menu.menuName"
            label="메뉴명"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || '메뉴명을 입력해주세요']"
            class="q-mb-sm input-width70"
            dense
          />
          <q-input
            v-model="menu.menuPrice"
            label="메뉴 가격"
            type="number"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || '패스워드를 입력해주세요']"
            class="q-mb-md input-width70"
            dense
          />
          <q-input
            v-model="menu.menuDesc"
            label="메뉴 설명"
            type="textarea"
            lazy-rules
            outlined
            :rules="[val => val && val.length > 0 || '이름을 입력해주세요']"
            class="q-mb-md input-width70"
            dense
          />
                    <q-card>
            <q-card-section>
              <div class="text-h6 text-bold">
                옵션
              </div>
              <q-table
                v-model:selected="selectedMenuOption"
                :rows="menu.menuOption"
                :columns="menuOptionColumns"
                row-key="optionName"
                selection="multiple"
                grid
              >
                <template v-slot:top-right>
                  <q-btn color="red" label="삭제" class="q-mr-md" :disable="isEmpty(selectedMenuOption)" size="sm" />
                  <q-space />
                  <q-btn color="primary" label="생성" class="q-mr-md" size="sm" />
                </template>
              </q-table>
            </q-card-section>
          </q-card>
</q-form>

-->
<style scoped lang="scss">
.stock_wrap{
  display: flex;
  justify-content: space-between;
  align-items: center;

  .stock_toggle{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    p{
      margin: 0;
      font-weight: 700;
      font-size: 17px;
    }
  }

   span{
    font-size:12px;
    letter-spacing: -0.5px;
    color: #de3b3b;
    transform: translateY(-7px);
    display: inline-block;
  }
}
</style>
