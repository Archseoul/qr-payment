<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { CompanyVo } from '~/types'
import CompanyInfoTab from '~/components/CompanyInfoTab.vue'
import CompanyInfoTable from '~/components/CompanyInfoTable.vue'
import { useAuthStore } from '~/store/auth'
import { menuAuthCheck } from '~/composables/menuAuthCheck'

const router = useRouter()
const route = useRoute()

const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { userInfo } = storeToRefs(authStore)
const currentSubMenu = findSubMenuByPath(route.path)
const authCheck = menuAuthCheck(currentSubMenu!.subMenu.menuCode)

const isEditing = ref(false)

const companyCode:string = route.params.companyCode as string
const $q = useQuasar()

const infoTab = ref<InstanceType<typeof CompanyInfoTab> | null>(null)
const infoTable = ref<InstanceType<typeof CompanyInfoTable> | null>(null)

const companyData = await useCustomFetch<CompanyVo>(`/admin/handOrder/company/v2/${companyCode}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
const company:Ref<CompanyVo | undefined> = companyData.data

const toList = () => {
  router.push('/company')
}

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

const editCompany = () => {
  if (!authCheck.U()) {
    $q.notify({
      message: $t('COMMON.010'),
      color: 'negative',
      icon: 'close'
    })
    return
  }
  isEditing.value = !isEditing.value
}

</script>

<template>
  <div class="main-content relative-position full-height column">
    <div>
      <span class="text-h5 text-bold"><q-icon
        name="keyboard_backspace"
        class="q-mr-md-lg cursor-pointer backspace"
        size="md"
        @click="toList"
      /> {{ $t('COMPANY.019') }} </span>
      <q-separator class="q-mt-lg" />
    </div>
    <q-item>
      <q-item-section>
        <div style="font-size:1.2rem;" class="text-bold">
          {{ $t('COMPANY.020') }}
        </div>
      </q-item-section>
      <q-item-section side>
        <template v-if="userInfo.userType == 'admin'">
          <q-btn
            v-if="!isEditing"
            :label="$t('COMMON.008')"
            color="primary"
            @click="editCompany"
          />
          <span>
            <q-btn
              v-if="isEditing"
              :label="$t('COMMON.005')"
              color="grey"
              @click="() => { isEditing = false; refreshData() }"
            />
            <q-btn
              v-if="isEditing"
              :label="$t('COMMON.009')"
              color="primary"
              class="q-ml-sm"
              @click="updateAll"
            />
          </span>
        </template>
      </q-item-section>
    </q-item>
    <q-scroll-area class="full-height col">
      <CompanyInfoTable
        ref="infoTable"
        v-model:is-editing-value="isEditing"
        :company-code="companyCode"
      />
      <CompanyInfoTab
        ref="infoTab"
        v-model:company-value="company"
        :company-code="companyCode"
        :is-editing="isEditing"
      />
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

</style>
