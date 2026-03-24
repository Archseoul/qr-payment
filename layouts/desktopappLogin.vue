<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <q-layout class="electron-layout">
    <q-header class="title-bar">
      <q-toolbar>
        <q-toolbar-title>
          <q-img src="desktop_handorder_logo.png" width="113px" height="15px" />
        </q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-page-container class="main-container">
      <q-page :class="route.path.includes('login') ? '' : 'main-container-box'">
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.electron-layout{
  .title-bar{
    position: relative;
    background:  var(--handorder-color);
    -webkit-app-region: drag;

    .icon-wrap{
      >*{
        color: black;
        padding: 0 5px;
        font-size: 10px;
        margin-right: 5px;
      }
    }
  }

  .main-container {
    height: calc(100vh - 50px) !important;
    padding: 0 !important;
    overflow:hidden ;
  }
}
</style>

<style lang="scss">
:root{
  --handorder-color: #ff8b4a;
}
</style>
