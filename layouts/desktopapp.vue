<script setup lang="ts">
import useDayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import { desktopAppMenuList } from '~/utils/code'
import { useAuthStore } from '~/store/auth'
import app from '~/app.vue'
import { useOrderListStore } from '~/store/orderListStore'
import { useShopInfoStore } from '~/store/shopInfoStore'
import { useQrPaymentStore } from '~/store/qrPaymentStore'
const { logUserOut, userInfo } = useAuthStore(app.$pinia)

const route = useRoute()
const router = useRouter()
const menuList = ref(desktopAppMenuList)
const tabMenuList = ref([])
const leftDrawerOpen = ref(false)
const orderPopup = ref(false)
const { newOrderList } = storeToRefs(useOrderListStore())
const { setOrder, removeFirstOrder } = useOrderListStore()

const { fetchShopInfo } = useShopInfoStore()
fetchShopInfo(route.params.shopCode as string)

const { shopInfo } = storeToRefs(useShopInfoStore())

// QR 결제 store
const qrPaymentStore = useQrPaymentStore()
const { qrPaymentEnabled, showQrConfirmModal, showPaymentToast, paymentToastMessage } = storeToRefs(qrPaymentStore)

const onToggleQrPayment = (newVal: boolean) => {
  if (!newVal) {
    qrPaymentEnabled.value = true // 토글 원복
    qrPaymentStore.openConfirmModal()
  } else {
    qrPaymentStore.enablePayment()
  }
}

provide('qrPaymentEnabled', qrPaymentEnabled)

const drawerClick = (e: any) => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  e.stopPropagation()
}

const changeTabMenu = (menu: any) => {
  if (isEmpty(menu.menuList)) {
    tabMenuList.value = [menu] as any
  } else {
    tabMenuList.value = menu.menuList
      .filter((childMenu: any) => childMenu.auth === 'ALL' || childMenu.auth.includes(userInfo.userType))
  }
}

const alternateLink = (menuId: string) => {
  switch (menuId) {
    case 'orderInfo':
      return `/order/desktop/${userInfo.shopInfo.shopCode}`
    case 'paymentHistory':
      return `/paymentHistory/${userInfo.shopInfo.shopCode}`
    default:
      return null
  }
}

const doMenu = (menu: any) => {
  router.push(menu.to)
  menu.expanded = false
  changeTabMenu(menu)
}

const logout = () => {
  if (shopInfo.value?.pg) {
    if (shopInfo.value?.posCode !== 'handorder') {
      console.log('[Desktop Layout] 로그아웃')
    }
  }

  logUserOut()
}

const closePopup = (val:boolean) => {
  // store 액션을 사용하여 첫 번째 주문 제거 (SSG 빌드에서 안전)
  removeFirstOrder()

  if (newOrderList.value.length > 0) {
    setOrder(newOrderList.value[0].printLogGroup)
  }

  if (newOrderList.value.length === 0) {
    orderPopup.value = val
  }
}

onMounted(() => {
  console.log('DesktopApp mounted')
})

</script>

