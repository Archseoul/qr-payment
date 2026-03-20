<script setup lang="ts">
import markdownIt from 'markdown-it'
import { useDialogPluginComponent } from 'quasar'

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const md = markdownIt({ html: true })

const terms = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/text/shop/niceVanTerms.md')
    const mdText = await res.text()
    terms.value = md.render(mdText)
  } catch (e) {
    console.error('NiceVanTermsAll fetch error:', e)
  }
})

</script>

<template>
  <q-dialog
    ref="dialogRef"
    :auto-close="false"
    persistent
    full-width
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin" style="width:1600px">
      <q-card-section>
        <h6 style="margin-block-start:0;margin-block-end: 0;">
          개인(신용)정보 수집·이용 ·제공 동의서
        </h6>
      </q-card-section>

      <q-separator />
      <q-card-section>
        <div class="non-reset-css" v-html="terms" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="확인" color="primary" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.non-reset-css{
  :deep(table){
    border-collapse: collapse;
  }
  :deep(table),:deep(th),:deep(td){
    border: 1px solid black;
  }
}
</style>
