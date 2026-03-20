<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import markdownIt from 'markdown-it'

const md = markdownIt({ html: true })

const props = defineProps<{
  file: string
}>()

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
const termsOfService = ref('')

onMounted(async () => {
  if (!props.file) { return }
  try {
    const res = await fetch(props.file)
    const mdText = await res.text()
    termsOfService.value = md.render(mdText)
  } catch (e) {
    console.error('termsOfService fetch error:', e)
  }
})

</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin" style="width: 1000px; max-width: 80vw;">
      <div class="q-pa-lg">
        <span class="text-h5 text-bold">{{ $t('COMMON.099') }}</span>
        <q-separator class="q-my-lg" />
        <q-scroll-area style="height:70vh" class="q-pr-sm">
          <div class="non-reset-css" v-html="termsOfService" />
        </q-scroll-area>
      </div>
      <q-card-actions align="right">
        <q-btn :label="$t('COMMON.004')" color="primary" @click="onDialogOK" />
      </q-card-actions>
      <!--      <q-card-actions align="right">
        <q-form class="row" @submit="onTermsSubmit">
          <q-checkbox v-model="agreed" label="위 이용약관에 동의합니다." />
          <div class="q-ml-md">
            <q-btn label="확인" type="submit" color="primary" />
          </div>
        </q-form>
      </q-card-actions>-->
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