<template>
  <template v-if="route.path.includes('/order/desktop')">
    <q-layout class="electron-layout">
      <q-header class="title-bar">
        <q-toolbar>
          <q-toolbar-title>
            <q-img src="/desktop_handorder_logo.png" width="113px" height="15px" />
          </q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container class="main-container">
        <q-page class="main-container-box">
          <slot />
        </q-page>
      </q-page-container>
    </q-layout>
  </template>

  <q-layout v-else class="electron-layout">
    <q-header class="title-bar">
      <q-toolbar>
        <q-btn
          v-if="!route.path.includes('login')"
          flat
          round
          icon="menu"
          color="black"
          @click="drawerClick"
        />

        <q-toolbar-title>
          <q-img src="/desktop_handorder_logo.png" width="113px" height="15px" />
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      bordered
      overlay
      :width="300"
      :breakpoint="400"
    >
      <q-list padding class="menu-list">
        <!-- QR 결제 토글 -->
        <div class="qr-payment-toggle-box">
          <div class="qr-payment-toggle-inner">
            <div>
              <span class="qr-payment-label">QR 결제</span>
              <CustomToggle v-model="qrPaymentEnabled" @update:model-value="onToggleQrPayment" />
            </div>
            <p class="qr-payment-status" :class="qrPaymentEnabled ? 'active' : 'inactive'">
              {{ qrPaymentEnabled ? '결제 등록이 활성화 되었습니다.' : '결제 등록이 꺼진 상태입니다.' }}
            </p>
          </div>
        </div>

        <template v-for="(menu,index) in menuList" :key="index">
          <q-expansion-item
            v-model="menu.expanded"
            :content-inset-level="1"
            group="menuGruop"
          >
            <template v-slot:header="{ expanded }">
              <q-item-section avatar @click="doMenu(menu)">
                <q-avatar>
                  <q-icon :name="menu.icon" :class="expanded ? menu.iconActiveClass : menu.iconNonActiveClass" />
                </q-avatar>
              </q-item-section>
              <q-item-section :class="expanded ? 'text-handorder' : ''">
                {{ $t(menu.menuName) }}
              </q-item-section>
            </template>
            <template v-if="isEmpty(menu.menuList)">
              <q-item
                :key="menu.to"
                clickable
                :to="menu.to ?? alternateLink(menu.menuId)"
                active-class="menu-active"
                @click="changeTabMenu(menu)"
              >
                <q-item-section>{{ $t(menu.menuName) }}</q-item-section>
              </q-item>
            </template>
            <template v-else>
              <template v-for="childMenu in menu.menuList">
                <q-item
                  v-if="childMenu.auth.includes('ALL') || childMenu.auth.includes(userInfo.userType)"
                  :key="childMenu.to!"
                  clickable
                  :to="childMenu.to ?? alternateLink(childMenu.menuId)"
                  active-class="menu-active"
                  @click="changeTabMenu(menu)"
                >
                  <q-item-section>
                    {{ $t(childMenu.menuName) }}
                  </q-item-section>
                </q-item>
              </template>
            </template>
          </q-expansion-item>
        </template>
      </q-list>

      <q-item clickable style="position: absolute; bottom: 5px; width: 100%;" @click="logout">
        <q-item-section avatar>
          <q-icon name="logout" />
        </q-item-section>
        <q-item-section>
          {{ $t('COMMON.003') }}
        </q-item-section>
      </q-item>
    </q-drawer>

    <q-page-container class="main-container">
      <q-page class="main-container-box" @click="leftDrawerOpen = false">
        <slot />
      </q-page>
    </q-page-container>

    <!-- QR 결제 모드 변경 안내 모달 -->
    <div v-if="showQrConfirmModal" class="qr-confirm-modal-overlay">
      <div class="qr-confirm-modal">
        <div class="qr-confirm-title">결제 모드 변경 안내</div>
        <div class="qr-confirm-desc">결제 모드를 종료하면 마감 처리 됩니다.</div>
        <div class="qr-confirm-actions">
          <button class="qr-btn qr-btn-keep" @click="qrPaymentStore.keepPayment()">계속 진행하기</button>
          <button class="qr-btn qr-btn-confirm" @click="qrPaymentStore.disablePayment()">돌아가기</button>
        </div>
      </div>
    </div>

    <!-- QR 결제 토스트 -->
    <Transition name="qr-payment-toast">
      <div v-if="showPaymentToast" class="qr-payment-toast-msg">
        {{ paymentToastMessage }}
      </div>
    </Transition>

    <template v-if="newOrderList.length > 0">
      <OrderPopup
        :order-popup="orderPopup"
        :order-flag="'newOrder'"
        @update:order-popup="closePopup"
      >
        <NewOrderButton />
      </OrderPopup>
    </template>
  </q-layout>
</template>

<style lang="scss">
:root{
  --handorder-color: #ff8b4a;
}

.electron-layout{
  overflow:hidden ;
  user-select: none;
  -webkit-user-select: none;
  .title-bar{
    position: relative;
    background:  var(--handorder-color);

    .icon-wrap{
      >*{
        color: black;
        padding: 0 5px;
        font-size: 10px;
        margin-right: 5px;
      }
    }
  }

  .main-container {
    height: calc(100vh - 50px) !important;
    padding :0 !important;
    overflow:auto ;
    .main-container-box{
      padding: 0px;
      .main-content{
        .content-header{
          display: none;
        }
      }
    }
  }
}

