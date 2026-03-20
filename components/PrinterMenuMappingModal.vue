<script setup lang="ts">
import type { PrinterVo, HoCategoryVo, HoMenuVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'

const props = defineProps<{
  modelValue: boolean
  printer: PrinterVo | null
  shopCode: string
}>()

const emits = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [menuSeqList: number[]]
}>()

const show = computed({
  get: () => props.modelValue,
  set: value => emits('update:modelValue', value)
})

const selectedMenuSeqList = ref<number[]>([])
const categoryList = ref<HoCategoryVo[]>([])
const menuList = ref<HoMenuVo[]>([])
const loading = ref(false)
const searchText = ref('')

// 카테고리별로 메뉴 그룹화
const menuByCategory = computed(() => {
  const filtered = searchText.value
    ? menuList.value.filter(menu =>
      menu.menuName.toLowerCase().includes(searchText.value.toLowerCase())
    )
    : menuList.value

  const grouped = new Map<string, HoMenuVo[]>()
  filtered.forEach((menu) => {
    const categoryUuid = menu.categoryUuid || 'uncategorized'
    if (!grouped.has(categoryUuid)) {
      grouped.set(categoryUuid, [])
    }
    grouped.get(categoryUuid)!.push(menu)
  })
  return grouped
})

// 카테고리 이름 가져오기
const getCategoryName = (categoryUuid: string) => {
  const category = categoryList.value.find(c => c.categoryUuid === categoryUuid)
  return category?.categoryName || $t('COMMON.088')
}

// 데이터 로드
const loadData = async () => {
  if (!props.shopCode) { return }

  loading.value = true
  try {
    // 카테고리 목록 가져오기
    const categoryData = await useCustomFetch<HoCategoryVo[]>(
      `/admin/handOrder/shop/category/${props.shopCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    categoryList.value = categoryData.data.value || []

    // 메뉴 목록은 카테고리에 포함되어 있음
    const allMenus: HoMenuVo[] = []
    categoryList.value.forEach((category) => {
      if (category.menus && category.menus.length > 0) {
        allMenus.push(...category.menus)
      }
    })
    menuList.value = allMenus

    // 프린터에 이미 매핑된 메뉴 목록 설정
    selectedMenuSeqList.value = props.printer?.menuSeqList ? [...props.printer.menuSeqList] : []
  } catch (error) {
    // Failed to load data
  } finally {
    loading.value = false
  }
}

// 모달이 열릴 때 데이터 로드
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadData()
  }
})

// 전체 선택/해제
const toggleSelectAll = () => {
  if (selectedMenuSeqList.value.length === menuList.value.length) {
    selectedMenuSeqList.value = []
  } else {
    selectedMenuSeqList.value = menuList.value.map(m => m.menuSeq)
  }
}

// 카테고리별 전체 선택/해제
const toggleCategorySelect = (categoryUuid: string) => {
  const categoryMenus = menuByCategory.value.get(categoryUuid) || []
  const categoryMenuSeqs = categoryMenus.map(m => m.menuSeq)
  const allSelected = categoryMenuSeqs.every(seq => selectedMenuSeqList.value.includes(seq))

  if (allSelected) {
    selectedMenuSeqList.value = selectedMenuSeqList.value.filter(
      seq => !categoryMenuSeqs.includes(seq)
    )
  } else {
    const newSeqs = categoryMenuSeqs.filter(seq => !selectedMenuSeqList.value.includes(seq))
    selectedMenuSeqList.value = [...selectedMenuSeqList.value, ...newSeqs]
  }
}

// 카테고리 선택 상태 확인
const isCategorySelected = (categoryUuid: string) => {
  const categoryMenus = menuByCategory.value.get(categoryUuid) || []
  const categoryMenuSeqs = categoryMenus.map(m => m.menuSeq)
  return categoryMenuSeqs.length > 0 && categoryMenuSeqs.every(seq => selectedMenuSeqList.value.includes(seq))
}

const isCategoryIndeterminate = (categoryUuid: string) => {
  const categoryMenus = menuByCategory.value.get(categoryUuid) || []
  const categoryMenuSeqs = categoryMenus.map(m => m.menuSeq)
  const selectedCount = categoryMenuSeqs.filter(seq => selectedMenuSeqList.value.includes(seq)).length
  return selectedCount > 0 && selectedCount < categoryMenuSeqs.length
}

// 저장
const handleSave = () => {
  emits('save', selectedMenuSeqList.value)
  show.value = false
}

// 취소
const handleCancel = () => {
  show.value = false
}
</script>

<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 700px; max-width: 900px; max-height: 80vh;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ $t('SHOP_SETTING.064') }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">
          {{ $t('SHOP_SETTING.025') }}: <strong>{{ printer?.printerName || '' }}</strong>
        </div>
        <div class="text-caption text-grey-7">
          {{ $t('SHOP_SETTING.065') }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="searchText"
          :placeholder="$t('COMMON.021')"
          dense
          outlined
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row items-center q-mb-sm">
          <q-checkbox
            :model-value="selectedMenuSeqList.length === menuList.length && menuList.length > 0"
            :indeterminate="selectedMenuSeqList.length > 0 && selectedMenuSeqList.length < menuList.length"
            @update:model-value="toggleSelectAll"
          />
          <span class="text-bold">{{ $t('COMMON.089') }}</span>
          <q-space />
          <span class="text-caption text-grey-7">
            {{ $t('COMMON.090', { selected: selectedMenuSeqList.length, total: menuList.length }) }}
          </span>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 400px; overflow-y: auto;">
        <q-inner-loading :showing="loading">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>

        <div v-if="!loading">
          <div
            v-for="[categoryUuid, menus] in menuByCategory"
            :key="categoryUuid"
            class="q-mb-md"
          >
            <div class="row items-center q-pa-sm bg-grey-2 rounded-borders">
              <q-checkbox
                :model-value="isCategorySelected(categoryUuid)"
                :indeterminate="isCategoryIndeterminate(categoryUuid)"
                @update:model-value="toggleCategorySelect(categoryUuid)"
              />
              <span class="text-bold">{{ getCategoryName(categoryUuid) }}</span>
              <q-space />
              <span class="text-caption text-grey-7">
                ({{ menus.length }})
              </span>
            </div>

            <div class="q-pl-lg q-mt-sm">
              <div
                v-for="menu in menus"
                :key="menu.menuSeq"
                class="row items-center q-pa-xs hover-highlight"
              >
                <q-checkbox
                  v-model="selectedMenuSeqList"
                  :val="menu.menuSeq"
                />
                <span>{{ menu.menuName }}</span>
                <q-space />
                <span class="text-caption text-grey-6">
                  {{ menu.menuPrice?.toLocaleString() }}{{ $t('COMMON.049') }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="menuList.length === 0" class="text-center text-grey-6 q-pa-md">
            {{ $t('COMMON.091') }}
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          :label="$t('COMMON.005')"
          color="grey-7"
          flat
          @click="handleCancel"
        />
        <q-btn
          :label="$t('COMMON.009')"
          color="primary"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.hover-highlight:hover {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}
</style>
