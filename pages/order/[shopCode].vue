<script setup lang="ts">
import SockJS from 'sockjs-client'
import type { IStompSocket } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { isEmpty } from 'lodash-es'
import type {HoSalesVo, HoTableOrderVo} from '~/types'
import { dayList } from '~/utils/code'
import { updateMenuNames } from '~/composables/updateMenuNames'
import { priceToCurrency } from '~/composables/priceToCurrency'
import {useOrderListStore} from "~/store/orderListStore";
import {useShopInfoStore} from "~/store/shopInfoStore";
import {useTableListStore} from "~/store/tableListStore";
import {getTotalPrice} from "~/utils/getTotalPrice";
import OrderButton from "~/components/order-popup/OrderButton.vue";
import OrderPopup from "~/components/OrderPopup.vue";

const dayjs = useDayjs()
const route = useRoute()
const { checkPermissions } = useCheckPermissions()
const $q = useQuasar()
$q.loadingBar.setDefaults({
  hijackFilter: (url: string) => !url.includes('xhr')
})
const config = useRuntimeConfig()
const splitterModel = ref(350)

const shopInfo = ref({
  tableOrderYn: true
})

const orderPopup = ref(false)

const openDetailPopup = (value:boolean) => {
  orderPopup.value = value
}

const closeDetailPopup = () => {
  orderPopup.value = false
}


const { fetchOrderList } = useOrderListStore()
const { fetchShopInfo } = useShopInfoStore()
const { fetchTableList } = useTableListStore()

fetchOrderList(route.params.shopCode as string)
fetchShopInfo(route.params.shopCode as string)
fetchTableList(route.params.shopCode as string)

const { orderList } = storeToRefs(useOrderListStore())
const { shopInfo : shop } = storeToRefs(useShopInfoStore())
const { tableList } = storeToRefs(useTableListStore())

updateMenuNames(orderList.value as HoSalesVo[], shop.value?.shopLanguage as string)
updateMenuNames(tableList.value as HoTableOrderVo[], shop.value?.shopLanguage as string)

const nowDate = dayjs().format('YYYY-MM-DD')
const nowDay = dayjs().day()

// const socket = new SockJS(config.public.baseUrl + '/chat')
const userAuth = useCookie('token')
const isSlowMode = ref(false)
const subscribeCallback = (message: any) => {
  orderList.value?.unshift(JSON.parse(message.body))
  $q.notify({
    message: $t('ORDER.001'),
    color: 'positive',
    position: 'top',
    group: false,
    icon: 'mdi-check'
  })
}
const makeClient = () => {
  const client = new Client()
  client.configure({
    brokerURL: config.public.webSocketUrl,
    connectHeaders: {
      Authorization: userAuth.value ?? ''
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 1000,
    heartbeatOutgoing: 1000,
    connectionTimeout: 5000,
    debug: msg => console.log(msg)
  })
  // if (typeof WebSocket !== 'function') {
  //   // For SockJS you need to set a factory that creates a new SockJS instance
  //   // to be used for each (re)connect
  //   client.webSocketFactory = function () {
  //     // Note that the URL is different from the WebSocket URL
  //     return socket as IStompSocket
  //   }
  // }
  client.webSocketFactory = () => new SockJS(config.public.baseUrl + '/chat', {}, {
    transports: isSlowMode.value ? ['xhr-streaming', 'xhr-polling'] : undefined
  }) as IStompSocket
  client.onConnect = function () {
    client.subscribe(`/topic/newOrder/${route.params.shopCode}`, subscribeCallback)
  }
  return client
}
const client = ref(makeClient())
onMounted(() => {
  client.value.activate()
})
onBeforeUnmount(async () => {
  await client.value.deactivate()
})
const webSocketReconnect = () => {
  client.value.deactivate()
  client.value = makeClient()
  client.value.activate()
}

const tableClean = (tableInfo:HoTableOrderVo) => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    title: $t('ORDER.005'),
    message: $t('ORDER.006'),
    cancel: true,
    persistent: true,
    color: 'red'
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/shop/table/${tableInfo.tableSeq}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    tableInfo.printLogList = []
  })
}

