<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import useDayjs from 'dayjs'
import { useCustomFetch } from '~/composables/useCustomFetch'
import type { HoNoticeVo } from '~/types'
import { sanitizeText } from '~/composables/sanitizeText'
import { useAuthStore } from '~/store/auth'

const $q = useQuasar()
const dayjs = useDayjs
dayjs.extend(customParseFormat)
const nuxtApp = useNuxtApp()
const authStore = useAuthStore(nuxtApp.$pinia)
const { checkPermissions } = useCheckPermissions()
const route = useRoute()
const router = useRouter()
const boardSeq = route.params.noticeId
const { data } = await useCustomFetch<HoNoticeVo>(`/admin/handOrder/notice/${boardSeq}`, {
  method: 'GET',
  params: {
    boardType: 'NOTICE'
  }
})
if (data.value) {
  data.value.boardText = sanitizeText(data.value.boardText)
}
const boardData = data
const boardCreateDt = dayjs(boardData.value?.createDt).format('YYYY-MM-DD HH:mm')
const deleteNotice = () => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.loading.show()
  customFetch(`/admin/handOrder/notice/${boardSeq}`, {
    method: 'DELETE',
    params: {
      boardType: 'NOTICE'
    }
  }).then(() => {
    $q.notify({
      message: $t('NOTICE.006'),
      color: 'positive',
      icon: 'check'
    })
    router.push('/notice')
  }).catch(() => {
    $q.notify({
      message: $t('NOTICE.007'),
      color: 'negative',
      icon: 'report_problem'
    })
  }).finally(() => {
    $q.loading.hide()
  })
}
const openDeleteConfirmDialog = () => {
  if (!checkPermissions(['D'])) {
    return
  }
  $q.dialog({
    message: $t('NOTICE.008'),
    cancel: true,
    persistent: true
  }).onOk(() => {
    deleteNotice()
  })
}

const updateNotice = () => {
  if (!checkPermissions(['U'])) {
    return
  }
  router.push(`/notice/update-${boardSeq}`)
}

</script>

<template>
  <div class="main-content relative-position full-height">
    <q-scroll-area class="fit q-pa-lg">
      <span class="text-h5 text-bold">{{ $t('SIDE_MENU.023') }}</span>

      <q-separator class="q-my-lg" />

      <q-card class="q-pa-sm q-ma-sm">
        <q-card-section class="q-pa-sm row justify-between">
          <div class="text-h6">
            {{ (boardData as HoNoticeVo | null)?.boardTitle }}
          </div>
          <div class="row items-center">
            <div class="text-caption row items-center">
              {{ boardCreateDt }}
            </div>
            <div class="row items-center justify-center">
              <q-btn
                v-if="authStore.userInfo.userType === 'admin'"
                class="q-ml-sm"
                color="negative"
                :label="$t('COMMON.007')"
                size="sm"
                @click="openDeleteConfirmDialog"
              />
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-sm">
          <div v-html="(boardData as HoNoticeVo | null)?.boardText" />
        </q-card-section>
      </q-card>
      <div class="row justify-end q-ma-sm">
        <q-btn
          class="q-mt-md q-mr-sm"
          outline
          color="primary"
          :label="$t('NOTICE.009')"
          @click="() => $router.push('/notice')"
        />
        <q-btn
          v-if="authStore.userInfo.userType === 'admin'"
          class="q-mt-md"
          color="primary"
          :label="$t('COMMON.035')"
          @click="updateNotice"
        />
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

</style>
