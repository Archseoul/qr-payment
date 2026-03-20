<script setup lang="ts">
import type { QTableProps } from 'quasar'
import type { Ref } from 'vue'
import { isEmpty, cloneDeep } from 'lodash-es'
import type { HoOptionGroupVo, HoOptionVo, LocaleCodeVo, LocaleOptionGroupVo, LocaleOptionVo, ShopInfoVo } from '~/types'
import { useCustomFetch } from '~/composables/useCustomFetch'
import getLocaleName from '~/utils/getLocaleName'
import { ChangeOptionStatusModal, ChangeOptionGroupSortModal } from '#components'

const props = defineProps<{
  shopCode: string
}>()

const $q = useQuasar()
const { checkPermissions } = useCheckPermissions()

const selectedGroup = ref([])
const selectedOption = ref([])
const groupFilter = ref('')
const optionFilter = ref('')
const optionGroupPopup = ref(false)

const menuPagination = ref({
  rowsPerPage: 0
})

const groupSubmitStatus = ref('POST')
const optionSubmitStatus = ref('POST')

const optionGroupColumns:QTableProps['columns'] = [
  {
    name: 'optionGroupName',
    required: true,
    label: $t('COMMON.044'),
    align: 'left',
    field: 'optionGroupName',
    sortable: true
  },
  {
    name: 'optionUnique',
    required: true,
    label: $t('SHOP.055'),
    align: 'left',
    field: 'optionUnique',
    sortable: true,
    style: 'width: 150px',
    format: (val:any) => `${val ? $t('SHOP.121') : $t('SHOP.122')}`
  },
  {
    name: 'optionRequired',
    required: true,
    label: $t('SHOP.058'),
    align: 'left',
    field: 'optionRequired',
    sortable: true,
    style: 'width: 150px',
    format: (val:any) => `${val ? $t('COMMON.093') : $t('COMMON.023')}`
  },
  {
    name: 'doesReplace',
    required: true,
    label: $t('SHOP.059'),
    align: 'center',
    field: 'doesReplace',
    sortable: true,
    style: 'width: 150px',
    format: (val:any) => `${val ? $t('SHOP.060') : $t('SHOP.061')}`
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

const optionColumn:QTableProps['columns'] = [
  {
    name: 'optionName',
    required: true,
    label: $t('SHOP.090'),
    align: 'left',
    field: 'optionName',
    sortable: true
  },
  {
    name: 'optionPrice',
    required: true,
    label: $t('SHOP.091'),
    align: 'left',
    field: 'optionPrice',
    sortable: true,
    style: 'width: 200px',
    format: (val:any) => `${val}${$t('COMMON.049')}`
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

const optionGroupListData = await useCustomFetch<HoOptionGroupVo[]>(`/admin/handOrder/shop/menu-option/${props.shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const optionGroupList:Ref<HoOptionGroupVo[] | null> = optionGroupListData.data

const initializeOptionGroup:()=>HoOptionGroupVo = () => ({
  optionGroupName: '',
  optionUnique: false,
  optionRequired: false,
  doesReplace: false,
  shopCode: props.shopCode,
  minQty: null,
  maxQty: null,
  optionGroupUuid: '',
  engOptionGroupName: '',
  insDate: '',
  insTid: '',
  uptDate: '',
  uptTid: '',
  optionGroupVisibleName: '',
  orderIndex: 0,
  tempMenuSeq: 0,
  isDeleted: false,
  isHidden: false,
  shopSeq: 0,
  optionList: [],
  mappedOptionGroupCode: '',
  mappedOptionGroupName: ''
})
const initializeOption:()=>HoOptionVo = () => ({
  optionName: '',
  optionGroupUuid: '',
  optionPrice: 0,
  shopCode: props.shopCode,
  optionUuid: '',
  orderIndex: 0,
  insDate: '',
  insTid: '',
  uptDate: '',
  uptTid: '',
  engOptionName: '',
  isDeleted: false,
  isHidden: false,
  mappedOptionCode: '',
  mappedOptionName: '',
  mappedOptionGroupCode: ''
})

const submitOptionGroup = async (optionGroupUuid:string) => {
  const outOfStockOptionList = optionGroup.value.optionList.filter(option => option.outOfStock)
  if (outOfStockOptionList.length > 0) {
    $q.dialog({
      title: $t('COMMON.009'),
      message: $t('SHOP.092'),
      ok: $t('COMMON.004')
    })
    return
  }

  if (shopInfo.value?.useLocale && groupSubmitStatus.value === 'PUT') {
    await upsertOptionGroupLocale(defaultOptionGroupLocales.value, optionGroupUuid)
  }
  await customFetch('/admin/handOrder/shop/menu-option/group', {
    method: groupSubmitStatus.value,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(optionGroup.value)
  })

  optionGroupPopup.value = false
  optionGroup.value = initializeOptionGroup()

  await optionGroupListData.refresh()
}

const optionGroup = ref<HoOptionGroupVo>(initializeOptionGroup())

const createGroup = () => {
  if (!checkPermissions(['C'])) {
    return
  }
  initializeOptionGroupLocales()
  groupSubmitStatus.value = 'POST'
  optionGroupPopup.value = true
  optionGroup.value = initializeOptionGroup()
}

const updateGroup = async (row:HoOptionGroupVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  initializeOptionGroupLocales()
  groupSubmitStatus.value = 'PUT'
  optionGroup.value = cloneDeep(row)
  optionGroupLocales.value = await getOptionGroupLocaleData(row.optionGroupUuid)
  defaultOptionGroupLocales.value.forEach((localeOptionGroup) => {
    localeOptionGroup.optionGroupUuid = row.optionGroupUuid
    optionGroupLocales.value?.forEach((optionGroupLocale) => {
      if (optionGroupLocale.localeCode === localeOptionGroup.localeCode) {
        localeOptionGroup.localeOptionGroupMapSeq = optionGroupLocale.localeOptionGroupMapSeq
        localeOptionGroup.localeOptionGroupName = optionGroupLocale.localeOptionGroupName
      }
    })
  })
  optionGroup.value.shopCode = props.shopCode
  optionGroupPopup.value = true
}

/* const refreshNuxtData = async () => {
  const { data } = await useCustomFetch(`/admin/handOrder/shop/menu-option/${props.shopCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  optionGroupList.value = data
} */

const optionPopup = ref(false)

const option = ref<HoOptionVo>(initializeOption())

const createOption = (optionGroupUuid:string) => {
  if (!checkPermissions(['C'])) {
    return
  }
  initializeOptionLocales()
  optionSubmitStatus.value = 'POST'
  optionPopup.value = true
  option.value = initializeOption()
  option.value.optionGroupUuid = optionGroupUuid
}

const updateOption = async (row:any) => {
  if (!checkPermissions(['U'])) {
    return
  }
  initializeOptionLocales()
  optionSubmitStatus.value = 'PUT'
  option.value = cloneDeep(row)
  optionLocales.value = await getOptionLocaleData(row.optionUuid)
  defaultOptionLocales.value?.forEach((localeOption) => {
    localeOption.optionUuid = row.optionUuid
    optionLocales.value?.forEach((optionLocale) => {
      if (optionLocale.localeCode === localeOption.localeCode) {
        localeOption.localeOptionMapSeq = optionLocale.localeOptionMapSeq
        localeOption.localeOptionName = optionLocale.localeOptionName
      }
    })
  })
  option.value.shopCode = props.shopCode
  optionPopup.value = true
}

const submitOption = async (optionUuid:string) => {
  if (shopInfo.value?.useLocale && optionSubmitStatus.value === 'PUT') {
    await upsertOptionLocale(defaultOptionLocales.value, optionUuid)
  }
  await customFetch('/admin/handOrder/shop/menu-option', {
    method: optionSubmitStatus.value,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(option.value)
  })

  optionPopup.value = false
  option.value = initializeOption()

  await optionGroupListData.refresh()
}

const deleteGroup = () => {
  if (!checkPermissions(['D'])) {
    return
  }

  $q.dialog({
    title: $t('COMMON.051'),
    message: $t('SHOP.093'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/menu-option/group', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedGroup.value)
    })

    await optionGroupListData.refresh()
  })
}

const deleteOption = () => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    title: $t('COMMON.051'),
    message: $t('SHOP.094'),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await customFetch('/admin/handOrder/shop/menu-option', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedOption.value)
    })

    await optionGroupListData.refresh()
  })
}
const shopInfoData = await useCustomFetch<ShopInfoVo>(`/admin/handOrder/shop/${props.shopCode}`, {
  method: 'GET'
})
const shopInfo:Ref<ShopInfoVo|null> = shopInfoData.data
const localeListData = await useCustomFetch<LocaleCodeVo[]>('/admin/handOrder/locale', {
  method: 'GET'
})
const localeList:Ref<LocaleCodeVo[] | null> = localeListData.data
const shopLocaleData = await useCustomFetch<LocaleCodeVo[]>(`/admin/handOrder/locale/shop/${props.shopCode}`, {
  method: 'GET'
})
const shopLocale:Ref<LocaleCodeVo[] | null> = shopLocaleData.data
const getOptionGroupLocaleData = async (optionGroupUuid:string) => await customFetch<LocaleOptionGroupVo[]>(`/admin/handOrder/locale/option-group/${optionGroupUuid}`, {
  method: 'GET',
  onResponse: (context) => {
    if (context.response.status !== 200) {
      $q.notify({
        message: $t('SHOP.095'),
        color: 'negative'
      })
    }
  }
})
const getOptionLocaleData = async (optionUuid:string) => await customFetch<LocaleOptionVo[]>(`/admin/handOrder/locale/option/${optionUuid}`, {
  method: 'GET',
  onResponse: (context) => {
    if (context.response.status !== 200) {
      $q.notify({
        message: $t('SHOP.095'),
        color: 'negative'
      })
    }
  }
})
const optionGroupLocales = ref<LocaleOptionGroupVo[] | null>(null)
const optionLocales = ref<LocaleOptionVo[] | null>(null)
const defaultOptionGroupLocales = ref<LocaleOptionGroupVo[]>([])
const defaultOptionLocales = ref<LocaleOptionVo[]>([])
const initializeOptionGroupLocales = () => {
  defaultOptionGroupLocales.value = shopLocale.value?.map(locale => ({
    localeCode: locale.localeCode,
    localeOptionGroupMapSeq: 0,
    optionGroupUuid: '',
    localeOptionGroupName: ''
  })) ?? []
}
const initializeOptionLocales = () => {
  defaultOptionLocales.value = shopLocale.value?.map(locale => ({
    localeCode: locale.localeCode,
    localeOptionMapSeq: 0,
    optionUuid: '',
    localeOptionName: ''
  })) ?? []
}
const upsertOptionGroupLocale = async (localeOptionGroup: LocaleOptionGroupVo[], optionGroupUuid:string) => {
  await customFetch(`/admin/handOrder/locale/option-group/${optionGroupUuid}`, {
    method: 'PUT',
    body: localeOptionGroup,
    onResponse: (context) => {
      if (context.response.status !== 200) {
        $q.notify({
          message: $t('SHOP.096'),
          color: 'negative'
        })
      }
    }
  })
}
const upsertOptionLocale = async (localeOption: LocaleOptionVo[], optionUuid:string) => {
  await customFetch(`/admin/handOrder/locale/option/${optionUuid}`, {
    method: 'PUT',
    body: localeOption,
    onResponse: (context) => {
      if (context.response.status !== 200) {
        $q.notify({
          message: $t('SHOP.096'),
          color: 'negative'
        })
      }
    }
  })
}