const tableCleanAll = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  $q.dialog({
    title: $t('ORDER.007'),
    message: $t('ORDER.008'),
    cancel: true,
    persistent: true,
    color: 'red'
  }).onOk(() => {
    tableList.value?.forEach(async (table:HoTableOrderVo) => {
      await customFetch(`/admin/handOrder/shop/table/${table.tableSeq}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      table.printLogList = []
    })
  })
}

const getPendingCount = () => {
  const pendingList = orderList.value?.filter((salesVo:HoSalesVo) => {
    return salesVo.printLogGroup.orderStatus.status === 'PENDING'
  }) ?? []
  return pendingList.length
}

const localeMenuPrice = (menu : number) => {
  return priceToCurrency(menu, shop.value?.shopLanguage as string)
}
</script>

<template>
  <ClientOnly>
    <div class="main-content relative-position full-height column">
      <div class="content-header">
        <span class="text-h5 text-bold">{{ $t('SIDE_MENU.019') }}</span>
        <!--      <q-btn label="새로고침" color="primary" class="q-mt-md float-right" @click="newData" />-->
        <span class="float-right text-bold"> {{ $t('ORDER.019') }} : {{ nowDate }} {{ $t(dayList[nowDay]) }}</span>
        <q-separator class="q-mt-lg" />
      </div>
      <div class="content-body col">
        <q-splitter
          v-model="splitterModel"
          style="height: 100%"
          disable
          reverse
          unit="px"
        >
          <template v-slot:before>
            <div class="section-header q-my-md q-mx-md row justify-between items-center">
              <q-btn :label="$t('ORDER.007')" color="primary" @click="tableCleanAll" />
            </div>
            <div class="section-body row q-gutter-sm justify-around">
              <div v-for="table in (tableList as HoTableOrderVo[])" :key="table.tableSeq" class="card-item">
                <q-card style="width: 100%;height: 100%">
                  <!--  v-ripple.center                 -->
                  <q-card-section class="column full-height">
                    <div class="text-h6 text-bold row justify-between">
                      <div>
                        {{ table.tableName }}
                      </div>
                      <div class="text-h6">
                        <q-badge
                          v-if="!isEmpty(table.printLogList)"
                          color="primary"
                          text-color="white"
                          :label="$t('ORDER.010')"
                          rounded
                          align="middle"
                        />
                      </div>
                    </div>
                    <div class="q-mt-sm">
                      <q-scroll-area style="height: 130px;" :thumb-style="{background:'#ff8b4a'}" visible>
                        <div v-for="print in table.printLogList" :key="print.printSeq" class="column q-pl-sm q-pr-md">
                          <div class="row justify-between">
                            <span>{{ print.menuName }}</span>
                            <span>{{ print.quantity }}</span>
                          </div>
                          <template v-if="print.printLogMenuOptionList.find(option => option.optionUuid != null)">
                            <div v-for="option in print.printLogMenuOptionList.filter((element) => element.optionUuid != null)" :key="option.optionUuid" class="option-text">
                              ㄴ {{ option.optionGroupName +'('+option.optionName+')' }}
                            </div>
                          </template>
                        </div>
                      </q-scroll-area>
                    </div>

                    <div class="order-box col-1">
                      <div class="absolute-bottom column q-my-sm q-mr-sm">
                        <div class="self-end q-mb-lg">
                          {{ $t('COMMON.079') }} : {{ localeMenuPrice(getTotalPrice((table.printLogList))) }}
                        </div>
                        <div class="self-center q-gutter-sm">
                          <q-btn :label="$t('ORDER.005')" color="primary" class=" " :disable="isEmpty(table.printLogList)" @click.stop="tableClean(table)" />
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </template>

          <template v-slot:after>
            <div class="section-header q-my-md q-mx-md row justify-between items-center">
<!--              <q-toggle v-model="isSlowMode" :label="$t('ORDER.012')" @update:model-value="webSocketReconnect" />-->
              <span class="text-bold"> {{ $t('ORDER.013') }} <span class="bg-handorder wait-bax inline-block">{{ getPendingCount() }} </span></span>
            </div> <!--수락대기-->
            <div class="section-body row justify-center q-gutter-sm">
              <OrderCard
                  @update:order-detail-popup="openDetailPopup"
              />
            </div>
          </template>
        </q-splitter>
      </div>

      <OrderPopup
          :order-popup="orderPopup"
          :order-flag="''"
          @update:order-popup="closeDetailPopup"
      >
        <OrderButton />
      </OrderPopup>

      <EstimatedDeliveryTimeModal />
    </div>
  </ClientOnly>
</template>

<style scoped lang="scss">
.wait-bax{
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--handorder-color);
  color: white;
  text-align: center;
  line-height: 20px;
}
.card-item{
  height: 290px;
  width: 290px;
}

.content-body{
  overflow: auto;
}

.option-text{
  font-size: 12px;
  color: #757575;
  padding-left:10px;
}
.button-position{
  bottom: 0;
  left:50%;
  transform:  translate(-50%, -50%);
}
.table-menu-box{
  max-height: 115px;
  overflow: auto;
}
</style>
