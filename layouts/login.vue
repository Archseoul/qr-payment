<script setup lang="ts">

</script>
<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container class="full-height">
      <q-page>
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style lang="scss">
.login-content{
  height: 100vh !important;
  padding: 0px;
}
</style>
