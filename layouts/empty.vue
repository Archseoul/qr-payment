<script setup lang="ts">
const mainPaddingTb: Ref<number> = ref(42)

const mainContentHeight = ref('')
const myTweak = (offset: number) => {
  mainContentHeight.value = offset ? `calc(100vh - ${offset + mainPaddingTb.value * 2}px)` : '100vh'
  return { minHeight: mainContentHeight.value }
}
</script>
<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container class="full-height">
      <q-page :style-fn="myTweak">
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style lang="scss">
.main-content{
  height: v-bind(mainContentHeight) !important;
  padding: 30px;
}
</style>
