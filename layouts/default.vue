<script setup lang="ts">
import { useAuthStore } from '~/store/auth'

const app = useNuxtApp()
const { logUserOut, userInfo } = useAuthStore(app.$pinia)

const route = useRoute()

const leftDrawerOpen = ref(true)
const miniState = ref(true)

watch(() => route.path, (path) => {
  if (path.startsWith('/order/desktop') || path.startsWith('/paymentHistory')) {
    miniState.value = true
  } else {
    miniState.value = false
  }
}, { immediate: true })

const shopCode = computed(() => userInfo.shopInfo?.shopCode)

const drawerClick = () => {
  miniState.value = !miniState.value
}

provide('sidebarMiniState', miniState)

const logout = () => {
  logUserOut()
}

const nuxtApp = useNuxtApp()
const loading = useState('loading', () => false)
nuxtApp.hook('page:start', () => { loading.value = true })
nuxtApp.hook('page:finish', () => { loading.value = false })
</script>

<template>
  <div>
    <q-layout view="hHh LpR lFf">
      <q-drawer
        v-model="leftDrawerOpen"
        show-if-above
        persistent
        side="left"
        :mini="miniState"
        :width="200"
        :breakpoint="0"
      >
        <q-list padding class="menu-list">
          <!-- 메뉴 토글 -->
          <q-item class="menu-title" clickable @click="drawerClick">
            <q-item-section avatar>
              <q-avatar>
                <q-icon :name="miniState ? 'arrow_forward' : 'menu'" class="cursor-pointer" />
              </q-avatar>
            </q-item-section>
            <q-item-section>{{ $t('COMMON.043') }}</q-item-section>
          </q-item>

          <!-- 주문접수 -->
          <q-item
            clickable
            :to="`/order/desktop/${shopCode}`"
            active-class="menu-active"
          >
            <q-item-section avatar>
              <q-avatar>
                <q-icon name="receipt_long" />
              </q-avatar>
            </q-item-section>
            <q-item-section>주문접수</q-item-section>
          </q-item>

          <!-- 결제내역 -->
          <q-item
            clickable
            :to="`/paymentHistory/${shopCode}`"
            active-class="menu-active"
          >
            <q-item-section avatar>
              <q-avatar>
                <q-icon name="payments" />
              </q-avatar>
            </q-item-section>
            <q-item-section>결제내역</q-item-section>
          </q-item>

          <!-- 하단 로그아웃 -->
          <q-space />
          <q-separator />
          <q-item clickable @click="logout">
            <q-item-section avatar>
              <q-avatar>
                <q-icon name="logout" />
              </q-avatar>
            </q-item-section>
            <q-item-section>{{ $t('COMMON.003') }}</q-item-section>
          </q-item>
        </q-list>
      </q-drawer>

      <q-page-container class="main-container">
        <slot />
        <q-inner-loading :showing="loading" />
      </q-page-container>
    </q-layout>
  </div>
</template>

<style scoped lang="scss">
:deep(.text-handorder),
:deep(.color-handorder) {
  color: var(--handorder-color);
}

:deep(.bg-handorder) {
  background-color: var(--handorder-color);
}

.main-container {
  background: #f5f3f2;
  min-height: 100dvh;
}

.q-drawer--standard {
  .menu-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 100%;

    .q-icon {
      margin-left: 12px;
      font-size: 24px;
    }
  }
}

.menu-list {
  color: #191d23;
  font-family: 'Noto Sans KR';
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  margin: 0 auto;
  padding: 0;

  .menu-title {
    color: #5c5c5c;
  }

  :deep(.q-item__section--side) {
    padding-right: 8px;
  }

  :deep(.q-item__section--avatar) {
    min-width: 0;
  }

  .q-item {
    padding: 0;
    padding-left: 8px;
    height: 56px;
  }

  .menu-active {
    background: var(--handorder-color);
    color: #ffffff;
    border-radius: 4px;
  }
}
</style>

<style lang="scss">
:root {
  --handorder-color: #ff8b4a;
}
</style>
