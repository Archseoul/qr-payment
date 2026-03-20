<script setup lang="ts">
import { customFetch } from '~/composables/customFetch'
import type { HoNoticeVo } from '~/types'
import { sanitizeText } from '~/composables/sanitizeText'

const editorText = ref('')
const title = ref('')
const $q = useQuasar()
const router = useRouter()

const onSubmit = () => {
  if (title.value === '') {
    $q.notify({
      message: $t('COMMON.089'),
      color: 'negative',
      icon: 'report_problem'
    })
    return
  }
  if (editorText.value === '') {
    $q.notify({
      message: $t('COMMON.090'),
      color: 'negative',
      icon: 'report_problem'
    })
    return
  }
  openSubmitConfirmDialog()
}
const openSubmitConfirmDialog = () => {
  $q.dialog({
    message: $t('FAQ.001'),
    cancel: true,
    persistent: true
  }).onOk(() => {
    postNotice()
  })
}
const postNotice = async () => {
  editorText.value = sanitizeText(editorText.value)
  const noticeVo:HoNoticeVo = {
    boardTitle: title.value,
    boardText: editorText.value,
    boardType: 'FAQ'
  }
  await customFetch('/admin/handOrder/notice', {
    method: 'POST',
    body: noticeVo,
    onResponse: (_ctx) => {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('FAQ.002'),
          color: 'positive',
          icon: 'check'
        })
        router.push('/faq')
      } else {
        $q.notify({
          message: $t('FAQ.003'),
          color: 'negative',
          icon: 'report_problem'
        })
      }
    }
  })
}
</script>

<template>
  <div class="main-content relative-position full-height">
    <q-scroll-area class="fit q-pa-lg">
      <span class="text-h5 text-bold">{{ $t('FAQ.004') }}</span>

      <q-separator class="q-my-lg" />
      <q-input
        v-model="title"
        class="q-mb-sm"
        :label="$t('COMMON.087')"
        outlined
        dense
      />
      <q-input
        v-model="editorText"
        outlined
        type="textarea"
      />
      <div class="row q-mt-sm full-width justify-end">
        <q-btn
          outline
          color="primary"
          class="q-mr-sm"
          @click="() => $router.push('/faq')"
        >
          {{ $t('COMMON.091') }}
        </q-btn>
        <q-btn
          color="primary"
          @click="onSubmit"
        >
          {{ $t('COMMON.047') }}
        </q-btn>
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

</style>
