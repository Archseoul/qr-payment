<script setup lang="ts">
import { EventBus, useQuasar } from 'quasar'
import type { Ref } from 'vue'
import { isEmpty } from 'lodash-es'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { HoTableOrderVo, ShopInfoVo } from '~/types'
import { updateMenuNames } from '~/composables/updateMenuNames'
import { priceToCurrency } from '~/composables/priceToCurrency'

const route = useRoute()
const bus = new EventBus()
const $q = useQuasar()

const detailTablePopup = ref(false)
const tableObj = ref<HoTableOrderVo | null>(null)

const shopInfoData = await useCustomFetch<ShopInfoVo>('/admin/handOrder/shop/' + route.params.shopCode, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const shopInfo:Ref<ShopInfoVo | null> = shopInfoData.data

const tableListData = await useCustomFetch<HoTableOrderVo[]>(`/admin/handOrder/shop/table/${route.params.shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const tableList = tableListData.data

updateMenuNames(tableList.value as HoTableOrderVo[], shopInfo?.value?.shopLanguage as string)

watch(tableList, (newValue) => {
  updateMenuNames(newValue as HoTableOrderVo[], shopInfo?.value?.shopLanguage as string)
})

// 데이터 갱신 함수
const refreshTableData = async () => {
  try {
    await tableListData.refresh()
    if (tableList.value) {
      updateMenuNames(tableList.value as HoTableOrderVo[], shopInfo?.value?.shopLanguage as string)
    }
  } catch (error) {
    // 에러 처리는 조용히 처리
  }
}

// 이벤트 리스너 등록
onMounted(() => {
  if (process.client) {
    window.addEventListener('order-data-refresh', refreshTableData)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('order-data-refresh', refreshTableData)
  }
})

const getTotalPrice = (orderList:any) => {
  let totalPrice = 0
  orderList.forEach((order:any) => {
    totalPrice += order.finalPrice
  })
  return (shopInfo.value) && priceToCurrency(totalPrice, shopInfo.value.shopLanguage as string)
}

const tableClean = (tableInfo:HoTableOrderVo) => {
  $q.dialog({
    title: $t('ORDER.005'),
    message: $t('ORDER.006'),
    cancel: true,
    persistent: true,
    color: 'red'
  }).onOk(async () => {
    try {
      await customFetch(`/admin/handOrder/shop/table/${tableInfo.tableSeq}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      tableInfo.printLogList = []
      await refreshTableData()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: '테이블 비우기에 실패했습니다.',
        position: 'top'
      })
    }
  })
}

const closeDetailTablePopup = () => {
  detailTablePopup.value = false
}

