<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/store/auth'
import type { CompanyVo } from '~/types'
import CompanyInfoTab from '~/components/CompanyInfoTab.vue'
import CompanyInfoTable from '~/components/CompanyInfoTable.vue'

const $q = useQuasar()
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = storeToRefs(authStore)
const isEditing = ref(false)

const infoTab = ref<InstanceType<typeof CompanyInfoTab> | null>(null)
const infoTable = ref<InstanceType<typeof CompanyInfoTable> | null>(null)

const companyData = await useCustomFetch<CompanyVo>(`/admin/handOrder/company/${userInfo.value.companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const company:Ref<CompanyVo | null> = companyData.data

const refreshData = () => {
  companyData.refresh()
}

const updateAll = async () => {
  const result = await Promise.all([
    infoTable.value?.validate()
  ])
  if (result.every(result => result)) {
    await infoTable.value?.updateCompanySequence()
    refreshData()
  } else {
    $q.notify({
      message: $t('COMMON.011'),
      color: 'negative',
      icon: 'close'
    })
  }
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div>
      <span class="text-h5 text-bold">{{ $t('COMPANY.019') }} </span>
      <q-separator class="q-mt-lg" />
    </div>
    <q-item>
      <q-item-section>
        <div style="font-size:1.2rem;" class="text-bold">
          {{ $t('COMPANY.020') }}
        </div>
      </q-item-section>
      <q-item-section v-if="userInfo.userType === 'admin'" side>
        <q-btn
          v-if="!isEditing"
          :label="$t('COMMON.008')"
          color="primary"
          @click="infoTable?.toggleEditing()"
        />
        <span>
          <q-btn
            v-if="isEditing"
            :label="$t('COMMON.005')"
            color="grey"
            @click="infoTable?.cancelUpdate()"
          />
          <q-btn
            v-if="isEditing"
            :label="$t('COMMON.009')"
            color="primary"
            class="q-ml-sm"
            @click="updateAll"
          />
        </span>
      </q-item-section>
      <q-item-section v-else side>
        <div>
          {{ $t('COMPANY.098', { email: 'info@handorder.co.kr' }) }}
        </div>
      </q-item-section>
    </q-item>
    <q-scroll-area class="full-height col">
      <CompanyInfoTable
        ref="infoTable"
        v-model="company"
        v-model:is-editing-value="isEditing"
        :company-code="userInfo.companyCode"
        @refresh="refreshData"
      />
      <CompanyInfoTab
        ref="infoTab"
        v-model:company-value="company"
        :is-editing="isEditing"
      />
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

</style>
