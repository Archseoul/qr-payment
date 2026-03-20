<script setup lang="ts">
import type { Ref } from 'vue'
import type { LocaleCodeVo, ShopInfoVo } from '~/types'

const { checkPermissions } = useCheckPermissions()

const shopListData = await useCustomFetch<ShopInfoVo[]>('/admin/handOrder/v2/shop', {
  method: 'GET'
})
const shopList:Ref<ShopInfoVo[]|null> = shopListData.data

const localeListData = await useCustomFetch<LocaleCodeVo[]>('/admin/handOrder/locale', {
  method: 'GET'
})
const localeList:Ref<LocaleCodeVo[] | null> = localeListData.data

const localeOptions = computed(() => {
  return localeList.value?.map(locale => ({
    label: locale.localeName,
    value: locale.localeCode
  }))
})
const selectedLocales = ref<string[]>([])

const activeShop = ref<ShopInfoVo |null>(null)

const getShopLocale = async (shopCode:string) => {
  return await customFetch<LocaleCodeVo[]>(`/admin/handOrder/locale/shop/${shopCode}`, {
    method: 'GET'
  })
}
const getSingleShop = async (shopCode:string) => {
  return await customFetch<ShopInfoVo>(`/admin/handOrder/shop/${shopCode}`, {
    method: 'GET'
  })
}
const getShopLocaleSequence = async (shop:ShopInfoVo) => {
  activeShop.value = await getSingleShop(shop.shopCode)
  selectedLocales.value = (await getShopLocale(shop.shopCode)).map(locale => locale.localeCode)
}
const assignLocaleSequence = async () => {
  if (!checkPermissions(['U'])) {
    return
  }
  if (activeShop.value) {
    await customFetch('/admin/handOrder/v2/shop', {
      method: 'PUT',
      body: activeShop.value
    })
    await customFetch(`/admin/handOrder/locale/shop/${activeShop.value.shopCode}`, {
      method: 'PUT',
      body: selectedLocales.value
    })
    await localeListData.refresh()
    await getShopLocaleSequence(activeShop.value)
  }
}
</script>

<template>
  <div class="main-content relative-position full-height">
    <q-scroll-area class="fit q-pa-lg">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.027') }}</span>

      <q-separator class="q-my-lg" />

      <div class="row">
        <q-card class="q-ma-sm select-box">
          <q-card-section class="fit">
            <q-scroll-area class="full-height">
              <q-list v-if="shopList" separator bordered>
                <template v-for="shop in shopList" :key="shop.shopSeq">
                  <q-item
                    clickable
                    :active="activeShop?.shopCode === shop.shopCode"
                    active-class="bg-primary text-white"
                    @click="getShopLocaleSequence(shop)"
                  >
                    {{ shop.shopName }}
                  </q-item>
                </template>
              </q-list>
            </q-scroll-area>
          </q-card-section>
        </q-card>
        <q-card class="q-ma-sm select-box">
          <q-card-section>
            <q-item>
              <q-item-section>
                <q-item-label>{{ $t('LOCALE.006') }}</q-item-label>
                <q-item-label class="text-h6 text-bold">
                  {{ activeShop ? activeShop.shopName : $t('COMMON.053') }}
                </q-item-label>
              </q-item-section>
              <q-item-section v-if="activeShop" side>
                <q-checkbox v-model="activeShop.useLocale" :label="$t('LOCALE.007')" />
              </q-item-section>
            </q-item>
          </q-card-section>
          <q-card-section v-if="activeShop">
            <q-scroll-area style="height: 300px;">
              <q-option-group v-model="selectedLocales" :options="localeOptions" type="checkbox" :disable="!activeShop.useLocale" />
            </q-scroll-area>
          </q-card-section>
          <q-card-actions class="absolute-bottom" align="right">
            <q-btn
              color="primary"
              :label="$t('COMMON.077')"
              @click="assignLocaleSequence"
            />
          </q-card-actions>
        </q-card>
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">
.select-box{
  width: 500px;
  height: 500px;
}
</style>