const postFrontPayment = async (table:HoTableOrderVo) => {
  if (!shopInfo.value.frontPaymentUse) { return }
  try {
    const res = await customFetch(`/admin/handOrder/shop/${route.params.shopCode}/front-payment`, {
      method: 'POST',
      body: JSON.stringify({
        deviceCode: shopInfo.value.frontPaymentDeviceCode,
        tableNum: table.tableNum
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    $q.notify({
      type: 'positive',
      message: '프론트 QR 결제 요청이 전송되었습니다.',
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '프론트 QR 결제 디바이스 코드를 확인해주세요.',
      position: 'top'
    })
  }
}

const detailTable = (table:HoTableOrderVo) => {
  if (table.printLogList.length === 0) {
    return
  }
  postFrontPayment(table)
  tableObj.value = table
  detailTablePopup.value = true
}

const tableElement = ref<HTMLElement | undefined>(undefined)

type ElementHeightType = (element:HTMLElement) => number

const props = defineProps({
  elementHeight: {
    type: Function as PropType<ElementHeightType>,
    required: true
  }
})

const emits = defineEmits(['update:childHeight'])
bus.on('refresh-data', () => {
  tableListData.refresh()
})

onMounted(() => {
  nextTick(() => {
    if (tableElement.value) {
      const element = props.elementHeight(tableElement.value)
      emits('update:childHeight', element)
    }
  })
})

</script>

<template>
  <template v-if="shopInfo?.tableManagement">
    <div ref="tableElement" class="table_container">
      <div class="section-body row q-gutter-sm">
        <div v-for="table in (tableList as HoTableOrderVo[])" :key="table.tableSeq" class="card-item">
          <q-card class="table-card">
            <q-card-section v-ripple.center class="table-card-content" @click="detailTable(table)">
              <div class="table-header">
                <div class="table-name">
                  {{ table.tableName }}
                </div>
                <q-badge
                  v-if="!isEmpty(table.printLogList)"
                  class="in-use-badge"
                  text-color="white"
                  :label="$t('ORDER.010')"
                />
              </div>

              <div class="menu-list-area">
                <q-scroll-area style="height: 130px;" :thumb-style="{background:'#e0e0e0'}" visible>
                  <div v-for="print in table.printLogList" :key="print.printSeq" class="menu-item">
                    <div class="menu-row">
                      <div class="menu-info">
                        <div class="menu-name">
                          {{ print.menuName }}
                        </div>
                        <template v-if="print.printLogMenuOptionList.find(option => option.optionUuid != null)">
                          <div v-for="option in print.printLogMenuOptionList.filter((element) => element.optionUuid != null)" :key="option.optionUuid" class="option-text">
                            L {{ option.optionGroupName +'('+option.optionName+')' }}
                          </div>
                        </template>
                      </div>
                      <div class="menu-quantity">
                        {{ print.quantity }}
                      </div>
                    </div>
                  </div>
                </q-scroll-area>
              </div>

              <div class="order-footer">
                <div class="total-amount">
                  <span class="total-text">{{ $t('COMMON.079') }}</span> {{ getTotalPrice(table.printLogList).replace('원', '') }}
                </div>
                <q-btn
                  :label="$t('ORDER.005')"
                  class="clear-btn"
                  flat
                  :disable="isEmpty(table.printLogList)"
                  @click.stop="tableClean(table)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-dialog v-model="detailTablePopup">
        <q-card class="detail_order_popup">
          <q-card-section style="padding-bottom:10px">
            <div class="row justify-between">
              <div class="text-h6 text-bold order_number">
                {{ tableObj?.tableName }}
              </div>
              <div class="text-h6 cursor-pointer close-btn">
                <q-icon name="close" @click="closeDetailTablePopup" />
              </div>
            </div>
            <q-separator class="q-mt-sm" />
          </q-card-section>
          <q-card-section>
            <div class="menu-text col-1">
              <!--            <div v-for="menu in tableObj?.printLogList" :key="menu.printSeq">
              <div class="content">
                <div class="text_wrap">
                  <div class="text-bold">
                    {{ `${menu.menuName} / ${ menu.quantity}개 ` }}
                  </div>
                  <template v-if="menu.printLogMenuOptionList.find(option => option.optionUuid != null)">
                    <div class="q-mt-sm">
                      옵션 :
                    </div>
                    <div v-for="option in menu.printLogMenuOptionList.filter(element => element.optionUuid != null)" :key="option.optionUuid" class="option-text">
                      {{ option.optionGroupName +'('+option.optionName+')' }}
                    </div>
                  </template>
                  <template v-else>
                    &lt;!&ndash;                <div>&ndash;&gt;
                    &lt;!&ndash;                  옵션 : 없음&ndash;&gt;
                    &lt;!&ndash;                </div>&ndash;&gt;
                  </template>
                </div>
              </div>
              <div class="arrow_wrap">
                <q-icon name="keyboard_arrow_up" />
                <q-icon name="keyboard_arrow_down" />
              </div>-->
              <div class="menu-text col-1">
                <div>
                  <div class="content">
                    <div class="menu-content column">
                      <div v-for="menu in tableObj?.printLogList" :key="menu.printSeq" class="text_wrap q-mb-lg">
                        <div class="text-bold">
                          {{ `${menu.menuName} / ${ $t('COMMON.058', {number: menu.quantity}) } ` }}
                        </div>
                        <template v-if="menu.printLogMenuOptionList.find(option => option.optionUuid != null)">
                          <div class="q-mt-sm">
                            {{ $t('SHOP.105') }} :
                          </div>
                          <div v-for="option in menu.printLogMenuOptionList.filter(element => element.optionUuid != null)" :key="option.optionUuid" class="option-text">
                            {{ option.optionGroupName +'('+option.optionName+')' }}
                          </div>
                        </template>
                        <template v-else />
                      </div>
                    </div>
                    <div class="arrow_wrap">
                    <!--                    <q-icon name="keyboard_arrow_up" />
                    <q-icon name="keyboard_arrow_down" />-->
                    </div>
                  </div>

                  <q-separator class="q-my-sm" />

                  <div class="popup_footer">
                    <div class="popup_price">
                      {{ $t('COMMON.059') }} : {{ getTotalPrice(tableObj?.printLogList) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </template>
  <template v-else>
    <div class="background-grey row justify-center items-center full-height">
      <span class="text-h4 text-bold"> {{ $t('ORDER.024') }}</span>
    </div>
  </template>
</template>

<style scoped lang="scss">
.table_container{
  .section-body {
    gap: 12px;
    justify-content: center;
    margin-bottom: 50px;
  }
  .card-item{
    height: 300px;
    width: 300px;

    .table-card{
      width: 100%;
      height: 100%;
      margin-top:32px;
      border-radius: 12px;
      overflow: hidden;
      font-family: "Pretendard";
      box-shadow:
        0px 1px 4px rgba(12, 12, 13, 0.1),
        0px 1px 4px rgba(12, 12, 13, 0.05);

      .table-card-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 16px;

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .table-name {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.6px;
            color: #000;
          }

          .in-use-badge {
            font-size: 12px;
            padding: 7px 12px;
            border-radius: 999px;
            font-weight: 500;
            letter-spacing: -0.3px;
            background-color: #FF8B4A;
          }
        }

        .menu-list-area {
          flex: 1;
          min-height: 0;

          .menu-item {
            margin-bottom: 7px;

            .menu-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 0 4px;

              .menu-info {
                flex: 1;

                .menu-name {
                  color: #000;
                  font-weight: 500;
                  font-size: 1rem;
                  margin-bottom: 4px;
                }

                .option-text {
                  color: #9E9E9E;
                  font-size: 0.9rem;
                  padding-left: 8px;
                  margin-top: 2px;
                }
              }

              .menu-quantity {
                color: #000;
                font-weight: 500;
                white-space: nowrap;
                margin-left: 12px;
                font-size: 1rem;
              }
            }
          }
        }

        .order-footer {
          margin-top: auto;
          margin-left: auto;
          padding-top: 12px;
          text-align: right;

          .total-amount {
            font-size: 18px;
            font-weight: 500;
            color: #111111;
            letter-spacing: -0.45px;
            .total-text{
              margin-right: 2px;
              color: #808080;
            }
          }

          .clear-btn {
            margin-top: 12px;
            color: #808080;
            border: 1px solid #E5E5E5;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: 500;
            text-transform: none;
            margin-left: auto;
            background-color: #F5F5F4;

            &:hover:not(:disabled) {
              background-color: #BDBDBD;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }
    }
  }
}
.detail_order_popup{
  min-width:400px;
  min-height: 500px;

  .order_number{
    color: var(--handorder-color);
  }

  .close-btn{
    &:hover{
      color: #9E9E9E;
    }
  }

  .content{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: 300px;
    overflow-y:auto;

    .text_wrap{

    }

    .arrow_wrap{
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      font-size: 30px;

      >*{
        cursor: pointer;

        &:hover{
          color: white;
          background-color: rgba(0,0,0,0.5);
          border-radius: 50%;
        }
      }
    }
  }
  .popup_footer{
    display: flex;
    flex-direction: column;
    justify-content: center;

    .popup_price{
      font-size: 1.05rem;
      font-weight: 700;
    }

    .btn_wrap{
      text-align: center;
      margin-top: 10px;

      button{
        margin: 10px auto;
        width: 70%;
        height: 40px;
        background-color: #BDBDBD;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
    }
  }
}
.background-grey{
  background-color: #f5f5f5;
  width: 100%;
  height: 100%;
  margin:0;
}

</style>
