<script setup lang="ts">
import { useRoute } from 'vue-router'
import { customFetch } from '~/composables/customFetch'
import type { HoNoticeVo } from '~/types'
import { sanitizeText } from '~/composables/sanitizeText'

const route = useRoute()
const boardData = await useCustomFetch<HoNoticeVo>(`/admin/handOrder/notice/${route.params.faqId}`, {
  method: 'GET',
  params: {
    boardType: 'FAQ'
  }
})
const editorText = ref('')
const title = ref('')
const $q = useQuasar()
const router = useRouter()
if (boardData.data.value) {
  editorText.value = boardData.data.value.boardText
  title.value = boardData.data.value.boardTitle
}

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
    message: $t('FAQ.005'),
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
    boardSeq: Number(route.params.faqId),
    boardType: 'FAQ'
  }
  await customFetch('/admin/handOrder/notice', {
    method: 'PUT',
    body: noticeVo,
    onResponse: (_ctx) => {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('FAQ.006'),
          color: 'positive',
          icon: 'check'
        })
        router.push('/faq')
      } else {
        $q.notify({
          message: $t('FAQ.007'),
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
    <q-scroll-area class="fit">
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