</style>
<style scoped lang="scss">
.order-count-box{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(230px, -230px);
  display: flex;
  align-items: center;
  z-index: 2;
  .new-text{
    font-size: 16px;
    font-weight: 700;
    color: var(--handorder-color);
  }
  .count-item{
    width: 30px;
    height: 30px;
    background-color: #ffffff;
    color: var(--handorder-color);
    font-size: 16px;
    font-weight: 700;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

}
.new-order-box{
  width: 500px;
  height: 400px;
  .order-title-box{
    height: 50px;
    background-color: var(--handorder-color);
    display: flex;
    justify-content: center;
    align-items: center;
    .order-title{
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      text-align: center;

    }
  }
  .order-body-box{
    .order-header{
      font-size:18px;
      font-weight: 700;
      color: var(--handorder-color);
      display: flex;
      justify-content: space-between;
    }
    .order-list{
      margin-top: 20px;
      height: 55%;
      .order-menu{
        margin-bottom: 15px;
        .menu-item{
          font-size: 16px;
          font-weight: 700;
          color: #000000;
          margin-bottom: 5px;
        }
        .option-item{
          font-size: 14px;
          font-weight: 500;
          color: #000000;
        }
      }

    }
  }
}

:deep(.text-handorder),
:deep(.color-handorder){
  color: var(--handorder-color);
}

:deep(.bg-handorder) {
  background-color: var(--handorder-color);
}
:deep(.fill-handorder) {
  fill: var(--handorder-color);

}

:deep(.stroke-handorder) {
  stroke: var(--handorder-color);

}

:deep(.stroke-black) {
  stroke: #000000;

}

:deep(.stroke-white) {
  stroke: #ffffff;

}

.menu-lnb {
  .main-tab-active {
    :deep(.q-tab__label) {
      color: var(--handorder-color);
    }
  }
}

.main-logo {
  cursor: pointer;
  width: 101px;
  height: 29px;
  margin-left: 20px;
}
.menu-lnb {
  height: 100%;
  padding-left: 80px;
  .menu-tab {
    height: 100%;
    :deep(.q-tab__label) {
      color: #5c5c5c;
      text-align: center;
      font-family: Noto Sans KR;
      font-size: 16px;
      font-style: normal;
      font-weight: 700;
      line-height: normal;
    }
  }
}
// QR 결제 모달
.qr-confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.qr-confirm-modal {
  background: #fff;
  border-radius: 12px;
  padding: 18px 16px 16px 16px;
  width: 280px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  animation: qrModalIn 0.18s ease-out;
  font-family: "Pretendard";

  .qr-confirm-title {
    font-size: 17px;
    font-weight: 700;
    color: #1c1917;
    margin-bottom: 10px;
    letter-spacing: -0.4px;
  }

  .qr-confirm-desc {
    font-size: 13px;
    color: #5D5D5C;
    font-weight: 500;
    margin-bottom: 18px;
    line-height: 1.5;
    letter-spacing: -0.3px;
  }

  .qr-confirm-actions {
    display: flex;
    gap: 8px;
  }

  .qr-btn {
    flex: 1;
    height: 44px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    letter-spacing: -0.3px;
    transition: all 0.15s;

    &.qr-btn-keep {
      background: #F2F4F6;
      color: #5D5D5C;
      font-weight: 600;
      &:hover { background: #e5e5e5; }
    }

    &.qr-btn-confirm {
      background: #FF8B4A;
      color: #FFFFFF;
      font-weight: 500;
      &:hover { background: #f07a35; }
      &:active { transform: scale(0.97); }
    }
  }
}

@keyframes qrModalIn {
  from { opacity: 0; transform: scale(0.93) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.qr-payment-toast-msg {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(59, 59, 59, 0.88);
  color: #fff;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: -0.35px;
  font-family: "Pretendard";
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.qr-payment-toast-enter-active,
.qr-payment-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.qr-payment-toast-enter-from,
.qr-payment-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

.qr-payment-toggle-box {
  margin: 12px 12px 4px;
  padding: 12px 10px 12px 12px;
  background: #F2F4F6;
  border-radius: 6px;
  font-family: "Pretendard";

  .qr-payment-toggle-inner {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    div {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .qr-payment-label {
    font-size: 15px;
    font-weight: 700;
    color: #1c1917;
  }

  .qr-payment-status {
    margin: 5px 0 0 0;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: -0.3px;

    &.active {
      color: #378AFF;
    }
    &.inactive {
      color: #808080;
    }
  }
}

.q-drawer--standard {
  .menu-list {
    width: 266px;
    .q-icon {
      margin-left: 12px;
      font-size:24px;
    }
  }
  .q-expansion-item {
    width: 100%;
    :deep(.q-item) {
      padding: 8px;
    }
  }
}

.q-drawer--mini-animate {
  .q-drawer--mini {
    .q-item__section--main {
      display: none;
    }
    :deep(.q-expansion-item__toggle-icon) {
      display: none;
    }
  }
}

.profile-box {
  width: 99px;
  height: 43px;
  border-left: 1px solid #9c9c9c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-list {
  color: #191d23;
  font-family: "Noto Sans KR";
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
    background-color: var(--handorder-color);
    color: #ffffff;
    border-radius: 4px;
    .active-icon{
      stroke: #ffffff;
    }
  }
  .q-expansion-item--expanded{
    :deep(.active-header){
      color: var(--handorder-color);
      background-color: #ffffff;
      border-radius: 4px;
      .active-icon{
        stroke: #ffffff;
      }
    }
  }
}

</style>
