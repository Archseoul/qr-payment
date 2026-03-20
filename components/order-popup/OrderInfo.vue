<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { formatPhoneNumber } from '~/utils/formatPhoneNumber'
import type { HoPrintLogVo } from '~/types'
import { useOrderListStore } from '~/store/orderListStore'

const $q = useQuasar()

const { order } = storeToRefs(useOrderListStore())

const copyAddress = (printLog :HoPrintLogVo | null) => {
  navigator.clipboard.writeText(printLog?.deliveryAddress + ' ' + printLog?.deliveryDetailAddress)

  $q.notify({
    message: '주소가 복사되었습니다.',
    color: 'positive',
    position: 'top',
    icon: 'content_copy'
  })
}

</script>

<template>
  <div class="info-container">
    <div class="request-box q-mb-sm">
      <div class="title">
        요청사항
      </div>
      <div v-if="order && order.orderStatus" class="q-pa-sm">
        <div class="content-wrap" :class="order.orderStatus.status==='CANCEL'?'cancel-order':''">
          <span class="sub-title">가게 요청사항</span>
          <div class="content">
            {{ order.printLog[0].requestText || '없음' }}
          </div>
        </div>

        <div v-if="order.delivery" class="content-wrap" :class="order.orderStatus.status==='CANCEL'?'cancel-order':''">
          <span class="sub-title">라이더 요청사항</span>
          <div class="content">
            {{ order.printLog[0].riderRequestText || '없음' }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="order.delivery || order.takeOut" class="info-box q-mb-sm">
      <div class="title">
        주문정보
      </div>
      <div class="q-pa-sm" :class="order.orderStatus.status==='CANCEL'?'cancel-order':''">
        <div v-if="order.delivery" class="content-wrap">
          <span class="sub-title"> 주소</span>
          <div class="content">
            {{ order.printLog[0].deliveryAddress }}
          </div>
          <button name="copyAddress" class="copy-btn" @click="copyAddress(order.printLog[0])">
            <q-icon name="content_copy" style="font-size: 15px" />
          </button>
        </div>
        <div v-if="order.delivery" class="content-wrap">
          <span class="sub-title">상세주소</span>
          <div class="content">
            {{ order.printLog[0].deliveryDetailAddress }}
          </div>
        </div>
        <div v-if="order.delivery || order.takeOut" class="content-wrap">
          <span class="sub-title">고객 전화번호</span>
          <div class="content">
            {{ formatPhoneNumber(order.printLog[0].userPhoneNumber) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .info-container{
    .request-box,
    .info-box{
      border: 1px solid #e1e1e1;

      .title{
        font-weight: 700;
        font-size:1.2em;
        padding: 5px;
        border-bottom: 1px solid #e1e1e1;
        letter-spacing: -1.5px;
      }

      .content-wrap{
        display: flex;
        max-height: 40px;

        +.content-wrap{
          margin-top: 10px;
        }

        .sub-title{
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          padding: 2px;
          margin-right:5px;
          border-radius: 5px;
          font-size: 0.65em;
          color: #818181;
          width: 70px;
          letter-spacing: -0.7px;
        }

        .content{
          font-size: 0.8em;
          flex: 1;
          padding: 2px;
          max-height: 40px;
          overflow-y: auto;
        }

        .copy-btn{
          border: none;
          background-color: transparent;
          cursor: pointer;
        }
      }
    }

    .cancel-order{
      >*{
        text-decoration:line-through;
      }
    }
  }

  div::-webkit-scrollbar {
    width: 5px;
  }

  div::-webkit-scrollbar-thumb {
    background-color: #5d5d5d;
    border-radius: 2px;
  }

  div::-webkit-scrollbar-track {
    background-color: #cccccc;
  }
</style>
