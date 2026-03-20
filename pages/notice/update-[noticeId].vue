<script setup lang="ts">
import { useRoute } from 'vue-router'
import { customFetch } from '~/composables/customFetch'
import type { HoNoticeVo } from '~/types'
import { sanitizeText } from '~/composables/sanitizeText'

const route = useRoute()
const boardData = await useCustomFetch<HoNoticeVo>(`/admin/handOrder/notice/${route.params.noticeId}`, {
  method: 'GET',
  params: {
    boardType: 'NOTICE'
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
    message: $t('NOTICE.010'),
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
    boardSeq: Number(route.params.noticeId),
    boardType: 'NOTICE'
  }
  await customFetch('/admin/handOrder/notice', {
    method: 'PUT',
    body: noticeVo,
    onResponse: (_ctx) => {
      if (_ctx.response.status === 200) {
        $q.notify({
          message: $t('NOTICE.011'),
          color: 'positive',
          icon: 'check'
        })
        router.push('/notice')
      } else {
        $q.notify({
          message: $t('NOTICE.012'),
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
      <span class="text-h5 text-bold">{{ $t('NOTICE.005') }}</span>

      <q-separator class="q-my-lg" />
      <q-input
        v-model="title"
        class="q-mb-sm"
        :label="$t('COMMON.087')"
        outlined
        dense
      />
      <q-editor
        v-model="editorText"
        :toolbar="[
          [
            {
              label: $q.lang.editor.align,
              icon: $q.iconSet.editor.align,
              fixedLabel: true,
              list: 'only-icons',
              options: ['left', 'center', 'right', 'justify']
            }
          ],
          ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
          ['token', 'hr', 'link', 'custom_btn'],
          [
            {
              label: $q.lang.editor.formatting,
              icon: $q.iconSet.editor.formatting,
              list: 'no-icons',
              options: [
                'p',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'code'
              ]
            },
            {
              label: $q.lang.editor.fontSize,
              icon: $q.iconSet.editor.fontSize,
              fixedLabel: true,
              fixedIcon: true,
              list: 'no-icons',
              options: [
                'size-1',
                'size-2',
                'size-3',
                'size-4',
                'size-5',
                'size-6',
                'size-7'
              ]
            },
            'removeFormat'
          ],
          ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

          ['undo', 'redo'],
          ['viewsource']
        ]"
        min-height="20rem"
      />
      <div class="row q-mt-sm full-width justify-end">
        <q-btn
          outline
          color="primary"
          class="q-mr-sm"
          @click="() => $router.push('/notice')"
        >
          {{ $t('COMMON.091') }}
        </q-btn>
        <q-btn
          color="primary"
          @click="onSubmit"
        >
          {{ $t('COMMON.008') }}
        </q-btn>
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

</style>
