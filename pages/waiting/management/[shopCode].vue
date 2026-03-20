<script setup lang="ts">
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { ShopInfoVo, ShopWaitingVo } from '~/types'
import { shopWaitingStatusCode } from '~/utils/code'

const route = useRoute()
const shopCode = route.params.shopCode as string
const currentTab = ref('')
const $q = useQuasar()

const { data: shopInfo } = await useCustomFetch<ShopInfoVo>(`/admin/handOrder/shop/${shopCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}) as { data: Ref<ShopInfoVo> }

const { data: shopWaitingInfo } = await useCustomFetch<ShopWaitingVo>(`/admin/handOrder/shop/${shopCode}/waiting`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}) as { data: Ref<ShopWaitingVo> }

currentTab.value = shopWaitingInfo?.value?.waitingStatus as string

const changeStatus = async (isActive:boolean) => {
  const waitStatus = isActive ? currentTab.value : 'AVAILABLE'
  await customFetch(`/admin/handOrder/shop/${shopCode}/waiting/${waitStatus}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    onResponse: (context) => {
      if (context.response.status === 200) {
        $q.notify({
          message: $t('WAITING_SETTING.001'),
          color: 'positive',
          icon: 'check'
        })
      }
    }
  })
  await refreshNuxtData()
  currentTab.value = waitStatus
}

</script>

<template>
  <div>
    <div class="waiting-header row justify-between">
      <div class="title-box">
        {{ shopInfo.shopName }}
      </div>
      <div class="waiting-state-box">
        <span>{{ $t('WAITING_SETTING.011') }}</span>
        <span>{{ $t('WAITING_SETTING.012', { count: 0 }) }} / {{ $t('COMMON.104', { count: 0 }) }}</span>
      </div>
    </div>
    <div class="waiting-content">
      <template v-if="shopWaitingInfo == null || !shopWaitingInfo?.useWaiting">
        <q-banner class="bg-grey-3 text-black">
          <q-icon name="info" class="q-mr-sm" />
          {{ $t('WAITING_SETTING.013') }}
        </q-banner>
      </template>
      <template v-else>
        <div class="waiting-status-tab">
          <button
            v-for="(tab) in shopWaitingStatusCode"
            :key="tab.value"
            :class="['tab-button', {'active-tab' : currentTab === tab.value }]"
            @click="currentTab = tab.value"
          >
            {{ $t(tab.label) }}
          </button>
        </div>
        <div>
          <template v-if="currentTab === 'AVAILABLE'">
            <div class="q-pa-md">
              <template v-if="shopWaitingInfo?.waitingStatus !== 'AVAILABLE'">
                <div class="row justify-around">
                  <q-btn class="status-change-button" :class="{ 'active': currentTab === shopWaitingInfo?.waitingStatus }" @click="changeStatus(true)">
                    ON
                  </q-btn>
                  <q-btn class="status-change-button" :class="{ 'active': currentTab !== shopWaitingInfo?.waitingStatus }" @click="changeStatus(false)">
                    OFF
                  </q-btn>
                </div>
              </template>
              <template v-else>
                <div class="waiting-list row">
                  <div class="waiting-number">
                    {{ $t('WAITING_SETTING.014') }}
                  </div>
                  <div class="waiting-count">
                    {{ $t('COMMON.104', { count: 'N' }) }}
                  </div>
                  <div class="waiting-phone-number">
                    010-1234-1234
                  </div>
                  <div class="waiting-status-button">
                    <div class="waiting-call">
                      {{ $t('WAITING_SETTING.015') }}
                    </div>
                    <div class="waiting-entered">
                      {{ $t('WAITING_SETTING.016') }}
                    </div>
                    <div class="waiting-no-show">
                      {{ $t('WAITING_SETTING.017') }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>
          <template v-else>
            <div class="q-pa-md">
              <div>
                <div class="row justify-around">
                  <q-btn class="status-change-button" :class="{ 'active': currentTab === shopWaitingInfo?.waitingStatus }" @click="changeStatus(true)">
                    ON
                  </q-btn>
                  <q-btn class="status-change-button" :class="{ 'active': currentTab !== shopWaitingInfo?.waitingStatus }" @click="changeStatus(false)">
                    OFF
                  </q-btn>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.waiting-header{
  padding: 20px;
  .title-box{
    font-size: 24px;
    font-weight: bold;
  }
  .waiting-state-box{
    background-color: #f0f0f0;
    padding: 10px 20px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    color: #333;
    width: 150px;
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}
.waiting-content{
  width: 100%;
  .waiting-status-tab{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 20px;
    .tab-button{
      padding: 10px 30px;
      border: none;
      cursor: pointer;
      border-top-left-radius: 7px;
      border-top-right-radius: 7px;
      font-size: 1.3rem;
      font-weight: bold;
      background-color: #BDBDBD;

      &.active-tab{
        background-color: #FF6D17;
      }
    }
    .waiting-state-box{
      cursor: pointer;
      &:hover{
        background-color: #e0e0e0;
      }
    }
  }
  .status-change-button{
    width: 120px;
    height: 40px;
    border-radius: 20px;
    background-color: #BDBDBD;
    color: white;
    font-weight: bold;
    font-size: 16px;
    &.active{
      background-color: #FF6D17;
    }
  }
}
</style>
