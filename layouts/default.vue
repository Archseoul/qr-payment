<script setup lang="ts">
import { useQuasar } from 'quasar'
import { isEmpty } from 'lodash-es'
import { useAuthStore } from '~/store/auth'
import { allMenuList } from '~/utils/code'
import TermsOfService from '~/components/termsOfService.vue'

const $q = useQuasar()
const app = useNuxtApp()
const { logUserOut, userInfo } = useAuthStore(app.$pinia)

const router = useRouter()

const menuList = ref(allMenuList)

const leftDrawerOpen = ref(false)
const miniState = ref(false)
const mainPaddingTb: Ref<number> = ref(42)
const mainPaddingLr: Ref<number> = ref(40)

const mainPaddingTbPx = computed(() => `${mainPaddingTb.value}px`)
const mainPaddingLrPx = computed(() => `${mainPaddingLr.value}px`)
const mainContentHeight = ref('')
const tab = ref('')

const targetShopData = await useCustomFetch('/admin/handOrder/signup/temp/shop/' + userInfo.shopInfo?.shopCode, {
  method: 'GET'
})

const targetShop = targetShopData.data

const tabMenuList = ref([])

const drawerClick = (e: any) => {
  miniState.value = !miniState.value
  e.stopPropagation()
}

const myTweak = (offset: number) => {
  mainContentHeight.value = offset ? `calc(100vh - ${offset + mainPaddingTb.value * 2}px)` : '100vh'
  return { minHeight: mainContentHeight.value }
}

const logout = () => {
  logUserOut()
}

const changeTabMenu = (menu: any) => {
  if (isEmpty(menu.menuList)) {
    tabMenuList.value = [menu] as any
  } else {
    const menuList = menu.menuList.filter((item: any) => {
      return item.auth.includes(userInfo.userType) || item.auth.includes('ALL')
    })

    tabMenuList.value = menuList.filter((item: any) => {
      return item.menuCode !== '1500' && item.menuCode !== '1600'
    })
  }
}

const doMenu = (menu: any) => {
  if (miniState.value) {
    changeTabMenu(menu)
    nextTick(() => {
      router.push(menu.to)
      menu.expanded = false
    })
  }
}

const doHome = () => {
  router.push('/')
}

const doCompany = () => {
  router.push('/myInfo/company')
}

const alternateLink = (menuId: string) => {
  switch (menuId) {
    case 'menuManagement':
      return `/shop/${userInfo.shopInfo.shopCode}/category`
    case 'companyInfo':
      return `/company/${userInfo.companyCode}`
    default:
      return null
  }
}

const openTermsOfService = (type: string) => {
  let file = ''
  switch (type) {
    case '1':
      if (userInfo.userType === 'company') {
        file = '/text/company/termsOfService_3.md'
      } else {
        file = targetShop.value ? '/text/shop/termsOfService_4.md' : '/text/shop/termsOfService_3.md'
      }
      break
    case '2':
      file = '/text/shop/termsOfService_6.md'
      break
  }

  $q.dialog({
    component: TermsOfService,
    componentProps: {
      file
    }
  })
}

const isMenuAuth = (menu: any) => {
  let result = false
  if (menu.auth.includes('ALL') || menu.auth.includes(userInfo.userType)) {
    result = true
  }
  if (userInfo.role === 'ROLE_OWNER' && (menu.menuCode === '1500' || menu.menuCode === '1600')) {
    result = false
  }
  return result
}

const route = useRoute()

const isMenuActive = (menuItem: any) => {
  const targetPath = menuItem.to ?? alternateLink(menuItem.menuId)
  if (!targetPath) {
    return false
  }
  return route.path === targetPath || route.path.startsWith(targetPath + '/')
}

const nuxtApp = useNuxtApp()
const loading = useState('loading', () => false)
nuxtApp.hook('page:start', () => {
  loading.value = true
})
nuxtApp.hook('page:finish', () => {
  loading.value = false
})

type AppLocale = typeof currentLocale.value
type LocaleOption = { code: AppLocale; name: string; dir?: 'ltr' | 'rtl' }
const { locales: i18nLocales, locale: currentLocale, setLocale } = useI18n()

