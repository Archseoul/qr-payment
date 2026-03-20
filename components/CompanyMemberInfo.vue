<script setup lang="ts">
import type { Ref } from 'vue'
import type { QTableProps } from 'quasar'
import { useQuasar } from 'quasar'
import type { AdminMemberVo, CompanyVo } from '~/types'
import { useAuthStore } from '~/store/auth'
import CompanyMemberAddModal from '~/components/CompanyMemberAddModal.vue'
import CompanyMemberUpdateModal from '~/components/CompanyMemberUpdateModal.vue'
const props = defineProps<{
  company: CompanyVo
}>()

const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const memberListData = await useCustomFetch<AdminMemberVo[]>(`/admin/handOrder/company/member/${props.company.companyCode}`, {
  params: {
    companyMemberId: authStore.userInfo.id
  }
})

// computed로 변경하여 반응형으로 만들고 undefined 방지
const memberList = computed(() => {
  return memberListData.data.value ?? []
})

const $q = useQuasar()
const selected = ref<AdminMemberVo[]>([])
const columns:QTableProps['columns'] = [
  {
    name: 'name',
    label: $t('COMMON.017'),
    field: 'userName',
    align: 'left'
  },
  {
    name: 'position',
    label: $t('COMPANY.043'),
    field: 'position',
    align: 'left'
  },
  {
    name: 'phoneNumber',
    label: $t('COMPANY.044'),
    field: 'phoneNumber',
    align: 'center'
  },
  {
    name: 'email',
    label: $t('COMMON.019'),
    field: 'email',
    align: 'center'
  },
  {
    name: 'id',
    label: $t('COMMON.018'),
    field: 'id',
    align: 'left'
  }
]

const notifyPleaseSelect = () => {
  $q.notify({
    message: $t('COMPANY.045'),
    color: 'negative',
    icon: 'close'
  })
}

const addMember = () => {
  $q.dialog({
    component: CompanyMemberAddModal,
    componentProps: {
      userInfo: authStore.userInfo
    }
  }).onOk(async () => {
    await memberListData.refresh()
  })
}

const updateMember = () => {
  $q.dialog({
    component: CompanyMemberUpdateModal,
    componentProps: {
      userInfo: authStore.userInfo,
      companyInfo: selected.value[0]
    }
  }).onOk(async () => {
    await memberListData.refresh()
  })
}

// 담당자 수정은 최고 관리자거나 해당 협력사인 경우만 가능하다.
const isMyCompanyValidation = () => {
  if (authStore.userInfo.userType === 'worker') { return false }
  /* if (authStore.userInfo.userType === 'admin') { return true } */
  return authStore.userInfo.companyCode === props.company.companyCode
}

const deleteMember = () => {
  if (selected.value.length !== 1) {
    notifyPleaseSelect()
    return
  }
  $q.dialog({
    title: $t('COMPANY.046'),
    message: $t('COMPANY.047'),
    ok: $t('COMMON.007'),
    cancel: $t('COMMON.005')
  }).onOk(async () => {
    await customFetch(`/admin/handOrder/company/member/${selected.value[0].memberUuid}`, {
      method: 'DELETE',
      onResponse: (context) => {
        if (context.response.status === 200) {
          $q.notify({
            message: $t('COMPANY.048'),
            color: 'positive',
            icon: 'check'
          })
          memberListData.refresh()
        } else {
          $q.notify({
            message: `${$t('COMPANY.049')} ${context.response._data.message}`,
            color: 'negative',
            icon: 'close'
          })
        }
      }
    })
  })
}

</script>

<template>
  <div class="member-info-top">
    <q-card flat>
      <q-table
        v-model:selected="selected"
        :rows="authStore.userInfo.userType==='worker' ? [authStore.userInfo] : memberList"
        :columns="columns"
        row-key="memberUuid"
        :selection="authStore.userInfo.userType !=='worker' ? 'single' : 'none'"
        flat
      >
        <template v-slot:top-right>
          <template v-if="isMyCompanyValidation()">
            <q-btn
              color="primary"
              :label="$t('COMMON.008')"
              class="q-mr-sm"
              :disable="selected.length !== 1"
              @click="updateMember"
            />
            <q-btn
              color="primary"
              :label="$t('COMMON.020')"
              class="q-mr-sm"
              :disable="selected.length !== 1"
              @click="deleteMember"
            />
            <q-btn
              color="primary"
              :label="$t('COMPANY.045')"
              @click="addMember"
            />
          </template>
        </template>
      </q-table>
    </q-card>
  </div>
</template>

<style scoped lang="scss">

</style>
