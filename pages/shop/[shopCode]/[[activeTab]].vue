<script setup lang="ts">
import { storeToRefs } from 'pinia'
import MenuTab from '~/components/MenuTab.vue'
import CategoryTab from '~/components/CategoryTab.vue'
import { useAuthStore } from '~/store/auth'

const route = useRoute()
const nuxtApp = useNuxtApp()
const $q = useQuasar()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = storeToRefs(authStore)

const tab = ref('shopInfo')
const syncShopYn = useCookie('syncShopYn', { maxAge: 600 })

const shopCode:string = route.params.shopCode as string
const activeTab = route.params.activeTab as string | undefined
if (activeTab) {
  tab.value = activeTab
}

const syncShopInfo = async () => {
  if (userInfo.value.userType === 'shop') {
    if (syncShopYn.value === 'Y') {
      $q.notify({
        message: $t('SHOP.010'),
        color: 'negative',
        position: 'top'
      })
      return
    }
    syncShopYn.value = 'Y'
  }

  await customFetch(`/admin/handOrder/shop/${shopCode}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  $q.notify({
    message: $t('SHOP.011'),
    color: 'positive',
    position: 'top'
  })
  await refreshNuxtData()
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold"><q-icon
        name="keyboard_backspace"
        class="q-mr-md-lg cursor-pointer backspace"
        size="md"
        @click="$router.back()"
      /> {{ $t('SHOP.012') }} </span>

      <q-btn :label="$t('SHOP.013')" color="primary" class="q-mt-md float-right" @click="syncShopInfo" />
      <q-separator class="q-mt-lg" />
      <q-separator class="q-mb-lg" />
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
          <q-tab v-if="!route.params.activeTab" name="shopInfo" icon="info" :label="$t('SHOP.014')" />
          <q-tab name="category" icon="restaurant_menu" :label="$t('SIDE_MENU.013')" />
          <q-tab name="menu" icon="tune" :label="$t('SHOP.015')" />
        </q-tabs>
      </div>
      <div class="tab-item col">
        <template v-if="tab === 'shopInfo'">
          <ShopInfoTab :shop-code="shopCode" />
        </template>
        <template v-else-if="tab === 'category'">
          <CategoryTab :shop-code="shopCode" />
        </template>
        <template v-else-if="tab === 'menu'">
          <MenuTab :shop-code="shopCode" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.backspace{
  &:hover{
    color: var(--handorder-color);
  }
}

.shop-table{
  :deep(.q-checkbox){
    :deep(.q-checkbox__inner){
      color: var(--handorder-color);
    }
  }
}

/*.category-table{
  height: v-bind(contentHeight);
}*/
</style>