const languageOptions = computed<LocaleOption[]>(() => {
  const locales = i18nLocales.value as Array<AppLocale | LocaleOption>
  return locales.map(locale => (typeof locale === 'string'
    ? { code: locale as AppLocale, name: locale }
    : { code: locale.code, name: locale.name ?? locale.code, dir: locale.dir }))
})

const currentLanguage = computed(() => languageOptions.value.find(l => l.code === currentLocale.value))

const onSelectLanguage = async (code: AppLocale): Promise<void> => {
  if (code !== currentLocale.value) {
    await setLocale(code)
  }
  window.location.reload()
}
</script>
<template>
  <div>
    <q-layout view="hHh LpR lFf">
      <q-header class="bg-white text-white overflow-hidden" style="height: 70px">
        <q-toolbar class="fit">
          <img src="@/assets/handOrderLogo.png" class="main-logo" @click="doHome">
          <q-toolbar-title class="menu-lnb">
            <q-tabs
              v-model="tab"
              class="text-black menu-tab"
              indicator-color="handorder"
              active-color="handorder"
              active-class="main-tab-active"
              align="left"
            >
              <q-route-tab v-for="tabMenu in tabMenuList" :key="tabMenu.to" :label="$t(tabMenu.menuName)" :to="tabMenu.to" />
            </q-tabs>
          </q-toolbar-title>
          <q-separator vertical inset />
          <div v-if="userInfo.userType === 'company' || userInfo.userType === 'worker'">
            <q-btn color="primary" :label="$t('COMMON.002')" class="q-mx-md" @click="doCompany" />
          </div>
          <q-btn flat text-color="black" :label="`${currentLanguage?.name} (${currentLanguage?.code})`">
            <q-menu>
              <q-list style="min-width: 160px">
                <q-item v-for="opt in languageOptions" :key="opt.code" v-close-popup clickable @click="onSelectLanguage(opt.code)">
                  <q-item-section>{{ opt.name }} ({{ opt.code.toUpperCase() }})</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-separator vertical inset />
          <q-btn flat text-color="black" :label="`${$t('COMMON.001', { name: userInfo.userName })}`">
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item v-close-popup clickable @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>{{ $t('COMMON.003') }}</q-item-section>
                </q-item>
                <!--                <q-separator />-->
              </q-list>
            </q-menu>
          </q-btn>
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="leftDrawerOpen"
        show-if-above
        persistent
        side="left"
        :mini="miniState"
        :width="300"
        :breakpoint="400"
      >
        <q-list padding class="menu-list">
          <q-item class="menu-title">
            <q-item-section avatar>
              <template v-if="miniState">
                <q-avatar>
                  <q-icon name="arrow_forward" class="cursor-pointer" @click="drawerClick" />
                </q-avatar>
              </template>
              <template v-else>
                <q-avatar>
                  <q-icon name="menu" class="cursor-pointer" @click="drawerClick" />
                </q-avatar>
              </template>
            </q-item-section>
            <q-item-section class="cursor-pointer" @click="drawerClick">
              {{ $t('COMMON.043') }}
            </q-item-section>
          </q-item>
          <template v-for="(menu,index) in menuList" :key="index">
            <q-expansion-item
              v-if="menu.auth == 'ALL' || menu.auth.includes(userInfo.userType)"
              v-model="menu.expanded"
              :content-inset-level="1"
              :header-class="miniState ? 'active-header' : ''"
              group="menuGruop"
            >
              <template v-slot:header="{ expanded }">
                <q-item-section avatar :class="(expanded && miniState ) ? 'menu-active' : ''" @click="doMenu(menu)">
                  <q-avatar>
                    <q-icon
                      :name="menu.icon"
                      :class="[(expanded && !miniState) ? menu.iconActiveClass : menu.iconNonActiveClass,(expanded && miniState) ? menu.iconMiniActiveClass : '']"
                    />
                  </q-avatar>
                </q-item-section>
                <q-item-section :class="expanded ? 'text-handorder' : ''">
                  {{ $t(menu.menuName) }}
                </q-item-section>
              </template>
              <template v-if="isEmpty(menu.menuList)">
                <q-item
                  :key="menu.to || menu.menuId"
                  clickable
                  :class="{ 'menu-active': isMenuActive(menu) }"
                  @click="() => { changeTabMenu(menu); if (menu.to || alternateLink(menu.menuId)) router.push(menu.to ?? alternateLink(menu.menuId)); }"
                >
                  <q-item-section>{{ $t(menu.menuName) }}</q-item-section>
                </q-item>
              </template>
              <template v-else>
                <template v-for="childMenu in menu.menuList">
                  <!-- 하위 메뉴가 있는 경우 (2단계 중첩) -->
                  <q-expansion-item
                    v-if="isMenuAuth(childMenu) && childMenu.menuList && childMenu.menuList.length > 0"
                    :key="childMenu.menuCode"
                    :content-inset-level="1"
                    dense
                  >
                    <template v-slot:header>
                      <q-item-section>
                        {{ childMenu.menuName }}
                      </q-item-section>
                    </template>
                    <template v-for="subMenu in childMenu.menuList">
                      <q-item
                        v-if="isMenuAuth(subMenu)"
                        :key="subMenu.to"
                        clickable
                        :to="subMenu.to"
                        active-class="menu-active"
                        @click="changeTabMenu(menu)"
                      >
                        <q-item-section>
                          {{ subMenu.menuName }}
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-expansion-item>
                  <!-- 하위 메뉴가 없는 경우 (일반 메뉴) -->
                  <q-item
                    v-else-if="isMenuAuth(childMenu)"
                    :key="childMenu.to || childMenu.menuId"
                    clickable
                    :class="{ 'menu-active': isMenuActive(childMenu) }"
                    @click="() => { changeTabMenu(menu); if (childMenu.to || alternateLink(childMenu.menuId)) router.push(childMenu.to ?? alternateLink(childMenu.menuId)); }"
                  >
                    <q-item-section>
                      {{ $t(childMenu.menuName) }}
                    </q-item-section>
                  </q-item>
                </template>
              </template>
            </q-expansion-item>
          </template>

          <!--        <q-expansion-item :content-inset-level="1">
            <template v-slot:header="{ expanded }">
              <q-item-section avatar>
                <q-avatar>
                  <q-icon name="svguse:/icons.svg#people-1" :class="expanded ? 'stroke-handorder' : 'stroke-black'" />
                </q-avatar>
              </q-item-section>
              <q-item-section :class="expanded ? 'text-handorder' : ''">
                사용자 관리
              </q-item-section>
            </template>
            <q-item clickable to="/company" active-class="menu-active">
              <q-item-section>거래처등록/현황</q-item-section>
            </q-item>
            <q-item clickable to="/member" active-class="menu-active">
              <q-item-section>사용자등록/현황</q-item-section>
            </q-item>
          </q-expansion-item>

          <q-item v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="svguse:/icons.svg#menu-1" class="stroke-black" />
            </q-item-section>

            <q-item-section> 권한관리 </q-item-section>
          </q-item>

          &lt;!&ndash;        <q-item v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="svguse:/icons.svg#document-1" class="stroke-black" />
            </q-item-section>

            <q-item-section> 메뉴관리 </q-item-section>
          </q-item>&ndash;&gt;
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header="{ expanded }">
              <q-item-section avatar>
                <q-avatar>
                  <q-icon name="svguse:/icons.svg#shop-2" :class="expanded ? 'fill-handorder' : 'fill-black'" />
                </q-avatar>
              </q-item-section>
              <q-item-section :class="expanded ? 'text-handorder' : ''">
                매장관리
              </q-item-section>
            </template>
            <q-item clickable to="/shop" active-class="menu-active">
              <q-item-section>매장 등록/현황</q-item-section>
            </q-item>
            &lt;!&ndash;          <q-item clickable to="/category" exact exact-active-class="menu-active">
              <q-item-section>카테고리 관리</q-item-section>
            </q-item>
            <q-item clickable to="/menu" exact exact-active-class="menu-active">
              <q-item-section>메뉴판 관리</q-item-section>
            </q-item>&ndash;&gt;
          </q-expansion-item>

          <q-expansion-item :content-inset-level="1">
            <template v-slot:header="{ expanded }">
              <q-item-section avatar>
                <q-avatar>
                  <q-icon name="svguse:/icons.svg#device-1" :class="expanded ? 'stroke-handorder' : 'stroke-black'" />
                </q-avatar>
              </q-item-section>
              <q-item-section :class="expanded ? 'text-handorder' : ''">
                디바이스 관리
              </q-item-section>
            </template>
            <q-item clickable to="/device/qr" active-class="menu-active">
              <q-item-section>QR관리</q-item-section>
            </q-item>
          </q-expansion-item>
          <q-item v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="svguse:/icons.svg#pizza-1" class="stroke-black" />
            </q-item-section>

            <q-item-section> 주문내역 통계 </q-item-section>
          </q-item>
          <q-expansion-item :content-inset-level="1">
            <template v-slot:header="{expanded}">
              <q-item-section avatar>
                <q-icon name="svguse:/icons.svg#bell-1" :class="expanded ? 'stroke-handorder':'stroke-black'" />
              </q-item-section>
              <q-item-section :class="expanded ? 'text-handorder' : ''">
                게시판
              </q-item-section>
            </template>
            <q-item clickable to="/faq" active-class="menu-active">
              <q-item-section>FAQ</q-item-section>
            </q-item>
            <q-item clickable to="/notice" active-class="menu-active">
              <q-item-section>공지사항</q-item-section>
            </q-item>
          </q-expansion-item>-->
          <!--          <q-item clickable v-ripple>
              <q-item-section avatar>
                <q-icon name="svguse:/icons.svg#advertising-1"/>
              </q-item-section>

              <q-item-section>
                배너관리
              </q-item-section>
            </q-item>-->
        </q-list>
      </q-drawer>

      <q-page-container class="main-container">
        <q-page class="main-container-box q-pl-lg" :class="{ 'shop-user': userInfo.userType === 'shop', 'admin-user': userInfo.userType !== 'shop' }">
          <q-page :style-fn="myTweak" class="bg-white">
            <slot />
          </q-page>
        </q-page>
        <q-inner-loading :showing="loading" />
      </q-page-container>
      <q-footer class="bg-white text-black" style="height: 70px">
        <q-toolbar style="height: 100%">
          <q-toolbar-title>
            <div class="footer-title">
              Copyright ⓒ 2024 아치서울 All rights reserved.
              <span style="cursor: pointer" @click="openTermsOfService('1')">  {{ $t('COMMON.101') }}  </span>
              <span style="cursor: pointer" @click="openTermsOfService('2')"><strong><u>{{ $t('COMMON.102') }}</u></strong></span>
            </div>
          </q-toolbar-title>
        </q-toolbar>
      </q-footer>
    </q-layout>
  </div>
</template>
<style scoped lang="scss">
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
    width: 110px;
    height: auto;
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

.main-container {
    background: #f5f3f2;
    .main-container-box {
      padding: v-bind(mainPaddingTbPx) v-bind(mainPaddingLrPx);
    }
}
.q-drawer--standard {
    .menu-list {
        width: 256px;
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
    padding-top: 22px;
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
      .active-icon{
        stroke: #ffffff;
      }
    }
    .q-expansion-item--expanded{
      :deep(.active-header){
        background: var(--handorder-color);
        color: #ffffff;
        border-radius: 4px;
        .active-icon{
          stroke: #ffffff;
        }
      }
    }
}

.footer-title {
    color: #7a7a7a;
    /*text-align: center;*/
    font-family: Noto Sans KR;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    padding-left: 40px;
}
</style>
<style lang="scss">
:root{
  --handorder-color: #ff8b4a;
}

.main-content{
  height: v-bind(mainContentHeight) !important;
  padding: 30px;
}
</style>
