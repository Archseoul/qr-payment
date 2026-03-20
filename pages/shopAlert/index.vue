<script setup lang="ts">
import type { AlertChargeVo } from '~/types'

const tab = ref('apply')
const dayjs = useDayjs()
const selected:Ref<AlertChargeVo[]> = ref([])
const $q = useQuasar()

const alertChargeApplyListData = await useCustomFetch<AlertChargeVo[]>('/admin/handOrder/shop/alert/apply', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const alertApplyList:Ref<AlertChargeVo[] | null> = alertChargeApplyListData.data

const alertChargeApprovalListData = await useCustomFetch<AlertChargeVo[]>('/admin/handOrder/shop/alert/approval', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})

const alertApprovalList:Ref<AlertChargeVo[] | null> = alertChargeApprovalListData.data

const columns = [
  {
    name: 'shopCode',
    required: true,
    label: '매장코드',
    align: 'left',
    field: 'shopCode',
    sortable: true
  },
  {
    name: 'shopName',
    required: true,
    label: '매장명',
    align: 'left',
    field: 'shopName',
    sortable: true
  },
  {
    name: 'chargeAmount',
    required: true,
    label: '충전금액',
    align: 'left',
    field: 'chargeAmount',
    sortable: true,
    format: (val:number) => val.toLocaleString()
  },
  {
    name: 'chargeCount',
    required: true,
    label: '충전건수',
    align: 'left',
    field: 'chargeCount',
    sortable: true,
    format: (val:number) => val.toLocaleString()
  },
  {
    name: 'applyDate',
    required: true,
    label: '신청일',
    align: 'left',
    field: 'applyDate',
    sortable: true,
    format: (val:string) => dayjs(val).format('YYYY-MM-DD')
  },
  {
    name: 'chargeStatus',
    required: true,
    label: '충전상태',
    align: 'left',
    field: 'chargeStatus',
    sortable: true,
    format: (val:string) => val === 'approval' ? '승인' : '요청'
  },
  {
    name: 'approvalDate',
    required: true,
    label: '승인일',
    align: 'left',
    field: 'approvalDate',
    sortable: true,
    format: (val:string) => val ? dayjs(val).format('YYYY-MM-DD') : '-'
  }
]

const changeAlertStatus = () => {
  $q.dialog({
    title: '알림톡 충전 승인',
    message: '선택한 알림톡 충전을 승인하시겠습니까?',
    ok: {
      label: '승인',
      color: 'primary',
      push: true
    },
    cancel: {
      label: '취소',
      color: 'negative',
      push: true
    }
  }).onOk(async () => {
    const alertChargeObjList = selected.value.map((item) => {
      return {
        alertChargeKey: item.alertChargeKey,
        chargeStatus: 'approval'
      }
    })
    await useCustomFetch('/admin/handOrder/shop/alert/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alertChargeObjList)
    })

    await alertChargeApplyListData.refresh()
    await alertChargeApprovalListData.refresh()
  })
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div class="content-header">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.028') }}</span>
      <q-separator class="q-my-lg" />
    </div>
    <div class="content-body col column">
      <q-tabs v-model="tab">
        <q-tab name="apply" label="요청중" />
        <q-tab name="approval" label="충전완료" />
      </q-tabs>
      <q-separator class="q-mt-lg" />
      <q-tab-panels v-model="tab" class="col">
        <q-tab-panel name="apply">
          <q-table
            v-model:selected="selected"
            flat
            class="apply-table"
            bordered
            selection="multiple"
            :rows="alertApplyList"
            :columns="columns"
            row-key="alertChargeKey"
            virtual-scroll
            :rows-per-page-options="[0]"
            hide-bottom
          />
          <q-btn label="충전 확인" color="primary" class="q-mt-md float-right" @click="changeAlertStatus" />
        </q-tab-panel>
        <q-tab-panel name="approval">
          <q-table
            flat
            bordered
            class="full-height"
            :rows="alertApprovalList"
            :columns="columns"
            row-key="alertApplyKey"
            virtual-scroll
            :rows-per-page-options="[0]"
            hide-bottom
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!--
           <q-tabs v-model="tab">
              <q-tab name="alarm-history" label="알림톡 충전 내역" />
            </q-tabs>
            <q-separator />
            <q-tab-panels v-model="tab">
              <q-tab-panel name="alarm-history">
                <div class="q-mt-md">
                  <q-table
                    flat
                    bordered
                    style="max-height: 500px"
                    :rows="alertChargingList"
                    :columns="columns"
                    row-key="alertChargeKey"
                    virtual-scroll
                    :rows-per-page-options="[0]"
                    hide-bottom
                  />
                </div>
              </q-tab-panel>
            </q-tab-panels>

  -->
  </div>
</template>

<style scoped lang="scss">
.apply-table{
  height: calc(100% - 50px);
}
</style>