const changeOptionStatus = (optionList : HoOptionVo[], optionGroup : HoOptionGroupVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: ChangeOptionStatusModal,
    componentProps: {
      optionList,
      shopCode: props.shopCode,
      optionGroup
    }
  }).onOk(async () => {
    await optionGroupListData.refresh()
  })
}

const changeOptionGroupSort = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    component: ChangeOptionGroupSortModal,
    componentProps: {
      optionGroupList: optionGroupList.value,
      shopCode: props.shopCode
    }
  }).onOk(async () => {
    await optionGroupListData.refresh()
  })
}

</script>

<template>
  <q-table
    v-model:pagination="menuPagination"
    v-model:selected="selectedGroup"
    class="q-mb-md-lg full-height shop-table"
    :rows="optionGroupList || []"
    :columns="optionGroupColumns"
    row-key="optionGroupUuid"
    :rows-per-page-options="[0]"
    hide-bottom
    selection="multiple"
    :filter="groupFilter"
  >
    <template v-slot:top-left>
      <q-input v-model="groupFilter" borderless dense debounce="300" placeholder="Search">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-space />
      <q-btn color="primary" :label="$t('SHOP.097')" class="q-ml-md" @click="changeOptionGroupSort" />
    </template>
    <template v-slot:top-right>
      <q-btn color="red" :label="$t('SHOP.098')" class="q-mr-md" :disable="isEmpty(selectedGroup)" @click="deleteGroup" />
      <q-space />
      <q-btn color="primary" :label="$t('MENU_AUTH.002')" class="q-mr-md" @click="createGroup" />
    </template>
    <template v-slot:header="slotProps">
      <q-tr :props="slotProps">
        <q-th auto-width>
          <q-checkbox v-model="slotProps.selected" />
        </q-th>
        <q-th
          v-for="col in slotProps.cols"
          :key="col.name"
          :props="slotProps"
        >
          {{ col.label }}
        </q-th>
        <q-th auto-width />
        <q-th auto-width />
      </q-tr>
    </template>

    <!--            <template v-slot:body-selection="scope">
              <q-checkbox :model-value="scope.selected" @update:model-value="(val, evt) => { Object.getOwnPropertyDescriptor(scope, 'selected').set(val, evt) }" />
            </template>-->
    <template v-slot:body="slotProps">
      <q-tr :props="slotProps">
        <q-td auto-width>
          <q-checkbox
            :model-value="slotProps.selected"
            @update:model-value="(val, evt) => { const descriptor = Object.getOwnPropertyDescriptor(slotProps, 'selected');
                                                 if (descriptor) {
                                                   descriptor.set.call(slotProps, val, evt);
                                                 } }"
          />
        </q-td>
        <q-td
          v-for="col in slotProps.cols"
          :key="col.name"
          :props="slotProps"
        >
          {{ col.value }}
          <q-icon v-if="col.name === 'optionGroupName' && slotProps.row.isHidden" name="visibility_off" style="opacity: 40%; " size="1.3em" />
        </q-td>
        <q-td auto-width>
          <q-btn dense flat icon="edit" class="" @click="updateGroup(slotProps.row)" />
        </q-td>
        <q-td auto-width>
          <q-btn
            size="sm"
            color="primary"
            round
            dense
            :icon="slotProps.expand ? 'remove' : 'add'"
            @click="slotProps.expand = !slotProps.expand"
          />
        </q-td>
      </q-tr>
      <q-tr v-show="slotProps.expand" :props="slotProps">
        <q-td colspan="100%">
          <q-table
            v-model:selected="selectedOption"
            :rows="slotProps.row.optionList"
            :columns="optionColumn"
            row-key="optionUuid"
            selection="multiple"
            :filter="optionFilter"
            :rows-per-page-options="[0]"
            hide-bottom
            style="max-height: 500px"
          >
            <template v-slot:top-left>
              <q-input
                v-model="optionFilter"
                borderless
                dense
                debounce="300"
                placeholder="Search"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-btn color="primary" :label="$t('SHOP.072')" class="q-ml-md" @click="changeOptionStatus(slotProps.row.optionList, slotProps.row)" />
            </template>
            <template v-slot:top-right>
              <q-btn color="red" :label="$t('SHOP.099')" class="q-mr-md" :disable="isEmpty(selectedOption)" @click="deleteOption" />
              <q-space />
              <q-btn color="primary" :label="$t('SHOP.100')" class="q-mr-md" @click="createOption(slotProps.row.optionGroupUuid)" />
            </template>
            <template v-slot:header="slotProp">
              <q-tr :props="slotProp">
                <q-th auto-width>
                  <q-checkbox v-model="slotProp.selected" />
                </q-th>
                <q-th
                  v-for="col in slotProp.cols"
                  :key="col.name"
                  :props="slotProp"
                >
                  {{ col.label }}
                </q-th>
                <q-th auto-width />
              </q-tr>
            </template>
            <template v-slot:body="slotProp">
              <q-tr :props="slotProp">
                <q-td auto-width>
                  <q-checkbox
                    :model-value="slotProp.selected"
                    @update:model-value="(val, evt) => { const descriptor = Object.getOwnPropertyDescriptor(slotProp, 'selected');
                                                         if (descriptor) {
                                                           descriptor.set.call(slotProp, val, evt);
                                                         } }"
                  />
                </q-td>
                <q-td
                  v-for="col in slotProp.cols"
                  :key="col.name"
                  :props="slotProp"
                >
                  {{ col.value }}
                  <q-icon v-if="col.name === 'optionName' && slotProp.row.isHidden" name="visibility_off" style="opacity: 40%; " size="1.3em" />
                </q-td>
                <q-td auto-width>
                  <q-btn dense flat icon="edit" class="" @click="updateOption(slotProp.row)" />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-td>
      </q-tr>
    </template>
  </q-table>

  <q-dialog v-model="optionGroupPopup" persistent>
    <q-card style="width: 500px">
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('SHOP.105') }} {{ groupSubmitStatus === 'POST' ? $t('COMMON.061') : $t('COMMON.062') }}
        </div>
      </q-card-section>
      <q-separator />

      <q-card-section style="max-height: 70vh;width: 500px" class="scroll">
        <q-form @submit="submitOptionGroup(optionGroup.optionGroupUuid)">
          <q-input v-model="optionGroup.optionGroupName" :label="$t('SHOP.054')" :rules="[val => !!val || $t('MENU_AUTH.001')]" />
          <template v-if="shopInfo?.useLocale && groupSubmitStatus === 'PUT'">
            <q-input
              v-for="language in defaultOptionGroupLocales"
              :key="language.localeCode"
              v-model="language.localeOptionGroupName"
              :label="`${getLocaleName(language.localeCode, localeList)} ${$t('SHOP.054')}`"
            />
          </template>
          <div class="q-my-md column">
            <q-toggle v-model="optionGroup.optionUnique" :label="$t('SHOP.055')" />
            <q-toggle v-model="optionGroup.optionRequired" :label="$t('SHOP.058')" />
            <q-toggle v-model="optionGroup.doesReplace" :label="$t('SHOP.059')" />
            <q-checkbox v-model="optionGroup.isHidden" :label="$t('COMMON.063')" />
            <q-input
              v-model.number="optionGroup.minQty"
              clearable
              :label="$t('SHOP.101')"
              type="number"
              min="0"
              reactive-rules
              :rules="[
                (val:number) => val >= 0 || '최소 수량은 0 이상이어야 합니다',
                (val:number) => (optionGroup?.maxQty ?? 0) >= val || $t('SHOP.102')
              ]"
            />
            <q-input
              v-model.number="optionGroup.maxQty"
              clearable
              :label="$t('SHOP.103')"
              type="number"
              min="0"
              reactive-rules
              :rules="[
                (val:number) => val >= 0 || '최대 수량은 0 이상이어야 합니다',
                (val:number) => (optionGroup?.minQty ?? 0) <= val || $t('SHOP.104')
              ]"
            />
          </div>
          <div class="q-mt-md">
            <q-btn type="submit" :label="$t('COMMON.064')" color="primary" class="q-mt-md" />
            <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mt-md q-ml-md" @click="optionGroupPopup = false" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="optionPopup" persistent>
    <q-card style="width: 500px">
      <q-card-section>
        <div class="text-h6 text-bold">
          {{ $t('SHOP.105') }} {{ optionSubmitStatus === 'POST' ? $t('COMMON.061') : $t('COMMON.062') }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="submitOption(option.optionUuid)">
          <q-input v-model="option.optionName" :label="$t('SHOP.090')" :rules="[val => !!val || $t('SHOP.106')]" />
          <template v-if="shopInfo?.useLocale && optionSubmitStatus === 'PUT'">
            <q-input
              v-for="language in defaultOptionLocales"
              :key="language.localeCode"
              v-model="language.localeOptionName"
              :label="`${getLocaleName(language.localeCode, localeList)} ${$t('SHOP.090')}`"
            />
          </template>
          <q-input v-model="option.optionPrice" :label="$t('SHOP.091')" type="number" />
          <div>
            <q-btn type="submit" :label="$t('COMMON.064')" color="primary" class="q-mt-md" />
            <q-btn :label="$t('COMMON.005')" color="grey-5" class="q-mt-md q-ml-md" @click="optionPopup = false" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">

</style>
